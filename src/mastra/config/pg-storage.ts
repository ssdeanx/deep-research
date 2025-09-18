import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from '@mastra/pg';
import { google } from "@ai-sdk/google";
import { createVectorQueryTool, MDocument, createGraphRAGTool } from "@mastra/rag";
import { embedMany } from "ai";
import { PinoLogger } from "@mastra/loggers";
import type { AITracingEvent } from '@mastra/core/ai-tracing';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'pg-storage', level: 'debug' });

logger.info("PG Storage config loaded");

// Provide a typed placeholder for chunks so subsequent code compiles.
// Replace or populate this with real content-loading logic as needed.
const chunks: Array<{ text: string; metadata?: any; id?: string }> = [];

// Create tracing event for embedding operation
const embeddingEvent: any = {
  type: AISpanType.LLM_CHUNK,
  timestamp: new Date().toISOString(),
  model: 'gemini-embedding-001',
  input: {
    chunkCount: chunks.length,
    totalTextLength: chunks.reduce((sum, chunk) => sum + (chunk.text?.length ?? 0), 0)
  },
  output: { status: 'processing' }
};

const { embeddings } = await embedMany({
  values: chunks.map(chunk => chunk.text),
  model: google.textEmbedding('gemini-embedding-001'),
  maxParallelCalls: 10,
  maxRetries: 3,
  abortSignal: new AbortController().signal,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true,
    functionId: 'embedMany',
    metadata: {
      type: 'chunking',
      source: 'pg-storage.ts',
      function: 'embedMany',
      model: 'gemini-embedding-001',
      usage: 'internal',
      purpose: 'embedding chunks for storage',
      timestamp: new Date().toISOString()},
    tracer: undefined
    }
});

// Update tracing event with completion
embeddingEvent.output = {
  embeddingCount: embeddings.length,
  embeddingDimension: embeddings[0]?.length || 0,
  status: 'completed'
};
logger.info("Embeddings generated", { output: embeddingEvent.output, type: embeddingEvent.type, model: embeddingEvent.model, timestamp: embeddingEvent.timestamp, input: embeddingEvent.input, chunkCount: embeddingEvent.input.chunkCount });
//const store2 = new PostgresStore({ connectionString });

const store = new PostgresStore({
    connectionString: process.env.SUPABASE ?? "postgresql://user:password@localhost:5432/mydb",
    schemaName: 'mastra',
    max: 20, // use up to 20 connections
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
});

const pgVector = new PgVector({ connectionString: process.env.SUPABASE ?? "postgresql://user:password@localhost:5432/mydb", schemaName: 'mastra' });

//await store.createIndex({
//  name: 'idx_traces_attributes',
//  table: 'mastra_traces',
//  columns: ['attributes'],
//  method: 'gin',
//  unique: true,
//  where: 'condition',
//  storage: { fillfactor: 90 },
//  concurrent: true,
//  opclass: 'jsonb_path_ops'
//});

// Basic index for common queries
//await store.createIndex({
//  name: 'idx_threads_resource',
//  table: 'mastra_threads',
//  columns: ['resourceId'],
//  method: 'btree', // '"gin" | "btree" | "hash" | "gist" | "spgist" | "brin" | undefined'
//  unique: true,
//  where: 'resourceId IS NOT NULL',
//  storage: { fillfactor: 90 },
//  concurrent: true,
//  opclass: 'resource_id_ops'
//});

// Composite index with sort order for filtering + sorting
//await store.createIndex({
//  name: 'idx_messages_composite',
//  table: 'mastra_messages',
//  columns: ['thread_id', 'createdAt DESC'],
//  unique: true,
//  method: 'gist',
//  where: 'thread_id IS NOT NULL',
//  storage: { fillfactor: 90 },
//  concurrent: true,
//  opclass: 'timestamp_ops'
//});

//await pgVector.createIndex({
//  indexName: "agentMemoryIndex",
//  dimension: 1536,
//  metric: 'cosine', // or 'euclidean', 'dotproduct'
//  buildIndex: true,
//});

// Store embeddings with rich metadata for better organization and filtering
//await pgVector.upsert({
//  indexName: "agentMemoryIndex",
//  vectors: embeddings,
//  metadata: chunks.map((chunk, i) => ({
//    // Basic content
//    text: chunk.text,
//    id: chunk.id ?? `chunk-${i}`, // generate fallback id when chunk has no id

//    // Document organization
//    source: chunk.metadata?.source,
//    category: chunk.metadata?.category,

    // Temporal metadata
//    createdAt: new Date().toISOString(),
//    version: "1.0",

    // Custom fields
//    language: chunk.metadata?.language,
//    author: chunk.metadata?.author,
//    confidenceScore: chunk.metadata?.score,
//    sparseVector: chunk.metadata?.sparseVector,
//  })),
//  sparseVectors:  // Optional sparse vectors
//});

export const agentMemory = new Memory({
  storage: store,
  vector: pgVector,
  embedder:  google.textEmbedding("gemini-embedding-001"),
  options: {
    lastMessages: 500,
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 3,
        after: 2
      },
      scope: 'resource'
    },
    workingMemory: {
        enabled: true,
        template: `
        # Todo List
          ## Active Items
            - Task 1: Example task
                - Due:
                - Description:
                - Status: Not Started
                - Estimated Time:
                - Priority:
            - Task 2: Another task
                - Due:
                - Description:
                - Status: Not Started
                - Estimated Time:
                - Priority:


          ## Completed Items
            - None yet

        `
      },
      threads: {
        generateTitle: true
      },
    }
  },
);

// Graph-based RAG tool for complex relational queries
export const graphQueryTool = createGraphRAGTool({
  vectorStoreName: "pgVector",
  indexName: "agentMemoryIndex",
  model: google.textEmbedding("gemini-embedding-001"),
  graphOptions: {
    threshold: 0.7,
  },
  enableFilter: true,
});

// pgVector with performance tuning
export const pgVectorQueryTool = createVectorQueryTool({
  vectorStoreName: "pgVector",
  indexName: "agentMemoryIndex",
  model: google.textEmbedding("gemini-embedding-001"),
  databaseConfig: {
    pgvector: {
      minScore: 0.7,    // Filter low-quality results
      ef: 200,          // HNSW search parameter
      probes: 10        // IVFFlat probe parameter
    }
  },
  enableFilter: true,
  description: "Search for semantically similar content in the pgVector store using embeddings. Supports filtering, ranking, and context retrieval."
});
