import { LibSQLVector } from "@mastra/libsql";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { createGeminiEmbeddingModel } from "./googleProvider";

const doc = MDocument.fromText("Your text content...");

const chunks = await doc.chunk();

// Create embeddingsdoc = MDocument.fromText(content, { title, source, ...metadata });

const { embeddings } = await embedMany({
  values: chunks.map((chunk) => chunk.text),
  model: createGeminiEmbeddingModel("gemini-embedding-001"),
});
 
const libsql = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || "",
  authToken: process.env.DATABASE_AUTH_TOKEN, // Optional: for Turso cloud databases
});

await libsql.createIndex({
    indexName: "myCollection",
    dimension: 1536,
});

// Store embeddings with rich metadata for better organization and filtering
await libsql.upsert({
  indexName: "myCollection",
  vectors: embeddings,
  metadata: chunks.map((chunk, idx) => ({
    // Basic content
    text: chunk.text,
    id: chunk.metadata?.id ?? `chunk-${idx}`,

    // Document organization (use metadata fields which are present on the chunk)
    source: chunk.metadata?.source,
    category: chunk.metadata?.category,

    // Temporal metadata
    createdAt: new Date().toISOString(),
    version: "1.0",

    // Custom fields (use metadata fields which are present on the chunk)
    language: chunk.metadata?.language,
    author: chunk.metadata?.author,
    confidenceScore: chunk.metadata?.score,
  })),
});

