import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from '@mastra/pg';
import { google } from "@ai-sdk/google";
import { createVectorQueryTool, MDocument, createGraphRAGTool } from "@mastra/rag";
import { embedMany } from "ai";
import type { UIMessage } from 'ai';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'libsql-storage', level: 'debug',
//  transports: {
//      file: new FileTransport({ path: "../../../mastra.log" })
//    }
});

logger.info("PG Storage config loaded");

//const host = process.env.PG_HOST ?? `localhost`;
//const port = process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432;
//const user = process.env.PG_USER ?? `postgres`;
//const database = process.env.PG_DATABASE ?? `postgres`;
//const password = process.env.PG_PASSWORD ?? `password`;
//const connectionString = process.env.PG_CONNECTION_STRING ?? `postgresql://${user}:${password}@${host}:${port}`;

const doc = MDocument.fromText("Your text content...", { metadata: { source: 'pg-storage.ts', type: 'example', version: '1.0' } });

const chunks = await doc.chunk();

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

//const store2 = new PostgresStore({ connectionString });

const store = new PostgresStore({
    connectionString: process.env.SUPABASE ?? "postgresql://user:password@localhost:5432/mydb",
    schemaName: 'mastra',
    max: 20, // use up to 20 connections
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
});

const pgVector = new PgVector({ connectionString: process.env.SUPABASE ?? "postgresql://user:password@localhost:5432/mydb", schemaName: 'mastra' });

await store.createIndex({
  name: 'idx_traces_attributes',
  table: 'mastra_traces',
  columns: ['attributes'],
  method: 'gin',
  unique: true,
  where: 'condition',
  storage: { fillfactor: 90 },
  concurrent: true
});

// Basic index for common queries
await store.createIndex({
  name: 'idx_threads_resource',
  table: 'mastra_threads',
  columns: ['resourceId']
});

// Composite index with sort order for filtering + sorting
await store.createIndex({
  name: 'idx_messages_composite',
  table: 'mastra_messages',
  columns: ['thread_id', 'createdAt DESC'],
  unique: true,
  method: 'gist',
  storage: { fillfactor: 90 },
  concurrent: true,
  opclass: 'timestamp_ops'
});

await pgVector.createIndex({
  indexName: "agentMemoryIndex",
  dimension: 3072,
  metric: 'cosine', // or 'euclidean', 'dotproduct'
  buildIndex: true,
});

// Store embeddings with rich metadata for better organization and filtering
await pgVector.upsert({
  indexName: "agentMemoryIndex",
  vectors: embeddings,
  metadata: chunks.map((chunk, i) => ({
    // Basic content
    text: chunk.text,
    id: (chunk as any).id ?? `chunk-${i}`, // generate fallback id when chunk has no id

    // Document organization
    source: (chunk as any).metadata?.source ?? null,
    category: (chunk as any).metadata?.category ?? null,

    // Temporal metadata
    createdAt: new Date().toISOString(),
    version: "1.0",

    // Custom fields
    language: (chunk as any).metadata?.language ?? null,
    author: (chunk as any).metadata?.author ?? null,
    confidenceScore: (chunk as any).metadata?.score ?? null,
    sparseVector: (chunk as any).metadata?.sparseVector ?? null,
  })),
//  sparseVectors:  // Optional sparse vectors
});

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
