# Mastra Integration Troubleshooting Guide

This comprehensive troubleshooting guide helps you diagnose and resolve common issues when working with Mastra in your deep research system.

## Quick Diagnosis Checklist

Before diving into specific issues, run through this checklist:

```bash
# 1. Check Mastra installation
npm list @mastra/core @mastra/libsql

# 2. Verify environment variables
echo $GOOGLE_GENERATIVE_AI_API_KEY
echo $DATABASE_URL

# 3. Test database connection
npx mastra db:test

# 4. Check agent configurations
npx mastra agent:list

# 5. Verify workflow definitions
npx mastra workflow:list
```

## Common Issues and Solutions

### 1. Agent Not Responding or Returning Errors

#### Issue: Agent returns empty or null responses

**Symptoms:**
- Agent generates empty responses
- No error messages in logs
- Workflow continues but with incomplete data

**Possible Causes & Solutions:**

**Cause 1: Model API Key Issues**
```typescript
// Check API key configuration
const agent = new Agent({
  model: openai("gpt-4o"),
  // Ensure API key is properly set
  apiKey: process.env.OPENAI_API_KEY // Don't hardcode
});
```

**Cause 2: Model Context Window Exceeded**
```typescript
// Solution: Implement context management
const agent = new Agent({
  model: openai("gpt-4o"),
  memory: {
    options: {
      lastMessages: 10, // Reduce context window
      semanticRecall: {
        topK: 5, // Limit semantic results
        scope: 'thread'
      }
    }
  }
});
```

**Cause 3: Rate Limiting**
```typescript
// Implement retry logic with backoff
const agent = new Agent({
  model: openai("gpt-4o"),
  onError: async (error, context) => {
    if (error.code === 'RATE_LIMIT') {
      await delay(Math.pow(2, context.retryCount) * 1000);
      return { action: 'retry' };
    }
    return { action: 'fail' };
  }
});
```

#### Issue: Agent throws authentication errors

**Symptoms:**
- "API key invalid" or "Authentication failed" errors
- HTTP 401/403 status codes

**Solutions:**
```typescript
// 1. Verify environment variables
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);

// 2. Check API key format
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey?.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API key format');
}

// 3. Test API key with simple request
import OpenAI from 'openai';
const client = new OpenAI({ apiKey });
try {
  await client.models.list();
  console.log('API key is valid');
} catch (error) {
  console.error('API key validation failed:', error.message);
}
```

### 2. Workflow Execution Issues

#### Issue: Workflow suspends unexpectedly

**Symptoms:**
- Workflow stops at unexpected points
- No error messages
- Cannot resume workflow

**Debugging Steps:**
```typescript
// 1. Add detailed logging to workflow steps
const debugStep = createStep({
  id: "debug-step",
  execute: async ({ inputData }) => {
    console.log('Step input:', JSON.stringify(inputData, null, 2));
    console.log('Step context:', JSON.stringify(context, null, 2));

    // Add checkpoint
    await logCheckpoint('debug-step', inputData);

    return inputData;
  }
});

// 2. Check workflow state
const workflow = mastra.getWorkflow('research-workflow');
const run = await workflow.createRunAsync();

try {
  const result = await run.start({ inputData });
  console.log('Workflow result:', result);

  if (result.status === 'suspended') {
    console.log('Suspended steps:', result.suspended);
    console.log('Suspended data:', result.suspended[0]?.data);
  }
} catch (error) {
  console.error('Workflow execution error:', error);
  console.error('Error stack:', error.stack);
}
```

#### Issue: Workflow loops infinitely

**Symptoms:**
- Workflow runs continuously
- High resource usage
- No completion

**Solutions:**
```typescript
// 1. Add iteration limits
const iterativeStep = createStep({
  id: "limited-iteration",
  execute: async ({ inputData }) => {
    const maxIterations = 5;
    const currentIteration = inputData.iteration || 0;

    if (currentIteration >= maxIterations) {
      throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
    }

    // Your iteration logic here
    const result = await performIteration(inputData);

    return {
      ...result,
      iteration: currentIteration + 1,
      shouldContinue: result.hasMoreData && currentIteration < maxIterations
    };
  }
});

// 2. Add timeout protection
const timeoutStep = createStep({
  id: "timeout-protected",
  execute: async ({ inputData }) => {
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    const result = await Promise.race([
      performLongRunningTask(inputData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);

    console.log(`Operation completed in ${Date.now() - startTime}ms`);
    return result;
  }
});
```

### 3. Memory and Storage Issues

#### Issue: Memory usage growing indefinitely

**Symptoms:**
- Increasing memory consumption
- Slow performance over time
- Out of memory errors

**Solutions:**
```typescript
// 1. Implement memory cleanup
class MemoryManager {
  async cleanupOldMemory(userId: string, daysOld = 30) {
    const storage = mastra.getStorage();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    // Delete old messages
    await storage.deleteMessages({
      resourceId: userId,
      before: cutoffDate
    });

    // Archive old threads
    const oldThreads = await storage.getThreads({
      resourceId: userId,
      before: cutoffDate
    });

    for (const thread of oldThreads) {
      await storage.archiveThread(thread.id);
    }
  }

  async optimizeMemory(userId: string) {
    const usage = await this.getMemoryUsage(userId);

    if (usage.totalSize > 100 * 1024 * 1024) { // 100MB
      await this.compressMemory(userId);
    }
  }
}

// 2. Configure memory limits
const agent = new Agent({
  memory: {
    options: {
      lastMessages: 50, // Limit message history
      semanticRecall: {
        topK: 10, // Limit semantic results
        scope: 'thread'
      },
      workingMemory: {
        maxSize: 1000, // Limit working memory
        ttl: 24 * 60 * 60 * 1000 // 24 hour TTL
      }
    }
  }
});
```

#### Issue: Database connection errors

**Symptoms:**
- "Connection refused" errors
- "Database not found" errors
- Slow query performance

**Solutions:**
```typescript
// 1. Test database connection
async function testDatabaseConnection() {
  try {
    const storage = mastra.getStorage();

    // Test basic connectivity
    await storage.healthCheck();

    // Test read/write operations
    const testId = `test-${Date.now()}`;
    await storage.set(testId, { test: true });
    const result = await storage.get(testId);
    await storage.delete(testId);

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 2. Configure connection pooling
const storage = new LibSQLStore({
  url: process.env.DATABASE_URL,
  options: {
    maxConnections: 10,
    minConnections: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  }
});
```

### 4. Tool Integration Issues

#### Issue: Tools not executing or returning errors

**Symptoms:**
- Tool calls fail silently
- "Tool not found" errors
- Incorrect tool results

**Debugging:**
```typescript
// 1. Verify tool registration
const mastra = new Mastra({
  tools: {
    webSearch: webSearchTool,
    evaluateResult: evaluateResultTool
  }
});

// Test tool execution
const webSearch = mastra.getTool('webSearch');
try {
  const result = await webSearch.execute({
    input: { query: 'test query' }
  });
  console.log('Tool executed successfully:', result);
} catch (error) {
  console.error('Tool execution failed:', error);
}

// 2. Add tool debugging
const debugTool = createTool({
  id: 'debug-tool',
  inputSchema: z.object({
    action: z.string(),
    data: z.any()
  }),
  execute: async ({ inputData }) => {
    console.log('Tool called with:', inputData);

    // Simulate tool execution
    const result = await performToolAction(inputData);

    console.log('Tool result:', result);
    return result;
  }
});
```

#### Issue: Tool rate limiting

**Solutions:**
```typescript
// Implement tool-level rate limiting
const rateLimitedTool = createTool({
  id: 'rate-limited-tool',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ inputData }) => {
    const rateLimiter = new RateLimiter({
      requests: 10,
      period: 60000 // 1 minute
    });

    await rateLimiter.waitForSlot();

    return await performToolAction(inputData);
  }
});

// Circuit breaker for external APIs
class CircuitBreakerTool {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute(input: any) {
    if (this.state === 'open') {
      throw new Error('Tool is temporarily unavailable');
    }

    try {
      const result = await this.callExternalAPI(input);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= 5) {
      this.state = 'open';
      setTimeout(() => {
        this.state = 'half-open';
      }, 60000); // Reset after 1 minute
    }
  }
}
```

### 5. Performance Issues

#### Issue: Slow response times

**Symptoms:**
- High latency in agent responses
- Workflow execution taking too long
- UI freezing during operations

**Optimization Strategies:**
```typescript
// 1. Implement caching
class CacheManager {
  private cache = new Map();

  async get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
    return null;
  }

  async set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// 2. Parallel processing
async function parallelResearch(queries: string[]) {
  const batchSize = 3;
  const results = [];

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchPromises = batch.map(query =>
      researchAgent.generate([{
        role: 'user',
        content: `Research: ${query}`
      }])
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting between batches
    await delay(1000);
  }

  return results;
}

// 3. Streaming for large responses
const streamingAgent = new Agent({
  model: openai("gpt-4o"),
  streaming: true
});

const stream = await streamingAgent.generate([{
  role: 'user',
  content: 'Generate comprehensive research report'
}]);

for await (const chunk of stream) {
  // Process chunks as they arrive
  updateUI(chunk);
}
```

### 6. Configuration Issues

#### Issue: Environment variable problems

**Symptoms:**
- "Environment variable not found" errors
- Incorrect configuration values
- Different behavior in different environments

**Solutions:**
```typescript
// 1. Environment validation
function validateEnvironment() {
  const required = [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'DATABASE_URL',
    'EXA_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate formats
  if (!process.env.DATABASE_URL?.startsWith('file:') &&
      !process.env.DATABASE_URL?.includes('://')) {
    throw new Error('Invalid DATABASE_URL format');
  }

  console.log('Environment validation passed');
}

// 2. Configuration loading with defaults
const config = {
  database: {
    url: process.env.DATABASE_URL || 'file:./mastra.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  ai: {
    model: process.env.AI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000')
  },
  memory: {
    maxMessages: parseInt(process.env.MEMORY_MAX_MESSAGES || '100'),
    ttl: parseInt(process.env.MEMORY_TTL || '86400000') // 24 hours
  }
};
```

### 7. Deployment Issues

#### Issue: Production deployment failures

**Symptoms:**
- Works in development but fails in production
- Environment-specific errors
- Resource limitations

**Solutions:**
```typescript
// 1. Health checks
async function healthCheck() {
  const checks = [
    checkDatabaseConnection(),
    checkAPIKeys(),
    checkExternalServices(),
    checkMemoryUsage()
  ];

  const results = await Promise.all(checks);
  const failures = results.filter(r => !r.success);

  if (failures.length > 0) {
    console.error('Health check failures:', failures);
    return false;
  }

  return true;
}

// 2. Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');

  // Close database connections
  await mastra.getStorage().close();

  // Stop accepting new requests
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// 3. Resource monitoring
class ResourceMonitor {
  async checkResources() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('High memory usage detected');
      await forceGC(); // Trigger garbage collection
    }

    return {
      memory: memUsage,
      cpu: cpuUsage,
      healthy: memUsage.heapUsed < 800 * 1024 * 1024
    };
  }
}
```

## Advanced Debugging Techniques

### Logging and Monitoring

```typescript
// Comprehensive logging setup
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});

// Agent with detailed logging
const loggedAgent = new Agent({
  model: openai("gpt-4o"),
  onError: async (error, context) => {
    logger.error({
      agent: 'research-agent',
      error: error.message,
      stack: error.stack,
      context: {
        messages: context.messages?.length,
        retryCount: context.retryCount
      }
    }, 'Agent execution failed');

    return { action: 'fail' };
  }
});

// Workflow monitoring
const monitoredWorkflow = createWorkflow({
  id: "monitored-workflow",
  execute: async (context) => {
    const startTime = Date.now();
    logger.info({ workflowId: context.runId }, 'Workflow started');

    try {
      const result = await executeWorkflowSteps(context);

      logger.info({
        workflowId: context.runId,
        duration: Date.now() - startTime,
        steps: context.stepsExecuted
      }, 'Workflow completed successfully');

      return result;
    } catch (error) {
      logger.error({
        workflowId: context.runId,
        duration: Date.now() - startTime,
        error: error.message,
        steps: context.stepsExecuted
      }, 'Workflow failed');

      throw error;
    }
  }
});
```

### Performance Profiling

```typescript
// Performance profiling utility
class PerformanceProfiler {
  private metrics: Map<string, number[]> = new Map();

  start(operation: string) {
    this.metrics.set(operation, [Date.now()]);
  }

  end(operation: string) {
    const startTimes = this.metrics.get(operation);
    if (!startTimes) return;

    const duration = Date.now() - startTimes[0];
    console.log(`${operation} took ${duration}ms`);

    // Store for analysis
    if (!this.metrics.has(`${operation}-durations`)) {
      this.metrics.set(`${operation}-durations`, []);
    }
    this.metrics.get(`${operation}-durations`)!.push(duration);
  }

  getStats(operation: string) {
    const durations = this.metrics.get(`${operation}-durations`) || [];
    if (durations.length === 0) return null;

    const sum = durations.reduce((a, b) => a + b, 0);
    return {
      count: durations.length,
      average: sum / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.percentile(durations, 95)
    };
  }

  private percentile(arr: number[], p: number) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage
const profiler = new PerformanceProfiler();

profiler.start('agent-generation');
const result = await agent.generate(messages);
profiler.end('agent-generation');

console.log('Performance stats:', profiler.getStats('agent-generation'));
```

## Common Error Patterns and Quick Fixes

| Error Pattern | Quick Fix |
|---------------|-----------|
| `TypeError: Cannot read property 'X' of undefined` | Add null checks and default values |
| `Rate limit exceeded` | Implement exponential backoff retry logic |
| `Memory heap out of memory` | Reduce memory limits, implement cleanup |
| `Database connection timeout` | Increase timeouts, implement connection pooling |
| `Tool execution failed` | Add try-catch blocks, implement fallbacks |
| `Workflow suspended unexpectedly` | Add logging, check suspend conditions |
| `Invalid API key` | Verify environment variables, check key format |

## Getting Help

If you can't resolve an issue:

1. **Check the Mastra documentation**: https://mastra.ai/docs
2. **Search existing issues**: GitHub issues and discussions
3. **Collect diagnostic information**:
   ```bash
   # System information
   node --version
   npm --version

   # Mastra version
   npm list @mastra/core

   # Environment check
   env | grep -E "(API|DATABASE|MASTRA)"

   # Recent logs
   tail -n 100 logs/mastra.log
   ```
4. **Create a minimal reproduction case**
5. **File an issue** with complete diagnostic information

---

*This troubleshooting guide covers the most common issues encountered when working with Mastra. Regular maintenance, proper logging, and following best practices will help prevent most problems.*