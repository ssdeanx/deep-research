/* eslint-disable tsdoc/syntax */
/**
 * Vector Query Tools for Dean Machines RSC
 *
 * This module provides tools for querying vector stores with semantic search,
 * hybrid filtering, and metadata search. It includes a basic vector query tool,
 * an enhanced tool that integrates with agent memory, and a hybrid search tool
 * that combines semantic and metadata filtering.
 *
 * Key Features:
 * - Semantic search using embeddings
 * - Hybrid filtering based on metadata
 * - Integration with agent memory for context-aware search
 * - Runtime context support for personalized search preferences
 * - Comprehensive validation and error handling
 *
 * @author SSD
 * @date 2025-06-21
 * @version 1.0.1
 *
 * [EDIT: 2025-06-18] [BY: SSD]
 */
import { createVectorQueryTool } from "@mastra/rag";
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import { RuntimeContext } from '@mastra/core/di';
import { AISpanType } from '@mastra/core/ai-tracing';
import { z } from 'zod';
import {
  createLibSQLVectorStore,
  STORAGE_CONFIG,
  searchMemoryMessages // Import searchMemoryMessages
} from '../config/libsql-storage';

import { PinoLogger } from '@mastra/loggers';
import { embedMany, generateId } from 'ai';
import type { Memory } from '@mastra/memory';
import { google } from "@ai-sdk/google";

// Define runtime context type for vector query tools
export interface VectorQueryRuntimeContext {
  'user-id': string;
  'session-id': string;
  'search-preference': 'semantic' | 'hybrid' | 'metadata';
  'language': string;
  'quality-threshold': number;
  'debug'?: boolean;
  'max-results'?: number;
  'include-metadata'?: boolean;
};

const logger = new PinoLogger({ name: 'VectorQueryTool', level: 'info' });
const vectorQueryInputSchema = z.object({
  query: z.string().min(1).describe('The query to search for in the vector store'),
  threadId: z.string().optional().describe('Optional thread ID to search within a specific conversation thread'),
  topK: z.number().int().positive().default(5).describe('Number of most similar results to return'),
  minScore: z.number().min(0).max(1).default(0.0).describe('Minimum similarity score threshold'),
  before: z.number().int().min(0).default(2).describe('Number of messages before each match to include for context'),
  after: z.number().int().min(0).default(1).describe('Number of messages after each match to include for context'),
  includeMetadata: z.boolean().default(true).describe('Whether to include metadata in results'),
  enableFilter: z.boolean().default(false).describe('Enable filtering based on metadata'),
  filter: z.record(z.string(), z.any()).optional().describe('Optional metadata filter using Pinecone-compatible MongoDB/Sift query syntax. Supports: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $and, $or, $not, $nor, $exists. Field keys limited to 512 chars, no null values.'),
}).strict();

const vectorQueryResultSchema = z.object({
  id: z.string().describe('Unique identifier for the result'),
  content: z.string().describe('The text content of the chunk'),
  score: z.number().describe('Similarity score (0-1)'),
  metadata: z.record(z.string(), z.any()).optional().describe('Chunk metadata including position, type, etc.'),
  threadId: z.string().optional().describe('Thread ID if applicable'),
});

const vectorQueryOutputSchema = z.object({
  relevantContext: z.string().describe('Combined text from the most relevant chunks'),
  results: z.array(vectorQueryResultSchema).describe('Array of search results with similarity scores'),
  totalResults: z.number().int().min(0).describe('Total number of results found'),
  processingTime: z.number().min(0).describe('Time taken to process the query in milliseconds'),
  queryEmbedding: z.array(z.number()).optional().describe('The embedding vector of the query'),
}).strict();
// Basic vector query tool using Mastra's createVectorQueryTool for compatibility with LibSQL
export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "libsql", // Use LibSQL vector store
  indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS, // Use research documents index
  model: google.textEmbedding("gemini-embedding-001"), // Use Gemini embedding model
  databaseConfig: {
    libsql: {
      connectionUrl: process.env.VECTOR_DATABASE_URL ?? STORAGE_CONFIG.VECTOR_DATABASE_URL,
      authToken: process.env.VECTOR_DATABASE_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN,
    }
  },
  enableFilter: true,
  description: "Search for semantically similar content in the LibSQL vector store using embeddings. Supports filtering, ranking, and context retrieval."
});

// Enhanced vector query tool that integrates with UpstashMemory
export const enhancedVectorQueryTool = createTool({
  id: 'vector_query',
  description: 'Advanced vector search with hybrid filtering, metadata search, and agent memory integration',
  inputSchema: vectorQueryInputSchema,
  outputSchema: vectorQueryOutputSchema,
  execute: async ({ input, runtimeContext, tracingContext, memory }: ToolExecutionContext<typeof vectorQueryInputSchema> & {
    input: z.infer<typeof vectorQueryInputSchema>;
    runtimeContext?: RuntimeContext<VectorQueryRuntimeContext>;
    memory?: Memory; // Add memory to the execution context
  }): Promise<z.infer<typeof vectorQueryOutputSchema>> => {
    const startTime = Date.now();
    try {
      // Validate input
      const validatedInput = vectorQueryInputSchema.parse(input);
      // Get runtime context values for personalization
      const userId = (runtimeContext?.get('user-id')) ?? 'anonymous';
      const sessionId = (runtimeContext?.get('session-id')) ?? 'default';
      const searchPreference = (runtimeContext?.get('search-preference')) ?? 'semantic';
      // Normalize qualityThreshold to a number to avoid type errors during comparisons
      const rawQualityThreshold = runtimeContext?.get('quality-threshold');
      const qualityThreshold = typeof rawQualityThreshold === 'number'
        ? rawQualityThreshold
        : Number(rawQualityThreshold ?? validatedInput.minScore) || validatedInput.minScore;
      const debug = (runtimeContext?.get('debug')) ?? false;

      // Enhanced tracing: Add span attributes and metadata
      if (tracingContext?.currentSpan) {
        tracingContext.currentSpan.update({
          metadata: {
            operation: 'vector_query',
            query: validatedInput.query,
            userId,
            sessionId,
            searchPreference,
            qualityThreshold: Number(qualityThreshold),
            topK: validatedInput.topK,
            threadId: validatedInput.threadId,
            enableFilter: validatedInput.enableFilter,
            hasMemory: !!memory
          }
        });
      }

      if (debug) {
        logger.info('Vector query input validated', {
          query: validatedInput.query,
          userId,
          sessionId,
          searchPreference,
          qualityThreshold: Number(qualityThreshold)
        });
      }

      // Use tracingContext to avoid unused parameter warning
      if (tracingContext?.currentSpan) {
        // Basic tracing context usage - can be enhanced later
        tracingContext.currentSpan.attributes = {
          ...tracingContext.currentSpan.attributes,
          'vector.operation': 'query'
        };
      }

      const results: Array<z.infer<typeof vectorQueryResultSchema>> = [];
      let relevantContext = '';

      // If threadId is provided, use LibSQL memory search
      if (typeof validatedInput.threadId === 'string' && validatedInput.threadId.length > 0) {
        const threadId = validatedInput.threadId;
        logger.info('Searching within thread using LibSQL memory', { threadId });

        if (!memory) {
          throw new Error("Memory instance is required for thread-specific searches.");
        }

        // Determine recall params based on context (thread for research, resource for report)
        const recallParams = (runtimeContext?.get('useReport'))
          ? { topK: 10, messageRange: 3, scope: 'resource' as const }
          : { topK: 5, messageRange: 2, scope: 'thread' as const };

        // Create child span for memory search
        const memorySearchSpan = tracingContext?.currentSpan?.createChildSpan({
          type: AISpanType.GENERIC,
          name: 'memory_search',
          input: {
            threadId,
            query: validatedInput.query,
            topK: validatedInput.topK,
            recallParams
          }
        });

        const { messages, uiMessages } = await searchMemoryMessages(
          memory,
          threadId,
          validatedInput.query,
          validatedInput.topK
        );

        // Update memory search span with results
        memorySearchSpan?.end({
          output: {
            messagesFound: messages.length,
            uiMessagesFound: uiMessages.length
          },
          metadata: {
            threadId,
            totalResults: messages.length + uiMessages.length
          }
        });

        // Transform searchMemoryMessages results to match our schema
        messages.forEach((message) => {
          results.push({
            id: message.id ?? generateId(),
            content: message.content ?? '',
            score: 1.0, // searchMemoryMessages doesn't return score, assume perfect match
            metadata: {
              role: message.role,
              threadId,
              createdAt: message.createdAt,
              // Add other relevant metadata from message if available
            },
            threadId,
          });
        });

        uiMessages.forEach((uiMessage) => {
          // UIMessage may not expose a typed 'content' property; coerce to any and try common fallbacks
          const anyUi = uiMessage as any;
          const uiContent =
            typeof anyUi.content === 'string'
              ? anyUi.content
              : typeof anyUi.text === 'string'
              ? anyUi.text
              : JSON.stringify(anyUi);

          results.push({
            id: uiMessage.id ?? generateId(),
            content: uiContent,
            score: 1.0, // searchMemoryMessages doesn't return score, assume perfect match
            metadata: {
              role: uiMessage.role,
              threadId,
              // Add other relevant metadata from uiMessage if available
            },
            threadId,
          });
        });

        relevantContext = [...messages, ...uiMessages]
          .map((m: any) => (typeof m.content === 'string' ? m.content : (typeof m.text === 'string' ? m.text : '')))
          .join('\n\n');

      } else {
        // Use direct LibSQL vector store search with cosine similarity
        logger.info('Performing direct LibSQL vector store search');

        // Create child span for embedding generation
        const embeddingSpan = tracingContext?.currentSpan?.createChildSpan({
          type: AISpanType.GENERIC,
          name: 'embedding_generation',
          input: {
            query: validatedInput.query,
            model: 'gemini-embedding-001'
          }
        });

        // Create query embedding using Google's embedding model
        const { embeddings } = await embedMany({
          model: google.textEmbedding('gemini-embedding-001'),
          values: [validatedInput.query]
        });
        const queryEmbedding = embeddings[0];

        // Update embedding span with results
        embeddingSpan?.end({
          output: {
            embeddingDimension: queryEmbedding.length
          },
          metadata: {
            model: 'gemini-embedding-001',
            tokensProcessed: validatedInput.query.split(/\s+/).filter(Boolean).length
          }
        });
        // Create child span for vector store query
        const vectorQuerySpan = tracingContext?.currentSpan?.createChildSpan({
          type: AISpanType.GENERIC,
          name: 'vector_store_query',
          input: {
            indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
            topK: validatedInput.topK,
            enableFilter: validatedInput.enableFilter,
            queryVectorLength: queryEmbedding.length
          }
        });

        // Determine index based on context
        let searchIndex: string = STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS;
        if (runtimeContext?.get('useReport')) {
          searchIndex = STORAGE_CONFIG.VECTOR_INDEXES.REPORTS;
        }
        // Query the LibSQL vector store directly with cosine similarity
        const vectorStore = createLibSQLVectorStore(tracingContext);
        const vectorResults = await vectorStore.query({
          indexName: searchIndex,
          queryVector: queryEmbedding,
          topK: validatedInput.topK,
          filter: validatedInput.enableFilter ? validatedInput.filter : undefined,
          includeVector: false // Don't include vectors in response for performance
        });

        // Update vector query span with results
        vectorQuerySpan?.end({
          output: {
            resultsFound: vectorResults.length
          },
          metadata: {
            indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
            topK: validatedInput.topK,
            filterApplied: validatedInput.enableFilter
          }
        });

        // Transform vector results to match our schema with runtime context, minimizing 'any' usage
        vectorResults.forEach((result: { id?: string; score?: number; metadata?: Record<string, unknown> }, index: number) => {
          const content = String((Boolean((result.metadata?.text ?? result.metadata?.content))) || '');
          const score = result.score ?? 0;

          const newLocal = score >= qualityThreshold;
          if (newLocal) {
            results.push({
              id: result.id ?? `vec-${index}`,
              content,
              score,
              metadata: {
                ...(result.metadata ?? {}),
                userId,
                sessionId,
                searchPreference
              } as Record<string, unknown>,
            });
          }
        });

        relevantContext = results.map(r => r.content).join('\n\n');
      }

      const processingTime = Date.now() - startTime;

      const output = {
        relevantContext,
        results,
        totalResults: results.length,
        processingTime,
        queryEmbedding: undefined, // Don't include embeddings by default for performance
      };

      // Update main span with final results
      if (tracingContext?.currentSpan) {
        tracingContext.currentSpan.update({
          metadata: {
            ...tracingContext.currentSpan.metadata,
            totalResults: output.totalResults,
            processingTime: output.processingTime,
            success: true,
            operationCompleted: true
          }
        });
      }

      logger.info('Vector query completed successfully', {
        totalResults: output.totalResults,
        processingTime: output.processingTime,
        threadId: validatedInput.threadId,
        userId,
        sessionId
      });

      return vectorQueryOutputSchema.parse(output);

    } catch (error) {
      logger.error('Vector query failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Vector query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

// Type for hybrid result to ensure type safety
interface HybridVectorResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
  threadId?: string;
}

// Hybrid scoring type
const hybridScoreSchema = z.object({
  semanticScore: z.number().describe('Pure semantic similarity score'),
  metadataScore: z.number().describe('Metadata matching score'),
  combinedScore: z.number().describe('Weighted combination of both scores'),
});

// Define input and output types for the hybrid tool
const hybridInputSchema = vectorQueryInputSchema.extend({
  metadataQuery: z.record(z.string(), z.any()).describe('Chunk metadata including position, type, etc.'),
  semanticWeight: z.number().min(0).max(1).default(0.7).describe('Weight for semantic similarity (0-1)'),
  metadataWeight: z.number().min(0).max(1).default(0.3).describe('Weight for metadata matching (0-1)'),
});
type HybridInput = z.infer<typeof hybridInputSchema>;

const hybridOutputSchema = vectorQueryOutputSchema.extend({
  hybridScores: z.array(hybridScoreSchema).describe('Breakdown of hybrid scoring'),
});
type HybridOutput = z.infer<typeof hybridOutputSchema>;

// Hybrid vector search tool that combines semantic and metadata filtering
export const hybridVectorSearchTool = createTool({
  id: 'hybrid_vector_query',
  description: 'Hybrid search combining vector similarity with metadata filtering for precise results',
  inputSchema: hybridInputSchema,
  outputSchema: hybridOutputSchema,
  execute: async ({
    input,
    runtimeContext,
    tracingContext, // Add tracingContext
    memory // Pass memory
  }: ToolExecutionContext<typeof hybridInputSchema> & {
    input: HybridInput;
    runtimeContext?: RuntimeContext<VectorQueryRuntimeContext>;
    memory?: Memory; // Add memory to the execution context
  }): Promise<HybridOutput> => {
    // Use tracingContext to avoid unused parameter warning
    if (tracingContext?.currentSpan) {
      tracingContext.currentSpan.attributes = {
        ...tracingContext.currentSpan.attributes,
        'vector.operation': 'hybrid-search'
      };
    }
    const startTime = Date.now();
    try {
      const extendedSchema = vectorQueryInputSchema.extend({
        metadataQuery: z.record(z.string(), z.any()).optional(),
        semanticWeight: z.number().min(0).max(1).default(0.7),
        metadataWeight: z.number().min(0).max(1).default(0.3),
      });
      const validatedInput = extendedSchema.parse(input);
      // Get runtime context values
      const userId = (runtimeContext?.get('user-id')) ?? 'anonymous';
      const sessionId = (runtimeContext?.get('session-id')) ?? 'default';
      const searchPreference = (runtimeContext?.get('search-preference')) ?? 'hybrid';
      logger.info('Hybrid vector search initiated', {
        query: validatedInput.query,
        semanticWeight: validatedInput.semanticWeight,
        metadataWeight: validatedInput.metadataWeight,
        userId,
        sessionId,
        searchPreference
      });      // Use enhanced vector query instead of the basic one for consistency
      logger.info('Using enhanced vector query for semantic search');
      const basicResults = await enhancedVectorQueryTool.execute({
        input: {
          query: validatedInput.query,
          topK: validatedInput.topK,
          minScore: validatedInput.minScore,
          before: 2,
          after: 1,
          includeMetadata: true,
          enableFilter: validatedInput.enableFilter || false,
          filter: validatedInput.filter,
        },
        context: { // Re-add context object as it's required by ToolExecutionContext
          query: validatedInput.query,
          topK: validatedInput.topK,
          minScore: validatedInput.minScore,
          before: 2,
          after: 1,
          includeMetadata: true,
          enableFilter: validatedInput.enableFilter || false,
          filter: validatedInput.filter,
        },
        runtimeContext,
        tracingContext: runtimeContext?.get('tracingContext'), // Pass tracingContext
        memory, // Pass memory to enhancedVectorQueryTool
      });
      // Transform basic results to match our hybrid scoring format
      const semanticResults = {
        relevantContext: basicResults.relevantContext || '',
        results: basicResults.results.map((r: {id: string; content: string; score: number; metadata?: Record<string, unknown>}): HybridVectorResult => ({
          id: r.id,
          content: r.content,
          score: r.score,
          metadata: r.metadata,
        })),
        totalResults: basicResults.totalResults,
        processingTime: 0,
      };

      // Apply hybrid scoring if metadata query is provided
      const hybridScores: Array<z.infer<typeof hybridScoreSchema>> = [];
      if (validatedInput.metadataQuery) {
        semanticResults.results.forEach((result: HybridVectorResult) => {
          const semanticScore = result.score;
          // Simple metadata matching score (can be enhanced)
          let metadataScore = 0;
          if (result.metadata && validatedInput.metadataQuery) {
            const matchingKeys = Object.keys(validatedInput.metadataQuery).filter(key =>
              result.metadata?.[key] === validatedInput.metadataQuery?.[key]
            );
            metadataScore = matchingKeys.length / Object.keys(validatedInput.metadataQuery).length;
          }

          const combinedScore = (semanticScore * validatedInput.semanticWeight) +
                                 (metadataScore * validatedInput.metadataWeight);

          hybridScores.push({
            semanticScore,
            metadataScore,
            combinedScore,
          });
        });

        // Re-sort results by combined score
        const resultsWithScores = semanticResults.results.map((result: HybridVectorResult, index: number) => {
          // Defensive: Only copy safe keys from result.metadata to prevent prototype pollution
          const safeMetadata: Record<string, unknown> = {};
          if (result.metadata && typeof result.metadata === "object") {
            for (const key of Object.keys(result.metadata)) {
              if (
                typeof key === "string" &&
                !Object.prototype.hasOwnProperty.call(Object.prototype, key)
              ) {
                safeMetadata[key] = result.metadata[key];
              }
            }
          }
          return {
            ...result,
            score: hybridScores[index].combinedScore,
            metadata: {
              ...safeMetadata,
              userId,
              sessionId,
              searchPreference
            }
          };
        });

        resultsWithScores.sort((a: HybridVectorResult, b: HybridVectorResult) => b.score - a.score);
        semanticResults.results = resultsWithScores;
      }

      const processingTime = Date.now() - startTime;

      const output = {
        ...semanticResults,
        processingTime,
        hybridScores,
      };

      logger.info('Hybrid vector search completed', {
        totalResults: output.totalResults,
        processingTime,
        hasMetadataQuery: !!validatedInput.metadataQuery,
        userId,
        sessionId
      });

      return output;

    } catch (error) {
      logger.error('Hybrid vector search failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Hybrid vector search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * Runtime context for vector query tools to enable dynamic configuration
 * This allows CopilotKit frontend to configure tool behavior via headers
 *
 * @example
 * ```typescript
 * // In CopilotKit agent registration:
 * setContext: (c, runtimeContext) => {
 *   runtimeContext.set("user-id", c.req.header("X-User-ID") || "anonymous");
 *   runtimeContext.set("session-id", c.req.header("X-Session-ID") || "default");
 *   runtimeContext.set("search-preference", c.req.header("X-Search-Preference") || "semantic");
 *   runtimeContext.set("language", c.req.header("X-Language") || "en");
 *   runtimeContext.set("quality-threshold", parseFloat(c.req.header("X-Quality-Threshold") || "0.5"));
 * }
 * ```
 */
export const vectorQueryRuntimeContext = new RuntimeContext<VectorQueryRuntimeContext>();

// Set default runtime context values
vectorQueryRuntimeContext.set("user-id", "anonymous");
vectorQueryRuntimeContext.set("session-id", "default");
vectorQueryRuntimeContext.set("search-preference", "semantic");
vectorQueryRuntimeContext.set("language", "en");
vectorQueryRuntimeContext.set("quality-threshold", 0.5);
