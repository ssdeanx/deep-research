# Advanced Mastra Features Documentation

This document covers the latest advanced features available in Mastra that can enhance your deep research system.

## Enhanced Streaming with streamVNext()

Mastra provides advanced streaming capabilities that are compatible with AI SDK v5 and offer enhanced real-time processing.

### AI SDK v5 Compatible Streaming

```typescript
import { mastra } from './src/mastra';

const agent = mastra.getAgent('researchAgent');

// Stream with AI SDK v5 compatibility
const stream = await agent.streamVNext("Research quantum computing trends", {
  format: 'aisdk', // Enable AI SDK v5 compatibility
  memory: {
    thread: "research-session-123",
    resource: "user-researcher"
  },
  modelSettings: {
    temperature: 0.7,
    maxTokens: 2000
  }
});

// Process streaming chunks
for await (const chunk of stream.textStream) {
  console.log('Received:', chunk);
  // Update UI in real-time
}

// Get final result
const finalText = await stream.text;
const usage = stream.usage;
```

### Enhanced Workflow Streaming

```typescript
const workflow = mastra.getWorkflow('research-workflow');
const run = await workflow.createRunAsync();

// Stream workflow execution
const result = await run.stream({
  inputData: { query: "AI advancements 2024" }
});

// Monitor workflow progress
for await (const event of result.stream) {
  switch (event.type) {
    case 'step_start':
      console.log(`Starting step: ${event.stepId}`);
      break;
    case 'step_complete':
      console.log(`Completed step: ${event.stepId}`, event.result);
      break;
    case 'workflow_suspend':
      console.log('Workflow suspended, awaiting input');
      break;
  }
}
```

## Advanced Memory Management

### Semantic Recall Configuration

```typescript
const agent = new Agent({
  name: 'advanced-research-agent',
  memory: {
    options: {
      // Message history settings
      lastMessages: 100,
      messageFormat: 'v2', // Use latest message format

      // Semantic recall settings
      semanticRecall: {
        topK: 10, // Return top 10 most relevant memories
        messageRange: {
          before: 15, // Include 15 messages before match
          after: 5    // Include 5 messages after match
        },
        scope: 'thread', // Search within current thread
        threshold: 0.7   // Minimum similarity score
      },

      // Working memory settings
      workingMemory: {
        enabled: true,
        maxSize: 2000, // Maximum working memory size
        persistence: true // Persist across sessions
      }
    }
  }
});
```

### Resource-Scoped Memory

```typescript
// Memory that persists across all threads for a user
const memory = new Memory({
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL
  }),
  resource: "user-456", // User-specific memory
  options: {
    // Memory persists across all conversations for this user
    scope: 'resource',
    // Automatic cleanup after 30 days
    ttl: 30 * 24 * 60 * 60 * 1000
  }
});

// Use in agent
const agent = new Agent({
  memory,
  instructions: "You are a research assistant with persistent memory"
});
```

## Inngest Integration for Production Workflows

Inngest provides production-ready workflow execution with built-in monitoring, retries, and scaling.

### Basic Inngest Setup

```typescript
import { Inngest } from "inngest";
import { init } from "@mastra/inngest";

// Initialize Inngest
const inngest = new Inngest({
  id: "mastra-deep-research",
  baseUrl: process.env.INNGEST_BASE_URL,
  isDev: process.env.NODE_ENV === 'development'
});

// Initialize Mastra with Inngest
const { createWorkflow, createStep } = init(inngest);
```

### Production-Ready Research Workflow

```typescript
// Create production workflow
const productionResearchWorkflow = createWorkflow({
  id: "production-research-workflow",
  inputSchema: z.object({
    query: z.string(),
    userId: z.string(),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  outputSchema: z.object({
    research: z.object({
      query: z.string(),
      results: z.array(z.object({
        title: z.string(),
        content: z.string(),
        url: z.string(),
        relevance: z.number()
      })),
      summary: z.string()
    }),
    metadata: z.object({
      executionTime: z.number(),
      sourcesAnalyzed: z.number(),
      userId: z.string()
    })
  })
});

// Add steps with error handling
productionResearchWorkflow
  .then(createStep({
    id: "validate-input",
    execute: async ({ inputData }) => {
      if (!inputData.query?.trim()) {
        throw new Error("Query is required");
      }
      return { validatedQuery: inputData.query.trim() };
    }
  }))
  .then(createStep({
    id: "research-execution",
    execute: async ({ inputData, mastra }) => {
      const agent = mastra.getAgent('researchAgent');
      const result = await agent.generate([{
        role: 'user',
        content: inputData.validatedQuery
      }]);
      return result;
    }
  }))
  .then(createStep({
    id: "process-results",
    execute: async ({ inputData }) => {
      // Process and structure research results
      return {
        research: inputData.research,
        metadata: {
          executionTime: Date.now() - inputData.startTime,
          sourcesAnalyzed: inputData.sources?.length || 0,
          userId: inputData.userId
        }
      };
    }
  }))
  .commit();
```

### Inngest Dashboard Integration

```typescript
// Register workflow with Mastra
export const mastra = new Mastra({
  workflows: {
    productionResearchWorkflow
  },
  server: {
    apiRoutes: [{
      path: "/api/inngest",
      method: "ALL",
      createHandler: async ({ mastra }) =>
        inngestServe({ mastra, inngest })
    }]
  }
});
```

### Monitoring and Observability

```typescript
// Add monitoring to workflow steps
const monitoredStep = createStep({
  id: "monitored-research",
  execute: async ({ inputData, logger }) => {
    const startTime = Date.now();

    logger.info('Starting research step', {
      query: inputData.query,
      userId: inputData.userId
    });

    try {
      const result = await performResearch(inputData);

      logger.info('Research completed', {
        duration: Date.now() - startTime,
        resultsCount: result.results.length
      });

      return result;
    } catch (error) {
      logger.error('Research failed', {
        error: error.message,
        query: inputData.query,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
});
```

## Advanced Error Handling Patterns

### Workflow-Level Error Recovery

```typescript
const resilientWorkflow = createWorkflow({
  id: "resilient-research-workflow"
});

resilientWorkflow
  .then(researchStep)
  .catch(async (error, context) => {
    console.error('Research step failed:', error);

    // Attempt recovery with simplified query
    if (error.message.includes('complex')) {
      return await fallbackResearch(context.inputData);
    }

    // Log error and rethrow
    await logError(error, context);
    throw error;
  })
  .then(processResultsStep)
  .finally(async (context) => {
    // Always cleanup resources
    await cleanupTempFiles(context);
    await updateMetrics(context);
  })
  .commit();
```

### Agent Error Handling

```typescript
const robustAgent = new Agent({
  name: 'robust-research-agent',
  model: openai("gpt-4o"),
  instructions: "You are a research assistant...",

  // Enhanced error handling
  onError: async (error, context) => {
    console.error('Agent error:', error);

    // Retry logic with exponential backoff
    if (error.code === 'RATE_LIMIT') {
      await delay(Math.pow(2, context.retryCount) * 1000);
      return { action: 'retry' };
    }

    // Fallback to simpler model
    if (error.code === 'MODEL_OVERLOAD') {
      return {
        action: 'fallback',
        model: openai("gpt-3.5-turbo")
      };
    }

    // Log and escalate
    await logCriticalError(error, context);
    return { action: 'fail' };
  },

  // Circuit breaker pattern
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  }
});
```

## Performance Optimization Techniques

### Batch Processing

```typescript
// Batch multiple research queries
const batchResearchStep = createStep({
  id: "batch-research",
  execute: async ({ inputData }) => {
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < inputData.queries.length; i += batchSize) {
      const batch = inputData.queries.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(query => researchAgent.generate([{
          role: 'user',
          content: query
        }]))
      );

      results.push(...batchResults);

      // Rate limiting between batches
      if (i + batchSize < inputData.queries.length) {
        await delay(1000);
      }
    }

    return { results };
  }
});
```

### Caching Strategies

```typescript
// Intelligent caching for research results
const cachedResearchStep = createStep({
  id: "cached-research",
  execute: async ({ inputData, mastra }) => {
    const cacheKey = `research:${hash(inputData.query)}`;
    const storage = mastra.getStorage();

    // Check cache first
    const cached = await storage.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // Perform research
    const result = await performResearch(inputData);

    // Cache result
    await storage.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });

    return result;
  }
});
```

### Connection Pooling and Resource Management

```typescript
// Optimized database connections
const optimizedStorage = new LibSQLStore({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  options: {
    // Connection pool settings
    maxConnections: 10,
    minConnections: 2,
    connectionTimeoutMillis: 10000,

    // Prepared statements
    prepareStatements: true,

    // WAL mode for better concurrency
    walMode: true
  }
});
```

## Integration Patterns

### External API Integration

```typescript
// Custom tool for external API integration
const externalAPITool = createTool({
  id: 'external-api-tool',
  inputSchema: z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    data: z.any().optional(),
    headers: z.record(z.string()).optional()
  }),
  execute: async ({ inputData }) => {
    const response = await fetch(inputData.endpoint, {
      method: inputData.method,
      headers: {
        'Content-Type': 'application/json',
        ...inputData.headers
      },
      body: inputData.data ? JSON.stringify(inputData.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  }
});
```

### Webhook Integration

```typescript
// Workflow that responds to webhooks
const webhookWorkflow = createWorkflow({
  id: "webhook-research-workflow",
  triggerSchema: z.object({
    webhookData: z.any(),
    source: z.string()
  })
});

webhookWorkflow
  .then(createStep({
    id: "validate-webhook",
    execute: async ({ inputData }) => {
      // Validate webhook signature and data
      const isValid = await validateWebhook(inputData);
      if (!isValid) {
        throw new Error("Invalid webhook signature");
      }
      return inputData;
    }
  }))
  .then(createStep({
    id: "process-webhook-data",
    execute: async ({ inputData, mastra }) => {
      // Process webhook data with AI
      const agent = mastra.getAgent('data-processor');
      const result = await agent.generate([{
        role: 'user',
        content: `Process this webhook data: ${JSON.stringify(inputData.webhookData)}`
      }]);
      return result;
    }
  }))
  .then(createStep({
    id: "send-response",
    execute: async ({ inputData }) => {
      // Send response back to webhook source
      await sendWebhookResponse(inputData.source, {
        status: 'processed',
        result: inputData.processedData
      });
    }
  }))
  .commit();
```

## Best Practices

### Memory Management
- Use resource-scoped memory for user-specific data
- Configure appropriate TTL values for cached data
- Monitor memory usage and implement cleanup strategies

### Error Handling
- Implement circuit breakers for external API calls
- Use exponential backoff for retries
- Log errors with sufficient context for debugging

### Performance
- Batch operations when possible
- Implement caching for expensive operations
- Use connection pooling for database operations

### Monitoring
- Track workflow execution times
- Monitor error rates and patterns
- Set up alerts for critical failures

---

*This document covers advanced Mastra features that can significantly enhance your deep research system. For implementation examples and more detailed configurations, refer to the Mastra documentation and examples repository.*