# Tools Reference Guide

This comprehensive guide covers all the tools available in the Mastra Deep Research System, including their functionality, configuration, and usage patterns.

## Overview

The system includes a comprehensive suite of tools designed for different aspects of deep research:

```
┌─────────────────────────────────────┐
│         Research Tools              │
│  - Web Search & Scraping            │
│  - Vector Query & Semantic Search   │
│  - Document Chunking & Processing   │
├─────────────────────────────────────┤
│         Analysis Tools              │
│  - Reranking & Relevance Scoring    │
│  - Content Evaluation & Filtering   │
│  - Learning Extraction              │
├─────────────────────────────────────┤
│         Utility Tools               │
│  - Data File Management             │
│  - Graph RAG Operations             │
│  - Weather Information              │
└─────────────────────────────────────┘
```

## Research Tools

### Web Search Tool (`webSearchTool`)

**Purpose**: Search the web for information and return summarized content using Exa API.

```typescript
import { webSearchTool } from './tools/webSearchTool';

const result = await webSearchTool.execute({
  context: {
    query: "quantum computing advancements 2024"
  },
  mastra
});
```

**Features**:
- Real-time web search with Exa API
- Automatic content summarization using web summarization agent
- Error handling and fallback mechanisms
- Configurable result limits

**Configuration**:
```typescript
// Environment variables
EXA_API_KEY=your_exa_api_key
```

**Input Schema**:
```typescript
{
  query: string; // The search query to run
}
```

**Output Schema**:
```typescript
{
  results: Array<{
    title: string;
    url: string;
    content: string; // Summarized content
  }>;
  error?: string; // Error message if search fails
}
```

### Web Scraper Tool (`web-scraper-tool`)

**Purpose**: Extract and process content from specific web pages.

```typescript
import { webScraperTool } from './tools/web-scraper-tool';

const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/research-paper",
    extractType: "full"
  }
});
```

**Features**:
- Multiple extraction modes (full, summary, metadata)
- Content cleaning and formatting
- Structured data extraction
- Rate limiting and error handling

### Vector Query Tools

#### Basic Vector Query Tool (`vectorQueryTool`)

**Purpose**: Search for semantically similar content in vector stores.

```typescript
import { vectorQueryTool } from './tools/vectorQueryTool';

const result = await vectorQueryTool.execute({
  context: {
    query: "machine learning algorithms",
    topK: 5,
    minScore: 0.7
  },
  runtimeContext
});
```

**Features**:
- Semantic search using embeddings
- Configurable similarity thresholds
- Metadata filtering support
- Thread-based conversation search
- Runtime context integration

**Input Schema**:
```typescript
{
  query: string;           // Search query
  threadId?: string;       // Optional thread ID for conversation search
  topK?: number;          // Number of results (default: 5)
  minScore?: number;      // Minimum similarity score (default: 0.0)
  before?: number;        // Context messages before match (default: 2)
  after?: number;         // Context messages after match (default: 1)
  includeMetadata?: boolean; // Include metadata in results (default: true)
  enableFilter?: boolean;    // Enable metadata filtering (default: false)
  filter?: Record<string, any>; // MongoDB-style filter query
}
```

**Output Schema**:
```typescript
{
  relevantContext: string;     // Combined text from relevant chunks
  results: Array<{
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
    threadId?: string;
  }>;
  totalResults: number;
  processingTime: number;
  queryEmbedding?: number[];
}
```

#### Enhanced Vector Query Tool (`enhancedVectorQueryTool`)

**Purpose**: Advanced vector search with agent memory integration.

**Features**:
- All basic vector query features
- Agent memory integration
- Personalized search based on user context
- Quality threshold filtering
- Comprehensive logging and monitoring

#### Hybrid Vector Search Tool (`hybridVectorSearchTool`)

**Purpose**: Combine semantic and metadata filtering for precise results.

```typescript
const result = await hybridVectorSearchTool.execute({
  input: {
    query: "neural networks",
    metadataQuery: { category: "machine-learning" },
    semanticWeight: 0.7,
    metadataWeight: 0.3,
    topK: 10,
    finalK: 3
  },
  runtimeContext
});
```

**Features**:
- Dual scoring system (semantic + metadata)
- Configurable weights for different scoring components
- Advanced filtering capabilities
- Result reranking based on combined scores

**Input Schema**:
```typescript
{
  query: string;
  metadataQuery?: Record<string, any>;
  semanticWeight?: number;  // 0-1 (default: 0.7)
  metadataWeight?: number;  // 0-1 (default: 0.3)
  topK?: number;           // Initial results to retrieve (default: 10)
  finalK?: number;         // Final results after reranking (default: 3)
  // ... plus all basic vector query parameters
}
```

**Output Schema**:
```typescript
{
  relevantContext: string;
  results: Array<VectorResult>;
  totalResults: number;
  processingTime: number;
  hybridScores: Array<{
    semanticScore: number;
    metadataScore: number;
    combinedScore: number;
  }>;
}
```

## Document Processing Tools

### Document Chunker Tool (`chunkerTool`)

**Purpose**: Advanced document chunking supporting multiple formats and strategies.

```typescript
import { chunkerTool } from './tools/chunker-tool';

const result = await chunkerTool.execute({
  context: {
    document: {
      content: "# Research Paper\n\nThis is a comprehensive study...",
      type: "markdown",
      title: "Advanced AI Research",
      source: "https://example.com/paper"
    },
    chunkParams: {
      strategy: "recursive",
      size: 512,
      overlap: 50
    },
    extractParams: {
      title: true,
      summary: { summaries: ["self"] },
      keywords: { keywords: 5 }
    },
    vectorOptions: {
      createEmbeddings: true,
      upsertToVector: true,
      indexName: "research_documents"
    }
  },
  runtimeContext
});
```

**Features**:
- Multiple document formats (text, HTML, Markdown, JSON, LaTeX, CSV, XML)
- Five chunking strategies (recursive, sentence, paragraph, fixed, semantic)
- Metadata extraction (titles, summaries, keywords, questions)
- Vector store integration with automatic embedding generation
- Runtime context support for dynamic configuration

**Supported Document Types**:
- **Text**: Plain text documents
- **HTML**: Web pages and HTML content
- **Markdown**: Markdown documents with structure preservation
- **JSON**: Structured data documents
- **LaTeX**: Academic papers and mathematical content
- **CSV**: Tabular data with header processing
- **XML**: Structured markup documents

**Chunking Strategies**:

1. **Recursive**: Hierarchical chunking with size limits
2. **Sentence**: Split at sentence boundaries
3. **Paragraph**: Split at paragraph boundaries
4. **Fixed**: Fixed-size chunks with overlap
5. **Semantic**: Topic-based chunking using content analysis

**Input Schema**:
```typescript
{
  document: {
    content: string;
    type: "text" | "html" | "markdown" | "json" | "latex" | "csv" | "xml";
    title?: string;
    source?: string;
    metadata?: Record<string, any>;
  };
  chunkParams?: {
    strategy?: "recursive" | "sentence" | "paragraph" | "fixed" | "semantic";
    size?: number;
    overlap?: number;
    separator?: string;
    preserveStructure?: boolean;
    minChunkSize?: number;
    maxChunkSize?: number;
  };
  outputFormat?: "simple" | "detailed" | "embeddings";
  includeStats?: boolean;
  vectorOptions?: {
    createEmbeddings?: boolean;
    upsertToVector?: boolean;
    indexName?: string;
    createIndex?: boolean;
  };
  extractParams?: {
    title?: boolean | object;
    summary?: boolean | object;
    keywords?: boolean | object;
    questions?: boolean | object;
  };
}
```

**Output Schema**:
```typescript
{
  chunks: Array<{
    id: string;
    content: string;
    index: number;
    size: number;
    metadata: Record<string, any>;
    source?: string;
    tokens?: number;
    embedding?: number[];
    vectorId?: string;
  }>;
  stats: {
    totalChunks: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    strategy: string;
    processingTime: number;
    overlap: number;
    contentCoverage: number;
  };
  originalLength: number;
  totalProcessed: number;
  vectorStats?: {
    embeddingsCreated: number;
    vectorsUpserted: number;
    indexName?: string;
    embeddingDimension?: number;
    vectorProcessingTime?: number;
  };
}
```

## Analysis Tools

### Rerank Tool (`rerankTool`)

**Purpose**: Rerank search results using advanced relevance scoring.

```typescript
import { rerankTool } from './tools/rerank-tool';

const result = await rerankTool.execute({
  input: {
    query: "machine learning optimization",
    topK: 10,
    finalK: 3,
    semanticWeight: 0.6,
    vectorWeight: 0.3,
    positionWeight: 0.1
  },
  runtimeContext
});
```

**Features**:
- Multi-dimensional relevance scoring
- Configurable weighting system
- Integration with vector search
- Performance optimization for large result sets

**Scoring Dimensions**:
- **Semantic Similarity**: Content relevance to query
- **Vector Similarity**: Embedding-based similarity
- **Position Bias**: Recency and importance weighting

**Input Schema**:
```typescript
{
  indexName?: string;
  query: string;
  topK?: number;          // Initial results to retrieve (default: 10)
  finalK?: number;        // Final results after reranking (default: 3)
  semanticWeight?: number; // 0-1 (default: 0.6)
  vectorWeight?: number;   // 0-1 (default: 0.3)
  positionWeight?: number; // 0-1 (default: 0.1)
}
```

**Output Schema**:
```typescript
{
  messages: Array<any>;
  uiMessages: Array<any>;
  rerankMetadata: {
    topK: number;
    finalK: number;
    before: number;
    after: number;
    initialResultCount: number;
    rerankingUsed: boolean;
    rerankingDuration: number;
    averageRelevanceScore: number;
    userId?: string;
    sessionId?: string;
  };
}
```

### Evaluation Tools

#### Result Evaluation Tool (`evaluateResultTool`)

**Purpose**: Evaluate search results for relevance and quality.

```typescript
import { evaluateResultTool } from './tools/evaluateResultTool';

const evaluation = await evaluateResultTool.execute({
  context: {
    query: "climate change impacts",
    results: searchResults,
    criteria: ["relevance", "accuracy", "recency"]
  }
});
```

**Features**:
- Multi-criteria evaluation
- Quality scoring algorithms
- Automated filtering based on thresholds
- Detailed evaluation reports

#### Learning Extraction Tool (`extractLearningsTool`)

**Purpose**: Extract key learnings and insights from content.

```typescript
import { extractLearningsTool } from './tools/extractLearningsTool';

const learnings = await extractLearningsTool.execute({
  context: {
    content: researchPaperContent,
    query: "AI ethics",
    extractTypes: ["key_points", "insights", "questions"]
  }
});
```

**Features**:
- Multiple extraction types
- Structured learning capture
- Follow-up question generation
- Source attribution

## Utility Tools

### Data File Manager (`data-file-manager`)

**Purpose**: Manage data files and perform file operations.

```typescript
import { dataFileManager } from './tools/data-file-manager';

const result = await dataFileManager.execute({
  context: {
    operation: "read",
    filePath: "./data/research-data.json",
    format: "json"
  }
});
```

**Features**:
- Multiple file format support
- CRUD operations
- Data validation
- Backup and recovery

### Graph RAG Tool (`graphRAG`)

**Purpose**: Perform graph-based retrieval augmented generation.

```typescript
import { graphRAG } from './tools/graphRAG';

const result = await graphRAG.execute({
  context: {
    query: "relationships between AI companies",
    graphType: "entity_relationship",
    depth: 2
  }
});
```

**Features**:
- Graph-based knowledge representation
- Entity relationship extraction
- Multi-hop reasoning
- Visual graph generation

### Weather Tool (`weather-tool`)

**Purpose**: Retrieve weather information for research contexts.

```typescript
import { weatherTool } from './tools/weather-tool';

const weather = await weatherTool.execute({
  context: {
    location: "New York, NY",
    date: "2024-01-15",
    includeForecast: true
  }
});
```

**Features**:
- Current weather conditions
- Historical weather data
- Weather forecasts
- Climate analysis

## Runtime Context Integration

All tools support runtime context for dynamic configuration:

```typescript
// Example runtime context usage
const runtimeContext = new RuntimeContext();

// Configure user preferences
runtimeContext.set('user-id', 'researcher123');
runtimeContext.set('search-preference', 'hybrid');
runtimeContext.set('quality-threshold', 0.8);
runtimeContext.set('language', 'en');

// Use with tools
const result = await vectorQueryTool.execute({
  context: { query: "quantum physics" },
  runtimeContext
});
```

## Tool Configuration and Environment

### Environment Variables

```bash
# API Keys
EXA_API_KEY=your_exa_api_key
GOOGLE_AI_API_KEY=your_google_ai_key
DATABASE_URL=file:./deep-research.db
DATABASE_AUTH_TOKEN=your_auth_token

# Tool-specific settings
VECTOR_DIMENSION=1536
DEFAULT_CHUNK_SIZE=512
DEFAULT_CHUNK_OVERLAP=50
MAX_PROCESSING_TIME=30000
```

### Configuration Files

```typescript
// config/tools.ts
export const toolConfig = {
  vectorQuery: {
    defaultTopK: 5,
    minScore: 0.0,
    maxResults: 100
  },
  chunker: {
    defaultStrategy: 'recursive',
    defaultSize: 512,
    defaultOverlap: 50
  },
  rerank: {
    defaultModel: 'gemini-2.5-flash-lite-preview-06-17',
    semanticWeight: 0.6,
    vectorWeight: 0.3,
    positionWeight: 0.1
  }
};
```

## Error Handling and Monitoring

### Error Types

```typescript
class ToolError extends Error {
  constructor(
    message: string,
    public toolId: string,
    public operation: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

class ValidationError extends ToolError {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message, 'validation', 'input_validation', { field, value });
  }
}

class NetworkError extends ToolError {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number
  ) {
    super(message, 'network', 'api_call', { url, statusCode });
  }
}
```

### Monitoring and Metrics

```typescript
// Tool usage metrics
interface ToolMetrics {
  toolId: string;
  operation: string;
  duration: number;
  success: boolean;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  errorType?: string;
}

// Performance monitoring
const toolMetrics = new ToolMetricsCollector();

function withMetrics<T>(
  toolId: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then(result => {
      toolMetrics.record({
        toolId,
        operation,
        duration: Date.now() - startTime,
        success: true
      });
      return result;
    })
    .catch(error => {
      toolMetrics.record({
        toolId,
        operation,
        duration: Date.now() - startTime,
        success: false,
        errorType: error.name
      });
      throw error;
    });
}
```

## Best Practices

### 1. Tool Selection

- Choose tools based on specific research requirements
- Consider performance implications of tool combinations
- Use runtime context for user-specific configurations

### 2. Error Handling

```typescript
// Robust error handling pattern
async function executeToolSafely(tool, input, options = {}) {
  try {
    const result = await tool.execute({
      context: input,
      ...options
    });

    if (result.error) {
      console.warn(`Tool execution warning: ${result.error}`);
      // Handle partial failures
    }

    return result;
  } catch (error) {
    console.error(`Tool execution failed: ${error.message}`);

    // Implement fallback strategies
    if (error instanceof NetworkError) {
      return await retryWithBackoff(tool, input, options);
    }

    throw error;
  }
}
```

### 3. Performance Optimization

- Use appropriate chunk sizes for document processing
- Implement caching for frequently accessed data
- Batch operations when possible
- Monitor tool performance metrics

### 4. Security Considerations

- Validate all input data
- Implement rate limiting
- Use secure API key management
- Log sensitive operations appropriately

## Integration Examples

### Research Workflow Integration

```typescript
// Complete research workflow using multiple tools
async function performDeepResearch(query: string, userId: string) {
  // 1. Web search
  const searchResults = await webSearchTool.execute({
    context: { query },
    mastra
  });

  // 2. Process and chunk content
  const processedContent = [];
  for (const result of searchResults.results) {
    const chunks = await chunkerTool.execute({
      context: {
        document: {
          content: result.content,
          type: 'text',
          source: result.url,
          title: result.title
        },
        vectorOptions: {
          createEmbeddings: true,
          upsertToVector: true
        }
      },
      runtimeContext: new RuntimeContext().set('user-id', userId)
    });
    processedContent.push(...chunks.chunks);
  }

  // 3. Semantic search for related content
  const relatedContent = await vectorQueryTool.execute({
    context: {
      query,
      topK: 5,
      minScore: 0.7
    },
    runtimeContext: new RuntimeContext().set('user-id', userId)
  });

  // 4. Extract learnings
  const learnings = await extractLearningsTool.execute({
    context: {
      content: relatedContent.relevantContext,
      query,
      extractTypes: ['key_points', 'insights']
    }
  });

  return {
    searchResults,
    processedContent,
    relatedContent,
    learnings
  };
}
```

---

*This comprehensive tools reference provides detailed documentation for all tools in the Mastra Deep Research System, including usage examples, configuration options, and best practices.*