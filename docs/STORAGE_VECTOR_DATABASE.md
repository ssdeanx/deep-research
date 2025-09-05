# Storage and Vector Database Guide

This comprehensive guide covers the storage and vector database implementation in the Mastra Deep Research System, including LibSQL storage, vector embeddings, and semantic search capabilities.

## Overview

The system uses a multi-layered storage architecture:

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  - Agents, Workflows, Tools         │
├─────────────────────────────────────┤
│        Storage Abstraction          │
│  - LibSQL Store (Messages, Threads) │
│  - Vector Store (Embeddings, Search)│
├─────────────────────────────────────┤
│          Database Layer             │
│  - LibSQL (SQLite with extensions)  │
│  - Vector extensions for embeddings │
└─────────────────────────────────────┘
```

## LibSQL Storage Configuration

### Core Configuration

```typescript
// Complete LibSQL Storage Configuration
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
```

### Storage Initialization

```typescript
import { LibSQLStore } from '@mastra/libsql';
import { STORAGE_CONFIG } from './config/libsql-storage';

// Initialize LibSQL storage
const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Initialize vector store
const vectorStore = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
```

## Vector Database Operations

### Index Management

```typescript
// Create vector indexes
export const initializeVectorIndexes = async () => {
  const vectorStore = createLibSQLVectorStore();

  // Create research documents index
  await vectorStore.createIndex({
    indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
    dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    metric: 'cosine' // cosine, euclidean, or dotproduct
  });

  // Create web content index
  await vectorStore.createIndex({
    indexName: STORAGE_CONFIG.VECTOR_INDEXES.WEB_CONTENT,
    dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    metric: 'cosine'
  });

  // Create learnings index
  await vectorStore.createIndex({
    indexName: STORAGE_CONFIG.VECTOR_INDEXES.LEARNINGS,
    dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    metric: 'cosine'
  });

  // Create reports index
  await vectorStore.createIndex({
    indexName: STORAGE_CONFIG.VECTOR_INDEXES.REPORTS,
    dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    metric: 'cosine'
  });
};
```

### Vector Upsert Operations

```typescript
// Upsert vectors with metadata
export async function upsertVectors(
  indexName: string,
  vectors: number[][],
  metadata: Array<Record<string, unknown>>,
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const vectorStore = createLibSQLVectorStore();

    // Ensure index exists

    // Upsert vectors
    await vectorStore.upsert({
      indexName,
      vectors,
      metadata,
      ids,
    });

    return { success: true, count: vectors.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Semantic Search Implementation

```typescript
// Search for similar content
export const searchSimilarContent = async (
  query: string,
  indexName: string,
  topK = 5
) => {
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel();

  // Generate query embedding
  const { embeddings } = await embedMany({
    values: [query],
    model: embedder,
  });

  // Perform vector search
  const results = await vectorStore.query({
    indexName,
    queryVector: embeddings[0],
    topK,
  });

  return results;
};
```

## Memory System Integration

### Research Memory Configuration

```typescript
// Memory configuration for research agents
export const createResearchMemory = () => {
  return new Memory({
    storage: createLibSQLStore(),
    vector: createLibSQLVectorStore(),
    options: {
      lastMessages: 50, // Keep last 50 messages
      workingMemory: {
        enabled: true,
        template: `# User Research Context
- **Current Research Topic**: The specific subject of the ongoing research.
- **Key Findings (Current)**: Summary of important discoveries from the current research phase.
- **Pending Questions**: Unanswered questions that require further investigation.
- **Relevant Sources**: Links or references to documents, web pages, or other materials being used.
- **Research Progress**: Current stage of the research (e.g., initial, follow-up, synthesis).
- **User Feedback**: Any feedback or directives from the user regarding the research.`,
      },
      semanticRecall: {
        enabled: true,
        topK: 10,
        messageRange: { before: 2, after: 1 }
      }
    },
  });
};
```

### Report Generation Memory

```typescript
// Memory configuration for report generation
export const createReportMemory = () => {
  return new Memory({
    storage: createLibSQLStore(),
    vector: createLibSQLVectorStore(),
    options: {
      lastMessages: 100, // Keep more messages for complex reports
      workingMemory: {
        enabled: true,
        template: `# Report Generation Context
- **Report Goal**: The main objective or purpose of the report.
- **Target Audience**: Who the report is for (e.g., technical experts, executives, general public).
- **Key Data Points**: Critical information or statistics to include.
- **Desired Tone**: The overall tone of the report (e.g., formal, informal, analytical, persuasive).
- **Structure Requirements**: Specific sections, headings, or formatting needed.
- **Call to Action**: Any specific actions the report should prompt.
- **Reviewer Feedback**: Input from previous drafts or review cycles.`,
      },
      semanticRecall: {
        enabled: true,
        topK: 15,
        messageRange: { before: 3, after: 2 }
      }
    },
  });
};
```

## Advanced Vector Operations

### Hybrid Search Implementation

```typescript
// Hybrid search combining semantic and metadata filtering
export const hybridVectorSearch = async (
  query: string,
  indexName: string,
  options: {
    topK?: number;
    metadataFilter?: Record<string, any>;
    semanticWeight?: number;
    metadataWeight?: number;
  } = {}
) => {
  const {
    topK = 5,
    metadataFilter,
    semanticWeight = 0.7,
    metadataWeight = 0.3
  } = options;

  // Generate embedding for semantic search
  const embedder = createGeminiEmbeddingModel();
  const { embeddings } = await embedMany({
    values: [query],
    model: embedder,
  });

  // Perform vector search
  const vectorStore = createLibSQLVectorStore();
  const semanticResults = await vectorStore.query({
    indexName,
    queryVector: embeddings[0],
    topK: topK * 2, // Get more results for reranking
    filter: metadataFilter
  });

  // Apply hybrid scoring
  const scoredResults = semanticResults.map(result => {
    const semanticScore = result.score;
    let metadataScore = 0;

    // Calculate metadata relevance score
    if (metadataFilter && result.metadata) {
      const matchingKeys = Object.keys(metadataFilter).filter(
        key => result.metadata[key] === metadataFilter[key]
      );
      metadataScore = matchingKeys.length / Object.keys(metadataFilter).length;
    }

    // Combine scores
    const combinedScore = (semanticScore * semanticWeight) +
                         (metadataScore * metadataWeight);

    return {
      ...result,
      combinedScore,
      semanticScore,
      metadataScore
    };
  });

  // Sort by combined score and return top K
  return scoredResults
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK);
};
```

### Batch Processing for Large Datasets

```typescript
// Batch processing for large document collections
export const batchProcessDocuments = async (
  documents: Array<{ content: string; metadata: Record<string, any> }>,
  options: {
    batchSize?: number;
    indexName?: string;
    onProgress?: (processed: number, total: number) => void;
  } = {}
) => {
  const { batchSize = 10, indexName = 'documents', onProgress } = options;

  const embedder = createGeminiEmbeddingModel();
  const results = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    // Generate embeddings for batch
    const contents = batch.map(doc => doc.content);
    const { embeddings } = await embedMany({
      values: contents,
      model: embedder,
    });

    // Prepare metadata and IDs
    const metadata = batch.map(doc => doc.metadata);
    const ids = batch.map((_, idx) => `doc_${i + idx}`);

    // Upsert to vector store
    const result = await upsertVectors(indexName, embeddings, metadata, ids);
    results.push(result);

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, documents.length), documents.length);
    }
  }

  return results;
};
```

## Performance Optimization

### Connection Pooling

```typescript
// Connection pooling for high-throughput scenarios
class LibSQLConnectionPool {
  private pool: LibSQLStore[] = [];
  private maxConnections: number;
  private activeConnections = 0;

  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
  }

  async getConnection(): Promise<LibSQLStore> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    if (this.activeConnections >= this.maxConnections) {
      // Wait for a connection to become available
      await this.waitForConnection();
      return this.getConnection();
    }

    this.activeConnections++;
    return new LibSQLStore({
      url: process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  releaseConnection(connection: LibSQLStore): void {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(connection);
    } else {
      this.activeConnections--;
    }
  }

  private waitForConnection(): Promise<void> {
    return new Promise(resolve => {
      const checkPool = () => {
        if (this.pool.length > 0) {
          resolve();
        } else {
          setTimeout(checkPool, 100);
        }
      };
      checkPool();
    });
  }
}
```

### Caching Strategies

```typescript
// Multi-level caching for vector search results
class VectorCache {
  private memoryCache = new Map<string, CachedResult>();
  private redisCache: Redis | null = null;
  private ttl: number;

  constructor(ttl = 3600000) { // 1 hour default
    this.ttl = ttl;
    this.initializeRedis();
  }

  async get(query: string, indexName: string): Promise<CachedResult | null> {
    const key = this.generateKey(query, indexName);

    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && Date.now() - memoryResult.timestamp < this.ttl) {
      return memoryResult;
    }

    // Check Redis cache
    if (this.redisCache) {
      const redisResult = await this.redisCache.get(key);
      if (redisResult) {
        const parsed = JSON.parse(redisResult);
        if (Date.now() - parsed.timestamp < this.ttl) {
          this.memoryCache.set(key, parsed); // Update memory cache
          return parsed;
        }
      }
    }

    return null;
  }

  async set(query: string, indexName: string, results: any[]): Promise<void> {
    const key = this.generateKey(query, indexName);
    const cachedResult = {
      query,
      indexName,
      results,
      timestamp: Date.now()
    };

    // Set in memory cache
    this.memoryCache.set(key, cachedResult);

    // Set in Redis cache
    if (this.redisCache) {
      await this.redisCache.setex(key, this.ttl / 1000, JSON.stringify(cachedResult));
    }
  }

  private generateKey(query: string, indexName: string): string {
    return `vector:${indexName}:${crypto.createHash('md5').update(query).digest('hex')}`;
  }

  private async initializeRedis(): Promise<void> {
    if (process.env.REDIS_URL) {
      const { Redis } = await import('ioredis');
      this.redisCache = new Redis(process.env.REDIS_URL);
    }
  }
}
```

## Monitoring and Health Checks

### Storage Health Monitoring

```typescript
// Comprehensive storage health monitoring
export const performStorageHealthCheck = async () => {
  const results = {
    storage: false,
    vectorStore: false,
    indexes: {} as Record<string, boolean>,
    errors: [] as string[],
    metrics: {
      connectionTime: 0,
      queryTime: 0,
      vectorCount: 0
    }
  };

  // Test storage connectivity
  try {
    const startTime = Date.now();
    const storage = createLibSQLStore();
    results.metrics.connectionTime = Date.now() - startTime;
    results.storage = true;
  } catch (error) {
    results.errors.push(`Storage check failed: ${error.message}`);
  }

  // Test vector store connectivity
  try {
    const vectorStore = createLibSQLVectorStore();
    results.vectorStore = true;
  } catch (error) {
    results.errors.push(`Vector store check failed: ${error.message}`);
  }

  // Test each vector index
  const indexesToCheck = Object.values(STORAGE_CONFIG.VECTOR_INDEXES);
  for (const indexName of indexesToCheck) {
    try {
      const vectorStore = createLibSQLVectorStore();
      const startTime = Date.now();

      // Perform a test query
      const testResults = await vectorStore.query({
        indexName,
        queryVector: new Array(STORAGE_CONFIG.DEFAULT_DIMENSION).fill(0),
        topK: 1,
      });

      results.metrics.queryTime = Date.now() - startTime;
      results.indexes[indexName] = true;
      results.metrics.vectorCount = testResults.length;
    } catch (error) {
      results.indexes[indexName] = false;
      results.errors.push(`Index '${indexName}' check failed: ${error.message}`);
    }
  }

  const overallHealth = results.storage &&
                       results.vectorStore &&
                       Object.values(results.indexes).every(Boolean);

  return {
    healthy: overallHealth,
    ...results,
    timestamp: new Date().toISOString()
  };
};
```

### Performance Metrics Collection

```typescript
// Performance metrics for storage operations
class StorageMetricsCollector {
  private metrics = {
    queries: [] as QueryMetric[],
    connections: [] as ConnectionMetric[],
    errors: [] as ErrorMetric[]
  };

  recordQuery(operation: string, duration: number, success: boolean): void {
    this.metrics.queries.push({
      operation,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  recordConnection(duration: number, success: boolean): void {
    this.metrics.connections.push({
      duration,
      success,
      timestamp: Date.now()
    });
  }

  recordError(operation: string, error: Error): void {
    this.metrics.errors.push({
      operation,
      error: error.message,
      timestamp: Date.now()
    });
  }

  getStats(timeRange = 3600000): StorageStats { // Last hour
    const cutoff = Date.now() - timeRange;

    const recentQueries = this.metrics.queries.filter(m => m.timestamp > cutoff);
    const recentConnections = this.metrics.connections.filter(m => m.timestamp > cutoff);
    const recentErrors = this.metrics.errors.filter(m => m.timestamp > cutoff);

    return {
      queryCount: recentQueries.length,
      avgQueryTime: recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length,
      querySuccessRate: recentQueries.filter(q => q.success).length / recentQueries.length,
      connectionCount: recentConnections.length,
      avgConnectionTime: recentConnections.reduce((sum, c) => sum + c.duration, 0) / recentConnections.length,
      connectionSuccessRate: recentConnections.filter(c => c.success).length / recentConnections.length,
      errorCount: recentErrors.length,
      topErrors: this.getTopErrors(recentErrors)
    };
  }

  private getTopErrors(errors: ErrorMetric[]): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();
    errors.forEach(e => {
      errorCounts.set(e.error, (errorCounts.get(e.error) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }
}
```

## Backup and Recovery

### Automated Backup System

```typescript
// Automated backup and recovery system
class StorageBackupManager {
  private backupInterval: number;
  private retentionDays: number;
  private backupPath: string;

  constructor(options: {
    interval?: number; // hours
    retention?: number; // days
    path?: string;
  } = {}) {
    this.backupInterval = (options.interval || 24) * 60 * 60 * 1000;
    this.retentionDays = options.retention || 30;
    this.backupPath = options.path || './backups';

    this.startAutomatedBackup();
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${this.backupPath}/deep-research-${timestamp}.db`;

    try {
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.backupPath, { recursive: true });

      // Copy database file
      await fs.copyFile(
        process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL,
        backupFile
      );

      // Clean up old backups
      await this.cleanupOldBackups();

      return backupFile;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreFromBackup(backupFile: string): Promise<void> {
    try {
      const dbPath = process.env.DATABASE_URL || STORAGE_CONFIG.DEFAULT_DATABASE_URL;

      // Create backup of current database
      await fs.copyFile(dbPath, `${dbPath}.backup`);

      // Restore from backup
      await fs.copyFile(backupFile, dbPath);

    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  private startAutomatedBackup(): void {
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('Automated backup failed:', error);
      }
    }, this.backupInterval);
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupPath);
      const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = `${this.backupPath}/${file}`;
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoff) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}
```

## Migration and Schema Management

### Database Schema Migrations

```typescript
// Database migration system
class DatabaseMigrationManager {
  private migrations: Migration[] = [];
  private migrationTable = '_migrations';

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
  }

  async runMigrations(): Promise<void> {
    const storage = createLibSQLStore();

    // Create migrations table if it doesn't exist
    await storage.execute(`
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedMigrations = await storage.query(
      `SELECT id FROM ${this.migrationTable}`
    );

    const executedIds = new Set(executedMigrations.map(m => m.id));

    // Run pending migrations
    for (const migration of this.migrations) {
      if (!executedIds.has(migration.id)) {
        try {
          await migration.up(storage);
          await storage.execute(
            `INSERT INTO ${this.migrationTable} (id, name) VALUES (?, ?)`,
            [migration.id, migration.name]
          );
        } catch (error) {
          throw new Error(`Migration ${migration.id} failed: ${error.message}`);
        }
      }
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    const storage = createLibSQLStore();
    const migration = this.migrations.find(m => m.id === migrationId);

    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    try {
      await migration.down(storage);
      await storage.execute(
        `DELETE FROM ${this.migrationTable} WHERE id = ?`,
        [migrationId]
      );
    } catch (error) {
      throw new Error(`Rollback of migration ${migrationId} failed: ${error.message}`);
    }
  }
}

// Example migration
const createVectorIndexesMigration: Migration = {
  id: 'create_vector_indexes',
  name: 'Create vector indexes for research documents',
  up: async (storage) => {
    const vectorStore = createLibSQLVectorStore();

    await vectorStore.createIndex({
      indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS,
      dimension: STORAGE_CONFIG.DEFAULT_DIMENSION,
    });
  },
  down: async (storage) => {
    const vectorStore = createLibSQLVectorStore();

    await vectorStore.deleteIndex(STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS);
  }
};
```

---

*This comprehensive storage and vector database guide provides detailed implementation patterns for the Mastra Deep Research System's data persistence and semantic search capabilities.*