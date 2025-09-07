import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import { RuntimeContext } from '@mastra/core/di';
import { AISpanType } from '@mastra/core/ai-tracing';
import { rerank, type RerankResult } from '@mastra/rag';
import { createGemini25Provider } from '../config/googleProvider';
import { vectorQueryTool } from './vectorQueryTool';
import { PinoLogger } from '@mastra/loggers';
import { z } from 'zod';
import { STORAGE_CONFIG } from '../config/libsql-storage';

const logger = new PinoLogger({ name: 'RerankTool', level: 'info' });

/**
 * Runtime context type for rerank tool configuration
 */
export interface RerankRuntimeContext {
  'user-id'?: string;
  'session-id'?: string;
  'model-preference'?: 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-preview-05-20' | 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';
  'semantic-weight'?: number;
  'vector-weight'?: number;
  'position-weight'?: number;
  'debug'?: boolean;
  'quality-threshold'?: number;
}

// Input and output schemas
const rerankInputSchema = z.object({
  indexName: z.string().optional().describe('Vector store index name (defaults to RESEARCH_DOCUMENTS)'),
  query: z.string().min(1).describe('Query string for semantic search and reranking'),
  topK: z.number().int().positive().default(10).describe('Number of initial results to retrieve before reranking'),
  finalK: z.number().int().positive().default(3).describe('Final number of results after reranking'),
  semanticWeight: z.number().min(0).max(1).default(0.6).describe('Weight for semantic similarity'),
  vectorWeight: z.number().min(0).max(1).default(0.3).describe('Weight for vector similarity'),
  positionWeight: z.number().min(0).max(1).default(0.1).describe('Weight for position bias'),
}).strict();

const rerankOutputSchema = z.object({
  messages: z.array(z.any()).describe('Reranked core messages'),
  uiMessages: z.array(z.any()).describe('Reranked UI messages'),
  rerankMetadata: z.object({
    topK: z.number().describe('Initial number of results retrieved'),
    finalK: z.number().describe('Final number of results after reranking'),
    before: z.number().describe('Context messages before'),
    after: z.number().describe('Context messages after'),
    initialResultCount: z.number().describe('Total initial results before reranking'),
    rerankingUsed: z.boolean().describe('Whether reranking was applied'),
    rerankingDuration: z.number().describe('Time taken for reranking in milliseconds'),
    averageRelevanceScore: z.number().describe('Average relevance score of reranked results'),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }).describe('Metadata about the reranking process')
}).strict();

/**
 * Enhanced reranking tool using Mastra's rerank function with runtime context
 */
export const rerankTool = createTool({
  id: 'rerank',
  description: 'Search and rerank conversation messages using semantic similarity and configurable weights',
  inputSchema: rerankInputSchema,
  outputSchema: rerankOutputSchema,
  execute: async ({ input, runtimeContext, tracingContext, memory }: ToolExecutionContext<typeof rerankInputSchema> & {
    input: z.infer<typeof rerankInputSchema>;
    runtimeContext?: RuntimeContext<RerankRuntimeContext>;
    tracingContext?: {
      currentSpan?: {
        createChildSpan(input: { type: AISpanType; name: string; input?: Record<string, unknown> }): { end(options: { output?: Record<string, unknown>; metadata?: Record<string, unknown> }): void };
      };
      context?: unknown;
      runtimeContext?: RuntimeContext<unknown>;
    };
  }): Promise<z.infer<typeof rerankOutputSchema>> => {
    const startTime = Date.now();

    try {
      const validatedInput = rerankInputSchema.parse(input);      // Get runtime context values
      const userId = (runtimeContext?.get('user-id') as string | undefined) ?? 'anonymous';
      const sessionId = (runtimeContext?.get('session-id') as string | undefined) ?? 'default';
      const modelPreference = (runtimeContext?.get('model-preference') as string | undefined) ?? 'gemini-2.5-flash-lite-preview-06-17';
      const semanticWeight = (runtimeContext?.get('semantic-weight') as number | undefined) ?? validatedInput.semanticWeight;
      const vectorWeight = (runtimeContext?.get('vector-weight') as number | undefined) ?? validatedInput.vectorWeight;
      const positionWeight = (runtimeContext?.get('position-weight') as number | undefined) ?? validatedInput.positionWeight;
      const debug = (runtimeContext?.get('debug') as boolean | undefined) ?? false;

      if (debug) {
        logger.info('Rerank tool executed with runtime context', {
          userId,
          sessionId,
          modelPreference,
          weights: { semanticWeight, vectorWeight, positionWeight },
          query: validatedInput.query,
          indexName: validatedInput.indexName
        });
      }

      // Determine index based on context
      let searchIndex = validatedInput.indexName || STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS;
      if (runtimeContext?.get('useReport')) {
        searchIndex = STORAGE_CONFIG.VECTOR_INDEXES.REPORTS;
      }
      // Conditional tracing span for initial query if tracing is enabled
      const initialQuerySpan = tracingContext?.currentSpan ? tracingContext.currentSpan.createChildSpan({
        type: AISpanType.GENERIC,
        name: 'rerank_initial_query',
        input: {
          query: validatedInput.query,
          indexName: searchIndex,
          topK: validatedInput.topK
        }
      }) : undefined;
      // First, get more results than needed for reranking using the vectorQueryTool
      const initialResults = await vectorQueryTool.execute({
        context: {
          queryText: validatedInput.query,
          topK: validatedInput.topK,
          threadId: searchIndex, // Use determined index as threadId for context
        },
        runtimeContext,
        tracingContext, // Pass tracingContext
        memory, // Pass memory
      });

      // If we have more results than needed, apply reranking
      if (initialResults.results.length > validatedInput.finalK) {
        const model = createGemini25Provider(modelPreference);

        // End initial query span if enabled
        if (initialQuerySpan) {
          initialQuerySpan.end({
            output: {
              resultsFound: initialResults.results.length,
              processingTime: Date.now() - startTime
            },
            metadata: { operation: 'rerank_initial_query' }
          });
        }
        // Convert vector query results to the format expected by rerank function
        const queryResults = initialResults.results.map((result: { id: string; score: number; metadata: Record<string, unknown>; content: string; }, index: number) => ({
          id: result.id,
          score: result.score,
          metadata: {
            ...result.metadata,
            text: result.content,
            index,
            userId,
            sessionId
          }
        }));

        // Rerank using Mastra's rerank function
        const rerankedResults = await rerank(
          queryResults,
          validatedInput.query,
          model,
          {
            weights: {
              semantic: semanticWeight,
              vector: vectorWeight,
              position: positionWeight
            },
            topK: validatedInput.finalK
          }
        );

        // Map reranked results back to messages (or a more generic format)
        const rerankedMessages = rerankedResults.map((result) => {
          return {
            id: result.result.id,
            content: result.result.metadata?.text || '', // Safely extract content
            role: 'assistant', // Assuming the reranked content is from the assistant
            metadata: result.result.metadata,
            score: result.score,
          };
        });

        const rerankMetadata = {
          topK: validatedInput.topK,
          finalK: validatedInput.finalK,
          before: 0, // Not applicable for vector search
          after: 0, // Not applicable for vector search
          initialResultCount: initialResults.results.length,
          rerankingUsed: true,
          rerankingDuration: Date.now() - startTime,
          averageRelevanceScore: rerankedResults.length > 0 ?
            rerankedResults.reduce((sum: number, r: RerankResult) => sum + r.score, 0) / rerankedResults.length : 0,
          userId,
          sessionId
        };
        // Conditional tracing span for reranking if tracing is enabled
        const rerankSpan = tracingContext?.currentSpan ? tracingContext.currentSpan.createChildSpan({
          type: AISpanType.GENERIC,
          name: 'rerank_operation',
          input: {
            initialCount: initialResults.results.length,
            finalK: validatedInput.finalK,
            model: modelPreference
          }
        }) : undefined;

        if (rerankSpan) {
          rerankSpan.end({
            output: {
              finalCount: rerankedResults.length,
              averageScore: rerankMetadata.averageRelevanceScore,
              processingTime: Date.now() - startTime
            },
            metadata: { operation: 'rerank_operation' }
          });
        }

        if (debug) {
          logger.info('Reranked search completed', {
            originalCount: initialResults.results.length,
            finalCount: rerankedMessages.length,
            avgScore: rerankMetadata.averageRelevanceScore,
            duration: rerankMetadata.rerankingDuration
          });
        }

        return rerankOutputSchema.parse({
          messages: rerankedMessages,
          uiMessages: [], // uiMessages are not applicable in this context
          rerankMetadata
        });

      } else {
        // Not enough results to warrant reranking, return original results
        const rerankMetadata = {
          topK: validatedInput.topK,
          finalK: validatedInput.finalK,
          before: 0,
          after: 0,
          initialResultCount: initialResults.results.length,
          rerankingUsed: false,
          rerankingDuration: Date.now() - startTime,
          averageRelevanceScore: 0,
          userId,
          sessionId
        };

        if (debug) {
          logger.info('Reranking skipped - insufficient results', {
            resultCount: initialResults.results.length,
            finalK: validatedInput.finalK
          });
        }

        return rerankOutputSchema.parse({
          messages: initialResults.results,
          uiMessages: [],
          rerankMetadata
        });
      }

    } catch (error) {
      logger.error('Rerank tool execution failed', {
        error: error instanceof Error ? error.message : String(error),
        query: input.query,
        indexName: input.indexName
      });

      // Return empty results on error
      const rerankMetadata = {
        topK: input.topK || 10,
        finalK: input.finalK || 3,
        before: 0,
        after: 0,
        initialResultCount: 0,
        rerankingUsed: false,
        rerankingDuration: Date.now() - startTime,
        averageRelevanceScore: 0,
        userId: runtimeContext?.get('user-id') || 'anonymous',
        sessionId: runtimeContext?.get('session-id') || 'default'
      };

      return rerankOutputSchema.parse({
        messages: [],
        uiMessages: [],
        rerankMetadata
      });
    }
  },
});

/**
 * Runtime context instance for rerank tool with defaults
 */
export const rerankRuntimeContext = new RuntimeContext<RerankRuntimeContext>();
rerankRuntimeContext.set('model-preference', 'gemini-2.5-flash-lite-preview-06-17');
rerankRuntimeContext.set('semantic-weight', 0.6);
rerankRuntimeContext.set('vector-weight', 0.3);
rerankRuntimeContext.set('position-weight', 0.1);
rerankRuntimeContext.set('debug', false);
rerankRuntimeContext.set('quality-threshold', 0.7);