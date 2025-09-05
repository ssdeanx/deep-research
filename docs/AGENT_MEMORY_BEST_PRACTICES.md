# Agent Configuration and Memory Management Best Practices

This guide provides comprehensive best practices for configuring agents and managing memory in your Mastra deep research system.

## Agent Configuration Patterns

### Research Agent Configuration

```typescript
// Optimal configuration for research agents
const researchAgent = new Agent({
  name: 'research-agent',
  instructions: `You are an expert research assistant specializing in comprehensive information gathering and analysis.

CORE CAPABILITIES:
- Conduct systematic, multi-phase research using web search and content analysis
- Extract key insights and identify knowledge gaps
- Generate follow-up questions to deepen understanding
- Maintain research context across multiple phases
- Provide structured, evidence-based findings

METHODOLOGY:
1. Phase 1: Initial broad search to establish baseline knowledge
2. Phase 2: Targeted deep dive based on initial findings
3. Synthesis: Connect insights across sources
4. Validation: Cross-reference information for accuracy

OUTPUT FORMAT:
- Structured JSON with clear sections
- Source attribution for all findings
- Confidence levels for key insights
- Follow-up research suggestions`,

  model: openai("gpt-4o"), // Use GPT-4o for complex reasoning

  // Enhanced memory configuration
  memory: {
    options: {
      // Message history for research context
      lastMessages: 50,

      // Semantic recall for related research
      semanticRecall: {
        topK: 8,
        messageRange: { before: 10, after: 3 },
        scope: 'thread',
        threshold: 0.75
      },

      // Working memory for current research session
      workingMemory: {
        enabled: true,
        maxSize: 1500,
        persistence: true
      }
    }
  },

  // Tool configuration
  tools: {
    webSearch: {
      maxRetries: 3,
      timeout: 30000,
      rateLimit: { requests: 10, period: 60000 }
    },
    evaluateResult: {
      batchSize: 5,
      parallelProcessing: true
    }
  },

  // Error handling
  onError: async (error, context) => {
    if (error.code === 'RATE_LIMIT') {
      await delay(exponentialBackoff(context.retryCount));
      return { action: 'retry' };
    }

    if (error.code === 'CONTENT_FILTER') {
      return {
        action: 'fallback',
        model: openai("gpt-3.5-turbo")
      };
    }

    // Log and escalate
    await logError(error, context);
    return { action: 'fail' };
  }
});
```

### Report Generation Agent Configuration

```typescript
const reportAgent = new Agent({
  name: 'report-agent',
  instructions: `You are a senior research analyst and technical writer specializing in creating comprehensive, well-structured reports.

EXPERTISE:
- Academic and professional report writing
- Data synthesis and analysis
- Technical documentation
- Executive summary creation
- Citation and source management

REPORT STRUCTURE:
1. Executive Summary (key findings, conclusions)
2. Methodology (research approach, sources)
3. Detailed Analysis (findings, insights, trends)
4. Recommendations (actionable insights)
5. Appendices (raw data, additional references)

QUALITY STANDARDS:
- Evidence-based conclusions
- Clear, concise writing
- Professional formatting
- Comprehensive citations
- Balanced perspective`,

  model: openai("gpt-4o"),

  memory: {
    options: {
      lastMessages: 100, // More context for report generation

      semanticRecall: {
        topK: 12,
        messageRange: { before: 15, after: 5 },
        scope: 'thread'
      },

      workingMemory: {
        enabled: true,
        maxSize: 2500, // Larger for complex reports
        persistence: true
      }
    }
  },

  // Specialized for report generation
  outputFormat: {
    structured: true,
    sections: ['executive-summary', 'methodology', 'analysis', 'recommendations'],
    citations: true,
    wordCount: { min: 2000, max: 5000 }
  }
});
```

### Evaluation Agent Configuration

```typescript
const evaluationAgent = new Agent({
  name: 'evaluation-agent',
  instructions: `You are a critical analysis expert specializing in evaluating information quality, relevance, and reliability.

EVALUATION CRITERIA:
- Relevance: How well content addresses the research query
- Accuracy: Factual correctness and source credibility
- Recency: Timeliness of information
- Completeness: Depth and breadth of coverage
- Objectivity: Balance and lack of bias

SCORING SYSTEM:
- Relevance: 0-10 scale
- Overall quality assessment
- Detailed reasoning for decisions
- Recommendations for further research

OUTPUT FORMAT:
{
  "relevanceScore": number,
  "quality": "high|medium|low",
  "reasoning": string,
  "recommendations": string[]
}`,

  model: openai("gpt-3.5-turbo"), // Faster for evaluation tasks

  memory: {
    options: {
      lastMessages: 25, // Shorter context for evaluations

      semanticRecall: {
        topK: 5,
        scope: 'thread'
      },

      workingMemory: {
        enabled: false // Not needed for evaluations
      }
    }
  },

  // Optimized for quick evaluations
  responseFormat: {
    json: true,
    schema: evaluationSchema
  }
});
```

## Memory Management Strategies

### Thread-Based Memory Organization

```typescript
// Research session memory management
class ResearchMemoryManager {
  constructor(private mastra: Mastra) {}

  async createResearchSession(query: string, userId: string) {
    const threadId = `research-${userId}-${Date.now()}`;

    // Initialize thread with research context
    await this.mastra.getStorage().createThread({
      id: threadId,
      resourceId: userId,
      title: `Research: ${query}`,
      metadata: {
        type: 'research',
        query: query,
        startTime: new Date().toISOString(),
        status: 'active'
      }
    });

    return threadId;
  }

  async addResearchFinding(threadId: string, finding: ResearchFinding) {
    await this.mastra.getStorage().createMessage({
      threadId,
      role: 'assistant',
      content: JSON.stringify(finding),
      metadata: {
        type: 'research-finding',
        source: finding.source,
        relevance: finding.relevance
      }
    });
  }

  async getResearchContext(threadId: string) {
    const messages = await this.mastra.getStorage().getMessages({
      threadId,
      format: 'v2',
      limit: 50
    });

    return this.synthesizeContext(messages);
  }

  private synthesizeContext(messages: Message[]) {
    const findings = messages
      .filter(m => m.metadata?.type === 'research-finding')
      .map(m => JSON.parse(m.content));

    const themes = this.extractThemes(findings);
    const gaps = this.identifyGaps(findings);

    return { findings, themes, gaps };
  }
}
```

### Semantic Memory for Knowledge Retrieval

```typescript
// Advanced semantic memory implementation
class SemanticMemoryManager {
  constructor(private mastra: Mastra) {}

  async storeResearchInsight(insight: ResearchInsight, userId: string) {
    const vectorStore = this.mastra.getStorage().getVectorStore();

    // Create embedding for semantic search
    const embedding = await this.generateEmbedding(insight.content);

    // Store with metadata
    await vectorStore.upsert({
      id: `insight-${Date.now()}`,
      vector: embedding,
      metadata: {
        type: 'research-insight',
        userId: userId,
        topic: insight.topic,
        confidence: insight.confidence,
        source: insight.source,
        createdAt: new Date().toISOString()
      },
      content: insight.content
    });
  }

  async retrieveRelevantInsights(query: string, userId: string, limit = 5) {
    const vectorStore = this.mastra.getStorage().getVectorStore();

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Semantic search with filtering
    const results = await vectorStore.query({
      vector: queryEmbedding,
      filter: {
        userId: userId,
        type: 'research-insight'
      },
      topK: limit,
      includeMetadata: true
    });

    return results.map(result => ({
      content: result.content,
      score: result.score,
      metadata: result.metadata
    }));
  }

  async findKnowledgeGaps(existingInsights: Insight[], query: string) {
    const gaps = [];

    // Analyze existing insights for completeness
    const topics = [...new Set(existingInsights.map(i => i.topic))];
    const queryTopics = await this.extractTopics(query);

    // Identify missing topics
    for (const topic of queryTopics) {
      if (!topics.includes(topic)) {
        gaps.push({
          topic,
          type: 'missing-topic',
          priority: 'high'
        });
      }
    }

    // Check for outdated information
    const recentInsights = existingInsights.filter(i =>
      new Date(i.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentInsights.length < existingInsights.length * 0.3) {
      gaps.push({
        topic: 'recency',
        type: 'outdated-information',
        priority: 'medium'
      });
    }

    return gaps;
  }
}
```

### Working Memory Optimization

```typescript
// Intelligent working memory management
class WorkingMemoryOptimizer {
  constructor(private mastra: Mastra) {}

  async optimizeWorkingMemory(userId: string, currentContext: any) {
    const storage = this.mastra.getStorage();

    // Get current working memory
    const currentMemory = await storage.getWorkingMemory(userId);

    // Analyze context relevance
    const relevantItems = await this.filterRelevantItems(
      currentMemory,
      currentContext
    );

    // Compress less relevant information
    const compressedMemory = await this.compressMemory(relevantItems);

    // Update working memory
    await storage.updateWorkingMemory(userId, compressedMemory);

    return compressedMemory;
  }

  private async filterRelevantItems(memory: any, context: any) {
    const relevantItems = [];

    for (const item of memory.items) {
      const relevance = await this.calculateRelevance(item, context);

      if (relevance > 0.6) {
        relevantItems.push({ ...item, relevance });
      }
    }

    // Sort by relevance and recency
    return relevantItems
      .sort((a, b) => {
        const relevanceDiff = b.relevance - a.relevance;
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;

        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 20); // Keep top 20 most relevant
  }

  private async compressMemory(items: any[]) {
    if (items.length <= 15) return { items };

    // Group similar items
    const groups = this.groupSimilarItems(items);

    // Summarize each group
    const summaries = await Promise.all(
      groups.map(group => this.summarizeGroup(group))
    );

    return {
      items: summaries,
      compressionRatio: items.length / summaries.length,
      lastOptimized: new Date().toISOString()
    };
  }
}
```

## Performance Optimization Techniques

### Agent Pool Management

```typescript
// Agent pool for handling multiple concurrent requests
class AgentPoolManager {
  private pools: Map<string, Agent[]> = new Map();

  constructor(private mastra: Mastra) {}

  async getAgent(type: string, userId: string): Promise<Agent> {
    const pool = this.pools.get(type) || [];
    let agent = pool.find(a => !a.isBusy());

    if (!agent) {
      agent = await this.createAgent(type, userId);
      pool.push(agent);
      this.pools.set(type, pool);
    }

    agent.markBusy();
    return agent;
  }

  private async createAgent(type: string, userId: string): Promise<Agent> {
    const config = this.getAgentConfig(type);

    return new Agent({
      ...config,
      memory: {
        ...config.memory,
        resource: userId // User-specific memory
      }
    });
  }

  private getAgentConfig(type: string) {
    const configs = {
      'research': {
        model: openai("gpt-4o"),
        memory: { lastMessages: 50 },
        tools: ['webSearch', 'evaluateResult']
      },
      'evaluation': {
        model: openai("gpt-3.5-turbo"),
        memory: { lastMessages: 25 },
        tools: ['evaluateResult']
      },
      'report': {
        model: openai("gpt-4o"),
        memory: { lastMessages: 100 },
        tools: []
      }
    };

    return configs[type] || configs.research;
  }
}
```

### Caching Strategies

```typescript
// Multi-level caching system
class CacheManager {
  constructor(private mastra: Mastra) {}

  async getCachedResult(key: string, ttl = 3600000) {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && this.isValid(memoryResult.timestamp, ttl)) {
      return memoryResult.data;
    }

    // Check persistent cache
    const persistentResult = await this.getPersistentCache(key);
    if (persistentResult && this.isValid(persistentResult.timestamp, ttl)) {
      this.memoryCache.set(key, persistentResult);
      return persistentResult.data;
    }

    return null;
  }

  async setCachedResult(key: string, data: any) {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };

    // Set in memory cache
    this.memoryCache.set(key, cacheEntry);

    // Set in persistent cache
    await this.setPersistentCache(key, cacheEntry);
  }

  private async getPersistentCache(key: string) {
    const storage = this.mastra.getStorage();
    return await storage.get(`cache:${key}`);
  }

  private async setPersistentCache(key: string, data: any) {
    const storage = this.mastra.getStorage();
    await storage.set(`cache:${key}`, data, { ttl: 86400000 }); // 24 hours
  }

  private isValid(timestamp: number, ttl: number) {
    return Date.now() - timestamp < ttl;
  }
}
```

## Error Handling and Recovery

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
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
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset() {
    return Date.now() - this.lastFailureTime > this.recoveryTimeout;
  }
}
```

### Graceful Degradation

```typescript
// Agent with graceful degradation
class ResilientAgent {
  constructor(
    private primaryAgent: Agent,
    private fallbackAgent: Agent,
    private circuitBreaker: CircuitBreaker
  ) {}

  async generate(messages: Message[], options = {}) {
    try {
      return await this.circuitBreaker.execute(() =>
        this.primaryAgent.generate(messages, options)
      );
    } catch (error) {
      console.warn('Primary agent failed, using fallback:', error.message);

      // Use fallback agent
      return await this.fallbackAgent.generate(messages, {
        ...options,
        model: 'gpt-3.5-turbo' // Simpler model for fallback
      });
    }
  }
}
```

## Monitoring and Observability

### Agent Performance Metrics

```typescript
class AgentMetricsCollector {
  private metrics: Map<string, AgentMetrics> = new Map();

  async recordAgentExecution(
    agentId: string,
    execution: AgentExecution
  ) {
    const metrics = this.metrics.get(agentId) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastExecutionTime: 0
    };

    metrics.totalExecutions++;
    metrics.lastExecutionTime = Date.now();

    if (execution.success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update average response time
    const responseTime = execution.endTime - execution.startTime;
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalExecutions - 1) + responseTime) /
      metrics.totalExecutions;

    // Update error rate
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions;

    this.metrics.set(agentId, metrics);

    // Log if error rate is high
    if (metrics.errorRate > 0.1) {
      await this.alertHighErrorRate(agentId, metrics);
    }
  }

  getMetrics(agentId: string) {
    return this.metrics.get(agentId);
  }

  async getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

### Memory Usage Monitoring

```typescript
class MemoryMonitor {
  constructor(private mastra: Mastra) {}

  async getMemoryUsage(userId: string) {
    const storage = this.mastra.getStorage();

    const [messages, threads, workingMemory] = await Promise.all([
      storage.getMessages({ resourceId: userId, limit: 1000 }),
      storage.getThreads({ resourceId: userId }),
      storage.getWorkingMemory(userId)
    ]);

    const messageSize = this.calculateSize(messages);
    const threadSize = this.calculateSize(threads);
    const workingMemorySize = this.calculateSize(workingMemory);

    return {
      totalSize: messageSize + threadSize + workingMemorySize,
      breakdown: {
        messages: messageSize,
        threads: threadSize,
        workingMemory: workingMemorySize
      },
      counts: {
        messages: messages.length,
        threads: threads.length
      }
    };
  }

  async optimizeMemory(userId: string) {
    const usage = await this.getMemoryUsage(userId);

    if (usage.totalSize > 50 * 1024 * 1024) { // 50MB
      await this.compressOldMessages(userId);
    }

    if (usage.counts.messages > 500) {
      await this.archiveOldThreads(userId);
    }
  }

  private calculateSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }
}
```

## Configuration Management

### Environment-Based Configuration

```typescript
// Configuration management for different environments
const agentConfigs = {
  development: {
    model: openai("gpt-3.5-turbo"),
    memory: { lastMessages: 25 },
    debug: true
  },

  staging: {
    model: openai("gpt-4o"),
    memory: { lastMessages: 50 },
    monitoring: true
  },

  production: {
    model: openai("gpt-4o"),
    memory: { lastMessages: 100 },
    monitoring: true,
    caching: true,
    circuitBreaker: true
  }
};

function getAgentConfig(environment: string, agentType: string) {
  const envConfig = agentConfigs[environment] || agentConfigs.development;
  const typeConfig = agentTypeConfigs[agentType] || {};

  return {
    ...envConfig,
    ...typeConfig,
    environment,
    agentType
  };
}
```

---

*These best practices provide a comprehensive framework for configuring agents and managing memory in your deep research system. Implement them gradually, starting with the most critical optimizations for your use case.*