# Specialized Tools - Research Capabilities

## Tools Overview
This directory contains 8+ specialized tools that provide the operational capabilities for the Deep Research Assistant. Each tool serves specific functions in the research pipeline, from web scraping to vector search.

## Tool Architecture

### Base Tool Pattern
All tools follow a consistent architecture:
- **Standardized Interface**: `createTool()` function with `execute()` method
- **Type Safety**: Full TypeScript typing with Zod validation
- **Error Handling**: Comprehensive error recovery and logging
- **Configuration**: Flexible parameter configuration
- **Performance Monitoring**: Built-in metrics and tracing

### Tool Categories

#### 🌐 Web & Content Tools
**Web Search Tool** (`webSearchTool.ts`)
- **Primary Function**: Intelligent web content discovery and extraction using Exa AI
- **Capabilities**:
  - Web search with live crawling
  - Content summarization using webSummarizationAgent
  - Error handling and fallback mechanisms
  - Structured result processing
  - Rate limiting and API key validation
- **Integration**: Exa AI API, webSummarizationAgent
- **Output**: Summarized search results with metadata

**Web Scraper Tool** (`web-scraper-tool.ts`)
- **Primary Function**: Targeted web content extraction
- **Capabilities**:
  - Single URL content extraction
  - HTML parsing and cleaning
  - Content structure preservation
  - Anti-bot detection handling
  - Rate limiting compliance
- **Integration**: Cheerio, Crawlee for content extraction
- **Output**: Clean, structured content data

#### 🔍 Search & Retrieval Tools
**Vector Query Tool** (`vectorQueryTool.ts`)
- **Primary Function**: Semantic search over embedded content
- **Capabilities**:
  - Vector similarity search
  - Multi-index support
  - Query optimization
  - Result ranking and filtering
  - Performance monitoring
- **Integration**: LibSQL vector extensions
- **Output**: Ranked search results with similarity scores

**Rerank Tool** (`rerank-tool.ts`)
- **Primary Function**: Result relevance optimization and ranking
- **Capabilities**:
  - Multi-criteria ranking algorithms
  - Semantic relevance scoring
  - Position-based weighting
  - Custom ranking models
  - Performance optimization
- **Integration**: Custom ranking algorithms
- **Output**: Re-ranked results with improved relevance

#### 📄 Content Processing Tools
**Chunker Tool** (`chunker-tool.ts`)
- **Primary Function**: Document segmentation for RAG applications
- **Capabilities**:
  - Intelligent text segmentation
  - Overlap configuration
  - Metadata preservation
  - Multiple format support
  - Chunk size optimization
- **Integration**: Text processing libraries
- **Output**: Optimized content chunks with metadata

**Data File Manager** (`data-file-manager.ts`)
- **Primary Function**: Research data organization and management
- **Capabilities**:
  - File system operations
  - Data serialization/deserialization
  - Format conversion
  - Storage optimization
  - Access control
- **Integration**: Node.js fs module, file processing libraries
- **Output**: Organized data files with metadata

#### 🤖 Analysis & Evaluation Tools
**Evaluate Result Tool** (`evaluateResultTool.ts`)
- **Primary Function**: Content quality and relevance assessment
- **Capabilities**:
  - Multi-dimensional evaluation using evaluationAgent
  - URL deduplication checking
  - Structured JSON output validation
  - Error handling and logging
  - Automated assessment workflow
- **Integration**: evaluationAgent, PinoLogger
- **Output**: Relevance assessment with reasoning

**Extract Learnings Tool** (`extractLearningsTool.ts`)
- **Primary Function**: Insight mining from research data
- **Capabilities**:
  - Pattern recognition
  - Key learning identification
  - Content categorization
  - Insight synthesis
  - Follow-up question generation
- **Integration**: NLP processing, pattern matching algorithms
- **Output**: Structured learning insights and questions

## Tool Development Guidelines

### Tool Creation Pattern
```typescript
// 1. Import required dependencies
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Exa from 'exa-js';
import { PinoLogger } from "@mastra/loggers";

// 2. Initialize dependencies
const logger = new PinoLogger({ level: 'info' });
const exa = new Exa(process.env.EXA_API_KEY);

// 3. Create tool using actual pattern from webSearchTool.ts
export const webSearchTool = createTool({
  id: 'web-search',
  description: 'Search the web for information on a specific query and return summarized content',
  inputSchema: z.object({
    query: z.string().describe('The search query to run'),
  }),
  execute: async ({ context, mastra }) => {
    logger.info('Executing web search tool');
    const { query } = context;

    try {
      if (!process.env.EXA_API_KEY) {
        logger.error('Error: EXA_API_KEY not found in environment variables');
        return { results: [], error: 'Missing API key' };
      }

      logger.info(`Searching web for: "${query}"`);
      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 2,
      });

      if (!results || results.length === 0) {
        logger.info('No search results found');
        return { results: [], error: 'No results found' };
      }

      logger.info(`Found ${results.length} search results, summarizing content...`);

      // Get the summarization agent
      const summaryAgent = mastra!.getAgent('webSummarizationAgent');

      // Process each result with summarization
      const processedResults = [];
      for (const result of results) {
        try {
          // Skip if content is too short or missing
          if (!result.text || result.text.length < 100) {
            processedResults.push({
              title: result.title || '',
              url: result.url,
              content: result.text || 'No content available',
            });
            continue;
          }

          // Summarize the content
          const summaryResponse = await summaryAgent.generate([
            {
              role: 'user',
              content: `Please summarize the following web content for research query: "${query}"

Title: ${result.title || 'No title'}
URL: ${result.url}
Content: ${result.text.substring(0, 8000)}...

Provide a concise summary that captures the key information relevant to the research query.`,
            },
          ]);

          processedResults.push({
            title: result.title || '',
            url: result.url,
            content: summaryResponse.text,
          });

          logger.info(`Summarized content for: ${result.title || result.url}`);
        } catch (summaryError) {
          logger.error('Error summarizing content', {
            error: summaryError instanceof Error ? summaryError.message : String(summaryError),
            stack: summaryError instanceof Error ? summaryError.stack : undefined
          });
          // Fallback to truncated original content
          processedResults.push({
            title: result.title || '',
            url: result.url,
            content: result.text ? result.text.substring(0, 500) + '...' : 'Content unavailable',
          });
        }
      }

      return {
        results: processedResults,
      };
    } catch (error) {
      logger.error('Error searching the web', { error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error details:', { error: errorMessage });
      return {
        results: [],
        error: errorMessage,
      };
    }
  },
});
```

### Tool Configuration Pattern
```typescript
// Tool configuration with validation
const toolConfig = {
  id: 'custom-tool',
  description: 'Custom tool for specific operations',
  inputSchema: z.object({
    query: z.string().describe('The search query to run'),
  }),
  execute: async ({ context, mastra }) => {
    // Implementation based on actual webSearchTool.ts pattern
  }
};
```

### Error Handling Pattern
```typescript
// Error handling pattern from actual implementation
execute: async ({ context, mastra }) => {
  try {
    // Primary operation
    if (!process.env.EXA_API_KEY) {
      logger.error('Error: EXA_API_KEY not found in environment variables');
      return { results: [], error: 'Missing API key' };
    }

    const result = await performOperation(context);
    return { results: result };
  } catch (error) {
    logger.error('Error in tool execution', { error });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { results: [], error: errorMessage };
  }
}
```

## Tool Integration Strategies

### Agent Tool Usage
```typescript
// Tool usage in agents - actual pattern from researchAgent.ts
export const researchAgent = new Agent({
  name: 'Research Agent',
  instructions: `You are an expert research agent...`,
  tools: {
    webSearchTool,
    evaluateResultTool,
    extractLearningsTool,
  },
  // Other configuration
});
```

### Workflow Tool Integration
```typescript
// Tool integration in workflows - actual pattern from comprehensiveResearchWorkflow.ts
const conductWebResearchStep = createStep({
  id: 'conduct-web-research',
  execute: async ({ inputData }) => {
    const result = await researchAgent.generate([
      {
        role: 'user',
        content: `Research the following topic thoroughly...`,
      },
    ]);
    return result.object;
  },
});
```

### MCP Tool Integration
```typescript
// MCP server tool registration
const mcpServer = new MCPServer({
  tools: [
    {
      name: 'custom-research-tool',
      description: 'Custom research capabilities',
      handler: async (params) => {
        const tool = mastra.getTool('customTool');
        return await tool.execute({ context: params });
      }
    }
  ]
});
```

## Quality Assurance

### Tool Testing Strategy
- **Unit Tests**: Individual tool functionality verification
- **Integration Tests**: Tool-agent-workflow interactions
- **Performance Tests**: Response time and resource usage
- **Reliability Tests**: Error handling and recovery
- **Security Tests**: Input validation and access control

### Testing Patterns
```typescript
describe('WebSearchTool', () => {
  it('should return relevant search results', async () => {
    const tool = new WebSearchTool();
    const result = await tool.execute({
      context: { query: 'test query' }
    });

    expect(result.success).toBe(true);
    expect(result.data.results).toBeDefined();
    expect(result.data.results.length).toBeGreaterThan(0);
  });

  it('should handle network errors gracefully', async () => {
    // Mock network failure
    const tool = new WebSearchTool();
    const result = await tool.execute({
      context: { query: 'test query' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Performance Optimization

### Tool Efficiency
- **Caching Strategy**: Response caching for repeated queries
- **Batch Processing**: Optimized bulk operations
- **Connection Pooling**: Efficient resource management
- **Rate Limiting**: API quota management
- **Async Processing**: Non-blocking operations

### Resource Management
```typescript
// Resource management pattern from actual implementation
class OptimizedTool extends createTool({
  execute: async ({ context, mastra }) => {
    // Check for required dependencies
    if (!process.env.EXA_API_KEY) {
      return { results: [], error: 'Missing API key' };
    }

    // Execute with proper error handling
    const result = await performOperation(context);
    return result;
  }
})
```

## Security Considerations

### Tool Security
- **Input Validation**: Comprehensive parameter sanitization
- **Output Filtering**: Sensitive information removal
- **Access Control**: Tool permission management
- **Audit Logging**: Tool usage tracking
- **Rate Limiting**: Abuse prevention

### Data Protection
```typescript
// Security pattern from actual implementation
execute: async ({ context, mastra }) => {
  // Validate input
  if (!context.query) {
    return { results: [], error: 'Missing query parameter' };
  }

  // Check API key
  if (!process.env.EXA_API_KEY) {
    return { results: [], error: 'Missing API key' };
  }

  // Execute with security context
  const result = await performSecureOperation(context);
  return result;
}
```

## Monitoring & Observability

### Tool Metrics
- **Execution Time**: Operation performance tracking
- **Success Rate**: Tool reliability monitoring
- **Error Patterns**: Failure analysis and trends
- **Resource Usage**: Memory and CPU consumption
- **Usage Patterns**: Tool utilization analytics

### Tracing Integration
```typescript
// Tracing pattern from actual implementation
async execute(context: ToolContext): Promise<ToolResult> {
  logger.info('Executing tool', { context });

  try {
    const result = await performOperation(context);
    logger.info('Tool execution completed successfully');
    return result;
  } catch (error) {
    logger.error('Error in tool execution', { error });
    return { results: [], error: error.message };
  }
}
```

## Development Workflow

### Tool Development Process
1. **Requirements Analysis**: Define tool capabilities and interfaces
2. **Design Phase**: Create tool architecture and data structures
3. **Implementation**: Write tool logic with full error handling
4. **Integration**: Connect external services and APIs
5. **Testing**: Comprehensive unit and integration testing
6. **Documentation**: Complete API and usage documentation
7. **Deployment**: Register tool with Mastra framework

### Tool Maintenance
1. **Performance Monitoring**: Track response times and reliability
2. **User Feedback**: Incorporate usage suggestions and corrections
3. **API Updates**: Maintain compatibility with external services
4. **Security Updates**: Regular security review and patching
5. **Feature Enhancement**: Add new capabilities based on needs

## AI Assistant Guidelines for Tool Development

When working with tools:

1. **Understand Tool Purpose**: Each tool has specific responsibilities
2. **Maintain Consistency**: Follow established interface patterns
3. **Ensure Type Safety**: Full TypeScript typing with Zod validation
4. **Handle Errors Gracefully**: Comprehensive error handling and recovery
5. **Optimize Performance**: Efficient resource usage and response times
6. **Document Thoroughly**: Clear documentation for all tool capabilities
7. **Test Extensively**: Robust testing for all tool operations
8. **Monitor Usage**: Track performance and usage patterns

## Import References

