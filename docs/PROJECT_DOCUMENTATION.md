# Mastra Deep Research System Documentation

## Project Overview

The Mastra Deep Research System is an AI-powered research and analysis platform built using the Mastra framework. It provides comprehensive research capabilities through specialized agents, tools, and workflows that enable thorough investigation of topics with web search integration, content summarization, and structured reporting.

### Key Features

- **Multi-Agent Architecture**: Specialized agents and **vNext Agent Networks** for intelligent orchestration.
- **Web Search Integration**: Real-time web search with content summarization.
- **Vector Storage**: Semantic search and knowledge retrieval using embeddings.
- **Workflow Orchestration**: Automated research and report generation processes, including human-in-the-loop capabilities.
- **Memory Management**: Persistent conversation and research context across agents, workflows, and networks.
- **Document Processing**: Advanced chunking and metadata extraction.

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

The system includes six specialized agents, each with distinct capabilities:

### 1. Research Agent (`researchAgent.ts`)

**Purpose**: Conducts thorough, systematic research using a two-phase approach.

**Key Features**:
- Phase 1: Initial research with 2 specific search queries
- Phase 2: Follow-up research based on extracted learnings
- Prevents infinite loops by limiting follow-up depth
- Structured JSON output with queries, results, and learnings

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

**Configuration**:
- Model: Gemini 2.5 Flash Lite
- Search Grounding: Enabled
- Structured Outputs: Enabled
- Safety Level: Off

### 4. Web Summarization Agent (`webSummarizationAgent.ts`)

**Purpose**: Optimizes token usage by generating concise summaries of web content.

**Key Features**:
- Intelligent content extraction
- Token-efficient summarization
- Preservation of critical information
- Structured summary outputs

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

**Integration**: Called by `evaluateResultTool` for automated assessment.

### 6. Learning Extraction Agent (`learningExtractionAgent.ts`)

**Purpose**: Extracts key insights and generates follow-up questions from content.

**Key Features**:
- Single key learning per result
- Up to 1 follow-up question generation
- Source attribution
- Structured extraction format

**Integration**: Called by `extractLearningsTool` for knowledge mining.

### 5. Web Summarization Agent (`webSummarizationAgent.ts`)

**Purpose**: Creates concise summaries of web content to manage token limits.

**Key Features**:
- 80-95% content reduction
- Structured summary format (Main Topic, Key Insights, Context)
- Token efficiency optimization
- Quality preservation

**Integration**: Called by `webSearchTool` for content processing.

## Tools

The system provides 10 specialized tools for various research and processing tasks:

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

## Workflows

The system includes two main workflows for automated research processes:

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
- LibSQL database integration
- Vector store with multiple indexes
- Automatic table creation (Mastra-managed)
- Embedding utilities with Gemini integration
- Health checks and monitoring
- Memory configuration for agents

**Vector Indexes**:
- `research_documents`: Research content storage
- `web_content`: Web-scraped content
- `learnings`: Extracted insights
- `reports`: Generated reports

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
# Database
DATABASE_URL="file:./deep-research.db"
DATABASE_AUTH_TOKEN=""  # For Turso cloud

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

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