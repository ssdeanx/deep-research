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

**Purpose**: Enhanced web scraping tool with marked.js integration for markdown output and comprehensive file saving capabilities.

#### Core Features

##### marked.js Integration
The web scraper now includes full marked.js integration for converting HTML content to clean, structured markdown:

```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/research-paper",
    extractType: "markdown",
    markdownOptions: {
      headerIds: true,
      mangle: false,
      breaks: true
    }
  }
});
```

**Markdown Conversion Features:**
- HTML to Markdown conversion with proper formatting
- Header ID generation for navigation
- Table conversion and preservation
- Code block syntax highlighting
- Link and image handling
- List formatting preservation

##### Enhanced File Saving
Automatic file saving with multiple format options:

```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/article",
    extractType: "full",
    saveToFile: {
      path: "./scraped-content/article.md",
      format: "markdown",
      createDirectories: true,
      backup: true
    }
  }
});
```

**File Saving Options:**
- **Format Support**: Markdown, HTML, JSON, PDF
- **Directory Creation**: Automatic directory structure creation
- **Backup System**: Automatic backup of existing files
- **Metadata Preservation**: Save extraction metadata alongside content
- **Batch Operations**: Save multiple pages to organized directories

#### Extraction Modes

##### 1. Full Content Extraction
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    extractType: "full",
    includeMetadata: true
  }
});
```

##### 2. Markdown Extraction
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    extractType: "markdown",
    markdownOptions: {
      gfm: true,           // GitHub Flavored Markdown
      tables: true,        // Table support
      breaks: true,        // Line breaks
      pedantic: false,     // Strict markdown
      smartLists: true,    // Smart list handling
      smartypants: true    // Smart punctuation
    }
  }
});
```

##### 3. Structured Data Extraction
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    extractType: "structured",
    selectors: {
      title: "h1",
      content: ".main-content",
      author: ".author",
      date: ".publish-date"
    }
  }
});
```

##### 4. Summary Extraction
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    extractType: "summary",
    maxLength: 500,
    includeKeyPoints: true
  }
});
```

#### Advanced Configuration

##### Custom marked.js Options
```typescript
const customOptions = {
  // Renderer options
  renderer: {
    heading: (text, level) => {
      return `<h${level} id="${text.toLowerCase().replace(/[^\w]+/g, '-')}">${text}</h${level}>`;
    }
  },

  // Tokenizer options
  tokenizer: {
    url: false  // Disable URL autolinking
  },

  // Walk tokens
  walkTokens: (token) => {
    if (token.type === 'link') {
      token.href = token.href.replace('http://', 'https://');
    }
  }
};
```

##### File Organization
```typescript
const fileConfig = {
  saveToFile: {
    path: "./content/{domain}/{date}/{title}.md",
    format: "markdown",
    metadataFile: true,     // Save metadata separately
    indexFile: true,        // Create index file
    organizeByDate: true,   // Organize by date folders
    preserveStructure: true // Preserve site structure
  }
};
```

#### Error Handling and Resilience

##### Rate Limiting
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    rateLimit: {
      requestsPerMinute: 30,
      delayBetweenRequests: 2000
    }
  }
});
```

##### Retry Logic
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    retryOptions: {
      maxRetries: 3,
      retryDelay: 1000,
      retryOn: [500, 502, 503, 504]
    }
  }
});
```

##### Content Validation
```typescript
const result = await webScraperTool.execute({
  context: {
    url: "https://example.com/page",
    validation: {
      minContentLength: 100,
      requireTitle: true,
      checkForPaywall: true
    }
  }
});
```

#### Integration Examples

##### Research Data Collection
```typescript
// Collect research papers and save as markdown
const papers = [
  "https://arxiv.org/abs/1234.5678",
  "https://example.com/research-paper"
];

for (const url of papers) {
  const result = await webScraperTool.execute({
    context: {
      url,
      extractType: "markdown",
      saveToFile: {
        path: `./research/${new Date().toISOString().split('T')[0]}/${url.split('/').pop()}.md`,
        format: "markdown"
      }
    }
  });
}
```

##### Documentation Scraping
```typescript
// Scrape API documentation
const result = await webScraperTool.execute({
  context: {
    url: "https://api.example.com/docs",
    extractType: "structured",
    selectors: {
      endpoints: ".endpoint",
      parameters: ".parameter",
      examples: ".example"
    },
    saveToFile: {
      path: "./api-docs/example-api.json",
      format: "json"
    }
  }
});
```

#### Performance Optimizations

- **Caching**: Automatic caching of scraped content
- **Parallel Processing**: Concurrent scraping of multiple URLs
- **Content Filtering**: Remove unwanted elements (ads, navigation)
- **Compression**: Automatic compression for storage
- **Incremental Updates**: Only scrape changed content

#### Security Features

- **Request Headers**: Custom user agent and headers
- **Cookie Management**: Session handling for authenticated sites
- **SSL/TLS**: Secure connection handling
- **Content Sanitization**: Remove malicious scripts and content</search>

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

**Purpose**: Comprehensive data file management system with 8 specialized tools for file operations, data processing, and system management.

#### Available Tools

##### 1. `readDataFileTool`
Reads data from files in various formats.

```typescript
const result = await readDataFileTool.execute({
  context: {
    filePath: "./data/research-data.json",
    format: "json",
    encoding: "utf8"
  }
});
```

**Features:**
- Support for JSON, CSV, XML, YAML, and text formats
- Automatic format detection
- Encoding specification
- Error handling for missing files

##### 2. `writeDataFileTool`
Writes data to files with format conversion.

```typescript
const result = await writeDataFileTool.execute({
  context: {
    filePath: "./data/processed-data.json",
    data: processedData,
    format: "json",
    createDirectories: true,
    backup: true
  }
});
```

**Features:**
- Automatic directory creation
- Backup creation before overwrite
- Format conversion (JSON ↔ CSV ↔ XML)
- Data validation before writing

##### 3. `listDataDirTool`
Lists files and directories with filtering options.

```typescript
const result = await listDataDirTool.execute({
  context: {
    directory: "./data",
    recursive: true,
    filter: "*.json",
    includeStats: true
  }
});
```

**Features:**
- Recursive directory traversal
- Pattern-based filtering
- File statistics (size, modified date)
- Directory structure analysis

##### 4. `searchDataFilesTool`
Searches for content within data files.

```typescript
const result = await searchDataFilesTool.execute({
  context: {
    directory: "./data",
    query: "machine learning",
    fileTypes: ["json", "csv", "txt"],
    caseSensitive: false,
    maxResults: 50
  }
});
```

**Features:**
- Full-text search across multiple file types
- Regular expression support
- Case-sensitive/insensitive search
- Result ranking and scoring

##### 5. `getDataFileInfoTool`
Retrieves detailed file information and metadata.

```typescript
const result = await getDataFileInfoTool.execute({
  context: {
    filePath: "./data/research-data.json",
    includeContent: false,
    calculateHash: true
  }
});
```

**Features:**
- File size, permissions, timestamps
- Content type detection
- MD5/SHA256 hash calculation
- Encoding detection

##### 6. `copyDataFileTool`
Copies files with optional transformation.

```typescript
const result = await copyDataFileTool.execute({
  context: {
    sourcePath: "./data/source.json",
    destinationPath: "./backup/source-copy.json",
    transform: "compress",
    preserveMetadata: true
  }
});
```

**Features:**
- Data transformation during copy
- Metadata preservation
- Compression/decompression
- Progress tracking for large files

##### 7. `moveDataFileTool`
Moves files between locations.

```typescript
const result = await moveDataFileTool.execute({
  context: {
    sourcePath: "./data/temp-file.json",
    destinationPath: "./archive/temp-file.json",
    createBackup: true,
    updateReferences: true
  }
});
```

**Features:**
- Cross-filesystem moves
- Automatic backup creation
- Reference updating in related files
- Transaction-like rollback on failure

##### 8. `archiveDataFilesTool`
Archives multiple files with compression.

```typescript
const result = await archiveDataFilesTool.execute({
  context: {
    files: ["./data/file1.json", "./data/file2.csv"],
    archivePath: "./archives/data-backup.zip",
    compression: "gzip",
    includeMetadata: true
  }
});
```

**Features:**
- Multiple compression formats (ZIP, TAR, GZIP)
- Incremental archiving
- Metadata preservation
- Archive integrity verification

#### Common Features Across All Tools
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Logging**: Structured logging for all operations
- **Validation**: Input validation and data integrity checks
- **Performance**: Optimized for large files and bulk operations
- **Security**: Safe file operations with permission checks
- **Monitoring**: Operation metrics and performance tracking</search>

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

## GitHub Tools

The Mastra Deep Research System provides comprehensive GitHub integration through 14 specialized tool modules, enabling seamless interaction with GitHub's REST API for repository management, issue tracking, code collaboration, and project automation.

### GitHub Tools Overview

The GitHub tools suite leverages **Octokit** for robust GitHub API integration, providing type-safe operations with **Zod validation** and comprehensive error handling. Each tool follows Mastra's `createTool` pattern, ensuring consistent behavior and reliable execution.

#### Core Architecture

```typescript
// Octokit integration with authentication
import { Octokit } from '@octokit/rest';
export const octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });

// Tool creation pattern with Zod validation
import { createTool } from '@mastra/core';
import { z } from 'zod';

export const exampleTool = createTool({
  id: 'exampleTool',
  description: 'Tool description',
  inputSchema: z.object({
    // Type-safe input validation
    param: z.string()
  }),
  execute: async ({ context }) => {
    // GitHub API operations
    const result = await octokit.api.endpoint(context);
    return result.data;
  }
});
```

#### Authentication & Security

All GitHub tools require proper authentication through environment variables:

```bash
# Required environment variable
GITHUB_API_KEY=your_github_personal_access_token
```

**Token Permissions Required:**
- `repo` - Full control of private repositories
- `public_repo` - Access public repositories
- `issues` - Read/write access to issues
- `pull_requests` - Read/write access to pull requests
- `workflow` - Read/write access to GitHub Actions

#### Type-Safe Operations

Each tool uses Zod schemas for input validation and TypeScript types for output, ensuring compile-time safety and runtime validation:

```typescript
// Input schema validation
inputSchema: z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional()
})

// Type-safe execution with validated context
execute: async ({ context }: { context: z.infer<typeof inputSchema> }) => {
  // context is fully typed and validated
}
```

### Issues Module

**Purpose**: Complete GitHub issue lifecycle management including creation, updates, comments, and state management.

#### Available Tools

##### `createIssue`
Creates a new issue in a repository.

```typescript
import { createIssue } from './tools/github/issues';

const result = await createIssue.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    title: "Bug: Authentication fails on mobile",
    body: "Users report login issues on mobile devices\n\n**Steps to reproduce:**\n1. Open app on mobile\n2. Attempt login\n3. Error occurs\n\n**Expected:** Successful login\n**Actual:** Error message displayed"
  }
});

// Returns: GitHub Issue object with number, title, body, state, etc.
```

**Input Schema:**
```typescript
{
  owner: string;        // Repository owner/organization
  repo: string;         // Repository name
  title: string;        // Issue title
  body: string;         // Issue description (supports Markdown)
}
```

**Output Schema:**
```typescript
{
  number: number;       // Issue number
  title: string;        // Issue title
  body: string;         // Issue body
  state: "open" | "closed";
  user: { login: string; id: number; };
  labels: Array<{ name: string; color: string; }>;
  created_at: string;   // ISO 8601 timestamp
  updated_at: string;   // ISO 8601 timestamp
}
```

**Rate Limiting:** 5000 requests/hour for authenticated users
**Error Handling:** Validates repository access and handles duplicate titles

##### `getIssue`
Retrieves detailed information about a specific issue.

```typescript
const issue = await getIssue.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    issue_number: 123
  }
});
```

**Input Schema:**
```typescript
{
  owner: string;
  repo: string;
  issue_number: number;  // GitHub issue number
}
```

##### `updateIssue`
Updates issue properties including title, body, state, labels, and assignees.

```typescript
const updatedIssue = await updateIssue.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    issue_number: 123,
    state: "closed",
    body: "Fixed in version 2.1.0\n\n**Changes:**\n- Updated authentication logic\n- Added mobile-specific handling\n- Improved error messages"
  }
});
```

**Input Schema:**
```typescript
{
  owner: string;
  repo: string;
  issue_number: number;
  title?: string;       // Optional: Update title
  body?: string;        // Optional: Update description
  state?: "open" | "closed";  // Optional: Change state
}
```

##### `listIssues`
Lists issues for a repository with filtering options.

```typescript
const issues = await listIssues.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    state: "open",       // "open", "closed", "all"
    labels: "bug,high-priority",
    sort: "created",     // "created", "updated", "comments"
    direction: "desc"    // "asc", "desc"
  }
});
```

**Input Schema:**
```typescript
{
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  sort?: "created" | "updated" | "comments";
  direction?: "asc" | "desc";
  since?: string;       // ISO 8601 timestamp
}
```

### Pull Requests Module

**Purpose**: Comprehensive pull request management including creation, reviews, comments, merging, and branch operations.

#### Available Tools

##### `createPullRequest`
Creates a new pull request between branches.

```typescript
import { createPullRequest } from './tools/github/pullRequests';

const pr = await createPullRequest.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    title: "Add user authentication system",
    head: "feature/auth-implementation",
    base: "main",
    body: "## Summary\nImplements comprehensive user authentication\n\n## Changes\n- Added JWT token handling\n- Implemented password hashing\n- Created login/logout endpoints\n\n## Testing\n- Unit tests for auth logic\n- Integration tests for API endpoints\n\nCloses #123",
    draft: false
  }
});
```

**Input Schema:**
```typescript
{
  owner: string;
  repo: string;
  title: string;
  head: string;         // Head branch name
  base: string;         // Base branch name
  body?: string;        // PR description (Markdown)
  draft?: boolean;      // Create as draft PR
}
```

##### `getPullRequest`
Retrieves detailed pull request information.

```typescript
const pr = await getPullRequest.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    pull_number: 42
  }
});
```

##### `updatePullRequest`
Updates pull request properties.

```typescript
const updated = await updatePullRequest.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    pull_number: 42,
    title: "feat: Add user authentication system",
    body: "Updated PR description with additional context...",
    state: "open"
  }
});
```

##### `mergePullRequest`
Merges a pull request with specified merge method.

```typescript
const merge = await mergePullRequest.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    pull_number: 42,
    commit_title: "Merge: Add user authentication system",
    commit_message: "Implements JWT-based authentication\n\n- Added login/logout endpoints\n- Implemented password hashing\n- Added session management",
    merge_method: "squash"  // "merge", "squash", "rebase"
  }
});
```

**Input Schema:**
```typescript
{
  owner: string;
  repo: string;
  pull_number: number;
  commit_title?: string;
  commit_message?: string;
  merge_method?: "merge" | "squash" | "rebase";
}
```

##### `listPullRequests`
Lists pull requests for a repository.

```typescript
const prs = await listPullRequests.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    state: "open",       // "open", "closed", "all"
    sort: "created",     // "created", "updated", "popularity", "long-running"
    direction: "desc"
  }
});
```

##### `createPullRequestComment`
Adds a comment to a pull request.

```typescript
const comment = await createPullRequestComment.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    issue_number: 42,    // PR number
    body: "@reviewer This implementation looks good! Just one question about the error handling..."
  }
});
```

##### `updatePullRequestComment`
Updates an existing comment.

```typescript
const updated = await updatePullRequestComment.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    comment_id: 12345,
    body: "Updated comment with additional clarification..."
  }
});
```

##### `deletePullRequestComment`
Deletes a comment from a pull request.

```typescript
await deletePullRequestComment.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    comment_id: 12345
  }
});
```

### Repositories Module

**Purpose**: Complete repository lifecycle management including CRUD operations, branch management, and repository settings.

#### Available Tools

##### `createRepository`
Creates a new repository for the authenticated user.

```typescript
import { createRepository } from './tools/github/repositories';

const repo = await createRepository.execute({
  context: {
    name: "new-research-project",
    description: "Machine learning research on natural language processing",
    private: false,
    auto_init: true,     // Initialize with README
    license_template: "mit"
  }
});
```

**Input Schema:**
```typescript
{
  name: string;                    // Repository name
  description?: string;           // Repository description
  private?: boolean;              // Make repository private
  auto_init?: boolean;            // Initialize with README
  license_template?: string;      // License template (e.g., "mit", "apache-2.0")
}
```

##### `getRepository`
Retrieves repository information.

```typescript
const repo = await getRepository.execute({
  context: {
    owner: "myorg",
    repo: "myrepo"
  }
});
```

##### `updateRepository`
Updates repository settings and information.

```typescript
const updated = await updateRepository.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    description: "Updated project description",
    private: true,
    default_branch: "develop"
  }
});
```

##### `deleteRepository`
Deletes a repository (requires admin access).

```typescript
await deleteRepository.execute({
  context: {
    owner: "myorg",
    repo: "myrepo"
  }
});
```

##### `listRepositories`
Lists repositories for the authenticated user.

```typescript
const repos = await listRepositories.execute({
  context: {
    type: "owner",       // "all", "owner", "public", "private", "member"
    sort: "updated",     // "created", "updated", "pushed", "full_name"
    direction: "desc"
  }
});
```

##### `listBranches`
Lists all branches in a repository.

```typescript
const branches = await listBranches.execute({
  context: {
    owner: "myorg",
    repo: "myrepo"
  }
});
```

##### `createBranch`
Creates a new branch from an existing commit SHA.

```typescript
const branch = await createBranch.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    branch: "feature/new-feature",
    sha: "abc123def456..."  // Commit SHA to branch from
  }
});
```

##### `deleteBranch`
Deletes a branch from the repository.

```typescript
await deleteBranch.execute({
  context: {
    owner: "myorg",
    repo: "myrepo",
    branch: "feature/old-feature"
  }
});
```

### Users Module

**Purpose**: User information retrieval and search functionality.

#### Available Tools

##### `getUser`
Retrieves information about the authenticated user.

```typescript
import { getUser } from './tools/github/users';

const user = await getUser.execute({
  context: {}
});
```

**Output Schema:**
```typescript
{
  login: string;        // Username
  id: number;          // User ID
  name: string;        // Full name
  email: string;       // Public email
  company: string;     // Company/organization
  location: string;    // Location
  bio: string;         // User bio
  public_repos: number; // Public repository count
  followers: number;   // Follower count
  following: number;   // Following count
  created_at: string;  // Account creation date
}
```

##### `searchUsers`
Searches for GitHub users.

```typescript
const users = await searchUsers.execute({
  context: {
    q: "john doe location:seattle",
    sort: "followers",   // "followers", "repositories", "joined"
    order: "desc",       // "asc", "desc"
    per_page: 10
  }
});
```

### Organizations Module

**Purpose**: Organization management and member administration.

#### Available Tools

##### `getOrganization`
Retrieves organization information.

```typescript
import { getOrganization } from './tools/github/organizations';

const org = await getOrganization.execute({
  context: {
    org: "myorg"
  }
});
```

##### `listOrganizationMembers`
Lists organization members with role information.

```typescript
const members = await listOrganizationMembers.execute({
  context: {
    org: "myorg",
    role: "member"      // "all", "admin", "member"
  }
});
```

### Search Module

**Purpose**: Advanced GitHub search across repositories, issues, pull requests, and code.

#### Available Tools

##### `searchRepositories`
Searches repositories with advanced filtering.

```typescript
import { searchRepositories } from './tools/github/search';

const repos = await searchRepositories.execute({
  context: {
    q: "machine learning language:python stars:>100",
    sort: "stars",       // "stars", "forks", "updated"
    order: "desc",
    per_page: 20
  }
});
```

**Advanced Search Examples:**
```typescript
// Search by language and topic
q: "topic:machine-learning language:python"

// Search by size and license
q: "size:1000..5000 license:mit"

// Search by creation date
q: "created:>2023-01-01"

// Search by organization
q: "org:myorg machine learning"
```

##### `searchIssuesAndPullRequests`
Searches issues and pull requests.

```typescript
const results = await searchIssuesAndPullRequests.execute({
  context: {
    q: "bug label:high-priority is:open",
    sort: "created",
    order: "desc"
  }
});
```

**Issue Search Examples:**
```typescript
// Search open bugs
q: "bug is:open"

// Search by label and assignee
q: "label:enhancement assignee:myuser"

// Search by date range
q: "created:2024-01-01..2024-12-31"

// Search in specific repository
q: "repo:myorg/myrepo authentication"
```

##### `searchCode`
Searches code across GitHub repositories.

```typescript
const code = await searchCode.execute({
  context: {
    q: "function authenticateUser",
    language: "javascript",
    repo: "myorg/myrepo",
    path: "src/auth"     // Search in specific path
  }
});
```

**Code Search Examples:**
```typescript
// Search for function definitions
q: "def authenticate"

// Search in specific file types
q: "class User" extension:ts

// Search with path filters
q: "TODO" path:src/controllers

// Search with size limits
q: "password" size:1000..5000
```

### Additional GitHub Tools

#### Gists Module (`gists`)
- **Purpose**: Create and manage GitHub Gists for code snippets and notes
- **Tools**: `createGist`, `getGist`, `updateGist`, `deleteGist`, `listGists`
- **Features**: Public/private gist management, versioning, forking

#### Reactions Module (`reactions`)
- **Purpose**: Add reactions to issues, pull requests, and comments
- **Tools**: `createReaction`, `deleteReaction`, `listReactions`
- **Features**: Standard reactions (+1, -1, laugh, confused, heart, hooray, rocket)

#### Activity Module (`activity`)
- **Purpose**: Monitor repository and user activity
- **Tools**: `listRepositoryEvents`, `listUserEvents`, `listPublicEvents`
- **Features**: Event streaming, activity feeds, notification management

#### Git Data Module (`gitData`)
- **Purpose**: Low-level Git object management
- **Tools**: `getBlob`, `createBlob`, `getTree`, `createTree`, `getCommit`, `createCommit`
- **Features**: Git object manipulation, reference management, diff analysis

#### Checks Module (`checks`)
- **Purpose**: GitHub Checks API integration for CI/CD
- **Tools**: `createCheckRun`, `updateCheckRun`, `listCheckRuns`, `listCheckSuites`
- **Features**: CI status monitoring, automated testing integration

#### Actions Module (`actions`)
- **Purpose**: GitHub Actions workflow management
- **Tools**: `listWorkflows`, `getWorkflow`, `listWorkflowRuns`, `rerunWorkflow`
- **Features**: Workflow execution, artifact management, deployment automation

#### Projects Module (`projects`)
- **Purpose**: GitHub Projects (classic) management
- **Tools**: `listProjects`, `createProject`, `updateProject`, `deleteProject`
- **Features**: Project board management, card organization, issue tracking

#### Teams Module (`teams`)
- **Purpose**: Team creation and permission management
- **Tools**: `listTeams`, `createTeam`, `getTeam`, `updateTeam`, `deleteTeam`
- **Features**: Team membership, repository access control, permission management

## GitHub Tools Integration Examples

### Research Workflow with GitHub Integration

```typescript
import { webSearchTool } from './tools/webSearchTool';
import { createIssue, createPullRequest } from './tools/github';
import { extractLearningsTool } from './tools/extractLearningsTool';

// Complete research workflow with GitHub integration
async function researchWithGitHubIntegration(query: string, repoOwner: string, repoName: string) {
  // 1. Perform web research
  const searchResults = await webSearchTool.execute({
    context: { query },
    mastra: {}
  });

  // 2. Extract learnings
  const learnings = await extractLearningsTool.execute({
    context: {
      content: searchResults.results.map(r => r.content).join('\n'),
      query,
      extractTypes: ['key_points', 'insights']
    }
  });

  // 3. Create GitHub issue for research findings
  const issue = await createIssue.execute({
    context: {
      owner: repoOwner,
      repo: repoName,
      title: `Research: ${query}`,
      body: `## Research Summary\n\n**Query:** ${query}\n\n## Key Findings\n\n${learnings.key_points?.join('\n') || 'No key points extracted'}`
    }
  });

  return { searchResults, learnings, issue };
}
```

### MCP Server Integration

```typescript
import { createMcpServer } from './mcp/server';
import * as githubTools from './tools/github';

// GitHub tools integration with MCP server
async function setupGitHubMcpIntegration() {
  const mcpServer = createMcpServer({
    name: 'github-tools-server',
    version: '1.0.0'
  });

  // Register GitHub tools with MCP
  mcpServer.registerTool('github.createIssue', {
    description: 'Create a new GitHub issue',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['owner', 'repo', 'title', 'body']
    },
    handler: async (params) => {
      return await githubTools.createIssue.execute({ context: params });
    }
  });

  return mcpServer;
}
```

## GitHub Tools Best Practices

### Rate Limiting Strategies

```typescript
// Intelligent rate limit handling
class GitHubRateLimiter {
  private requestCount = 0;
  private resetTime = 0;
  private readonly maxRequestsPerHour = 5000;

  async executeWithRateLimit<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    if (this.requestCount >= this.maxRequestsPerHour) {
      const waitTime = this.resetTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    }

    try {
      this.requestCount++;
      const result = await operation();
      return result;
    } catch (error: any) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        const retryAfter = error.response?.headers?.['retry-after'];
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.executeWithRateLimit(operation, context);
        }
      }
      throw error;
    }
  }
}
```

### Error Handling Patterns

```typescript
// Comprehensive error handling for GitHub operations
class GitHubErrorHandler {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private static isNonRetryableError(error: any): boolean {
    return error.status === 401 || error.status === 403 ||
           error.status === 422 || error.status === 404;
  }

  static getErrorMessage(error: any): string {
    if (error.status) {
      switch (error.status) {
        case 401: return 'Authentication failed. Please check your GitHub token.';
        case 403: return 'Access forbidden. Check token permissions.';
        case 404: return 'Resource not found. Verify repository details.';
        case 422: return 'Validation failed. Check input parameters.';
        default: return `GitHub API error (${error.status}): ${error.message}`;
      }
    }
    return error.message || 'An unexpected error occurred.';
  }
}
```

### Performance Optimization

```typescript
// Caching layer for GitHub API responses
class GitHubCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Cached repository information
class CachedGitHubRepository {
  private cache = new GitHubCache();

  async getRepository(owner: string, repo: string) {
    const cacheKey = `repo:${owner}:${repo}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await getRepository.execute({ context: { owner, repo } });
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

## GitHub Tools Configuration

### Environment Variables

```bash
# GitHub API Configuration
GITHUB_API_KEY=your_github_personal_access_token
GITHUB_API_BASE_URL=https://api.github.com  # Optional: for GitHub Enterprise

# Required Permissions for GitHub Token
# - repo (Full control of private repositories)
# - public_repo (Access public repositories)
# - issues (Read/write access to issues)
# - pull_requests (Read/write access to pull requests)
# - workflow (Read/write access to GitHub Actions)
```

### Tool-Specific Configuration

```typescript
// config/github-tools.ts
export const githubConfig = {
  defaultOwner: 'myorg',
  defaultRepo: 'myrepo',
  rateLimit: {
    requestsPerHour: 5000,
    burstLimit: 100
  },
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000
  }
};
```

### Error Handling

```typescript
// GitHub-specific error handling
class GitHubError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

// Rate limit handling
async function executeWithRateLimitHandling(tool, context) {
  try {
    return await tool.execute({ context });
  } catch (error) {
    if (error.status === 403 && error.message.includes('rate limit')) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const waitTime = (resetTime * 1000) - Date.now();

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return await tool.execute({ context });
      }
    }
    throw error;
  }
}
```

### Best Practices for GitHub Tools

1. **Rate Limit Management**:
   - Monitor API usage and implement backoff strategies
   - Use caching for frequently accessed data
   - Batch operations when possible

2. **Error Handling**:
   - Handle network errors and API failures gracefully
   - Implement retry logic for transient failures
   - Provide meaningful error messages to users

3. **Security**:
   - Use least-privilege access tokens
   - Rotate tokens regularly
   - Never expose tokens in logs or client-side code

4. **Performance**:
   - Use appropriate pagination for large result sets
   - Cache repository and user information
   - Implement efficient search queries

5. **Copilot Integration**:
   - Use detailed issue descriptions for Copilot tasks
   - Leverage PR comments for code analysis requests
   - Monitor Copilot Enterprise subscription requirements

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