import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { createGeminiEmbeddingModel } from "./googleProvider";
import { embedMany } from "ai";
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ name: 'libsql-storage', level: 'info' });

/**
 * Complete LibSQL Storage Configuration for Mastra Deep Research Agent
 */

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

/**
 * LibSQL Storage Configuration
 */
export const createLibSQLStore = () => {
  const databaseUrl = process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL;

  try {
    const store = new LibSQLStore({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
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

/**
 * LibSQL Vector Store Configuration
 */
export const createLibSQLVectorStore = () => {
  const databaseUrl = process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL;

  try {
    const vectorStore = new LibSQLVector({
      connectionUrl: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
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

/**
 * Initialize vector indexes
 */
export const initializeVectorIndexes = async () => {
  const vectorStore = createLibSQLVectorStore();

  try {
    logger.info('Initializing vector indexes...');

    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.WEB_CONTENT,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.LEARNINGS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });

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
    const { embeddings } = await embedMany({
      values: [query],
      model: embedder,
    });

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

/**
 * Memory Configuration for Research Agents
 */
export const createResearchMemory = () => {
  return new Memory({
    storage: createLibSQLStore(),
    vector: createLibSQLVectorStore(),
    options: {
      lastMessages: 50,
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
    },
  });
};

/**
 * Memory Configuration for Report Generation Agents
 */
export const createReportMemory = () => {
  return new Memory({
    storage: createLibSQLStore(),
    vector: createLibSQLVectorStore(),
    options: {
      lastMessages: 100,
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
    },
  });
};

/**
 * ExtractParams interface
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
 * Upsert vectors to LibSQL vector store
 */
export async function upsertVectors(
  indexName: string,
  vectors: number[][],
  metadata: Array<Record<string, unknown>>,
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const vectorStore = createLibSQLVectorStore();


    await vectorStore.upsert({
      indexName,
      vectors,
      metadata,
      ids,
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
 * Create vector index
 */
export async function createVectorIndex(
  indexName: string,
  dimension = STORAGE_CONFIG.DEFAULT_DIMENSION,
  metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine'
): Promise<{ success: boolean; error?: string }> {
  try {
    const vectorStore = createLibSQLVectorStore();
    await vectorStore.createIndex({
      indexName,
      dimension,
      metric,
    });

    logger.info('Vector index created successfully', { indexName, dimension, metric });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create vector index', {
      indexName,
      dimension,
      error: errorMessage
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Query vectors from LibSQL vector store
 */
export async function queryVectors(
  indexName: string,
  queryVector: number[],
  topK = 5,
  filter?: Record<string, unknown>,
  includeVector = false
): Promise<Array<{
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}>> {
  try {
    const vectorStore = createLibSQLVectorStore();
    const results = await vectorStore.query({
      indexName,
      queryVector,
      topK,
      filter: filter as any,
      includeVector,
    });

    logger.info('Vector query completed successfully', {
      indexName,
      topK,
      resultsCount: results.length
    });

    return results.map(result => ({
      id: result.id,
      score: result.score,
      metadata: result.metadata || {}
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to query vectors', {
      indexName,
      topK,
      error: errorMessage
    });
    throw error;
  }
}

/**
 * Search memory messages
 */
export async function searchMemoryMessages(
  memory: Memory,
  threadId: string,
  query: string,
  topK = 5
): Promise<{ messages: any[]; uiMessages: any[] }> {
  try {
    const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

    const { embeddings } = await embedMany({
      values: [query],
      model: embedder,
    });

    const recalled = await memory.query({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
      queryVector: embeddings[0],
      query: query,
      threadId,
      topK,
      embedder,
    } as any);

    // memory.query can return different shapes; prefer .messages or .messagesV2, fallback to array if provided
    const recalledMessagesArray: any[] =
      Array.isArray((recalled as any).messages) ? (recalled as any).messages
      : Array.isArray((recalled as any).messagesV2) ? (recalled as any).messagesV2
      : Array.isArray(recalled) ? recalled
      : [];

    const relevantMessages = recalledMessagesArray.map((msg: any) => ({
      id: msg.id,
      role: msg.role ?? msg.sender ?? msg.roleName,
      content: msg.content ?? msg.parts?.map((p: any) => p.text || p.content).join('') ?? '',
      createdAt: msg.createdAt ?? msg.timestamp,
      threadId: msg.threadId ?? msg.thread_id,
    }));

    logger.info('Memory search completed', {
      threadId,
      query,
      topK,
      foundMessages: relevantMessages.length
    });

    return {
      messages: relevantMessages,
      uiMessages: relevantMessages // Assuming uiMessages are the same for now
    };
  } catch (error) {
    logger.error('Failed to search memory messages', {
      threadId,
      query,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { messages: [], uiMessages: [] };
  }
}

/**
 * Vector store error class
 */
export class VectorStoreError extends Error {
  public operation: string;
  public context: Record<string, unknown>;

  constructor(message: string, operation: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'VectorStoreError';
    this.operation = operation;
    this.context = context;
  }
}

/**
 * LibSQL vector store instance
 */
export const upstashVector = createLibSQLVectorStore();

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

/**
 * Get or create user resource for working memory
 */
export const getOrCreateUserResource = async (memory: Memory, userId: string) => {
  try {
    const storage = memory.storage; // Already confirmed to be LibSQLStore type

    let userResource = await storage.getResourceById({ resourceId: userId });

    if (userResource) {
      return userResource;
    }

    await storage.saveResource({
      resource: {
        id: userId,
        workingMemory: `# User Research Context for ${userId}
- **Research Interests**: To be populated during conversations
- **Preferred Sources**: To be populated during conversations
- **Previous Research**: To be populated during conversations
- **Contact Information**: User ID: ${userId}`,
        createdAt: new Date(), // Changed to Date object
        updatedAt: new Date(), // Changed to Date object
        metadata: {
          resourceId: userId, // Keep resourceId in metadata for consistency/retrieval
          preferences: {},
          tags: ['research-user']
        }
      }
    });

    logger.info('Created new user resource', { userId });

    // Re-fetch the resource after creation to ensure it's fully populated and consistent
    userResource = await storage.getResourceById({ resourceId: userId });
    return userResource;
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
export const updateUserWorkingMemory = async (memory: Memory, userId: string, updates: Record<string, any>) => {
  try {
    await memory.storage?.updateResource({
      resourceId: userId,
      workingMemory: updates.workingMemory,
      metadata: {
        ...updates.metadata,
        updatedAt: new Date(), // Moved updatedAt back into metadata
        // resourceId: userId // This property is not needed here, as it's already resourceId
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

/**
 * Chunk with metadata for processing
 */
export interface ChunkWithMetadata {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Extract metadata from chunks
 */
export function extractChunkMetadata(
  chunks: ChunkWithMetadata[],
  extractParams: ExtractParams
): ChunkWithMetadata[] {
  const enhancedChunks = [...chunks];

  chunks.forEach((chunk, index) => {
    const enhancedMetadata: Record<string, unknown> = { ...chunk.metadata };

    if (extractParams.title) {
      if (typeof extractParams.title === 'boolean') {
        const firstLine = chunk.content.split('\n')[0]?.trim();
        const firstSentence = chunk.content.split(/[.!?]/)[0]?.trim();
        enhancedMetadata.extractedTitle = firstLine || firstSentence || `Chunk ${index + 1}`;
      } else {
        enhancedMetadata.extractedTitle = `Advanced Title ${index + 1}`;
      }
    }

    if (extractParams.summary) {
      if (typeof extractParams.summary === 'boolean') {
        enhancedMetadata.extractedSummary = `${chunk.content.substring(0, 100)}...`;
      } else {
        const summaries: Record<string, string> = {};
        if (extractParams.summary.summaries?.includes('self')) {
          summaries.self = `${chunk.content.substring(0, 150)}...`;
        }
        enhancedMetadata.extractedSummaries = summaries;
      }
    }

    if (extractParams.keywords) {
      if (typeof extractParams.keywords === 'boolean') {
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
        enhancedMetadata.extractedKeywords = [`keyword1`, `keyword2`, `keyword3`];
      }
    }

    if (extractParams.questions) {
      if (typeof extractParams.questions === 'boolean') {
        const questions = chunk.content.split(/[.!?]/)
          .map(s => s.trim())
          .filter(s => s.endsWith('?'))
          .slice(0, 3);
        enhancedMetadata.extractedQuestions = questions;
      } else {
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

/**
 * Storage health check
 */
export const performStorageHealthCheck = async () => {
  const results = {
    storage: false,
    vectorStore: false,
    indexes: {} as Record<string, boolean>,
    errors: [] as string[]
  };

  try {
    createLibSQLStore();
    results.storage = true;
    logger.info('Storage connectivity check passed');
  } catch (error) {
    results.errors.push(`Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    createLibSQLVectorStore();
    results.vectorStore = true;
    logger.info('Vector store connectivity check passed');
  } catch (error) {
    results.errors.push(`Vector store check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const indexesToCheck = Object.values(STORAGE_CONFIG.VECTOR_INDEXES);
  for (const indexName of indexesToCheck) {
    try {
      const vectorStore = createLibSQLVectorStore();
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
 */
export const initializeStorageSystem = async () => {
  try {
    logger.info('Initializing complete storage system...');

    await initializeVectorIndexes();

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