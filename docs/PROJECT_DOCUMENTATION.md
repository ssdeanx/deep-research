# Mastra Deep Research System Documentation

## Frontend Architecture

The system includes a modern React frontend that provides an intuitive interface for interacting with the Mastra backend:

### Technology Stack
- **React 19.1+**: Latest React with concurrent features and automatic batching
- **Vite 7.1+**: Lightning-fast build tool with HMR and optimized production builds
- **TypeScript 5.9+**: Full type safety with advanced language features
- **Tailwind CSS v4.1**: CSS-first configuration with OKLCH colors, text shadows, and modern utilities
- **shadcn/ui**: 47 pre-built, accessible UI components with Radix UI primitives
- **React Router v7.8+**: Modern routing with nested routes and data loading

### Frontend Components

#### Core Application Structure
```
src/
├── app/                    # Main application
│   ├── App.tsx            # Main router configuration
│   ├── Layout.tsx         # Navigation and layout
│   ├── main.tsx           # React entry point
│   ├── global.css         # Tailwind CSS with shadcn/ui variables
│   └── pages/             # Page components
│       ├── Home.tsx       # Landing page
│       ├── Research.tsx   # Research interface
│       ├── Agents.tsx     # Agent management
│       └── Workflows.tsx  # Workflow monitoring
├── components/
│   └── ui/                # 47 shadcn/ui components
└── lib/
    ├── mastra.ts          # Mastra client configuration
    └── utils.ts           # Utility functions
```

#### Key Features
- **Responsive Design**: Mobile-first approach with container queries
- **Dark Mode**: Automatic theme switching with CSS custom properties
- **Real-time Updates**: Live workflow status and agent responses
- **Error Boundaries**: Comprehensive error handling and user feedback
- **Loading States**: Skeleton components and progressive loading
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

### Frontend-Backend Integration

#### Mastra Client Configuration
```typescript
// lib/mastra.ts
import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl: import.meta.env.VITE_MASTRA_API_URL || "http://localhost:4111",
});
```

#### API Communication
- **RESTful Endpoints**: Direct API calls for agent and workflow operations
- **Real-time Streaming**: WebSocket connections for live updates
- **Error Handling**: Comprehensive error boundaries and retry logic
- **Caching**: React Query for efficient data fetching and caching
- **Type Safety**: End-to-end TypeScript integration

### UI Component Library

The system uses shadcn/ui, a comprehensive component library built on Radix UI primitives with 47 available components including Button, Card, Dialog, Table, and many more for building modern, accessible user interfaces.

---

## Project Overview

The Mastra Deep Research System is an AI-powered research and analysis platform built using the Mastra framework. It provides comprehensive research capabilities through specialized agents, tools, and workflows that enable thorough investigation of topics with web search integration, content summarization, and structured reporting.

### Key Features

- **Multi-Agent Architecture**: Specialized agents and **vNext Agent Networks** for intelligent orchestration.
- **Web Search Integration**: Real-time web search with content summarization.
- **Vector Storage**: Semantic search and knowledge retrieval using embeddings.
- **Workflow Orchestration**: Automated research and report generation processes, including human-in-the-loop capabilities.
- **Memory Management**: Persistent conversation and research context across agents, workflows, and networks.
- **Document Processing**: Advanced chunking and metadata extraction.
- **Evaluation Capabilities**: Integrated non-LLM based evaluation metrics for quality assurance of agent outputs.

## Architecture Overview

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Workflows     │    │     Agents      │    │     Tools       │
│                 │    │                 │    │                 │
│ • Research      │◄──►│ • Research      │◄──►│ • Web Search    │
│ • Report Gen    │    │ • Report        │    │ • Evaluation    │
│                 │    │ • Evaluation    │    │ • Learning Ext  │
└─────────────────┘    │ • Learning Ext  │    │ • Chunking      │
                       │ • Web Summary   │    │ • Vector Query  │
                       └─────────────────┘    │ • Graph RAG     │
                                              │ • Data Manager  │
                                              └─────────────────┘
                                                     │
                                                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Storage       │    │ Configuration   │    │   Memory        │
│                 │    │                 │    │                 │
│ • LibSQL        │    │ • Google AI     │    │ • Conversation  │
│ • Vector Store  │    │ • Embeddings    │    │ • Research      │
│ • File Storage  │    │ • Safety        │    │ • User Context  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Mastra Instance** (`src/mastra/index.ts`): Central orchestration point
2. **Agents** (`src/mastra/agents/`): Specialized AI assistants
3. **Tools** (`src/mastra/tools/`): Reusable functionality modules
4. **Workflows** (`src/mastra/workflows/`): Automated process definitions
5. **Configuration** (`src/mastra/config/`): Provider and storage setup
6. **Memory** (`src/mastra/memory/`): Context and conversation persistence

## Agents

The system includes seven specialized agents, each with distinct capabilities:

### 1. Research Agent (`researchAgent.ts`)

**Purpose**: Conducts thorough, systematic research using a two-phase approach.

**Key Features**:
- Phase 1: Initial research with 2 specific search queries
- Phase 2: Follow-up research based on extracted learnings
- Prevents infinite loops by limiting follow-up depth
- Structured JSON output with queries, results, and learnings
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Configuration**:
- Model: Gemini 2.5 Flash Lite
- Search Grounding: Enabled
- Dynamic Retrieval: Enabled
- Safety Level: Off (for research flexibility)

**Tools Used**:
- `webSearchTool`: Web content discovery
- `evaluateResultTool`: Relevance assessment
- `extractLearningsTool`: Knowledge extraction

### 2. RAG Agent (`ragAgent.ts`)

**Purpose**: Provides Retrieval-Augmented Generation capabilities for contextual responses.

**Key Features**:
- Semantic search across vectorized knowledge base
- Context-aware response generation
- Integration with LibSQL vector store
- Enhanced accuracy through external knowledge retrieval
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Configuration**:
- Model: Gemini 2.5 Flash Lite
- Vector Search: Enabled
- Embedding Model: Gemini text-embedding-004
- Safety Level: Off

**Tools Used**:
- `vectorQueryTool`: Semantic search and retrieval
- `chunkerTool`: Document processing and chunking

### 3. Report Agent (`reportAgent.ts`)

**Purpose**: Generates comprehensive, well-structured reports from research data.

**Key Features**:
- Expert-level analysis and synthesis
- Markdown formatting
- Proactive recommendations
- Contrarian viewpoints consideration
- Citation and source validation
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.
- **Advanced Tracing**: Comprehensive observability with OpenTelemetry spans, performance metrics, and error tracking

**Configuration**:
- Model: Gemini 2.5 Flash Lite
- Search Grounding: Enabled
- Structured Outputs: Enabled
- Safety Level: Off

**Tracing Features**:
- `AISpanType.AGENT_RUN` main execution span
- Performance timing and success metrics
- Error handling with detailed metadata
- Runtime context integration
- Child span creation for complex operations

### 4. Web Summarization Agent (`webSummarizationAgent.ts`)

**Purpose**: Optimizes token usage by generating concise summaries of web content.

**Key Features**:
- Intelligent content extraction
- Token-efficient summarization
- Preservation of critical information
- Structured summary outputs
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Configuration**:
- Model: Gemini 2.5 Flash Lite
- Token Optimization: Enabled
- Content Filtering: Enabled
- Safety Level: Off

### 5. Evaluation Agent (`evaluationAgent.ts`)

**Purpose**: Assesses the relevance and quality of search results.

**Key Features**:
- Binary relevance scoring
- Detailed reasoning for decisions
- URL deduplication
- Structured JSON responses
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Integration**: Called by `evaluateResultTool` for automated assessment.

### 6. Learning Extraction Agent (`learningExtractionAgent.ts`)

**Purpose**: Extracts key insights and generates follow-up questions from content.

**Key Features**:
- Single key learning per result
- Up to 1 follow-up question generation
- Source attribution
- Structured extraction format
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Integration**: Called by `extractLearningsTool` for knowledge mining.

### 7. GitHub Agent (`githubAgent.ts`)

**Purpose**: Advanced AI-powered GitHub Assistant for complete repository and project management with Copilot integration.

**Key Features**:
- **Repository Management**: Create, list, update, and delete repositories
- **Issue Management**: Create, update, list, and manage GitHub issues with comments
- **Pull Request Management**: Handle PR creation, updates, merging, and reviews
- **Branch Management**: Create, list, and delete repository branches
- **User & Organization Management**: Search users, manage organization members
- **Advanced Copilot Integration**: Delegate complex coding tasks to GitHub Copilot
- **GitHub API Integration**: Full access to GitHub REST API via Octokit
- **Evaluation**: Integrated non-LLM based evaluation metrics (Content Similarity, Completeness, Textual Difference, Keyword Coverage, Tone Consistency) for quality assurance.

**Copilot Integration Features**:
- **Task Delegation**: Assign coding tasks to @github-copilot for automated implementation
- **Code Analysis**: Request Copilot analysis and suggestions on pull requests
- **Automated PR Creation**: Copilot generates code and creates pull requests automatically

**Configuration**:
- Model: Gemini 2.5 Flash
- Search Grounding: Enabled
- Dynamic Retrieval: Enabled
- Safety Level: Off (for flexibility)
- GitHub API: Octokit integration with GITHUB_API_KEY

**Tools Used**:
- `createRepository`: Repository creation and management
- `getRepository`: Repository information retrieval
- `updateRepository`: Repository settings modification
- `deleteRepository`: Repository removal (with confirmation)
- `listRepositories`: Repository listing with filtering
- `createIssue`: Issue creation with detailed descriptions
- `getIssue`: Issue information retrieval
- `updateIssue`: Issue status and content modification
- `listIssues`: Issue listing with status filtering
- `createPullRequest`: Pull request creation between branches
- `getPullRequest`: PR information retrieval
- `updatePullRequest`: PR modification and state changes
- `mergePullRequest`: PR merging with various merge methods
- `listPullRequests`: PR listing with filtering
- `search`: Advanced GitHub search across repositories
- `getUser`: User profile information retrieval
- `listOrganizations`: Organization listing and management

**Prerequisites**:
- GitHub Copilot Enterprise subscription for advanced features
- Valid GITHUB_API_KEY environment variable
- Appropriate repository permissions


## Tools

The system provides 25 specialized tools for various research and processing tasks (11 core research tools + 14 GitHub integration tools):

### 1. Web Search Tool (`webSearchTool.ts`)

**Purpose**: Searches the web and returns summarized content.

**Features**:
- Exa API integration for web search
- Automatic content summarization
- Live crawl capability
- Error handling and fallbacks

**Input Schema**:
```typescript
{
  query: string  // Search query
}
```

**Output**: Array of summarized search results with titles, URLs, and content.

### 2. Evaluate Result Tool (`evaluateResultTool.ts`)

**Purpose**: Determines if search results are relevant to research queries.

**Features**:
- Agent-based evaluation
- URL deduplication
- Structured relevance assessment

**Input Schema**:
```typescript
{
  query: string,
  result: { title: string, url: string, content: string },
  existingUrls?: string[]
}
```

### 3. Extract Learnings Tool (`extractLearningsTool.ts`)

**Purpose**: Extracts key learnings and follow-up questions from content.

**Features**:
- Single learning extraction
- Follow-up question generation
- Source tracking

### 4. Chunker Tool (`chunker-tool.ts`)

**Purpose**: Advanced document chunking with multiple strategies and metadata extraction.

**Features**:
- Multiple document formats (text, HTML, Markdown, JSON, LaTeX, CSV, XML)
- Chunking strategies: recursive, sentence, paragraph, fixed, semantic
- Metadata extraction (title, summary, keywords, questions)
- Vector store integration
- Runtime context support

**Input Schema**:
```typescript
{
  document: {
    content: string,
    type: 'text' | 'html' | 'markdown' | 'json' | 'latex' | 'csv' | 'xml',
    title?: string,
    source?: string,
    metadata?: Record<string, unknown>
  },
  chunkParams?: {
    strategy: 'recursive' | 'sentence' | 'paragraph' | 'fixed' | 'semantic',
    size: number,
    overlap: number,
    separator: string
  },
  extractParams?: {
    title?: boolean,
    summary?: boolean,
    keywords?: boolean,
    questions?: boolean
  },
  vectorOptions?: {
    createEmbeddings: boolean,
    upsertToVector: boolean,
    indexName: string
  }
}
```

### 5. Vector Query Tool (`vectorQueryTool.ts`)

**Purpose**: Semantic search and retrieval from vector stores.

**Advanced Features**:
- Hybrid search combining semantic similarity with metadata filtering
- Runtime context support for personalized search preferences
- Comprehensive tracing with multiple child spans for different operations
- Memory integration for thread-specific searches
- Performance monitoring and error tracking

**Tracing Features**:
- Main span with operation metadata and user context
- Child spans for embedding generation, memory search, and vector store queries
- Performance metrics and result counts
- Error handling with detailed metadata
- Runtime context integration for observability

### 6. Graph RAG Tool (`graphRAG.ts`)

**Purpose**: Graph-based retrieval-augmented generation.

### 7. Rerank Tool (`rerank-tool.ts`)

**Purpose**: Re-ranking search results by relevance.

### 8. Data File Manager (`data-file-manager.ts`)

**Purpose**: File system operations for data management.

### 9. Web Scraper Tool (`web-scraper-tool.ts`)

**Purpose**: Direct web content scraping.

### 10. Weather Tool (`weather-tool.ts`)

**Purpose**: Weather data integration.

### GitHub Tools Suite

The system includes 14 specialized GitHub integration tools for comprehensive repository and project management:

#### Repository Management Tools
- **createRepository**: Create new repositories with custom settings and descriptions
- **getRepository**: Retrieve detailed repository information and metadata
- **updateRepository**: Modify repository settings, descriptions, and visibility
- **deleteRepository**: Remove repositories (with confirmation safeguards)
- **listRepositories**: List user repositories with filtering and pagination

#### Branch Management Tools
- **listBranches**: List all branches in a repository with protection status
- **getBranch**: Get detailed branch information including protection rules
- **createBranch**: Create new branches from existing commits or branches
- **deleteBranch**: Remove branches safely with conflict checking

#### Issue Management Tools
- **createIssue**: Create new issues with titles, descriptions, and labels
- **getIssue**: Retrieve issue details, comments, and metadata
- **updateIssue**: Modify issue status, title, body, and assignees
- **listIssues**: List repository issues with advanced filtering (open/closed/all)

#### Pull Request Management Tools
- **createPullRequest**: Create pull requests between branches with detailed descriptions
- **getPullRequest**: Get detailed PR information including reviews and commits
- **updatePullRequest**: Modify PR title, body, state, and merge settings
- **mergePullRequest**: Merge PRs with various merge methods (merge/squash/rebase)
- **listPullRequests**: List PRs with status filtering and sorting options

#### Additional GitHub Tools
- **search**: Advanced GitHub search across repositories, issues, and code
- **getUser**: Retrieve user profile information and repository statistics
- **listOrganizations**: List user organizations and membership details
- **createComment**: Add comments to issues and pull requests

**Common Features Across GitHub Tools**:
- Full GitHub API integration via Octokit
- Comprehensive error handling and rate limiting
- Type-safe input validation with Zod schemas
- Automatic retry logic for transient failures
- Detailed logging and tracing support

## Workflows

The system includes three main workflows for automated research processes:

### 1. Research Workflow (`researchWorkflow.ts`)

**Purpose**: Orchestrates the complete research process from query to approval.

**Steps**:
1. **Get User Query**: Interactive query collection with suspend/resume
2. **Research**: Multi-phase research execution using Research Agent
3. **Approval**: User approval checkpoint for research results

**Flow**:
```
User Query → Research Agent → Results → User Approval → Complete
```

**Features**:
- Interactive workflow with suspension points
- Structured research data output
- Error handling and fallbacks

### 2. Generate Report Workflow (`generateReportWorkflow.ts`)

**Purpose**: Iterative research and report generation process.

**Steps**:
1. **Research Loop**: Repeated research workflow until approval
2. **Process Results**: Conditional report generation based on approval
3. **Report Generation**: Automated report creation using Report Agent

**Flow**:
```
Research Workflow (loop until approved) → Process Results → Generate Report
```

**Features**:
- Do-while loop for iterative research
- Conditional execution based on approval status
- Integrated report generation

### 3. Comprehensive Research Workflow (`comprehensiveResearchWorkflow.ts`)

**Purpose**: Advanced end-to-end research workflow with iterative learning, RAG processing, and comprehensive report generation.

**Steps**:
1. **Get User Query**: Interactive query collection with suspend/resume
2. **Iterative Research Loop**: Multi-iteration research with evaluation and learning extraction
3. **Consolidate Research Data**: Combine all research findings and learnings
4. **Process and Retrieve**: RAG processing with chunking, embedding, and semantic retrieval
5. **Synthesize Content**: Generate coherent summaries from refined context
6. **Generate Final Report**: Create comprehensive report using Report Agent
7. **Report Approval**: Human-in-the-loop approval checkpoint

**Flow**:
```
User Query → Iterative Research (with evaluation) → Consolidate Data → RAG Processing → Synthesis → Report Generation → Approval
```

**Features**:
- Advanced iterative research with up to 3 iterations
- Integrated evaluation and learning extraction per search result
- RAG pipeline with dedicated vector index (`comprehensive_research_data`)
- Semantic reranking for improved retrieval quality
- Comprehensive content synthesis and report generation
- Human-in-the-loop approval for final reports
- Parallel processing with controlled concurrency
- Robust error handling and logging throughout

## Advanced Workflow Features

### Workflow Control Flow

The system leverages Mastra's advanced workflow control flow capabilities:

#### Parallel Execution
```typescript
workflow.parallel([step1, step2])
  .then(step3)
  .commit();
```

#### Conditional Branching
```typescript
workflow.branch([
  [async ({ inputData }) => inputData.value > 10, highValueStep],
  [async ({ inputData }) => inputData.value <= 10, lowValueStep]
])
.commit();
```

#### Looping Constructs
```typescript
// Do-while loop
workflow.dountil(step, condition);

// Do-until loop
workflow.dowhile(step, condition);

// Foreach with concurrency control
workflow.foreach(step, { concurrency: 2 });
```

#### Suspend & Resume
```typescript
const step = createStep({
  suspendSchema: z.object({}),
  resumeSchema: z.object({ extraData: z.string() }),
  execute: async ({ suspend }) => {
    await suspend({}); // Pause workflow
    return { result: "resumed" };
  }
});
```

### Streaming and Real-time Updates

#### Enhanced Streaming with streamVNext()
```typescript
// AI SDK v5 compatible streaming
const stream = await agent.streamVNext("query", {
  format: 'aisdk',
  memory: { thread: "thread-123", resource: "user-456" }
});

// Real-time streaming with callbacks
for await (const chunk of stream.textStream) {
  console.log(chunk);
}
```

#### Workflow Streaming
```typescript
const run = await workflow.createRunAsync();
const result = await run.stream({
  inputData: { query: "research topic" }
});

for await (const event of result.stream) {
  console.log(event);
}
```

### Inngest Integration for Production Workflows

For production deployments, workflows can be integrated with Inngest:

```typescript
import { Inngest } from "inngest";
import { init } from "@mastra/inngest";

const inngest = new Inngest({ id: "mastra-workflows" });
const { createWorkflow, createStep } = init(inngest);

// Create production-ready workflow
const productionWorkflow = createWorkflow({
  id: "production-research-workflow",
  // ... workflow definition
});
```

### Advanced Memory Management

#### Semantic Recall and Working Memory
```typescript
const agent = new Agent({
  memory: {
    options: {
      lastMessages: 50,
      semanticRecall: {
        topK: 5,
        messageRange: { before: 10, after: 5 },
        scope: 'thread'
      },
      workingMemory: {
        enabled: true,
        maxSize: 1000
      }
    }
  }
});
```

#### Resource-scoped Memory
```typescript
// Memory persists across all threads for a user
const memory = new Memory({
  storage: new LibSQLStore({ connectionString }),
  resource: "user-123"
});
```

### Error Handling and Recovery

#### Workflow Error Recovery
```typescript
workflow
  .then(step1)
  .catch(errorStep) // Handle errors gracefully
  .finally(cleanupStep) // Always execute cleanup
  .commit();
```

#### Agent Error Handling
```typescript
const agent = new Agent({
  model: openai("gpt-4o"),
  onError: async (error, context) => {
    console.error("Agent error:", error);
    // Implement retry logic or fallback behavior
  }
});
```

## Configuration

### Google AI Provider (`googleProvider.ts`)

**Features**:
- Gemini 2.5 model support (Flash Lite, Pro, Flash)
- Search grounding and dynamic retrieval
- Cached content management
- Safety settings configuration
- Embedding model integration
- Langfuse tracing support

**Key Models**:
- `gemini-2.5-flash-lite-preview-06-17` (Primary)
- `gemini-2.5-pro-preview-05-06`
- `gemini-2.5-flash-preview-05-20`

### Storage Configuration (`libsql-storage.ts`)

**Features**:
- LibSQL database integration with file-based storage
- Separate vector database configuration for optimal performance
- Automatic table creation (Mastra-managed)
- Embedding utilities with Gemini integration
- Health checks and monitoring
- Memory configuration for agents
- Enhanced tracing context support

**Database Configuration**:
- Main storage: `file:./deep-research.db`
- Vector storage: `file:./vector-store.db`
- Support for Turso cloud databases with auth tokens

**Vector Indexes**:
- `research_documents`: Research content storage
- `web_content`: Web-scraped content
- `learnings`: Extracted insights
- `reports`: Generated reports
- `comprehensive_research_data`: Dedicated index for comprehensive workflow

## Storage and Memory

### LibSQL Storage

**Auto-managed Tables**:
- `messages`: Conversation messages (V1/V2 format)
- `threads`: Message grouping with metadata
- `resources`: User working memory
- `workflows`: Suspended workflow snapshots
- `eval_data-sets`: Evaluation results
- `traces`: OpenTelemetry tracing data

### Memory Configuration

**Research Memory**:
- 50 message history
- Top 5 semantic recall results
- User research context template

**Report Memory**:
- 100 message history
- Top 10 semantic recall results
- Report generation context template

## Advanced Tracing and Observability

The system implements comprehensive tracing and observability features using OpenTelemetry and Mastra's tracing framework:

### Agent Tracing Features

#### Report Agent Tracing
- **Main Execution Span**: `AISpanType.AGENT_RUN` for overall agent execution
- **Performance Metrics**: Processing time, success/failure status, message counts
- **Error Handling**: Detailed error metadata and stack traces
- **Runtime Context**: User and session information tracking
- **Child Spans**: For complex operations within agent execution

#### Vector Query Tool Tracing
- **Multi-level Spans**: Main span with child spans for different operations
- **Embedding Generation**: Separate span for Gemini embedding creation
- **Memory Search**: Dedicated span for LibSQL memory queries
- **Vector Store Queries**: Span for direct vector database operations
- **Performance Tracking**: Query execution time, result counts, similarity scores
- **User Context**: Personalized search preferences and session tracking

### Tracing Architecture

#### Span Types Used
- `AISpanType.AGENT_RUN`: Main agent execution spans
- `AISpanType.GENERIC`: Tool operations and utility functions
- Custom spans for specific operations (memory search, embedding generation, etc.)

#### Metadata Captured
- **Operation Details**: Query parameters, user context, session information
- **Performance Metrics**: Processing time, result counts, success rates
- **Error Information**: Error messages, stack traces, failure points
- **Business Context**: Thread IDs, user preferences, search parameters

#### Integration Points
- **Runtime Context**: Dynamic configuration via headers and context
- **Memory Integration**: Thread-specific search tracking
- **Error Recovery**: Comprehensive error handling and recovery mechanisms
- **Performance Monitoring**: Real-time metrics and observability

### Benefits

1. **Debugging**: Detailed execution traces for troubleshooting
2. **Performance Monitoring**: Real-time metrics and bottleneck identification
3. **User Experience**: Personalized search and context tracking
4. **Error Recovery**: Comprehensive error handling and recovery mechanisms
5. **Observability**: Full system visibility for maintenance and optimization

## Component Interactions

### Agent-Tool Integration

```
Research Agent
├── webSearchTool → Web Summarization Agent
├── evaluateResultTool → Evaluation Agent
└── extractLearningsTool → Learning Extraction Agent

Report Agent
└── Direct content processing

Web Summarization Agent
└── Content processing for webSearchTool
```

### Workflow-Agent Integration

```
Research Workflow
├── getUserQueryStep → Interactive input
├── researchStep → Research Agent
└── approvalStep → User approval

Generate Report Workflow
├── researchWorkflow (loop) → Research process
└── processResearchResultStep → Report Agent
```

### Storage Integration

```
All Agents → Memory → LibSQL Store
Vector Tools → Vector Store → LibSQL Vector
Chunker Tool → Vector Store → Embeddings
```

## Usage Examples

### Basic Research

```typescript
import { mastra } from './src/mastra';

const researchWorkflow = mastra.getWorkflow('research-workflow');
const result = await researchWorkflow.execute({});
```

### Report Generation

```typescript
const reportWorkflow = mastra.getWorkflow('generate-report-workflow');
const result = await reportWorkflow.execute({});
```

### Direct Agent Usage

```typescript
const researchAgent = mastra.getAgent('researchAgent');
const result = await researchAgent.generate([{
  role: 'user',
  content: 'Research quantum computing advancements'
}]);
```

### vNext Agent Network Usage

```typescript
import { mastra } from './src/mastra';

const complexResearchNetwork = mastra.getVNextNetwork('complex-research-network');
const result = await complexResearchNetwork.loop('Research the impact of AI on healthcare and generate a report.', {});
console.log(result);
```

### Tool Usage

```typescript
const webSearch = mastra.getTool('web-search');
const results = await webSearch.execute({
  input: { query: 'AI research trends' }
});
```

## API Reference

### Mastra Instance Methods

- `getAgent(name: string)`: Retrieve agent instance
- `getWorkflow(name: string)`: Retrieve workflow instance
- `getTool(name: string)`: Retrieve tool instance
- `getStorage()`: Access storage interface

### Agent Methods

- `generate(messages: Message[], options?)`: Generate response
- `stream(messages: Message[], options?)`: Stream response

### Workflow Methods

- `execute(input?)`: Execute workflow
- `suspend()`: Pause workflow execution
- `resume(data?)`: Resume suspended workflow

### Tool Methods

- `execute(input, context?)`: Execute tool functionality

## Environment Configuration

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL="file:./deep-research.db"  # Main storage database
DATABASE_AUTH_TOKEN=""  # For Turso cloud (leave empty for local)

# Vector Database Configuration
VECTOR_DATABASE_URL="file:./vector-store.db"  # Separate vector database
# VECTOR_DATABASE_AUTH_TOKEN=""  # For remote vector databases

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"

# GitHub API Configuration
GITHUB_API_KEY="your-github-personal-access-token"

# Search
EXA_API_KEY="your-exa-api-key"
```

### Optional Environment Variables

```bash
# Logging
LOG_LEVEL="info"

# Vector Store
VECTOR_DIMENSION="1536"
VECTOR_INDEX_NAME="research_documents"

# Memory
MEMORY_MESSAGE_LIMIT="50"
MEMORY_SEMANTIC_TOP_K="5"
```

## Error Handling

The system includes comprehensive error handling:

- **Tool Failures**: Graceful degradation with fallbacks
- **API Errors**: Retry logic and error reporting
- **Storage Issues**: Health checks and recovery mechanisms
- **Workflow Errors**: Suspension and resume capabilities

## Performance Considerations

- **Token Management**: Content summarization to reduce token usage
- **Caching**: Vector embeddings and content caching
- **Batch Processing**: Efficient batch operations for embeddings
- **Memory Limits**: Configurable message history limits

## Security and Safety

- **Safety Settings**: Configurable content filtering
- **API Key Management**: Secure environment variable usage
- **Input Validation**: Zod schema validation throughout
- **Error Sanitization**: Safe error message exposure

## Future Enhancements

- Additional agent specializations
- Enhanced vector search capabilities
- Multi-modal content processing
- Advanced workflow branching
- Real-time collaboration features

---

*This documentation covers the Mastra Deep Research System as of the current implementation. For the latest updates and additional features, refer to the source code and commit history.*</target_file>