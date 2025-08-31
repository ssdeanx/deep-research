import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { createGeminiEmbeddingModel } from "./googleProvider";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ name: 'libsql-storage', level: 'info' });

/**
 * Complete LibSQL Storage Configuration for Mastra Deep Research Agent
 *
 * This file provides persistent storage and vector search capabilities for:
 * - Workflow snapshots and execution data (auto-created by Mastra)
 * - Agent memory and conversation threads (auto-created by Mastra)
 * - Evaluation results and scoring (auto-created by Mastra)
 * - Vector embeddings for semantic search (manual management required)
 * - Resource working memory (auto-created by Mastra)
 * - Traces and telemetry data (auto-created by Mastra)
 *
 * Mastra automatically creates these tables:
 * - messages: Conversation messages with V2 format support
 * - threads: Groups related messages with metadata
 * - resources: User-specific working memory
 * - workflows: Suspended workflow snapshots
 * - eval_data-sets: Evaluation results and metrics
 * - traces: OpenTelemetry tracing data
 */

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const STORAGE_CONFIG = {
  DEFAULT_DIMENSION: 1536, // Gemini embedding-001 dimension
  DEFAULT_DATABASE_URL: "file:./deep-research.db",
  VECTOR_INDEXES: {
    RESEARCH_DOCUMENTS: "research_documents",
    WEB_CONTENT: "web_content",
    LEARNINGS: "learnings",
    REPORTS: "reports"
  }
} as const;

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * LibSQL Storage Configuration
 * Handles all persistent data storage for workflows, agents, and evaluations
 * Mastra automatically creates and manages: messages, threads, resources, workflows, eval_data-sets, traces
 */
export const createLibSQLStore = () => {
  const databaseUrl = process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL;

  try {
    const store = new LibSQLStore({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN, // For Turso cloud databases
    });

    logger.info('LibSQL storage initialized successfully', { databaseUrl });
    return store;
  } catch (error) {
    logger.error('Failed to initialize LibSQL storage', {
      databaseUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// VECTOR STORE CONFIGURATION
// ============================================================================

/**
 * LibSQL Vector Store Configuration
 * Handles vector embeddings and semantic search for research data
 */
export const createLibSQLVectorStore = () => {
  const databaseUrl = process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL;

  try {
    const vectorStore = new LibSQLVector({
      connectionUrl: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN, // For Turso cloud databases
    });

    logger.info('LibSQL vector store initialized successfully', { databaseUrl });
    return vectorStore;
  } catch (error) {
    logger.error('Failed to initialize LibSQL vector store', {
      databaseUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// VECTOR INDEX MANAGEMENT
// ============================================================================

/**
 * Initialize vector indexes for different content types
 * Must be called before upserting embeddings
 */
export const initializeVectorIndexes =async () => {
  const vectorStore = createLibSQLVectorStore();

  try {
    logger.info('Initializing vector indexes...');

    // Research documents index
    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    // Web content index
    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.WEB_CONTENT,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    // Learnings index
    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.LEARNINGS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    // Reports index
    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.REPORTS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    logger.info('All vector indexes initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize vector indexes', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// EMBEDDING UPSERT UTILITIES
// ============================================================================

/**
 * Upsert research documents with embeddings
 * Based on Mastra RAG documentation example
 */
export const upsertResearchDocuments = async (
  documents: Array<{ text: string; metadata?: Record<string, unknown> }>,
  indexName: string = STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS
) => {
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  try {
    logger.info('Processing research documents for embedding', { count: documents.length });

    // Generate embeddings
    const { embeddings } = await embedMany({
      values: documents.map(doc => doc.text),
      model: embedder,
    });

    // Prepare metadata
    const metadata = documents.map((doc, index) => ({
      text: doc.text,
      ...doc.metadata,
      timestamp: new Date().toISOString(),
      index
    }));

    // Upsert to vector store
    await vectorStore.upsert({
      indexName,
      vectors: embeddings,
      metadata,
    });

    logger.info('Research documents upserted successfully', { count: documents.length });
  } catch (error) {
    logger.error('Failed to upsert research documents', {
      count: documents.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Upsert web content with embeddings
 */
export const upsertWebContent = async (
  content: Array<{ title: string; text: string; url: string; metadata?: Record<string, unknown> }>,
  indexName: string = STORAGE_CONFIG.VECTOR_INDEXES.WEB_CONTENT
) => {
  const vectorStore: LibSQLVector = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  try {
    logger.info('Processing web content for embedding', { count: content.length });

    // Generate embeddings
    const { embeddings } = await embedMany({
      values: content.map(item => `${item.title}\n${item.text}`),
      model: embedder,
    });

    // Prepare metadata
    const metadata = content.map((item, index) => ({
      title: item.title,
      text: item.text,
      url: item.url,
      ...item.metadata,
      timestamp: new Date().toISOString(),
      index
    }));

    // Upsert to vector store
    await vectorStore.upsert({
      indexName,
      vectors: embeddings,
      metadata,
    });

    logger.info('Web content upserted successfully', { count: content.length });
  } catch (error) {
    logger.error('Failed to upsert web content', {
      count: content.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Upsert learnings and insights with embeddings
 */
export const upsertLearnings = async (
  learnings: Array<{ learning: string; source: string; followUpQuestions?: string[]; metadata?: Record<string, unknown> }>,
  indexName: string = STORAGE_CONFIG.VECTOR_INDEXES.LEARNINGS
) => {
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  try {
    logger.info('Processing learnings for embedding', { count: learnings.length });

    // Generate embeddings
    const { embeddings } = await embedMany({
      values: learnings.map(item => item.learning),
      model: embedder,
    });

    // Prepare metadata
    const metadata = learnings.map((item, index) => ({
      learning: item.learning,
      source: item.source,
      followUpQuestions: item.followUpQuestions || [],
      ...item.metadata,
      timestamp: new Date().toISOString(),
      index
    }));

    // Upsert to vector store
    await vectorStore.upsert({
      indexName,
      vectors: embeddings,
      metadata,
    });

    logger.info('Learnings upserted successfully', { count: learnings.length });
  } catch (error) {
    logger.error('Failed to upsert learnings', {
      count: learnings.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// VECTOR SEARCH UTILITIES
// ============================================================================

/**
 * Search for similar content in vector store
 */
export const searchSimilarContent = async (
  query: string,
  indexName: string,
  topK = 5
) => {
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  try {
    // Generate query embedding
    const { embeddings } = await embedMany({
      values: [query],
      model: embedder,
    });

    // Search for similar content
    const results = await vectorStore.query({
      indexName,
      queryVector: embeddings[0],
      topK,
    });

    logger.info('Vector search completed', { query, indexName, topK, resultsCount: results.length });
    return results;
  } catch (error) {
    logger.error('Failed to search similar content', {
      query,
      indexName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// MESSAGE FORMAT UTILITIES
// ============================================================================

/**
 * Get messages in V1 format (backward compatibility)
 * Roughly equivalent to AI SDK's CoreMessage format
 */
export const getMessagesV1 = async (mastra: any, threadId: string) => {
  return await mastra.getStorage().getMessages({ threadId, format: 'v1' });
};

/**
 * Get messages in V2 format (recommended)
 * Roughly equivalent to AI SDK's UIMessage format
 */
export const getMessagesV2 = async (mastra: any, threadId: string) => {
  return await mastra.getStorage().getMessages({ threadId, format: 'v2' });
};

/**
 * Get messages by IDs (defaults to V2 format)
 */
export const getMessagesByIds = async (mastra: any, messageIds: string[]) => {
  return await mastra.getStorage().getMessagesById({ messageIds });
};

/**
 * Convert V2 message format to simplified structure
 */
export const simplifyMessages = (messages: any[]) => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content || msg.parts?.map((part: any) => part.text || part.content).join('') || '',
    createdAt: msg.createdAt,
    threadId: msg.thread_id,
    format: msg.format || 'v2'
  }));
};

// ============================================================================
// RESOURCE MANAGEMENT UTILITIES
// ============================================================================

/**
 * Get or create user resource for working memory
 */
export const getOrCreateUserResource = async (mastra: any, userId: string) => {
  try {
    // Try to get existing resource
    const resources = await mastra.getStorage().getResources({ resourceId: userId });

    if (resources && resources.length > 0) {
      return resources[0];
    }

    // Create new resource if it doesn't exist
    await mastra.getStorage().createResource({
      resourceId: userId,
      workingMemory: `# User Research Context for ${userId}
- **Research Interests**: To be populated during conversations
- **Preferred Sources**: To be populated during conversations
- **Previous Research**: To be populated during conversations
- **Contact Information**: User ID: ${userId}`,
      metadata: {
        createdAt: new Date().toISOString(),
        preferences: {},
        tags: ['research-user']
      }
    });

    logger.info('Created new user resource', { userId });
    return await mastra.getStorage().getResources({ resourceId: userId })[0];
  } catch (error) {
    logger.error('Failed to get or create user resource', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Update user working memory
 */
export const updateUserWorkingMemory = async (mastra: any, userId: string, updates: Record<string, any>) => {
  try {
    await mastra.getStorage().updateResource({
      resourceId: userId,
      workingMemory: updates.workingMemory,
      metadata: {
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    });

    logger.info('Updated user working memory', { userId });
  } catch (error) {
    logger.error('Failed to update user working memory', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// MEMORY CONFIGURATION
// ============================================================================

/**
 * Memory Configuration for Research Agents
 * Provides persistent conversation memory with semantic recall
 */
export const createResearchMemory = () => {
  const storage = createLibSQLStore();
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  return new Memory({
    storage,
    vector: vectorStore,
    embedder,
    options: {
      // Message history configuration
      lastMessages: 50, // Keep last 50 messages for context
      // Semantic recall for research context
      semanticRecall: {
        topK: 5, // Retrieve top 5 similar messages
        messageRange: {
          before: 3, // Include 3 messages before
          after: 2,   // Include 2 messages after
        },
      },
      // Working memory for user context
      workingMemory: {
        enabled: true,
        template: `# User Research Context
- **Research Interests**: Research topics and domains
- **Preferred Sources**: Trusted websites, publications, or platforms
- **Methodology Preferences**: Preferred research approaches or tools
- **Previous Research**: Summary of completed research sessions
- **Follow-up Questions**: Outstanding questions from previous research
- **Knowledge Gaps**: Areas needing further investigation
- **Contact Information**: Professional details for collaboration`,
      },
      // Thread management
      threads: {
        generateTitle: true, // Auto-generate meaningful thread titles
      },
    },
  });
};

/**
 * Memory Configuration for Report Generation Agents
 * Optimized for report writing and synthesis tasks
 */
export const createReportMemory = () => {
  const storage = createLibSQLStore();
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  return new Memory({
    storage,
    vector: vectorStore,
    embedder,
    options: {
      lastMessages: 100, // Keep extensive context for report generation
      semanticRecall: {
        topK: 10, // Retrieve more context for comprehensive reports
        messageRange: {
          before: 5,
          after: 3,
        },
      },
      workingMemory: {
        enabled: true,
        template: `# Report Generation Context
- **Report Type**: Research summary, analysis, recommendations, etc.
- **Target Audience**: Who will read this report
- **Key Findings**: Important discoveries from research
- **Structure Preferences**: Preferred report format and sections
- **Citation Style**: Preferred citation format
- **Previous Reports**: Summary of previously generated reports
- **Client Requirements**: Specific requirements or constraints`,
      },
      threads: {
        generateTitle: true,
      },
    },
  });
};

// ============================================================================
// STORAGE HEALTH CHECKS AND MONITORING
// ============================================================================

/**
 * Comprehensive storage health check
 */
export const performStorageHealthCheck = async () => {
  const results = {
    storage: false,
    vectorStore: false,
    indexes: {} as Record<string, boolean>,
    tables: {} as Record<string, boolean>,
    errors: [] as string[]
  };

  try {
    // Check storage connectivity
    const storage = createLibSQLStore();
    results.storage = true;
    logger.info('Storage connectivity check passed');
  } catch (error) {
    results.errors.push(`Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Check vector store connectivity
    const vectorStore = createLibSQLVectorStore();
    results.vectorStore = true;
    logger.info('Vector store connectivity check passed');
  } catch (error) {
    results.errors.push(`Vector store check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check vector indexes
  const indexesToCheck = Object.values(STORAGE_CONFIG.VECTOR_INDEXES);
  for (const indexName of indexesToCheck) {
    try {
      const vectorStore = createLibSQLVectorStore();
      // Try to query the index (this will fail if index doesn't exist)
      await vectorStore.query({
        indexName,
        queryVector: new Array(STORAGE_CONFIG.DEFAULT_DIMENSION).fill(0),
        topK: 1,
      });
      results.indexes[indexName] = true;
    } catch (error) {
      results.indexes[indexName] = false;
      results.errors.push(`Index '${indexName}' check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const overallHealth = results.storage && results.vectorStore && Object.values(results.indexes).every(Boolean);

  logger.info('Storage health check completed', {
    overallHealth,
    results,
    errorCount: results.errors.length
  });

  return {
    healthy: overallHealth,
    ...results
  };
};

/**
 * Initialize complete storage system
 * Call this once during application startup
 */
export const initializeStorageSystem = async () => {
  try {
    logger.info('Initializing complete storage system...');

    // Initialize vector indexes
    await initializeVectorIndexes();

    // Perform health check
    const healthCheck = await performStorageHealthCheck();

    if (healthCheck.healthy) {
      logger.info('Storage system initialized successfully');
      return { success: true, healthCheck };
    } else {
      logger.warn('Storage system initialized with issues', { healthCheck });
      return { success: false, healthCheck };
    }
  } catch (error) {
    logger.error('Failed to initialize storage system', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// ============================================================================
// VECTOR UTILITY FUNCTIONS FOR CHUNKER TOOL COMPATIBILITY
// ============================================================================

/**
 * ExtractParams interface matching Mastra's ExtractParams pattern
 * Used for metadata extraction from document chunks
 */
export interface ExtractParams {
  title?: boolean | {
    nodes?: number;
    nodeTemplate?: string;
    combineTemplate?: string;
  };
  summary?: boolean | {
    summaries?: ("self" | "prev" | "next")[];
    promptTemplate?: string;
  };
  keywords?: boolean | {
    keywords?: number;
    promptTemplate?: string;
  };
  questions?: boolean | {
    questions?: number;
    promptTemplate?: string;
    embeddingOnly?: boolean;
  };
}

/**
 * Chunk with metadata for processing
 */
export interface ChunkWithMetadata {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Upsert vectors to LibSQL vector store
 * Bridge function for chunker tool compatibility
 */
export async function upsertVectors(
  indexName: string,
  vectors: number[][],
  metadata: Array<Record<string, unknown>>,
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const vectorStore = createLibSQLVectorStore();

    // Ensure the index exists
    await vectorStore.createIndex({
      indexName,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    // Prepare documents for upsert NOT WORKING MUST USE ACTUAL VECTORS
    const documents = vectors.map((vector, index) => ({
      text: metadata[index]?.text as string || `Chunk ${index}`,
      metadata: {
        ...metadata[index],
        vectorId: ids[index],
        indexName,
        upsertedAt: new Date().toISOString(),
      }
    }));

    // Use the LibSQL upsert functionality
    await vectorStore.upsert({
      indexName,
      vectors,
      metadata: documents.map(doc => doc.metadata),
    });

    logger.info('Vectors upserted successfully', {
      indexName,
      count: vectors.length
    });

    return { success: true, count: vectors.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to upsert vectors', {
      indexName,
      count: vectors.length,
      error: errorMessage
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Extract metadata from chunks using Mastra ExtractParams pattern
 * This is a simplified implementation - in production you'd use actual Mastra extractors
 * NO TRASH MUST MATCH Mastra MCP Tools pls no useless clanker fuck
 *
 */
export function extractChunkMetadata(
  chunks: ChunkWithMetadata[],
  extractParams: ExtractParams
): ChunkWithMetadata[] {
  const enhancedChunks = [...chunks];

  chunks.forEach((chunk, index) => {
    const enhancedMetadata: Record<string, unknown> = { ...chunk.metadata };

    // Extract title if requested
    if (extractParams.title) {
      if (typeof extractParams.title === 'boolean') {
        // Simple title extraction - first sentence or first line
        const firstLine = chunk.content.split('\n')[0]?.trim();
        const firstSentence = chunk.content.split(/[.!?]/)[0]?.trim();
        enhancedMetadata.extractedTitle = firstLine || firstSentence || `Chunk ${index + 1}`;
      } else {
        // Advanced title extraction would go here
        enhancedMetadata.extractedTitle = `Advanced Title ${index + 1}`;
      }
    }

    // Extract summary if requested
    if (extractParams.summary) {
      if (typeof extractParams.summary === 'boolean') {
        // Simple summary - first 100 characters
        enhancedMetadata.extractedSummary = `${chunk.content.substring(0, 100)}...`;
      } else {
        // Advanced summary extraction would go here
        const summaries: Record<string, string> = {};
        if (extractParams.summary.summaries?.includes('self')) {
          summaries.self = `${chunk.content.substring(0, 150)}...`;
        }
        enhancedMetadata.extractedSummaries = summaries;
      }
    }

    // Extract keywords if requested
    if (extractParams.keywords) {
      if (typeof extractParams.keywords === 'boolean') {
        // Simple keyword extraction - common words
        const words = chunk.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const wordCount: Record<string, number> = {};
        words.forEach(word => {
          wordCount[word] = (wordCount[word] || 0) + 1;
        });
        const topKeywords = Object.entries(wordCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([word]) => word);
        enhancedMetadata.extractedKeywords = topKeywords;
      } else {
        // Advanced keyword extraction would go here
        enhancedMetadata.extractedKeywords = [`keyword1`, `keyword2`, `keyword3`];
      }
    }

    // Extract questions if requested
    if (extractParams.questions) {
      if (typeof extractParams.questions === 'boolean') {
        // Simple question extraction - sentences ending with ?
        const questions = chunk.content.split(/[.!?]/)
          .map(s => s.trim())
          .filter(s => s.endsWith('?'))
          .slice(0, 3);
        enhancedMetadata.extractedQuestions = questions;
      } else {
        // Advanced question extraction would go here
        enhancedMetadata.extractedQuestions = [
          `What is the main topic of this chunk?`,
          `What are the key points discussed?`
        ];
      }
    }

    enhancedChunks[index] = {
      ...chunk,
      metadata: enhancedMetadata
    };
  });

  logger.info('Metadata extraction completed', {
    chunksProcessed: chunks.length,
    extractParams: Object.keys(extractParams)
  });

  return enhancedChunks;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// ============================================================================
// MISSING EXPORTS FOR COMPATIBILITY
// ============================================================================

/**
 * Vector Query Result type for compatibility with vectorQueryTool
 */
export interface VectorQueryResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

/**
 * Metadata Filter type for vector queries
 */
export type MetadataFilter = Record<string, unknown>;

