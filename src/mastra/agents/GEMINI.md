# AI Agents - Specialized Research Assistants

## Agents Overview
This directory contains 6 specialized AI agents that form the core intelligence layer of the Deep Research Assistant. Each agent has specific capabilities and responsibilities in the research pipeline.

## Agent Architecture

### Base Agent Pattern
All agents follow a consistent architecture:
- **Specialized Instructions**: Agent-specific system prompts and guidelines
- **Tool Integration**: Access to relevant tools for their domain
- **Memory Management**: Context optimization using memory processors
- **Error Handling**: Robust error recovery and logging
- **Type Safety**: Full TypeScript typing with Zod validation

### Agent Categories

#### 🤖 Research & Analysis Agents
**Research Agent** (`researchAgent.ts`)
- **Primary Function**: Two-phase research process with systematic web search and evaluation
- **Capabilities**:
  - Phase 1: Initial research with 2-3 focused search queries
  - Phase 2: Follow-up research based on extracted learnings (stops after Phase 2)
  - Content relevance evaluation using evaluation agent
  - Learning extraction with up to 1 follow-up question per result
  - Structured JSON output with queries, results, learnings, and completed queries
  - Error handling with fallback to knowledge when searches fail
- **Tools Used**: webSearchTool, evaluateResultTool, extractLearningsTool
- **Evaluation Metrics**: Content similarity, completeness, textual difference, keyword coverage, tone consistency
- **Memory Focus**: Research context and learning patterns

**Evaluation Agent** (`evaluationAgent.ts`)
- **Primary Function**: Content quality and relevance assessment
- **Capabilities**:
  - Multi-dimensional content evaluation
  - Source credibility scoring
  - Recency analysis
  - Bias detection
  - Quality metrics calculation
- **Tools Used**: EvaluateResultTool, WebSearchTool
- **Memory Focus**: Evaluation criteria and quality standards

**Learning Extraction Agent** (`learningExtractionAgent.ts`)
- **Primary Function**: Key insights and pattern identification
- **Capabilities**:
  - Pattern recognition in research data
  - Key learning identification
  - Follow-up question generation
  - Content categorization
  - Insight synthesis and organization
- **Tools Used**: ExtractLearningsTool, EvaluateResultTool
- **Memory Focus**: Learning patterns and insight extraction

#### 📝 Content Generation Agents
**Report Agent** (`reportAgent.ts`)
- **Primary Function**: Comprehensive report generation from research data
- **Capabilities**:
  - Research data synthesis and structuring
  - Markdown report formatting
  - Executive summary creation
  - Detailed analysis sections
  - Source attribution and citations
- **Tools Used**: DataFileManager, EvaluateResultTool
- **Memory Focus**: Report structure and formatting standards

**Web Summarization Agent** (`webSummarizationAgent.ts`)
- **Primary Function**: Content condensation and synthesis
- **Capabilities**:
  - Web content analysis and categorization
  - Intelligent summarization (80-95% reduction)
  - Key insight preservation
  - Source context maintenance
  - Token optimization
- **Tools Used**: WebSearchTool, ChunkerTool
- **Memory Focus**: Summarization patterns and content structure

#### 🔍 Information Retrieval Agents
**RAG Agent** (`ragAgent.ts`)
- **Primary Function**: Vector search and retrieval-augmented generation
- **Capabilities**:
  - Vector embedding generation and search
  - Semantic similarity matching
  - Context retrieval and ranking
  - Knowledge augmentation
  - Memory integration
- **Tools Used**: VectorQueryTool, ChunkerTool, RerankTool
- **Memory Focus**: Vector search optimization and context retrieval

## Agent Development Guidelines

### Agent Creation Pattern
```typescript
// 1. Import required dependencies
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { PinoLogger } from "@mastra/loggers";

// 2. Initialize logger
const logger = new PinoLogger({ level: 'info' });
logger.info("Initializing Research Agent...");

// 3. Create memory instance
const memory = createResearchMemory();

// 4. Define agent with actual implementation pattern
export const researchAgent = new Agent({
  name: 'Research Agent',
  instructions: `You are an expert research agent. Your goal is to research topics thoroughly by following this EXACT process:

  **PHASE 1: Initial Research**
  1. Break down the main topic into 2 specific, focused search queries
  2. For each query, use the webSearchTool to search the web
  3. Use evaluateResultTool to determine if results are relevant
  4. For relevant results, use extractLearningsTool to extract key learnings and follow-up questions

  **PHASE 2: Follow-up Research**
  1. After completing Phase 1, collect ALL follow-up questions from the extracted learnings
  2. Search for each follow-up question using webSearchTool
  3. Use evaluateResultTool and extractLearningsTool on these follow-up results
  4. **STOP after Phase 2 - do NOT search additional follow-up questions from Phase 2 results**

  **Important Guidelines:**
  - Keep search queries focused and specific - avoid overly general queries
  - Track all completed queries to avoid repetition
  - Only search follow-up questions from the FIRST round of learnings
  - Do NOT create infinite loops by searching follow-up questions from follow-up results

  **Output Structure:**
  Return findings in JSON format with:
  - queries: Array of all search queries used (initial + follow-up)
  - searchResults: Array of relevant search results found
  - learnings: Array of key learnings extracted from results
  - completedQueries: Array tracking what has been searched
  - phase: Current phase of research ("initial" or "follow-up")

  **Error Handling:**
  - If all searches fail, use your knowledge to provide basic information
  - Always complete the research process even if some searches fail

  Use all the tools available to you systematically and stop after the follow-up phase.
  `,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    webSearchTool,
    evaluateResultTool,
    extractLearningsTool,
  },
  memory,
});
```

### Agent Communication Protocol
```typescript
// Standard agent interaction - actual pattern from implementation
const result = await researchAgent.generate(
  [
    {
      role: 'user',
      content: `Research the following topic thoroughly using the two-phase process: "${query}".
      Phase 1: Search for 2-3 initial queries about this topic
      Phase 2: Search for follow-up questions from the learnings (then STOP)
      Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`,
    },
  ],
  {
    experimental_output: z.object({
      queries: z.array(z.string()),
      searchResults: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          relevance: z.string().optional(),
          content: z.string(),
        }),
      ),
      learnings: z.array(
        z.object({
          learning: z.string(),
          followUpQuestions: z.array(z.string()),
          source: z.string(),
        }),
      ),
      completedQueries: z.array(z.string()),
      phase: z.string().optional(),
    }),
  },
);
```

### Tool Integration Pattern
```typescript
// Agent tool usage - actual pattern from researchAgent.ts
export const researchAgent = new Agent({
  name: 'Research Agent',
  tools: {
    webSearchTool,
    evaluateResultTool,
    extractLearningsTool,
  },
  // Other configuration
});
```

## Agent Specialization Strategies

### Domain Expertise
- **Research Agent**: Web research methodologies, source evaluation
- **Evaluation Agent**: Content analysis, quality assessment frameworks
- **Learning Agent**: Pattern recognition, insight extraction techniques
- **Report Agent**: Technical writing, document structure, formatting
- **Summarization Agent**: Content analysis, condensation techniques
- **RAG Agent**: Vector search, semantic similarity, context retrieval

### Task Optimization
- **Prompt Engineering**: Specialized prompts for each agent's domain
- **Tool Selection**: Curated tool sets for specific capabilities
- **Memory Configuration**: Domain-specific memory processors
- **Output Formatting**: Structured outputs for downstream processing

## Quality Assurance

### Agent Testing Strategy
- **Unit Tests**: Individual agent capability verification
- **Integration Tests**: Agent-workflow-tool interactions
- **Performance Tests**: Response time and resource usage
- **Accuracy Tests**: Output quality and correctness validation

### Evaluation Metrics
- **Relevance Score**: How well agent responses match requirements
- **Accuracy Rate**: Factual correctness of generated content
- **Completeness Score**: Coverage of requested information
- **Efficiency Rating**: Token usage and processing time optimization

### Continuous Improvement
- **Feedback Loop**: User feedback integration
- **Performance Monitoring**: Response quality tracking
- **Model Updates**: Regular model and prompt refinement
- **Capability Expansion**: New tool and feature integration

## Agent Orchestration

### Multi-Agent Collaboration
```typescript
// Agent coordination pattern - actual implementation from comprehensiveResearchWorkflow.ts
const evaluationResult = await evaluationAgent.generate(
  [
    {
      role: 'user',
      content: `Evaluate whether this search result is relevant to the query: "${query}".
      Search result: Title: ${searchResult.title}, URL: ${searchResult.url}, Content snippet: ${searchResult.content.substring(0, 500)}...
      Respond with JSON { isRelevant: boolean, reason: string }`,
    },
  ],
  {
    experimental_output: z.object({
      isRelevant: z.boolean(),
      reason: z.string(),
    }),
  },
);
```

### Agent Networks
- **Complex Research Network**: Multi-agent research coordination
- **Dynamic Task Distribution**: Intelligent workload balancing
- **Inter-Agent Communication**: Result sharing and feedback loops
- **Consensus Building**: Multi-agent decision making

## Memory Management

### Agent-Specific Memory
Each agent uses specialized memory processors:
- **Research Agent**: Focuses on research context and learning patterns
- **Evaluation Agent**: Quality criteria and assessment standards
- **Learning Agent**: Pattern recognition and insight extraction
- **Report Agent**: Document structure and formatting guidelines
- **Summarization Agent**: Content structure and summarization patterns
- **RAG Agent**: Vector search optimization and retrieval strategies

### Memory Processor Integration
```typescript
const agentMemory = createMemoryWithProcessors({
  storage: libsqlStorage,
  processors: [
    new PersonalizationProcessor({ userId: 'agent-specific' }),
    new TokenLimiterProcessor({ maxTokens: 4000 }),
    new ErrorCorrectionProcessor({ enableChecksum: true }),
    // Agent-specific processors
  ]
});
```

## Error Handling & Recovery

### Agent Error Patterns
- **Tool Failures**: Graceful degradation when tools unavailable
- **API Limits**: Rate limiting and retry mechanisms
- **Content Issues**: Fallback strategies for poor quality content
- **Memory Issues**: Context overflow and recovery procedures

### Recovery Strategies
- **Fallback Agents**: Alternative agents for failed operations
- **Partial Results**: Return available results when complete failure occurs
- **User Notification**: Clear error communication to users
- **Automatic Retry**: Intelligent retry with exponential backoff

## Performance Optimization

### Agent Efficiency
- **Token Optimization**: Efficient context window usage
- **Caching Strategy**: Response caching for repeated queries
- **Batch Processing**: Optimized bulk operations
- **Parallel Execution**: Concurrent tool usage where appropriate

### Resource Management
- **Memory Limits**: Context size management and optimization
- **API Quotas**: Rate limiting and usage monitoring
- **Processing Time**: Response time optimization
- **Cost Control**: API usage and cost optimization

## Security Considerations

### Agent Security
- **Input Validation**: Comprehensive input sanitization
- **Output Filtering**: Sensitive information removal
- **Tool Permissions**: Granular tool access control
- **Audit Logging**: Agent action tracking and monitoring

### Data Protection
- **Privacy Compliance**: GDPR and privacy regulation adherence
- **Content Filtering**: Inappropriate content detection and blocking
- **Access Control**: User permission and role-based access
- **Data Encryption**: Secure data handling and storage

## Development Workflow

### Agent Development Process
1. **Requirements Analysis**: Define agent capabilities and scope
2. **Design Phase**: Create agent architecture and interfaces
3. **Implementation**: Write agent logic with full type safety
4. **Tool Integration**: Connect relevant tools and services
5. **Memory Configuration**: Set up specialized memory processors
6. **Testing**: Comprehensive unit and integration testing
7. **Documentation**: Complete API and usage documentation

### Agent Maintenance
1. **Performance Monitoring**: Track response quality and efficiency
2. **User Feedback**: Incorporate user suggestions and corrections
3. **Model Updates**: Regular prompt and model refinement
4. **Capability Expansion**: Add new tools and features as needed
5. **Security Updates**: Regular security review and updates

## AI Assistant Guidelines for Agent Development

When working with AI agents:

1. **Understand Agent Roles**: Each agent has specific responsibilities and capabilities
2. **Maintain Specialization**: Keep agents focused on their core competencies
3. **Ensure Type Safety**: Full TypeScript typing with Zod validation
4. **Handle Errors Gracefully**: Comprehensive error handling and recovery
5. **Optimize Performance**: Efficient token usage and response times
6. **Document Thoroughly**: Clear documentation for all agent capabilities
7. **Test Extensively**: Robust testing for all agent interactions
8. **Monitor Quality**: Continuous quality assessment and improvement

## Import References

