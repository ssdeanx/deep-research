# Tracing & Observability Documentation

## Overview

The Mastra Deep Research System implements comprehensive observability using OpenTelemetry for complete system monitoring, performance tracking, and debugging capabilities. The tracing system provides detailed insights into system behavior, performance bottlenecks, and error conditions.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   OpenTelemetry │    │   Observability │
│   Components    │───►│   Tracing       │───►│   Backend       │
│                 │    │                 │    │                 │
│ • Agents        │    │ • Child Spans   │    │ • Jaeger        │
│ • Workflows     │    │ • Performance   │    │ • Prometheus    │
│ • Tools         │    │ • Error Tracking│    │ • Grafana       │
│ • Memory        │    │ • Context       │    │ • Custom Dash   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Tracing Components

### 1. OpenTelemetry Integration

#### Span Types
- **AISpanType.GENERIC**: All tool operations (GitHub, web search, vector queries, etc.)
- **AISpanType.AGENT_RUN**: Not currently used in implementation
- **Custom spans**: Specific operations (memory search, embedding generation)

#### Span Hierarchy
```
Root Span (Workflow/Agent)
├── Child Span (Tool Operation - AISpanType.GENERIC)
│   ├── Child Span (GitHub API Call)
│   ├── Child Span (Vector Query)
│   ├── Child Span (Web Search)
│   └── Child Span (Data Processing)
├── Child Span (Memory Operation)
│   ├── Child Span (Vector Search)
│   └── Child Span (Storage Query)
└── Child Span (Error Handling)
    └── Child Span (Error Logging)
```

### 2. Performance Monitoring

#### Key Metrics
- **Processing Time**: End-to-end operation timing
- **Resource Usage**: Memory, CPU, and I/O utilization
- **API Call Tracking**: Request/response monitoring
- **Cache Performance**: Hit rates and effectiveness

#### Performance Spans
```typescript
// CORRECT - Our actual pattern
const toolSpan = tracingContext?.currentSpan?.createChildSpan({
  type: AISpanType.GENERIC,
  name: 'tool_operation_name',
  input: { /* relevant input parameters */ }
});

try {
  // Tool execution
  const result = await performOperation();
  toolSpan?.end({
    output: { resultCount: result.length },
    metadata: { operation: 'tool_operation_name' }
  });
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  toolSpan?.end({
    metadata: {
      error: errorMessage,
      operation: 'tool_operation_name'
    }
  });
  throw error;
}
```

### 3. Error Tracking & Diagnostics

#### Error Span Creation
```typescript
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  span?.end({
    metadata: {
      error: errorMessage,
      operation: 'tool_operation_name'
    }
  });
  logger.error(`Failed to execute operation: ${errorMessage}`);
  throw error;
}
```

#### Error Context Capture
- **Stack Traces**: Complete error stack information
- **Operation Context**: What was being executed when error occurred
- **Input/Output Data**: Relevant data for debugging
- **System State**: Memory usage, active connections, etc.

### PinoLogger Integration

PinoLogger works alongside tracing to provide additional logging capabilities:

```typescript
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'ToolName', level: 'info' });

// Used alongside tracing for additional logging
logger.info('Operation started', { operationId, input: context });
```

### 4. Context Propagation

#### Runtime Context Integration
```typescript
const span = tracer.createSpan('operation', {
  attributes: {
    'user.id': runtimeContext.userId,
    'session.id': runtimeContext.sessionId,
    'thread.id': runtimeContext.threadId,
    'request.id': runtimeContext.requestId
  }
});
```

#### Distributed Tracing
- **Request Correlation**: Track requests across components
- **Service Dependencies**: Map component interactions
- **Performance Bottlenecks**: Identify slow operations
- **Failure Points**: Trace error propagation

## Component-Specific Tracing

### Tool Coverage Overview

#### GitHub Tools (14 tools, 85+ individual functions):
- **issues.ts**: createIssue, getIssue, updateIssue, listIssues
- **repositories.ts**: listRepositories, createRepository, getRepository
- **pullRequests.ts**: createPullRequest, getPullRequest, updatePullRequest, mergePullRequest
- **users.ts**: getAuthenticatedUser, getUser, listUsers
- **organizations.ts**: getOrganization, listOrganizations, listOrganizationMembers
- **gists.ts**: listGists, getGist, createGist, updateGist, deleteGist
- **reactions.ts**: listIssueReactions, createIssueReaction, deleteIssueReaction, etc.
- **search.ts**: searchIssues, searchRepositories, searchUsers, searchCode
- **activity.ts**: listRepoEvents, listPublicEvents, listRepoNotifications
- **gitData.ts**: getCommit, createCommit, getTree, createTree, getBlob, createBlob, getRef, createRef, updateRef, deleteRef
- **checks.ts**: createCheckRun, getCheckRun, updateCheckRun, listCheckRunsForRef, listCheckSuitesForRef, getCheckSuite, createCheckSuite
- **actions.ts**: listWorkflowRuns, getWorkflowRun, cancelWorkflowRun, rerunWorkflowRun, listJobsForWorkflowRun, getJobForWorkflowRun, downloadJobLogsForWorkflowRun, listWorkflowRunArtifacts, downloadWorkflowRunArtifact
- **projects.ts**: listProjectCards, getProjectCard, createProjectCard, updateProjectCard, deleteProjectCard, moveProjectCard, listProjectColumns, getProjectColumn, createProjectColumn, updateProjectColumn, deleteProjectColumn, moveProjectColumn, listProjects, getProject, createProject, updateProject, deleteProject
- **teams.ts**: getTeam, listTeams, createTeam, updateTeam, deleteTeam, listTeamMembers, addTeamMember, removeTeamMember, listTeamRepos, addTeamRepo, removeTeamRepo

#### Core Tools (9 tools):
- **chunker-tool.ts**: chunkerTool
- **data-file-manager.ts**: readDataFileTool, writeDataFileTool, deleteDataFileTool, listDataDirTool, copyDataFileTool, moveDataFileTool, searchDataFilesTool, getDataFileInfoTool, createDataDirTool, removeDataDirTool, archiveDataTool, backupDataTool
- **evaluateResultTool.ts**: evaluateResultTool
- **extractLearningsTool.ts**: extractLearningsTool
- **graphRAG.ts**: graphRAGUpsertTool, graphRAGTool, graphRAGQueryTool
- **rerank-tool.ts**: rerankTool
- **vectorQueryTool.ts**: vectorQueryTool, enhancedVectorQueryTool, hybridVectorSearchTool
- **weather-tool.ts**: weatherTool
- **web-scraper-tool.ts**: webScraperTool
- **webSearchTool.ts**: webSearchTool

**Total: 85+ individual tool functions across 23+ files**

### Agent Tracing

#### Research Agent Tracing
```typescript
// Main agent execution
const agentSpan = tracer.createSpan('agent.research.run', {
  attributes: {
    'agent.phase': 'research',
    'query.complexity': calculateComplexity(query),
    'search.queries': searchQueries.length
  }
});

// Phase-specific spans
const phaseSpan = tracer.createSpan('agent.research.phase', {
  attributes: {
    'phase.number': phaseNumber,
    'phase.type': phaseType,
    'results.count': results.length
  }
});
```

#### Report Agent Tracing
```typescript
const reportSpan = tracer.createSpan('agent.report.generate', {
  attributes: {
    'report.type': reportType,
    'content.length': contentLength,
    'sources.count': sources.length,
    'processing.time': Date.now() - startTime
  }
});
```

### Tool Tracing

#### Vector Query Tool Tracing
```typescript
const vectorSpan = tracer.createSpan('tool.vector.query', {
  attributes: {
    'vector.index': indexName,
    'query.dimensions': queryVector.length,
    'results.limit': topK,
    'similarity.threshold': threshold,
    'cache.hit': cacheHit
  }
});

// Child spans for operations
const embeddingSpan = tracer.createSpan('vector.embedding.generate', {
  attributes: {
    'model.id': embeddingModel,
    'text.length': textLength,
    'tokens.count': tokenCount
  }
});

const searchSpan = tracer.createSpan('vector.search.execute', {
  attributes: {
    'search.type': searchType,
    'candidates.count': candidates.length,
    'results.count': results.length
  }
});
```

#### Web Search Tool Tracing
```typescript
const searchSpan = tracer.createSpan('tool.web.search', {
  attributes: {
    'search.query': query,
    'search.engine': engine,
    'results.expected': expectedCount,
    'timeout.ms': timeout
  }
});

// API call span
const apiSpan = tracer.createSpan('web.api.call', {
  attributes: {
    'api.endpoint': endpoint,
    'request.size': requestSize,
    'response.status': statusCode,
    'response.size': responseSize
  }
});
```

### Memory Tracing

#### Memory Operation Tracing
```typescript
const memorySpan = tracer.createSpan('memory.operation', {
  attributes: {
    'memory.type': operationType,
    'memory.scope': scope,
    'thread.id': threadId,
    'messages.count': messageCount
  }
});

// Processor spans
const processorSpan = tracer.createSpan('memory.processor.execute', {
  attributes: {
    'processor.name': processorName,
    'processor.type': processorType,
    'input.size': inputSize,
    'output.size': outputSize
  }
});
```

### Workflow Tracing

#### Workflow Execution Tracing
```typescript
const workflowSpan = tracer.createSpan('workflow.execute', {
  attributes: {
    'workflow.id': workflowId,
    'workflow.name': workflowName,
    'input.size': inputSize,
    'steps.count': steps.length
  }
});

// Step execution spans
const stepSpan = tracer.createSpan('workflow.step.execute', {
  attributes: {
    'step.id': stepId,
    'step.name': stepName,
    'step.type': stepType,
    'execution.order': order
  }
});
```

## Google AI Integration Tracing

### Gemini Model Tracing
```typescript
const modelSpan = tracer.createSpan('google.model.generate', {
  attributes: {
    'model.id': modelId,
    'model.version': modelVersion,
    'prompt.tokens': promptTokens,
    'response.tokens': responseTokens,
    'temperature': temperature,
    'thinking.budget': thinkingBudget
  }
});
```

### Search Grounding Tracing
```typescript
const groundingSpan = tracer.createSpan('google.grounding.search', {
  attributes: {
    'grounding.enabled': true,
    'search.queries': searchQueries.length,
    'grounding.sources': sources.length,
    'confidence.score': averageConfidence
  }
});
```

### Caching Tracing
```typescript
const cacheSpan = tracer.createSpan('google.cache.operation', {
  attributes: {
    'cache.operation': operationType,
    'cache.hit': isHit,
    'cache.size': cacheSize,
    'cache.ttl': ttlSeconds,
    'tokens.saved': savedTokens
  }
});
```

## Monitoring & Analytics

### Key Performance Indicators

#### System Metrics
- **Throughput**: Operations per second
- **Latency**: Average response time
- **Error Rate**: Percentage of failed operations
- **Resource Usage**: CPU, memory, disk I/O

#### Business Metrics
- **User Satisfaction**: Success rates, retry rates
- **Content Quality**: Evaluation scores, user feedback
- **Cost Efficiency**: API usage, cache hit rates
- **System Reliability**: Uptime, mean time between failures

### Alerting & Notifications

#### Performance Alerts
- High latency thresholds
- Error rate spikes
- Resource usage limits
- Cache miss rate increases

#### Business Alerts
- Low user satisfaction scores
- High retry rates
- Cost budget exceeded
- Service degradation

## Configuration

### Tracing Configuration
```typescript
const tracingConfig = {
  serviceName: 'mastra-deep-research',
  serviceVersion: '1.0.0',
  exporter: {
    type: 'otlp',
    endpoint: 'http://localhost:4318',
    headers: {
      'authorization': 'Bearer <token>'
    }
  },
  sampling: {
    rate: 0.1, // 10% sampling
    rules: [
      { service: 'critical-operations', rate: 1.0 },
      { error: true, rate: 1.0 }
    ]
  }
};
```

### Custom Span Configuration
```typescript
const spanConfig = {
  attributes: {
    'service.name': 'mastra-deep-research',
    'service.version': process.env.npm_package_version,
    'environment': process.env.NODE_ENV
  },
  links: [], // Related spans
  events: [], // Timestamped events
  resources: {
    'host.name': os.hostname(),
    'process.pid': process.pid
  }
};
```

## Best Practices

### Span Naming Conventions
- Use hierarchical naming: `component.operation.suboperation`
- Include operation type: `agent.run`, `tool.execute`, `memory.search`
- Use consistent naming across services

### Attribute Standards
- Use semantic attribute names
- Include units for measurements: `duration.ms`, `size.bytes`
- Use enumerated values for status: `status.success`, `status.error`

### Error Handling
- Always create error spans for exceptions
- Include relevant context in error spans
- Use appropriate error codes and messages
- Propagate error context through span hierarchy

### Performance Considerations
- Use sampling for high-volume operations
- Limit span attribute count
- Avoid large string values in attributes
- Use child spans for complex operations

## Integration Examples

### With Langfuse
```typescript
const langfuseConfig = {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL
};

// Automatic trace export to Langfuse
const tracer = new LangfuseTracer(langfuseConfig);
```

### With Jaeger
```typescript
const jaegerConfig = {
  serviceName: 'mastra-deep-research',
  reporter: {
    collectorEndpoint: 'http://localhost:14268/api/traces'
  },
  sampler: {
    type: 'probabilistic',
    param: 0.1
  }
};
```

### Custom Dashboard Integration
```typescript
const dashboardConfig = {
  metrics: [
    'request.duration',
    'error.rate',
    'cache.hit_rate',
    'memory.usage'
  ],
  alerts: [
    { metric: 'error.rate', threshold: 0.05, operator: '>' },
    { metric: 'request.duration', threshold: 5000, operator: '>' }
  ]
};
```

## Future Enhancements

- **Real-time Monitoring**: Live dashboard updates
- **Predictive Analytics**: Anomaly detection and forecasting
- **Automated Optimization**: Self-tuning based on metrics
- **Multi-cloud Tracing**: Cross-cloud service tracing
- **AI-powered Insights**: ML-based performance analysis
- **Custom Metrics**: Domain-specific KPI tracking

---

*This tracing and observability documentation reflects the current implementation as of the latest system updates. For implementation details, refer to the source code and OpenTelemetry integration points throughout the system.*