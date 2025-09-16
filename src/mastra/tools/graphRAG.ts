/* eslint-disable tsdoc/syntax */
/**
 * GraphRAG Tool - Production-ready implementation for Dean Machines RSC
 * Uses createGraphRAGTool from @mastra/rag with Upstash Vector store integration
 * Supports chunking, embedding, upserting, and graph-based querying
 *
 * @author dm-mastra-training
 * @version 2.0.1 - Complete rewrite using correct Mastra patterns
 */

import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { ExtractParams } from '@mastra/rag';
import { createGraphRAGTool } from '@mastra/rag';
import { z } from 'zod';
import type { UIMessage } from 'ai';

// Local fallback for Message type when '@mastra/core/message' is unavailable
// This defines the minimal shape used in this module to avoid a hard dependency.
interface Message {
  id: string;
  role?: string;
  content: string;
  createdAt?: string | number | Date;
}

import { generateId } from 'ai';
import { PinoLogger } from '@mastra/loggers';
import { RuntimeContext } from "@mastra/core/runtime-context";
import { AISpanType } from '@mastra/core/ai-tracing';

import type {
  TracingSpanInput,
  SpanEndInput
} from '../config/libsql-storage';
import {
  upsertVectors,
  createVectorIndex,
  VectorStoreError,
  STORAGE_CONFIG,
  searchMemoryMessages,
  type Message as StorageMessage
} from '../config/libsql-storage';
//import { pinecone } from '../pinecone';

import { embedMany } from 'ai';

import { chunkerTool } from './chunker-tool';
import type { Memory } from '@mastra/memory';
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ name: 'GraphRAGTool' });

/**
 * Zod schemas for GraphRAG tool validation
 */
const documentInputSchema = z.object({
  text: z.string().min(1).describe('The document text content to process'),
  type: z.enum(['text', 'html', 'markdown', 'json', 'latex']).default('text').describe('Type of document content'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Metadata associated with the document')
}).strict();

const chunkParamsSchema = z.object({
  strategy: z.enum(['recursive']).default('recursive').describe('The chunking strategy to use'),
  size: z.number().int().positive().default(512).describe('Target size of each chunk in tokens/characters'),
  overlap: z.number().int().min(0).default(50).describe('Number of overlapping tokens/characters between chunks'),
  separator: z.string().default('\n').describe('Character(s) to use as chunk separator')
}).strict();

const upsertInputSchema = z.object({
  document: documentInputSchema,
  chunkParams: chunkParamsSchema.optional(),
  extractParams: z.custom<ExtractParams>().optional().describe('Metadata extraction parameters'),
  useReport: z.boolean().optional().describe('Whether to use report index'),
  indexName: z.string().default(STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS).describe('Name of the index to upsert to'),
  createIndex: z.boolean().default(true).describe('Whether to create the index if it does not exist'),
  vectorProfile: z.enum(['libsql']).default('libsql').describe('Vector profile to use for embeddings and upserting'),
}).strict();

const upsertOutputSchema = z.object({
  success: z.boolean().describe('Whether the upsert operation was successful'),
  chunksProcessed: z.number().int().min(0).describe('Number of chunks processed and upserted'),
  indexName: z.string().describe('Name of the index used'),
  processingTime: z.number().min(0).describe('Time taken to process and upsert in milliseconds'),
  chunkIds: z.array(z.string()).describe('Array of chunk IDs that were upserted')
}).strict();

const queryInputSchema = z.object({
  query: z.string().min(1).describe('The query to search for relationships and patterns'),
  indexName: z.string().default(STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS).describe('Name of the index to upsert to'),
  topK: z.number().int().positive().default(10).describe('Number of results to return'),
  threshold: z.number().min(0).max(1).default(0.7).describe('Similarity threshold for graph connections'),
  includeVector: z.boolean().default(false).describe('Whether to include vector data in results'),
  minScore: z.number().min(0).max(1).default(0).describe('Minimum similarity score threshold'),
  vectorProfile: z.enum(['libsql']).default('libsql').describe('Vector profile to use for embeddings and querying'),
  filter: z.record(z.string(), z.unknown()).optional().describe('Optional metadata filter using Upstash-compatible MongoDB/Sift query syntax'), // Add filter field
  useReport: z.boolean().optional().describe('Whether to use report index'),
}).strict();

const queryResultSchema = z.object({
  id: z.string().describe('Unique chunk/document identifier'),
  score: z.number().describe('Similarity score for this retrieval'),
  content: z.string().describe('The chunk content'),
  metadata: z.record(z.string(), z.unknown()).describe('All metadata fields'), // Fixed z.any() to z.unknown()
  vector: z.array(z.number()).optional().describe('Embedding vector if requested')
}).strict();

const queryOutputSchema = z.object({
  relevantContext: z.string().describe('Combined text from the most relevant document chunks'),
  sources: z.array(queryResultSchema).describe('Array of full retrieval result objects with metadata and similarity scores'),
  totalResults: z.number().int().min(0).describe('Total number of results found'),
  graphStats: z.object({
    nodes: z.number().int().min(0).describe('Number of nodes in the graph'),
    edges: z.number().int().min(0).describe('Number of edges in the graph'),
    avgScore: z.number().min(0).describe('Average similarity score')
  }).describe('Statistics about the graph structure'),
  processingTime: z.number().min(0).describe('Time taken to process the query in milliseconds')
}).strict();

/**
 * Runtime context type for GraphRAG tool configuration
 */
export interface GraphRAGRuntimeContext {
  indexName: string;
  topK: number;
  threshold: number;
  minScore: number;
  dimension: number;
  userId?: string;
  sessionId?: string;
  category?: string;
  debug?: boolean;
  vectorProfile?: 'libsql';
};

/**
 * Document upsert tool - Handles chunking, embedding, and storing documents
 */
export const graphRAGUpsertTool = createTool({
  id: 'graph_rag_upsert',
  description: 'Chunk documents, create embeddings, and upsert them to the LibSQL Vector store for GraphRAG retrieval',
  inputSchema: upsertInputSchema,
  outputSchema: upsertOutputSchema,
  execute: async ({ input, runtimeContext, tracingContext }: ToolExecutionContext<typeof upsertInputSchema> & {
    input: z.infer<typeof upsertInputSchema>;
    runtimeContext?: RuntimeContext<GraphRAGRuntimeContext>;
    tracingContext?: {
      currentSpan?: {
        createChildSpan(input: TracingSpanInput): { end(options: SpanEndInput): void };
      };
      context?: unknown;
      runtimeContext?: RuntimeContext<unknown>;
    };
  }): Promise<z.infer<typeof upsertOutputSchema>> => {
    const startTime = Date.now();

    try {
      const validatedInput = upsertInputSchema.parse(input);
      let effectiveIndexName = (validatedInput.useReport ?? false) ? STORAGE_CONFIG.VECTOR_INDEXES.REPORTS : validatedInput.indexName;
      // Conditional for report context - safely inspect metadata without using `any`
      const docMetadata = validatedInput.document.metadata;
      const docUseReport = docMetadata ? docMetadata.useReport : undefined;
      if ((typeof docUseReport === 'boolean' && docUseReport) || runtimeContext?.get('useReport')) {
        effectiveIndexName = STORAGE_CONFIG.VECTOR_INDEXES.REPORTS;
      }

      // Get runtime context values (coerce runtimeContext values to concrete types)
      const rawUserId = runtimeContext?.get('userId');
      const userId = (typeof rawUserId === 'string' && rawUserId.length > 0) ? rawUserId : 'anonymous';
      const rawSessionId = runtimeContext?.get('sessionId');
      const sessionId = (typeof rawSessionId === 'string' && rawSessionId.length > 0) ? rawSessionId : 'default';
      const rawDebug = runtimeContext?.get('debug');
      const debug = (typeof rawDebug === 'boolean') ? rawDebug : false;
      const vectorProfileName = validatedInput.vectorProfile || 'libsql';

      // Get the embedder
      const embedder = google.textEmbedding('gemini-embedding-001');

      if (debug) {
        logger.info('Starting document upsert', {
          textLength: validatedInput.document.text.length,
          type: validatedInput.document.type,
          indexName: validatedInput.indexName,
          userId,
          sessionId,
          vectorProfile: vectorProfileName
        });
      }

      // Use the chunkerTool for robust document processing - fixed input structure
      // Normalize extractParams shape so that summary.summaries contains only allowed literals
      interface SummaryObject { summaries?: Array<'self' | 'prev' | 'next'>; promptTemplate?: string }
      const normalizeSummary = (s?: unknown) => {
        if (s === undefined || typeof s === 'boolean') {
          return s;
        }
        const maybe = s as SummaryObject;
        const allowed = new Set<NonNullable<SummaryObject['summaries']>[number]>(['self', 'prev', 'next']);
        const summaries = Array.isArray(maybe.summaries)
          ? maybe.summaries.filter((it): it is 'self' | 'prev' | 'next' => typeof it === 'string' && allowed.has(it))
          : undefined;
        return {
          ...(summaries ? { summaries } : {}),
          ...((maybe.promptTemplate !== null) ? { promptTemplate: maybe.promptTemplate } : {})
        };
      };

      const normalizeExtractParams = (ep?: ExtractParams) => {
        if (!ep) {
          return undefined;
        }
        return {
          ...(typeof ep.title !== 'undefined' ? { title: ep.title } : {}),
          ...(typeof ep.summary !== 'undefined'
            ? { summary: normalizeSummary(ep.summary) }
            : {}),
          ...(typeof ep.keywords !== 'undefined' ? { keywords: ep.keywords } : {}),
          ...(typeof ep.questions !== 'undefined' ? { questions: ep.questions } : {})
        };
      };

      const chunkerResult = await chunkerTool.execute({
        context: { // Preserved original 'context' structure to avoid TS errors
          document: {
            content: validatedInput.document.text,
            type: validatedInput.document.type,
            metadata: validatedInput.document.metadata,
          },
          chunkParams: validatedInput.chunkParams ? {
            strategy: validatedInput.chunkParams.strategy || 'recursive',
            size: validatedInput.chunkParams.size || 512,
            overlap: validatedInput.chunkParams.overlap || 50,
            separator: validatedInput.chunkParams.separator || '\n',
            preserveStructure: true,
            minChunkSize: 100,
            maxChunkSize: 2048,
          } : undefined,
          outputFormat: 'detailed',
          includeStats: true,
          vectorOptions: {
            createEmbeddings: true,
            upsertToVector: false, // Chunker will create embeddings, we will upsert here
            indexName: effectiveIndexName,
            createIndex: validatedInput.createIndex,
          },
          extractParams: normalizeExtractParams(validatedInput.extractParams),
        },
        runtimeContext,
        tracingContext,
      });

      const chunks = chunkerResult.chunks.map((chunk: { content: string; metadata: Record<string, unknown>; embedding?: number[] }) => ({
        text: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding,
      }));

      logger.info('Document chunked successfully', { totalChunks: chunks.length });

      // Create embeddings (if not already created by chunker)
      let embeddings: number[][] = [];
      if (chunks[0]?.embedding) {
        embeddings = chunks.map(chunk => {
          if (chunk.embedding) {
            return chunk.embedding;
          }
          throw new Error("Expected embedding to be present on all chunks if present on the first.");
        });
      } else {
        const chunkTexts = chunks.map((chunk: { text: string }) => chunk.text);
        const embedResult = await embedMany({
          model: embedder,
          values: chunkTexts
        });
        embeddings = embedResult.embeddings;
      }

      // Create index if needed
      if (validatedInput.createIndex) {
        const idxResult = await createVectorIndex(
          effectiveIndexName,
          STORAGE_CONFIG.DEFAULT_DIMENSION, // Use STORAGE_CONFIG.DEFAULT_DIMENSION
          'cosine'
        );
        if (!idxResult.success) {
          logger.warn('Index validation warning (may already exist)', {
            indexName: validatedInput.indexName,
            error: idxResult.error
          });
        } else {
          logger.info('Upstash vector index validated', { indexName: validatedInput.indexName });
        }
      }

      // Upsert embeddings and metadata
      const chunkIds: string[] = [];
      const { chunkParams } = validatedInput;
      const { metadata } = validatedInput.document;
      const metadataArray = chunks.map((chunk: { text: string; metadata: Record<string, unknown> }, index: number) => {
        const chunkId = generateId();
        chunkIds.push(chunkId);
        return {
          id: chunkId,
          text: chunk.text,
          ...chunk.metadata,
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          strategy: (chunkParams ?? { strategy: 'recursive' }).strategy,
          chunkSize: chunk.text.length,
          vectorProfile: vectorProfileName, // Include vectorProfile in metadata
        };
      });

      // Upsert vectors to LibSQL Vector with cosine similarity
      // Conditional tracing span for upsert if tracing is enabled - fixed typing
      const upsertSpan = tracingContext?.currentSpan ? tracingContext.currentSpan.createChildSpan({
        type: AISpanType.GENERIC,
        name: 'rag_upsert',
        input: {
          indexName: effectiveIndexName,
          topK: 0
        }
        // Removed 'as any' to fix typing
      }) : undefined;
      const upsertRes = await upsertVectors(
        effectiveIndexName,
        embeddings,
        metadataArray,
        chunkIds
      );
      // End tracing span if enabled
      if (upsertSpan) {
        upsertSpan.end({
          output: {
            resultsFound: upsertRes.count,
            processingTime: Date.now() - startTime
          },
          metadata: { operation: 'upsert' }
        });
      }
      if (!upsertRes.success) {
        throw new VectorStoreError(
          `GraphRAG upsert failed: ${upsertRes.error}`,
          'operation_failed',
          { indexName: validatedInput.indexName }
        );
      }

      const processingTime = Date.now() - startTime;
      const result = {
        success: true,
        chunksProcessed: chunks.length,
        indexName: validatedInput.indexName,
        processingTime,
        chunkIds
      };

      logger.info('Document upsert completed successfully', result);
      return upsertOutputSchema.parse(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Document upsert failed', {
        error: errorMessage,
        indexName: input.indexName || 'context'
      });

      // Safely extract document type without using `any`
      const inputWithDoc = input as unknown as { document?: { type?: string } } | undefined;
      const documentType = inputWithDoc?.document?.type;

      // Throw VectorStoreError for better error handling
      throw new VectorStoreError(
        `GraphRAG document upsert failed: ${errorMessage}`,
        'operation_failed',
        {
          indexName: input.indexName || 'context',
          documentType,
          processingTime: Date.now() - startTime
        }
      );
    }
  }
});

/**
 * GraphRAG query tool - Uses createGraphRAGTool with Upstash Vector store and sparse cosine similarity
 */
export const graphRAGTool = createGraphRAGTool({
  vectorStoreName: 'libsqlVectorStoreInstance',
  indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS, // Fixed hard-coded value
  model: google.textEmbedding('gemini-embedding-001'),
  graphOptions: {
    dimension: STORAGE_CONFIG.DEFAULT_DIMENSION // Use default dimension from config
  }
});

/**
 * Enhanced GraphRAG query tool with comprehensive validation
 */
export const graphRAGQueryTool = createTool({
  id: 'graph_rag_query',
  description: 'Query the GraphRAG system for complex document relationships and patterns using graph-based retrieval',
  inputSchema: queryInputSchema,
  outputSchema: queryOutputSchema,
  execute: async ({ input, runtimeContext, tracingContext, memory }: ToolExecutionContext<typeof queryInputSchema> & {
    input: z.infer<typeof queryInputSchema>;
    runtimeContext?: RuntimeContext<GraphRAGRuntimeContext>;
    tracingContext?: {
      currentSpan?: {
        createChildSpan(input: TracingSpanInput): { end(options: SpanEndInput): void };
      };
      context?: unknown;
      runtimeContext?: RuntimeContext<unknown>;
    };
    memory?: Memory;
  }): Promise<z.infer<typeof queryOutputSchema>> => {
    const startTime = Date.now();
    try {

    // Validate input early so it can be referenced safely below
    const validatedInput = queryInputSchema.parse(input);

      // Get runtime context values (coerce runtimeContext values to concrete types)
      const rawUserId = runtimeContext?.get('userId');
      const userId = (typeof rawUserId === 'string' && rawUserId.length > 0) ? rawUserId : 'anonymous';
      const rawSessionId = runtimeContext?.get('sessionId');
      const sessionId = (typeof rawSessionId === 'string' && rawSessionId.length > 0) ? rawSessionId : 'default';
      const rawDebug = runtimeContext?.get('debug');
      const debug = (typeof rawDebug === 'boolean') ? rawDebug : false;
      let indexName = (validatedInput.useReport ?? false) ? STORAGE_CONFIG.VECTOR_INDEXES.REPORTS : ((runtimeContext?.get('indexName')) ?? validatedInput.indexName);

      // Conditional for report context
      if ((Boolean((runtimeContext?.get('useReport')))) || (validatedInput.useReport ?? false)) {
        indexName = STORAGE_CONFIG.VECTOR_INDEXES.REPORTS;
      }
      const rawTopK = runtimeContext?.get('topK');
      const topK = (typeof rawTopK === 'number' && Number.isFinite(rawTopK)) ? rawTopK : validatedInput.topK;
      const rawThreshold = runtimeContext?.get('threshold');
      const threshold = (typeof rawThreshold === 'number' && Number.isFinite(rawThreshold)) ? rawThreshold : validatedInput.threshold;
      const vectorProfileName = validatedInput.vectorProfile || 'libsql';

      // Get the embedder for potential use in query processing

      if (debug) {
        logger.info('Starting GraphRAG query', {
          query: validatedInput.query,
          indexName,
          topK,
          threshold,
          userId,
          sessionId,
          vectorProfile: vectorProfileName
        });
      }
      // Integrate semantic recall with searchMemoryMessages for context-based params
      // Use memory if available and call searchMemoryMessages with the required arguments (memory, threadId, query, topK)
      let memoryResults: { messages: StorageMessage[]; uiMessages: UIMessage[] } = { messages: [], uiMessages: [] };
      if (typeof memory !== 'undefined' && memory) {
        // Use sessionId as the threadId for memory lookup (adjust if a different threadId is desired)
        memoryResults = await searchMemoryMessages(
          memory,
          sessionId,
          validatedInput.query,
          topK
        );
      }

      // Create runtime context for the GraphRAG tool
      const graphRAGContext = new RuntimeContext();
      graphRAGContext.set('indexName', indexName);
      graphRAGContext.set('topK', (memoryResults.messages.length > 0) ? Math.min(topK, memoryResults.messages.length + 3) : topK); // Adjust topK based on memory
      graphRAGContext.set('minScore', validatedInput.minScore);
      graphRAGContext.set('dimension', STORAGE_CONFIG.DEFAULT_DIMENSION); // Use STORAGE_CONFIG.DEFAULT_DIMENSION

      // Conditional tracing span for graph query if tracing is enabled - fixed typing
      const graphQuerySpan = tracingContext?.currentSpan ? tracingContext.currentSpan.createChildSpan({
        type: AISpanType.GENERIC,
        name: 'rag_query',
        input: {
          indexName,
          topK: validatedInput.topK
        }
        // Removed 'as any' to fix typing
      }) : undefined;

      // Execute the GraphRAG query
      const graphResult = await graphRAGTool.execute({
        context:  {
          queryText: validatedInput.query,
          topK: graphRAGContext.get('topK') ?? validatedInput.topK,
          includeVector: validatedInput.includeVector,
          minScore: validatedInput.minScore,
          filter: validatedInput.filter, // Pass filter to graphRAGTool.execute
        },
        runtimeContext: graphRAGContext,
        tracingContext,
      });
      // Integrate memory results into graph results for enhanced semantic recall
            type ExtendedMessage = (StorageMessage | Message) & { metadata?: Record<string, unknown> };
            const enhancedSources = [
              ...(graphResult.sources ?? []),
              ...((memoryResults.messages || []).slice(0, 3).map((msg: ExtendedMessage) => {
                const msgMeta = msg.metadata ?? {};
                return {
                  id: msg.id ?? generateId(),
                  score: 0.9, // High score for memory relevance
                  content: msg.content,
                  metadata: { type: 'memory', scope: 'thread', ...msgMeta },
                  vector: undefined
                };
              }))
            ];
      const processingTime = Date.now() - startTime;
      const sources = enhancedSources.map((source: {
        id?: string;
        score?: number;
        metadata?: Record<string, unknown>;
        text?: string;
        content?: string;
        vector?: number[];
      }) => ({
        id: source.id ?? generateId(),
        score: source.score ?? 0,
        content: (source.text ?? source.content) ?? '',
        metadata: source.metadata ?? {},
        vector: validatedInput.includeVector ? source.vector : undefined
      }));

      const totalResults = sources.length;
      const avgScore = totalResults > 0 ? sources.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / totalResults : 0;

      if (graphQuerySpan) {
        graphQuerySpan.end({
          output: {
            resultsFound: totalResults
          },
          metadata: { operation: 'query' }
        });
      }

      const result = {
        relevantContext: (typeof graphResult.relevantContext === 'string' && graphResult.relevantContext.length > 0)
          ? graphResult.relevantContext
          : sources.map((s: { content: string }) => s.content).join('\n\n'),
        sources,
        totalResults,
        graphStats: {
          nodes: totalResults,
          edges: Math.floor(totalResults * 1.5), // Estimated edges based on threshold
          avgScore
        },
        processingTime
      };

      logger.info('GraphRAG query completed successfully', {
        relevantContextLength: result.relevantContext.length,
        totalResults: result.totalResults,
        avgScore: result.graphStats.avgScore,
        processingTime: result.processingTime
      });

      return queryOutputSchema.parse(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('GraphRAG query failed', {
        error: errorMessage,
        query: input.query,
        indexName: input.indexName
      });

      // Throw VectorStoreError for better error handling
      throw new VectorStoreError(
        `GraphRAG query failed: ${errorMessage}`,
        'operation_failed',
        {
          query: input.query,
          indexName: input.indexName,
          processingTime: Date.now() - startTime
        }
      );
    }
  }
});

/**
 * Runtime context for GraphRAG tools with default values
 */
export const graphRAGRuntimeContext = new RuntimeContext<GraphRAGRuntimeContext>();

// Set default runtime context values for LibSQL Vector
graphRAGRuntimeContext.set("indexName", STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS);
graphRAGRuntimeContext.set("topK", 5);
graphRAGRuntimeContext.set("threshold", 0.7);
graphRAGRuntimeContext.set("minScore", 0.0);
graphRAGRuntimeContext.set("dimension", STORAGE_CONFIG.DEFAULT_DIMENSION); // Use default dimension from config
graphRAGRuntimeContext.set("category", "document");
graphRAGRuntimeContext.set("debug", false);
