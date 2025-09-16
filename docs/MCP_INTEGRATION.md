# Model Context Protocol (MCP) Integration Guide

This comprehensive guide covers the integration of Model Context Protocol (MCP) in the Mastra Deep Research System, enabling seamless communication between AI models and external tools and services.

## Overview

MCP is a standardized protocol that enables AI models to securely access external tools, resources, and services. In the Mastra system, MCP integration provides:

```
┌─────────────────────────────────────┐
│         MCP Architecture            │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ MCP Server  │  │ MCP Client  │   │
│  │ (Mastra)    │◄►│ (External)  │   │
│  └─────────────┘  └─────────────┘   │
│         │                  │        │
│         └─────────┬────────┘        │
│                   │                 │
│         ┌─────────▼─────────┐       │
│         │   MCP Protocol    │       │
│         │ - Tool Discovery  │       │
│         │ - Resource Access │       │
│         │ - Secure Transport│       │
│         └───────────────────┘       │
└─────────────────────────────────────┘
```

## MCP Server Implementation

### Basic MCP Server Setup

```typescript
import { MCPServer } from '@mastra/mcp';
import { mastra } from './mastra';

// Create MCP server instance
const mcpServer = new MCPServer({
  name: 'mastra-deep-research',
  version: '1.0.0',
  // Pass Mastra components directly to the server
  agents: {
    researchAgent: mastra.getAgent('researchAgent'),
  },
  workflows: {
    researchWorkflow: mastra.getWorkflow('researchWorkflow'),
  },
  tools: {
    webSearch: mastra.getTool('webSearch'),
  },
});

// Start MCP server
await mcpServer.startStdio();
```

### Advanced MCP Server Configuration

```typescript
const mcpServer = new MCPServer({
  name: 'mastra-deep-research-server',
  version: '1.0.0',

  // Server capabilities
  capabilities: {
    tools: {
      listChanged: true, // Notify when tool list changes
    },
    resources: {
      subscribe: true,   // Allow resource subscriptions
      listChanged: true  // Notify when resource list changes
    },
    prompts: {
      listChanged: true  // Notify when prompt list changes
    },
    logging: {
      level: 'info'      // MCP logging level
    }
  },

  // Security configuration
  security: {
    allowedOrigins: ['https://trusted-domain.com'],
    apiKeyRequired: true,
    rateLimit: {
      requests: 100,
      period: 60000 // 1 minute
    }
  },

  // Transport configuration
  transport: {
    type: 'websocket',
    options: {
      heartbeatInterval: 30000,
      maxConnections: 100,
      compression: true
    }
  }
});
```

## Tool Registration and Discovery

### Registering Tools with MCP

Tools, agents, and workflows are registered by passing them directly to the `MCPServer` constructor. The `MCPServer` automatically converts them into callable MCP tools.

```typescript
import { MCPServer } from '@mastra/mcp';
import { mastra } from './mastra'; // Assuming mastra instance is available

const mcpServer = new MCPServer({
  name: 'your-server-name',
  version: '1.0.0',
  agents: {
    // Your agents here
    researchAgent: mastra.getAgent('researchAgent'),
    githubAgent: mastra.getAgent('githubAgent'), // GitHub agent available through MCP
  },
  workflows: {
    // Your workflows here
    researchWorkflow: mastra.getWorkflow('researchWorkflow'),
  },
  tools: {
    // Your tools here
    webSearchTool: mastra.getTool('webSearch'),
    // GitHub tools available through MCP
    createIssue: mastra.getTool('createIssue'),
    getRepository: mastra.getTool('getRepository'),
    createPullRequest: mastra.getTool('createPullRequest'),
    listPullRequests: mastra.getTool('listPullRequests'),
    // ... and 10+ more GitHub tools
  },
});
```

### GitHub Tools Integration

The system provides comprehensive GitHub integration through MCP with 14 specialized tools:

**Available GitHub Tools:**
- **Issues**: `createIssue`, `getIssue`, `updateIssue`, `listIssues`
- **Repositories**: `createRepository`, `getRepository`, `updateRepository`, `deleteRepository`, `listRepositories`, `listBranches`, `createBranch`, `deleteBranch`
- **Pull Requests**: `createPullRequest`, `getPullRequest`, `updatePullRequest`, `mergePullRequest`, `listPullRequests`, `createPullRequestComment`, `updatePullRequestComment`, `deletePullRequestComment`
- **Users**: `getUser`, `searchUsers`
- **Organizations**: `getOrganization`, `listOrganizationMembers`
- **Search**: `searchRepositories`, `searchIssues`, `searchCode`
- **Additional**: `createGist`, `listGists`, `createReaction`, `searchActivity`, `getGitData`, `listChecks`, `listActions`, `listProjects`, `listTeams`

**GitHub Agent**: The `githubAgent` provides intelligent GitHub management with advanced Copilot integration for automated task delegation and code analysis.

### Tool Discovery

```typescript
// List all available tools
const tools = await mcpServer.listTools();

// Get tool details
const toolInfo = await mcpServer.getToolInfo('web_search');

// Search tools by capability
const searchTools = await mcpServer.findTools({
  category: 'search',
  tags: ['web', 'research']
});
```

## Resource Management

### Resource Registration

```typescript
// Register static resources
mcpServer.registerResource({
  uri: 'mastra://research/documents',
  name: 'Research Documents',
  description: 'Collection of research documents',
  mimeType: 'application/json',
  content: async () => {
    return await mastra.getStorage().getDocuments();
  }
});

// Register dynamic resources
mcpServer.registerResource({
  uri: 'mastra://research/{userId}/history',
  name: 'User Research History',
  description: 'Research history for a specific user',
  mimeType: 'application/json',
  parameters: {
    userId: { type: 'string', required: true }
  },
  content: async (params) => {
    return await mastra.getStorage().getUserHistory(params.userId);
  }
});
```

### Resource Subscriptions

```typescript
// Subscribe to resource changes
const subscription = mcpServer.subscribeToResource(
  'mastra://research/documents',
  (change) => {
    console.log('Resource changed:', change);
  }
);

// Unsubscribe
subscription.unsubscribe();
```

## Workflow Integration

### Exposing Workflows as MCP Tools

```typescript
// Workflows are automatically exposed as MCP tools when registered with the MCPServer.
// For example, a workflow with `id: 'research-workflow'` will be exposed as a tool named `run_research-workflow`.

```typescript
import { MCPServer } from '@mastra/mcp';
import { mastra } from './mastra'; // Assuming mastra instance is available

const mcpServer = new MCPServer({
  name: 'your-server-name',
  version: '1.0.0',
  workflows: {
    researchWorkflow: mastra.getWorkflow('researchWorkflow'),
  },
});

// To call this workflow as an MCP tool:
// await mcpClient.callTool('run_research-workflow', { query: 'your research query' });
```

### Workflow State Management

```typescript
// Monitor workflow execution via MCP
mcpServer.registerResource({
  uri: 'mastra://workflows/{workflowId}/status',
  name: 'Workflow Status',
  description: 'Current status of a workflow execution',
  content: async (params) => {
    const workflow = mastra.getWorkflow(params.workflowId);
    return await workflow.getStatus();
  }
});
```

## MCP Client Implementation

### Basic MCP Client Setup

```typescript
import { MCPClient } from '@mastra/mcp';

const mcpClient = new MCPClient({
  serverUrl: 'ws://localhost:3001',
  apiKey: 'your-api-key'
});

// Connect to MCP server
await mcpClient.connect();

// List available tools
const tools = await mcpClient.listTools();
console.log('Available tools:', tools);

// Execute a tool
const result = await mcpClient.callTool('web_search', {
  query: 'quantum computing',
  limit: 5
});

console.log('Search results:', result);
```

### Advanced MCP Client Features

```typescript
const mcpClient = new MCPClient({
  serverUrl: 'ws://localhost:3001',
  apiKey: process.env.MCP_API_KEY,

  // Connection options
  connection: {
    reconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  },

  // Request options
  request: {
    timeout: 30000,
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  },

  // Event handlers
  onConnect: () => console.log('Connected to MCP server'),
  onDisconnect: () => console.log('Disconnected from MCP server'),
  onError: (error) => console.error('MCP client error:', error),
  onToolListChanged: (tools) => console.log('Tools updated:', tools)
});
```

## Authentication and Security

### API Key Authentication

```typescript
// Server-side authentication
const mcpServer = new MCPServer({
  name: 'secure-mcp-server',
  authentication: {
    type: 'api-key',
    validateApiKey: async (apiKey) => {
      // Validate API key against your system
      return await validateApiKey(apiKey);
    },
    getUserContext: async (apiKey) => {
      // Get user context from API key
      return await getUserFromApiKey(apiKey);
    }
  }
});
```

### JWT Authentication

```typescript
const mcpServer = new MCPServer({
  authentication: {
    type: 'jwt',
    jwtSecret: process.env.JWT_SECRET,
    validateToken: async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
          userId: decoded.userId,
          permissions: decoded.permissions
        };
      } catch (error) {
        throw new Error('Invalid JWT token');
      }
    }
  }
});
```

### OAuth 2.0 Integration

```typescript
const mcpServer = new MCPServer({
  authentication: {
    type: 'oauth2',
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    authorizationUrl: 'https://auth.example.com/oauth/authorize',
    tokenUrl: 'https://auth.example.com/oauth/token',
    scopes: ['read:tools', 'execute:workflows'],
    validateToken: async (token) => {
      // Validate OAuth token and get user info
      return await validateOAuthToken(token);
    }
  }
});
```

## Transport Protocols

### WebSocket Transport

```typescript
// Server configuration
const mcpServer = new MCPServer({
  transport: {
    type: 'websocket',
    options: {
      port: 3001,
      host: '0.0.0.0',
      ssl: {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.crt')
      },
      cors: {
        origin: ['https://your-app.com'],
        credentials: true
      }
    }
  }
});

// Client configuration
const mcpClient = new MCPClient({
  transport: {
    type: 'websocket',
    url: 'wss://your-server.com:3001',
    options: {
      headers: {
        'Authorization': 'Bearer your-token'
      }
    }
  }
});
```

### HTTP Transport

```typescript
// Server configuration
const mcpServer = new MCPServer({
  transport: {
    type: 'http',
    options: {
      port: 3000,
      host: '0.0.0.0',
      routes: {
        tools: '/api/mcp/tools',
        resources: '/api/mcp/resources',
        workflows: '/api/mcp/workflows'
      },
      middleware: [
        cors(),
        helmet(),
        express.json({ limit: '10mb' })
      ]
    }
  }
});

// Client configuration
const mcpClient = new MCPClient({
  transport: {
    type: 'http',
    baseUrl: 'https://your-server.com/api/mcp',
    headers: {
      'Authorization': 'Bearer your-token',
      'Content-Type': 'application/json'
    }
  }
});
```

### Stdio Transport (for CLI tools)

```typescript
// Server for CLI usage
const mcpServer = new MCPServer({
  transport: {
    type: 'stdio',
    options: {
      input: process.stdin,
      output: process.stdout,
      encoding: 'utf8'
    }
  }
});

// Client for CLI usage
const mcpClient = new MCPClient({
  transport: {
    type: 'stdio',
    command: 'node',
    args: ['path/to/mcp-server.js'],
    options: {
      cwd: process.cwd(),
      env: { ...process.env, API_KEY: 'your-key' }
    }
  }
});
```

## Error Handling and Monitoring

### Error Handling

```typescript
// Server error handling
mcpServer.on('error', (error) => {
  console.error('MCP Server error:', error);

  // Log error details
  logger.error('MCP Server error', {
    error: error.message,
    stack: error.stack,
    clientId: error.clientId,
    requestId: error.requestId
  });
});

// Client error handling
mcpClient.on('error', (error) => {
  console.error('MCP Client error:', error);

  // Implement retry logic
  if (error.code === 'CONNECTION_LOST') {
    setTimeout(() => mcpClient.reconnect(), 5000);
  }
});
```

### Monitoring and Metrics

```typescript
// Server metrics
const metrics = {
  activeConnections: 0,
  totalRequests: 0,
  errorCount: 0,
  averageResponseTime: 0
};

mcpServer.on('connection', () => metrics.activeConnections++);
mcpServer.on('disconnection', () => metrics.activeConnections--);

mcpServer.on('request', (request) => {
  metrics.totalRequests++;
  const startTime = Date.now();

  // Track response time
  request.on('response', () => {
    const responseTime = Date.now() - startTime;
    metrics.averageResponseTime =
      (metrics.averageResponseTime + responseTime) / 2;
  });
});

// Client metrics
mcpClient.on('request', (request) => {
  console.log(`MCP Request: ${request.method} ${request.url}`);
});

mcpClient.on('response', (response) => {
  console.log(`MCP Response: ${response.status} (${response.duration}ms)`);
});
```

## Advanced MCP Features

### Tool Streaming

```typescript
// Server-side streaming
mcpServer.registerStreamingTool({
  name: 'research_stream',
  description: 'Stream research results in real-time',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      streamUpdates: { type: 'boolean', default: true }
    }
  },
  handler: async function* (args) {
    const research = startResearch(args.query);

    if (args.streamUpdates) {
      for await (const update of research.updates()) {
        yield {
          type: 'update',
          data: update
        };
      }
    }

    const finalResult = await research.complete();
    yield {
      type: 'result',
      data: finalResult
    };
  }
});

// Client-side streaming
const stream = await mcpClient.callToolStream('research_stream', {
  query: 'AI advancements',
  streamUpdates: true
});

for await (const chunk of stream) {
  if (chunk.type === 'update') {
    console.log('Progress update:', chunk.data);
  } else if (chunk.type === 'result') {
    console.log('Final result:', chunk.data);
  }
}
```

### Resource Templates

```typescript
// Dynamic resource templates
mcpServer.registerResourceTemplate({
  pattern: 'mastra://users/{userId}/research/{researchId}',
  name: 'User Research Document',
  description: 'Research document for a specific user and research session',
  content: async (params) => {
    const { userId, researchId } = params;
    return await mastra.getStorage().getUserResearch(userId, researchId);
  }
});

// List resources matching pattern
const userResources = await mcpServer.listResources({
  pattern: 'mastra://users/123/research/*'
});
```

### Batch Operations

```typescript
// Batch tool execution
const batchRequest = {
  operations: [
    {
      tool: 'web_search',
      args: { query: 'quantum computing' }
    },
    {
      tool: 'vector_query',
      args: { query: 'quantum algorithms', topK: 5 }
    },
    {
      tool: 'rerank',
      args: { results: '$web_search.results', query: 'quantum computing' }
    }
  ]
};

const batchResult = await mcpClient.executeBatch(batchRequest);
```

## Integration Examples

### Integrating with Claude Desktop

```typescript
// claude_desktop_config.json
{
  "mcpServers": {
    "mastra-research": {
      "command": "npx",
      "args": ["tsx", "src/mastra/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "file:./deep-research.db",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your-key",
        "EXA_API_KEY": "your-key"
      }
    }
  }
}
```

### Integrating with VS Code

```typescript
// .vscode/settings.json
{
  "mastra.mcp.server": {
    "url": "ws://localhost:3001",
    "apiKey": "${env:MCP_API_KEY}"
  }
}
```

### Integrating with Custom Applications

```typescript
// Custom application integration
class MastraMCPIntegration {
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL,
      apiKey: process.env.MCP_API_KEY
    });
  }

  async initialize() {
    await this.mcpClient.connect();

    // Set up event handlers
    this.mcpClient.on('toolListChanged', this.handleToolListChanged.bind(this));
    this.mcpClient.on('resourceChanged', this.handleResourceChanged.bind(this));
  }

  async performResearch(query: string) {
    // Use web search tool
    const searchResults = await this.mcpClient.callTool('web_search', {
      query,
      limit: 10
    });

    // Use vector query for related content
    const relatedContent = await this.mcpClient.callTool('vector_query', {
      query,
      topK: 5
    });

    // Use reranking for better results
    const rerankedResults = await this.mcpClient.callTool('rerank', {
      query,
      results: searchResults,
      topK: 3
    });

    return {
      searchResults,
      relatedContent,
      rerankedResults
    };
  }

  private handleToolListChanged(tools: any[]) {
    console.log('Available tools updated:', tools.map(t => t.name));
  }

  private handleResourceChanged(change: any) {
    console.log('Resource changed:', change.uri);
  }
}
```

## Best Practices

### Security Best Practices

1. **Always use authentication**: Implement proper authentication mechanisms
2. **Validate inputs**: Thoroughly validate all inputs to prevent injection attacks
3. **Use HTTPS/WSS**: Always use encrypted connections in production
4. **Implement rate limiting**: Protect against abuse with rate limiting
5. **Log security events**: Monitor and log security-related events

### Performance Best Practices

1. **Connection pooling**: Reuse connections when possible
2. **Caching**: Cache frequently accessed resources and tool results
3. **Batch operations**: Use batch operations for multiple related requests
4. **Streaming**: Use streaming for large data transfers
5. **Monitoring**: Monitor performance metrics and set up alerts

### Reliability Best Practices

1. **Error handling**: Implement comprehensive error handling
2. **Retry logic**: Implement retry logic for transient failures
3. **Circuit breakers**: Use circuit breakers to prevent cascade failures
4. **Health checks**: Implement health checks for all components
5. **Graceful degradation**: Design for graceful degradation when components fail

## Troubleshooting

### Common Issues

#### Connection Issues

```typescript
// Diagnosing connection problems
mcpClient.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('Cannot connect to MCP server. Check if server is running.');
  } else if (error.code === 'EPROTO') {
    console.error('Protocol error. Check SSL/TLS configuration.');
  }
});
```

#### Authentication Issues

```typescript
// Debugging authentication problems
mcpServer.on('authenticationFailed', (attempt) => {
  console.error('Authentication failed:', {
    clientId: attempt.clientId,
    reason: attempt.reason,
    ip: attempt.ip
  });
});
```

#### Tool Execution Issues

```typescript
// Monitoring tool execution
mcpServer.on('toolExecution', (execution) => {
  console.log(`Tool ${execution.toolName} executed:`, {
    duration: execution.duration,
    success: execution.success,
    error: execution.error?.message
  });
});
```

### Debugging Tools

```typescript
// Enable debug logging
const mcpServer = new MCPServer({
  logging: {
    level: 'debug',
    format: 'json',
    outputs: [
      { type: 'console' },
      { type: 'file', path: './mcp-server.log' }
    ]
  }
});

// MCP client debugging
const mcpClient = new MCPClient({
  debug: true,
  logger: (level, message, meta) => {
    console.log(`[${level}] ${message}`, meta);
  }
});
```

---

*This comprehensive MCP integration guide provides detailed documentation for implementing and using Model Context Protocol in the Mastra Deep Research System, including setup, configuration, security, and best practices.*