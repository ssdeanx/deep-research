# Mastra Core Framework - Development Context

## Framework Overview
This is the core Mastra framework implementation for the Deep Research Assistant. It provides the foundation for AI agent orchestration, workflow management, tool integration, and memory processing capabilities.

## Core Architecture

### Main Entry Point (`index.ts`)
- **Mastra Instance**: Central orchestration hub managing all components
- **Component Registration**: Agents, workflows, tools, and networks
- **Configuration Management**: Environment and runtime configuration
- **Storage Integration**: LibSQL database connections and vector indexes

### Key Components

#### 🤖 Agents (`agents/`)
Specialized AI agents with specific research and analysis capabilities:
- **Research Agent**: Multi-phase web research and content evaluation
- **Report Agent**: Structured report generation from research data
- **Evaluation Agent**: Content quality and relevance assessment
- **Learning Extraction Agent**: Key insights and follow-up questions
- **Web Summarization Agent**: Content condensation and synthesis
- **RAG Agent**: Vector search and retrieval-augmented generation

#### 🔄 Workflows (`workflows/`)
Orchestrated sequences of operations:
- **Comprehensive Research Workflow**: End-to-end research pipeline
- **Generate Report Workflow**: Automated report creation
- **Research Workflow**: Basic research orchestration

#### 🛠️ Tools (`tools/`)
Specialized utilities for research tasks:
- **Web Search Tool**: Intelligent web content discovery
- **Vector Query Tool**: Semantic search over embedded content
- **Chunker Tool**: Document segmentation for RAG
- **Rerank Tool**: Result relevance optimization
- **Evaluation Tool**: Content quality assessment
- **Learning Extraction Tool**: Insight mining

#### 🌐 Networks (`networks/`)
Multi-agent collaboration systems:
- **Complex Research Network**: Advanced multi-agent coordination

#### ⚙️ Configuration (`config/`)
System configuration and setup:
- **Google AI Provider**: Gemini model configuration
- **LibSQL Storage**: Database connection and vector setup
- **Memory Processors**: Context optimization configuration
- **Logger**: Structured logging setup

#### 🔌 MCP Integration (`mcp/`)
Model Context Protocol implementation:
- **Server Implementation**: MCP server for tool integration
- **Tool Registration**: Dynamic tool discovery and management
- **Real-time Communication**: WebSocket-based interactions

## Development Guidelines

### Code Patterns
- **Agent Pattern**: Modular, specialized AI assistants
- **Workflow Pattern**: Declarative operation orchestration
- **Tool Pattern**: Reusable, composable utilities
- **Memory Pattern**: Hierarchical context management
- **MCP Pattern**: Standardized tool integration

### TypeScript Standards
- **Strict Mode**: No implicit any, full type coverage
- **Interface Segregation**: Small, focused interfaces
- **Generic Constraints**: Type-safe generic implementations
- **Zod Validation**: Runtime type validation for all inputs

### Error Handling
- **Structured Errors**: Custom error classes with context
- **Graceful Degradation**: Fallback mechanisms for failures
- **Logging Integration**: Comprehensive error tracking
- **Recovery Patterns**: Automatic retry and circuit breaker logic

### Performance Optimization
- **Token Management**: Efficient context window usage
- **Caching Strategy**: Multi-level caching (memory, database, API)
- **Batch Processing**: Optimized bulk operations
- **Resource Monitoring**: Performance tracking and alerting

## Component Interactions

### Agent ↔ Workflow Communication
```typescript
// Workflow orchestrates agent execution
const workflow = mastra.getWorkflow('comprehensive-research-workflow');
const run = await workflow.createRunAsync();

// Agent handles specific research tasks
const researchAgent = mastra.getAgent('researchAgent');
const result = await researchAgent.generate(messages);
```

### Tool Integration Pattern
```typescript
// Tools provide specialized capabilities
const webSearchTool = mastra.getTool('webSearch');
const searchResults = await webSearchTool.execute({
  context: { query: 'research topic', limit: 10 }
});
```

### Memory Processing Pipeline
```typescript
// Memory processors optimize context
const memory = createMemoryWithProcessors({
  storage,
  processors: [
    new TokenLimiterProcessor({ maxTokens: 4000 }),
    new PersonalizationProcessor({ userId: 'user123' }),
    new ErrorCorrectionProcessor({ enableChecksum: true })
  ]
});
```

## Configuration Management

### Environment Variables
```env
# Core Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
DATABASE_URL=file:./mastra.db

# Optional Services
EXA_API_KEY=your_exa_key
LOG_LEVEL=info
```

### Runtime Configuration
```typescript
// Dynamic configuration loading
const config = await loadConfiguration();
const mastra = new Mastra({
  agents: config.agents,
  workflows: config.workflows,
  tools: config.tools,
  storage: config.storage
});
```

## Testing Strategy

### Unit Testing
- **Agent Testing**: Individual agent capability verification
- **Tool Testing**: Tool functionality and error handling
- **Workflow Testing**: End-to-end workflow execution
- **Memory Testing**: Context processing and optimization

### Integration Testing
- **Component Integration**: Agent-workflow-tool interactions
- **Database Integration**: Storage and retrieval operations
- **External API Integration**: Google AI, web services
- **MCP Integration**: Tool discovery and execution

### Performance Testing
- **Load Testing**: Concurrent agent execution
- **Memory Testing**: Context processing efficiency
- **API Rate Limiting**: External service interaction limits
- **Caching Effectiveness**: Cache hit rates and performance

## Deployment Considerations

### Environment Setup
- **Node.js 20.9+**: Required runtime version
- **LibSQL**: Database setup and migration
- **Vector Indexes**: Index creation and optimization
- **MCP Server**: Tool registration and configuration

### Monitoring & Observability
- **OpenTelemetry Tracing**: Distributed tracing setup
- **Performance Metrics**: Response time and resource monitoring
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: System status monitoring

### Scaling Considerations
- **Horizontal Scaling**: Multi-instance deployment
- **Database Scaling**: Read/write separation
- **Caching Layer**: Redis or similar for session storage
- **Load Balancing**: Request distribution across instances

## Security Considerations

### API Key Management
- **Environment Variables**: Secure key storage
- **Key Rotation**: Automated key refresh mechanisms
- **Access Control**: API key usage monitoring
- **Audit Logging**: Key usage tracking

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **Output Filtering**: Sensitive data removal from responses
- **Encryption**: Data encryption at rest and in transit
- **Privacy Compliance**: GDPR and privacy regulation compliance

### Tool Security
- **Sandbox Execution**: Isolated tool execution environments
- **Permission Management**: Granular tool access control
- **Rate Limiting**: API abuse prevention
- **Audit Trails**: Tool usage logging and monitoring

## Development Workflow

### Component Development
1. **Design**: Define component interface and capabilities
2. **Implementation**: Write TypeScript code with full typing
3. **Testing**: Unit and integration tests
4. **Documentation**: Comprehensive API documentation
5. **Integration**: Add to main Mastra instance

### Workflow Development
1. **Requirements**: Define workflow requirements and steps
2. **Design**: Create workflow diagram and data flow
3. **Implementation**: Write workflow definition
4. **Testing**: End-to-end workflow testing
5. **Optimization**: Performance tuning and error handling

### Tool Development
1. **Specification**: Define tool interface and capabilities
2. **Implementation**: Write tool logic with error handling
3. **Integration**: Register tool with Mastra framework
4. **Testing**: Tool functionality and edge case testing
5. **Documentation**: Tool usage and configuration docs

## Troubleshooting Guide

### Common Issues
- **Agent Initialization**: Check configuration and API keys
- **Workflow Execution**: Verify step dependencies and data flow
- **Tool Execution**: Check tool permissions and network connectivity
- **Memory Issues**: Monitor token usage and context limits

### Debug Tools
- **Logging**: Structured logging with different verbosity levels
- **Tracing**: OpenTelemetry spans for request tracking
- **Metrics**: Performance and usage metrics
- **Health Checks**: System status and component health

### Performance Optimization
- **Token Management**: Efficient context window usage
- **Caching**: Multi-level caching strategy
- **Batch Processing**: Optimized bulk operations
- **Resource Monitoring**: Performance bottleneck identification

---

## AI Assistant Guidelines for Mastra Development

When working with the Mastra framework:

1. **Understand Component Roles**: Each component (agent, workflow, tool) has specific responsibilities
2. **Follow Established Patterns**: Use existing patterns for consistency and maintainability
3. **Maintain Type Safety**: Full TypeScript typing with Zod validation
4. **Handle Errors Gracefully**: Comprehensive error handling and recovery
5. **Optimize Performance**: Consider token limits, caching, and resource usage
6. **Document Thoroughly**: Clear documentation for all public APIs
7. **Test Extensively**: Robust testing for all components and interactions

## Import References

@/src/mastra/index.ts
@/src/mastra/agents/GEMINI.md
@/src/mastra/tools/GEMINI.md
@/src/mastra/workflows/GEMINI.md
@GEMINI.md