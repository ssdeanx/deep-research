# Performance Optimization Guide

This guide provides comprehensive strategies for optimizing the performance of your Mastra deep research system, covering everything from basic optimizations to advanced performance tuning techniques.

## Performance Monitoring Setup

### Basic Metrics Collection

```typescript
// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  start(operation: string) {
    const startTime = performance.now();
    const memoryUsage = process.memoryUsage();

    this.metrics.set(operation, [{
      timestamp: Date.now(),
      startTime,
      initialMemory: memoryUsage.heapUsed
    }]);
  }

  end(operation: string) {
    const endTime = performance.now();
    const memoryUsage = process.memoryUsage();
    const startMetric = this.metrics.get(operation)?.[0];

    if (startMetric) {
      const duration = endTime - startMetric.startTime;
      const memoryDelta = memoryUsage.heapUsed - startMetric.initialMemory;

      console.log(`${operation} Performance:`, {
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
      });

      // Store for analysis
      this.storeMetric(operation, {
        duration,
        memoryDelta,
        timestamp: Date.now()
      });
    }
  }

  private storeMetric(operation: string, metric: any) {
    if (!this.metrics.has(`${operation}-history`)) {
      this.metrics.set(`${operation}-history`, []);
    }
    this.metrics.get(`${operation}-history`)!.push(metric);
  }

  getStats(operation: string) {
    const history = this.metrics.get(`${operation}-history`) || [];
    if (history.length === 0) return null;

    const durations = history.map(h => h.duration);
    const memoryDeltas = history.map(h => h.memoryDelta);

    return {
      count: history.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      p95Duration: this.percentile(durations, 95),
      maxDuration: Math.max(...durations),
      totalMemoryImpact: memoryDeltas.reduce((a, b) => a + b, 0)
    };
  }

  private percentile(arr: number[], p: number) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage
const monitor = new PerformanceMonitor();

monitor.start('research-workflow');
const result = await researchWorkflow.execute({ query: 'AI trends' });
monitor.end('research-workflow');

console.log('Performance stats:', monitor.getStats('research-workflow'));
```

### Advanced Monitoring with OpenTelemetry

```typescript
// OpenTelemetry integration for comprehensive monitoring
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

// Initialize tracing
const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

// Instrument HTTP calls and other libraries
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    // Add other instrumentations as needed
  ]
});

// Create tracer
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('mastra-deep-research');

// Instrument workflow execution
async function tracedWorkflowExecution(workflowId: string, input: any) {
  const span = tracer.startSpan(`workflow.${workflowId}.execute`);

  try {
    span.setAttribute('workflow.id', workflowId);
    span.setAttribute('input.size', JSON.stringify(input).length);

    const result = await mastra.getWorkflow(workflowId).execute(input);

    span.setAttribute('result.size', JSON.stringify(result).length);
    span.setAttribute('status', 'success');

    return result;
  } catch (error) {
    span.setAttribute('status', 'error');
    span.setAttribute('error.message', error.message);
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

## Memory Optimization Techniques

### Memory Leak Prevention

```typescript
// Memory leak detection and prevention
class MemoryLeakDetector {
  private snapshots: Map<string, any> = new Map();
  private thresholds = {
    heapGrowth: 50 * 1024 * 1024, // 50MB
    frequency: 30000 // Check every 30 seconds
  };

  start() {
    setInterval(() => this.checkMemoryLeaks(), this.thresholds.frequency);
  }

  takeSnapshot(label: string) {
    const usage = process.memoryUsage();
    this.snapshots.set(label, {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      external: usage.external
    });
  }

  private checkMemoryLeaks() {
    const current = process.memoryUsage();
    const recentSnapshots = Array.from(this.snapshots.values())
      .filter(s => Date.now() - s.timestamp < 300000) // Last 5 minutes
      .sort((a, b) => b.timestamp - a.timestamp);

    if (recentSnapshots.length >= 2) {
      const oldest = recentSnapshots[recentSnapshots.length - 1];
      const newest = recentSnapshots[0];

      const growth = newest.heapUsed - oldest.heapUsed;

      if (growth > this.thresholds.heapGrowth) {
        console.warn('Potential memory leak detected:', {
          growth: `${(growth / 1024 / 1024).toFixed(2)}MB`,
          period: `${((newest.timestamp - oldest.timestamp) / 1000).toFixed(1)}s`,
          currentHeap: `${(current.heapUsed / 1024 / 1024).toFixed(2)}MB`
        });

        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('Forced garbage collection');
        }
      }
    }

    // Keep only recent snapshots
    this.cleanupOldSnapshots();
  }

  private cleanupOldSnapshots() {
    const cutoff = Date.now() - 600000; // 10 minutes ago
    for (const [label, snapshot] of this.snapshots) {
      if (snapshot.timestamp < cutoff) {
        this.snapshots.delete(label);
      }
    }
  }
}

// Automatic memory management
class MemoryManager {
  private detector = new MemoryLeakDetector();

  constructor() {
    this.detector.start();
  }

  async optimizeMemory() {
    const usage = process.memoryUsage();

    // Force garbage collection if heap is large
    if (usage.heapUsed > 200 * 1024 * 1024 && global.gc) { // 200MB
      global.gc();
      console.log('Memory optimization: Forced GC');
    }

    // Clear caches if memory is high
    if (usage.heapUsed > 300 * 1024 * 1024) { // 300MB
      await this.clearCaches();
      console.log('Memory optimization: Cleared caches');
    }

    // Reduce memory limits for agents
    await this.adjustMemoryLimits();
  }

  private async clearCaches() {
    // Clear application caches
    cacheManager.clear();
    vectorStore.clearCache();
  }

  private async adjustMemoryLimits() {
    // Temporarily reduce memory limits
    const agents = mastra.getAgents();
    for (const agent of agents) {
      agent.setMemoryLimit(50); // Reduce to 50 messages
    }
  }
}
```

### Efficient Memory Usage Patterns

```typescript
// Memory-efficient data processing
class MemoryEfficientProcessor {
  async processLargeDataset<T>(
    data: T[],
    processor: (batch: T[]) => Promise<any>,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ) {
    const {
      batchSize = 10,
      maxConcurrency = 3,
      onProgress
    } = options;

    const results = [];
    let processed = 0;

    // Process in batches with concurrency control
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      // Limit concurrent processing
      const batchPromises = [];
      for (let j = 0; j < Math.min(batch.length, maxConcurrency); j++) {
        const item = batch[j];
        batchPromises.push(processor([item]));
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      processed += batch.length;
      onProgress?.(processed, data.length);

      // Allow event loop to process other operations
      await new Promise(resolve => setImmediate(resolve));
    }

    return results;
  }

  // Streaming data processing
  async *processStream<T>(
    stream: ReadableStream<T>,
    processor: (item: T) => Promise<any>
  ) {
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const result = await processor(value);
        yield result;

        // Yield control to prevent blocking
        await new Promise(resolve => setImmediate(resolve));
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Usage example
const processor = new MemoryEfficientProcessor();

// Process large research results
const results = await processor.processLargeDataset(
  researchData,
  async (batch) => {
    return await evaluateBatch(batch);
  },
  {
    batchSize: 5,
    maxConcurrency: 2,
    onProgress: (processed, total) => {
      console.log(`Processed ${processed}/${total} items`);
    }
  }
);
```

## Database Optimization

### Connection Pooling and Query Optimization

```typescript
// Optimized database configuration
const optimizedStorage = new LibSQLStore({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  options: {
    // Connection pool settings
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,

    // Query optimization
    prepareStatements: true,
    walMode: true, // Write-Ahead Logging for better concurrency

    // Memory management
    cacheSize: 64 * 1024 * 1024, // 64MB cache
    tempStore: 'memory', // Use memory for temp tables
  }
});

// Query optimization utilities
class QueryOptimizer {
  async batchInsert(table: string, records: any[]) {
    const batchSize = 100;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      await this.storage.transaction(async (tx) => {
        for (const record of batch) {
          await tx.insert(table, record);
        }
      });
    }
  }

  async optimizedQuery(query: string, params: any[] = []) {
    // Add query hints for better performance
    const optimizedQuery = this.addQueryHints(query);

    // Use prepared statements for repeated queries
    const stmt = await this.prepareStatement(optimizedQuery);

    try {
      return await stmt.execute(params);
    } finally {
      await stmt.finalize();
    }
  }

  private addQueryHints(query: string) {
    // Add performance hints based on query analysis
    if (query.includes('ORDER BY')) {
      return `${query} /*+ INDEX(table_name index_name) */`;
    }

    if (query.includes('JOIN')) {
      return `${query} /*+ USE_NL(table1, table2) */`;
    }

    return query;
  }

  private async prepareStatement(query: string) {
    // Cache prepared statements
    if (!this.statementCache.has(query)) {
      const stmt = await this.storage.prepare(query);
      this.statementCache.set(query, stmt);
    }

    return this.statementCache.get(query);
  }
}
```

### Index Optimization

```typescript
// Automatic index management
class IndexManager {
  async analyzeQueryPatterns() {
    const storage = mastra.getStorage();

    // Get slow queries from monitoring
    const slowQueries = await this.getSlowQueries();

    for (const query of slowQueries) {
      const recommendedIndexes = await this.analyzeQueryForIndexes(query);

      for (const index of recommendedIndexes) {
        await this.createIndexIfNotExists(index);
      }
    }
  }

  private async getSlowQueries() {
    // Query performance monitoring table
    const storage = mastra.getStorage();
    return await storage.query(`
      SELECT query, avg_duration, execution_count
      FROM query_performance
      WHERE avg_duration > 1000 -- Queries taking > 1 second
      ORDER BY avg_duration DESC
      LIMIT 10
    `);
  }

  private async analyzeQueryForIndexes(query: string) {
    const indexes = [];

    // Analyze WHERE clauses
    const whereMatches = query.match(/WHERE\s+(.+?)(?:\s+(?:GROUP BY|ORDER BY|LIMIT|$))/i);
    if (whereMatches) {
      const whereClause = whereMatches[1];
      const columns = this.extractColumns(whereClause);

      for (const column of columns) {
        indexes.push({
          table: this.extractTable(query),
          columns: [column],
          type: 'btree'
        });
      }
    }

    // Analyze JOIN conditions
    const joinMatches = query.match(/JOIN\s+(\w+)\s+ON\s+(.+?)(?:\s+(?:WHERE|GROUP BY|ORDER BY|LIMIT|$))/gi);
    if (joinMatches) {
      for (const join of joinMatches) {
        const columns = this.extractJoinColumns(join);
        indexes.push({
          table: this.extractTable(join),
          columns,
          type: 'btree'
        });
      }
    }

    return indexes;
  }

  private async createIndexIfNotExists(index: any) {
    const storage = mastra.getStorage();

    const indexName = `idx_${index.table}_${index.columns.join('_')}`;

    // Check if index exists
    const exists = await storage.query(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name=?
    `, [indexName]);

    if (exists.length === 0) {
      await storage.query(`
        CREATE INDEX ${indexName} ON ${index.table} (${index.columns.join(', ')})
      `);

      console.log(`Created index: ${indexName}`);
    }
  }
}
```

## Caching Strategies

### Multi-Level Caching

```typescript
// Multi-level caching system
class MultiLevelCache {
  private l1Cache = new Map(); // Fast in-memory cache
  private l2Cache: Map<string, any>; // Larger persistent cache

  constructor(private storage: any) {
    this.l2Cache = new Map();
  }

  async get(key: string, options: CacheOptions = {}) {
    const { ttl = 300000, useL2 = true } = options; // 5 minutes default

    // Check L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && this.isValid(l1Entry, ttl)) {
      return l1Entry.data;
    }

    // Check L2 cache
    if (useL2) {
      const l2Entry = await this.getL2Cache(key);
      if (l2Entry && this.isValid(l2Entry, ttl)) {
        // Promote to L1
        this.l1Cache.set(key, l2Entry);
        return l2Entry.data;
      }
    }

    return null;
  }

  async set(key: string, data: any, options: CacheOptions = {}) {
    const { ttl = 300000, useL2 = true } = options;

    const entry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Set in L1 cache
    this.l1Cache.set(key, entry);

    // Set in L2 cache
    if (useL2) {
      await this.setL2Cache(key, entry);
    }

    // Cleanup old entries
    this.cleanup();
  }

  private async getL2Cache(key: string) {
    try {
      return await this.storage.get(`cache:${key}`);
    } catch (error) {
      console.warn('L2 cache read failed:', error);
      return null;
    }
  }

  private async setL2Cache(key: string, entry: any) {
    try {
      await this.storage.set(`cache:${key}`, entry, { ttl: entry.ttl });
    } catch (error) {
      console.warn('L2 cache write failed:', error);
    }
  }

  private isValid(entry: any, ttl: number) {
    return Date.now() - entry.timestamp < ttl;
  }

  private cleanup() {
    // Cleanup L1 cache
    const now = Date.now();
    for (const [key, entry] of this.l1Cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.l1Cache.delete(key);
      }
    }

    // Limit L1 cache size
    if (this.l1Cache.size > 1000) {
      const entries = Array.from(this.l1Cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20%
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.l1Cache.delete(entries[i][0]);
      }
    }
  }
}

// Intelligent cache key generation
class CacheKeyGenerator {
  static forResearchQuery(query: string, options: any = {}) {
    const components = [
      'research',
      this.hash(query),
      this.hash(JSON.stringify(options))
    ];

    return components.join(':');
  }

  static forAgentResponse(agentId: string, messages: any[], options: any = {}) {
    const messageHash = this.hash(JSON.stringify(messages));
    const optionsHash = this.hash(JSON.stringify(options));

    return `agent:${agentId}:${messageHash}:${optionsHash}`;
  }

  static forVectorSearch(query: string, filters: any = {}) {
    const queryHash = this.hash(query);
    const filterHash = this.hash(JSON.stringify(filters));

    return `vector:${queryHash}:${filterHash}`;
  }

  private static hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
```

### Cache Invalidation Strategies

```typescript
// Intelligent cache invalidation
class CacheInvalidator {
  private dependencies = new Map<string, Set<string>>();

  trackDependency(cacheKey: string, dependencyKey: string) {
    if (!this.dependencies.has(dependencyKey)) {
      this.dependencies.set(dependencyKey, new Set());
    }
    this.dependencies.get(dependencyKey)!.add(cacheKey);
  }

  invalidate(dependencyKey: string) {
    const dependentKeys = this.dependencies.get(dependencyKey);

    if (dependentKeys) {
      for (const cacheKey of dependentKeys) {
        cache.delete(cacheKey);
      }

      // Clean up dependency tracking
      this.dependencies.delete(dependencyKey);
    }
  }

  invalidatePattern(pattern: RegExp) {
    const keysToDelete = [];

    for (const [key] of cache.entries()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }

  // Time-based invalidation
  scheduleInvalidation(cacheKey: string, ttl: number) {
    setTimeout(() => {
      cache.delete(cacheKey);
    }, ttl);
  }

  // Event-based invalidation
  onDataUpdate(dataType: string, dataId: string) {
    const pattern = new RegExp(`${dataType}:${dataId}:.*`);
    this.invalidatePattern(pattern);
  }
}
```

## Parallel Processing Optimization

### Worker Pool Implementation

```typescript
// Worker pool for CPU-intensive tasks
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ task: any; resolve: Function; reject: Function }> = [];
  private activeTasks = 0;

  constructor(
    private workerScript: string,
    private poolSize = Math.max(1, require('os').cpus().length - 1)
  ) {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      worker.on('message', (result) => this.handleWorkerMessage(worker, result));
      worker.on('error', (error) => this.handleWorkerError(worker, error));
      this.workers.push(worker);
    }
  }

  async execute(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0 || this.activeTasks >= this.poolSize) {
      return;
    }

    const availableWorker = this.workers.find(w => !w.isBusy);
    if (!availableWorker) return;

    const { task, resolve, reject } = this.queue.shift()!;
    this.activeTasks++;

    availableWorker.isBusy = true;
    availableWorker.postMessage(task);

    // Store resolve/reject for later
    availableWorker.currentTask = { resolve, reject };
  }

  private handleWorkerMessage(worker: any, result: any) {
    this.activeTasks--;
    worker.isBusy = false;

    if (worker.currentTask) {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
    }

    this.processQueue();
  }

  private handleWorkerError(worker: any, error: any) {
    this.activeTasks--;
    worker.isBusy = false;

    if (worker.currentTask) {
      worker.currentTask.reject(error);
      worker.currentTask = null;
    }

    this.processQueue();
  }

  async terminate() {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
  }
}

// Usage for research processing
const researchWorkerPool = new WorkerPool('./research-worker.js', 4);

// Process research tasks in parallel
const researchTasks = researchQueries.map(query =>
  researchWorkerPool.execute({ type: 'research', query })
);

const results = await Promise.all(researchTasks);
```

### Batch Processing Optimization

```typescript
// Intelligent batch processing
class BatchProcessor {
  async processBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      adaptive?: boolean;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize: initialBatchSize = 10,
      maxConcurrency = 3,
      adaptive = true,
      onProgress
    } = options;

    const results: R[] = [];
    let batchSize = initialBatchSize;
    let completed = 0;

    // Process in concurrent batches
    const batches = this.createBatches(items, batchSize);

    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const concurrentBatches = batches.slice(i, i + maxConcurrency);

      const batchPromises = concurrentBatches.map(async (batch, index) => {
        const startTime = Date.now();

        try {
          const batchResults = await processor(batch);
          const duration = Date.now() - startTime;

          // Adaptive batch sizing
          if (adaptive) {
            batchSize = this.adjustBatchSize(batchSize, duration, batch.length);
          }

          return batchResults;
        } catch (error) {
          console.error(`Batch ${i + index} failed:`, error);
          throw error;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
          completed += result.value.length;
        } else {
          console.error('Batch processing failed:', result.reason);
        }
      }

      onProgress?.(completed, items.length);

      // Allow event loop to breathe
      await new Promise(resolve => setImmediate(resolve));
    }

    return results;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private adjustBatchSize(currentSize: number, duration: number, batchLength: number): number {
    const targetDuration = 5000; // 5 seconds target
    const itemsPerSecond = batchLength / (duration / 1000);

    if (duration > targetDuration * 1.5) {
      // Too slow, reduce batch size
      return Math.max(1, Math.floor(currentSize * 0.8));
    } else if (duration < targetDuration * 0.5) {
      // Too fast, increase batch size
      return Math.min(100, Math.floor(currentSize * 1.2));
    }

    return currentSize;
  }
}

// Usage for research data processing
const batchProcessor = new BatchProcessor();

const processedResults = await batchProcessor.processBatches(
  researchData,
  async (batch) => {
    return await processResearchBatch(batch);
  },
  {
    batchSize: 5,
    maxConcurrency: 2,
    adaptive: true,
    onProgress: (completed, total) => {
      console.log(`Processed ${completed}/${total} research items`);
    }
  }
);
```

<h2>Network Optimization</h2>

### Connection Pooling and Reuse

```typescript
// HTTP connection pooling
class HttpConnectionPool {
  private pool = new Map<string, Agent>();
  private maxConnections = 10;

  getAgent(url: string): Agent {
    const key = new URL(url).origin;

    if (!this.pool.has(key)) {
      const agent = new Agent({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 30000
      });

      this.pool.set(key, agent);
    }

    return this.pool.get(key)!;
  }

  async request(options: any) {
    const agent = this.getAgent(options.url || options.href);

    return new Promise((resolve, reject) => {
      const req = https.request({
        ...options,
        agent
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.data) {
        req.write(options.data);
      }

      req.end();
    });
  }
}

// API client with connection pooling
class OptimizedApiClient {
  private connectionPool = new HttpConnectionPool();
  private rateLimiter = new RateLimiter({ requests: 10, period: 1000 });

  async makeRequest(endpoint: string, options: any = {}) {
    await this.rateLimiter.waitForSlot();

    const startTime = Date.now();

    try {
      const response = await this.connectionPool.request({
        url: endpoint,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mastra-Deep-Research/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        data: options.data
      });

      const duration = Date.now() - startTime;
      console.log(`${options.method || 'GET'} ${endpoint} - ${response.statusCode} (${duration}ms)`);

      return response;
    } catch (error) {
      console.error(`Request failed: ${endpoint}`, error);
      throw error;
    }
  }
}
```

### DNS and SSL Optimization

```typescript
// DNS caching and optimization
class DnsOptimizer {
  private cache = new Map<string, { address: string; expiry: number }>();
  private resolver = new Resolver();

  constructor() {
    // Use faster DNS servers
    this.resolver.setServers([
      '8.8.8.8', // Google DNS
      '1.1.1.1', // Cloudflare DNS
      '208.67.222.222' // OpenDNS
    ]);
  }

  async resolve(hostname: string): Promise<string> {
    const cached = this.cache.get(hostname);

    if (cached && Date.now() < cached.expiry) {
      return cached.address;
    }

    try {
      const addresses = await this.resolver.resolve4(hostname);
      const address = addresses[0];

      // Cache for 5 minutes
      this.cache.set(hostname, {
        address,
        expiry: Date.now() + 300000
      });

      return address;
    } catch (error) {
      console.error(`DNS resolution failed for ${hostname}:`, error);
      throw error;
    }
  }
}

// SSL/TLS optimization
const tlsOptions = {
  // Use modern TLS versions
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',

  // Enable session resumption
  sessionTimeout: 300,

  // Optimize cipher suites
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),

  // Enable compression
  compression: true,

  // Connection reuse
  keepAlive: true,
  keepAliveMsecs: 30000
};
```

<h2>Performance Testing and Benchmarking</h2>

### Automated Performance Testing

```typescript
// Performance test suite
class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];

  async runAllTests() {
    console.log('Running performance test suite...');

    const tests = [
      { name: 'Agent Response Time', test: () => this.testAgentResponseTime() },
      { name: 'Workflow Execution', test: () => this.testWorkflowExecution() },
      { name: 'Memory Usage', test: () => this.testMemoryUsage() },
      { name: 'Database Queries', test: () => this.testDatabaseQueries() },
      { name: 'Concurrent Requests', test: () => this.testConcurrentRequests() }
    ];

    for (const { name, test } of tests) {
      console.log(`\nRunning: ${name}`);
      try {
        const result = await test();
        this.results.push({ name, ...result, status: 'passed' });
        console.log(`✅ ${name}: ${result.duration}ms`);
      } catch (error) {
        this.results.push({ name, error: error.message, status: 'failed' });
        console.log(`❌ ${name}: ${error.message}`);
      }
    }

    this.generateReport();
  }

  private async testAgentResponseTime() {
    const startTime = Date.now();
    const agent = mastra.getAgent('research-agent');

    const response = await agent.generate([{
      role: 'user',
      content: 'What are the latest trends in AI research?'
    }]);

    return {
      duration: Date.now() - startTime,
      responseLength: response.content.length
    };
  }

  private async testWorkflowExecution() {
    const startTime = Date.now();
    const workflow = mastra.getWorkflow('research-workflow');

    const result = await workflow.execute({
      query: 'quantum computing advancements'
    });

    return {
      duration: Date.now() - startTime,
      stepsExecuted: result.steps?.length || 0
    };
  }

  private async testMemoryUsage() {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform memory-intensive operation
    await this.performMemoryIntensiveTask();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = finalMemory - initialMemory;

    return {
      initialMemory,
      finalMemory,
      memoryDelta,
      memoryDeltaMB: memoryDelta / 1024 / 1024
    };
  }

  private async testDatabaseQueries() {
    const storage = mastra.getStorage();
    const startTime = Date.now();

    // Perform various database operations
    await storage.createMessage({
      threadId: 'test-thread',
      role: 'user',
      content: 'Test message'
    });

    const messages = await storage.getMessages({ threadId: 'test-thread' });
    await storage.deleteMessages({ threadId: 'test-thread' });

    return {
      duration: Date.now() - startTime,
      operations: 3,
      avgOperationTime: (Date.now() - startTime) / 3
    };
  }

  private async testConcurrentRequests() {
    const concurrentRequests = 10;
    const startTime = Date.now();

    const promises = Array(concurrentRequests).fill(null).map((_, i) =>
      mastra.getAgent('research-agent').generate([{
        role: 'user',
        content: `Test query ${i}`
      }])
    );

    await Promise.all(promises);

    return {
      duration: Date.now() - startTime,
      concurrentRequests,
      avgResponseTime: (Date.now() - startTime) / concurrentRequests
    };
  }

  // Agent Evals for Performance Testing
  // Agent evaluation metrics can be integrated into performance tests to assess
  // the impact of optimizations on output quality, ensuring that performance
  // gains do not come at the cost of reduced accuracy or relevance.

  private generateReport() {
    console.log('\n=== Performance Test Report ===');

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;

    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);

    for (const result of this.results) {
      if (result.status === 'passed') {
        console.log(`✅ ${result.name}: ${result.duration}ms`);
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
      }
    }

    // Save detailed report
    this.saveReport();
  }

  private saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length
      }
    };

    // Save to file
    require('fs').writeFileSync(
      './performance-report.json',
      JSON.stringify(report, null, 2)
    );
  }
}

// Run performance tests
const testSuite = new PerformanceTestSuite();
await testSuite.runAllTests();
```

---

*This performance optimization guide provides comprehensive strategies for improving your Mastra deep research system's performance. Implement these optimizations incrementally, measuring impact at each step to ensure improvements are effective.*