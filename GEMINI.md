# Deep Research Assistant - Project Context

## Project Overview
This is an advanced AI-powered deep research system built with Mastra framework, designed for intelligent, autonomous research and reporting. The system leverages multiple AI agents, sophisticated workflows, and cutting-edge RAG (Retrieval-Augmented Generation) capabilities to conduct comprehensive research with human-in-the-loop approval.

## Core Technologies & Architecture

### Primary Framework
- **Mastra**: AI orchestration framework for agents, workflows, and tools
- **TypeScript**: Primary programming language with strict type safety
- **Node.js 20.9+**: Runtime environment with modern ES modules

### AI & ML Stack
- **Google AI Gemini 2.5**: Advanced multimodal AI with search grounding and caching
- **AI SDK**: Unified interface for multiple AI providers
- **Exa AI**: Primary web search and content discovery API
- **Vector Embeddings**: Semantic search and similarity matching
- **Graph RAG**: Knowledge graph-based reasoning and retrieval

### Data & Storage
- **LibSQL**: High-performance SQLite-compatible database (currently in-memory configuration)
- **Vector Indexes**: Multiple specialized indexes for different content types
- **Memory Processors**: 11 specialized processors for context optimization

### Observability & Monitoring
- **OpenTelemetry**: Comprehensive tracing with child spans
- **Performance Metrics**: Processing time, resource usage, API costs
- **Error Tracking**: Structured error logging and failure analysis

## Key Components

### 🤖 AI Agents (6 Specialized Agents)
1. **Research Agent**: Multi-phase research with web search and evaluation
2. **Report Agent**: Comprehensive report generation from research data
3. **Evaluation Agent**: Content relevance and quality assessment
4. **Learning Extraction Agent**: Key insights and follow-up question generation
5. **Web Summarization Agent**: Content condensation and synthesis
6. **RAG Agent**: Vector search and retrieval-augmented generation

### 🔄 Workflows (3 Core Workflows)
1. **Comprehensive Research Workflow**: End-to-end research with human approval
2. **Generate Report Workflow**: Automated report creation
3. **Research Workflow**: Basic research orchestration

### 🛠️ Specialized Tools (8+ Tools)
- **Web Search Tool**: Intelligent web scraping and content extraction
- **Vector Query Tool**: Semantic search over embedded content
- **Chunker Tool**: Document segmentation for RAG
- **Rerank Tool**: Result relevance optimization
- **Evaluation Tool**: Content quality assessment
- **Learning Extraction Tool**: Insight mining from research data

### 🧠 Memory Processors (11 Specialized Processors)
- **TokenLimiterProcessor**: Prevents context overflow
- **PersonalizationProcessor**: Boosts user-relevant content
- **ErrorCorrectionProcessor**: Deduplicates content via checksum
- **HierarchicalMemoryProcessor**: Filters episodic vs semantic content
- **CitationExtractorProcessor**: Prioritizes cited content
- **MultiPerspectiveProcessor**: Multi-viewpoint evaluation
- **TemporalReasoningProcessor**: Time-based relationship analysis
- **UncertaintyQuantificationProcessor**: Confidence scoring
- **KnowledgeGraphProcessor**: Graph construction and reasoning
- **BayesianBeliefProcessor**: Probabilistic belief updating
- **CircuitBreakerProcessor**: Fault tolerance and recovery

## Development Guidelines

### Code Quality Standards
- **TypeScript Strict Mode**: All code must be fully typed with no `any` types
- **ESLint**: Code quality and consistency enforcement
- **Zod Validation**: Runtime type validation for all data structures
- **Error Handling**: Comprehensive error handling with proper logging
- **Documentation**: JSDoc comments for all public APIs and complex functions

### Architecture Patterns
- **Agent-Based Architecture**: Modular, specialized AI agents
- **Workflow Orchestration**: Declarative workflow definitions
- **Tool Composition**: Reusable, composable tools
- **Memory Management**: Hierarchical memory with specialized processors
- **Event-Driven**: Async/await patterns with proper error propagation

### Performance Considerations
- **Token Optimization**: Efficient context management and compression
- **Caching Strategy**: Multi-level caching (explicit, implicit, search)
- **Batch Processing**: Optimized for bulk operations
- **Resource Monitoring**: Comprehensive performance tracking
- **Cost Optimization**: API usage monitoring and optimization

## Project Structure

```
deep-research/
├── src/mastra/           # Core framework code
│   ├── index.ts         # Main entry point
│   ├── agents/          # AI agent implementations
│   ├── workflows/       # Workflow definitions
│   ├── tools/           # Specialized tools
│   ├── networks/        # Multi-agent networks
│   ├── config/          # Configuration modules
│   └── mcp/            # MCP server implementation
├── docs/                # Documentation
├── templates/           # Code templates
├── memory/             # Memory and context data
├── scripts/            # Build and utility scripts
└── tests/              # Test suites
```

## Research Methodology

### Multi-Phase Research Process
1. **Query Analysis**: Understand user intent and research scope
2. **Web Research**: Multi-source information gathering
3. **Content Evaluation**: Relevance and credibility assessment
4. **Learning Extraction**: Key insights and pattern identification
5. **Synthesis**: Information consolidation and structuring
6. **Report Generation**: Comprehensive output creation
7. **Human Review**: Interactive approval and refinement

### Quality Assurance
- **Source Credibility**: Automated source evaluation
- **Content Freshness**: Recency analysis and prioritization
- **Cross-Reference Validation**: Multi-source verification
- **Bias Detection**: Perspective diversity assessment
- **Fact-Checking**: Automated verification where possible

## Integration Points

### External APIs
- **Google AI Gemini**: Primary AI model provider
- **Exa AI**: Alternative search and research capabilities
- **GitHub API**: Repository and issue management
- **Web Scraping**: Content extraction from web sources

### MCP Integration
- **Model Context Protocol**: Standardized AI tool integration
- **Real-time Communication**: WebSocket-based tool communication
- **Tool Discovery**: Dynamic tool registration and management
- **Security**: Sandboxed tool execution

## Deployment & Operations

### Environment Configuration
- **Environment Variables**: Secure API key management
- **Database URLs**: LibSQL connection configuration
- **Logging Levels**: Configurable verbosity
- **Performance Tuning**: Resource allocation optimization

### Monitoring & Maintenance
- **Health Checks**: System status monitoring
- **Performance Metrics**: Response times and resource usage
- **Error Tracking**: Comprehensive error logging
- **Cost Monitoring**: API usage and budget tracking

## Ethical AI Considerations

### Responsible AI Practices
- **Transparency**: Clear explanation of AI-generated content
- **Bias Mitigation**: Multi-perspective evaluation
- **Privacy Protection**: User data minimization
- **Content Verification**: Source credibility assessment
- **Human Oversight**: Human-in-the-loop approval processes

### Research Ethics
- **Academic Integrity**: Proper citation and attribution
- **Source Diversity**: Multiple perspective inclusion
- **Fact Verification**: Automated and manual validation
- **Misinformation Prevention**: Content quality filtering

## Development Workflow

### Task Management
- **Archon Integration**: Knowledge management and task tracking
- **GitHub Issues**: Feature requests and bug tracking
- **Pull Requests**: Code review and integration
- **Documentation**: Comprehensive project documentation

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing
- **AI Evaluation**: Model output quality assessment

## Future Roadmap

### Planned Enhancements
- **Multi-Modal Support**: Image, video, and audio processing
- **Advanced Graph RAG**: Enhanced knowledge graph capabilities
- **Real-time Collaboration**: Multi-user research sessions
- **Custom Model Training**: Domain-specific model fine-tuning
- **Advanced Analytics**: Research trend analysis and insights

### Research Capabilities
- **Cross-Disciplinary Research**: Multi-domain knowledge integration
- **Longitudinal Studies**: Time-series analysis and tracking
- **Predictive Analytics**: Trend forecasting and prediction
- **Automated Literature Review**: Academic paper analysis
- **Competitive Intelligence**: Market and competitor analysis

## MCP Tools
The system has access to several MCP (Model Context Protocol) servers that provide additional capabilities for Gemini CLI:

### 🤖 Mastra MCP Tools
- **mastraBlog**: Get Mastra.ai blog content and announcements
- **mastraDocs**: Access comprehensive Mastra.ai documentation and guides
- **mastraExamples**: Retrieve code examples from the Mastra.ai examples directory
- **mastraChanges**: Get changelog information for Mastra.ai packages
- **Usage**: Query documentation, get code examples, check changelogs

### 🎯 Vibe-Check MCP Tools

#### vibe_check
**Purpose**: Metacognitive questioning tool for identifying assumptions and preventing tunnel vision
**Schema**:
- `plan` (string, required): Current plan or thinking to analyze
- `userRequest` (string, required): Original user request for alignment checking
- `thinkingLog` (string, optional): Raw sequential thinking transcript
- `availableTools` (array, optional): List of available MCP tools
- `focusAreas` (array, optional): Specific focus areas for analysis
- `sessionId` (string, optional): Session ID for state management
- `previousAdvice` (string, optional): Previous feedback to avoid repetition
- `phase` (enum, optional): Current project phase (planning, implementation, review)
- `confidence` (number, optional): Agent's confidence level (0-1)

**Usage Examples**:
```
"Analyze this plan for potential assumptions before implementing"
"Check if this approach aligns with the user's original request"
"Identify blind spots in this debugging strategy"
```

**Best Practices**:
- Use before major implementation steps
- Always provide the original user request for alignment checking
- Include thinking logs for deeper analysis
- Use multiple times during complex problem-solving

#### vibe_learn
**Purpose**: Pattern recognition system for tracking common errors and solutions
**Schema**:
- `mistake` (string, required): One-sentence description of the learning entry
- `category` (enum, required): Error category (Complex Solution Bias, Feature Creep, Premature Implementation, Misalignment, Overtooling, Preference, Success, Other)
- `solution` (string, optional): How the issue was corrected
- `type` (enum, optional): Type of learning entry (mistake, preference, success)
- `sessionId` (string, optional): Session ID for state management

**Usage Examples**:
```
"Log this debugging approach for future reference"
"Record successful problem-solving pattern"
"Track common implementation mistakes"
```

### 🧘 Lotus Wisdom MCP Tools

#### lotuswisdom
**Purpose**: Problem-solving using Lotus Sutra wisdom framework with multiple approaches
**Schema**:
- `tag` (enum, required): Processing technique (upaya, expedient, direct, gradual, sudden, recognize, transform, integrate, transcend, embody, examine, reflect, verify, refine, complete, open, engage, transform, express, meditate, OUTPUT)
- `content` (string, required): Content of the current processing step
- `stepNumber` (integer, required): Current number in sequence (minimum: 1)
- `totalSteps` (integer, required): Estimated total steps needed (minimum: 1)
- `nextStepNeeded` (boolean, required): Whether another step is needed
- `isMeditation` (boolean, optional): Whether this step is a meditative pause
- `meditationDuration` (integer, optional): Duration for meditation in seconds (minimum: 1)

**Usage Examples**:
```
"Apply Lotus wisdom framework to analyze this architectural decision"
"Use multiple approaches to understand this complex problem"
"Transform confusion into clarity using wisdom techniques"
```

**Meditation Integration**:
- Set `isMeditation: true` for pause steps
- Use `meditationDuration` to specify pause length
- Combine with multiple `tag` values for comprehensive analysis

**Best Practices**:
- Use step-by-step process (open → engage → transform → express → OUTPUT)
- Include meditation pauses for complex problems
- Apply multiple wisdom techniques sequentially

### 🤔 Clear-Thought MCP Tools

#### sequentialthinking
**Purpose**: Dynamic and reflective problem-solving through structured thoughts
**Schema**:
- `thought` (string, required): Current thinking step
- `nextThoughtNeeded` (boolean, required): Whether another thought step is needed
- `thoughtNumber` (integer, required): Current thought number (minimum: 1)
- `totalThoughts` (integer, required): Estimated total thoughts needed (minimum: 1)
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought number is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Identifier for the current branch
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

**Usage Examples**:
```
"Break down this complex problem into sequential steps"
"Revise my previous approach based on new information"
"Branch into alternative solutions for this issue"
```

#### mentalmodel
**Purpose**: Application of structured mental models for problem-solving
**Schema**:
- `modelName` (enum, required): Mental model to apply (first_principles, opportunity_cost, error_propagation, rubber_duck, pareto_principle, occams_razor)
- `problem` (string, required): Problem to analyze
- `steps` (array, optional): Analysis steps
- `reasoning` (string, optional): Reasoning process
- `conclusion` (string, optional): Final conclusion

**Usage Examples**:
```
"Apply first principles thinking to this database optimization"
"Use opportunity cost analysis for feature prioritization"
"Apply Occam's razor to simplify this complex solution"
```

#### debuggingapproach
**Purpose**: Systematic debugging approaches for technical issues
**Schema**:
- `approachName` (enum, required): Debugging method (binary_search, reverse_engineering, divide_conquer, backtracking, cause_elimination, program_slicing)
- `issue` (string, required): Issue to debug
- `steps` (array, optional): Debugging steps
- `findings` (string, optional): Investigation findings
- `resolution` (string, optional): Final resolution

**Usage Examples**:
```
"Use binary search to isolate this performance issue"
"Apply divide and conquer to this complex bug"
"Use reverse engineering to understand this third-party API"
```

#### collaborativereasoning
**Purpose**: Simulated expert collaboration with diverse perspectives
**Schema**:
- `topic` (string, required): Topic for collaborative analysis
- `personas` (array, required): Expert personas with backgrounds
- `contributions` (array, required): Individual contributions
- `stage` (enum, required): Collaboration stage
- `activePersonaId` (string, required): Currently active persona
- `sessionId` (string, required): Unique session identifier
- `iteration` (integer, required): Current iteration number
- `nextContributionNeeded` (boolean, required): Whether another contribution is needed

**Usage Examples**:
```
"Get multiple expert perspectives on this architecture decision"
"Simulate team discussion for this design problem"
"Apply collaborative reasoning to this complex issue"
```

#### decisionframework
**Purpose**: Structured decision analysis and rational choice
**Schema**:
- `decisionStatement` (string, required): Decision to analyze
- `options` (array, required): Available options
- `criteria` (array, required): Evaluation criteria
- `analysisType` (enum, required): Analysis method
- `stage` (enum, required): Current analysis stage
- `decisionId` (string, required): Unique decision identifier
- `iteration` (integer, required): Current iteration
- `nextStageNeeded` (boolean, required): Whether another stage is needed

**Usage Examples**:
```
"Apply expected utility analysis to this investment decision"
"Use multi-criteria decision analysis for feature selection"
"Apply maximin strategy for risk management"
```

#### metacognitivemonitoring
**Purpose**: Self-monitoring of knowledge and reasoning quality
**Schema**:
- `task` (string, required): Task being monitored
- `stage` (enum, required): Current monitoring stage
- `overallConfidence` (number, required): Overall confidence level (0-1)
- `uncertaintyAreas` (array, required): Areas of uncertainty
- `recommendedApproach` (string, required): Recommended next steps
- `monitoringId` (string, required): Unique monitoring session ID
- `iteration` (integer, required): Current iteration
- `nextAssessmentNeeded` (boolean, required): Whether further assessment is needed

**Usage Examples**:
```
"Monitor my confidence in this technical solution"
"Assess knowledge gaps in this domain"
"Track reasoning quality throughout this analysis"
```

#### scientificmethod
**Purpose**: Formal scientific reasoning and hypothesis testing
**Schema**:
- `stage` (enum, required): Current scientific method stage
- `inquiryId` (string, required): Unique inquiry identifier
- `iteration` (integer, required): Current iteration
- `nextStageNeeded` (boolean, required): Whether another stage is needed

**Usage Examples**:
```
"Apply scientific method to test this performance hypothesis"
"Use hypothesis testing for this user behavior analysis"
"Apply experimental design to this feature validation"
```

#### structuredargumentation
**Purpose**: Dialectical reasoning and argument analysis
**Schema**:
- `claim` (string, required): Main claim to analyze
- `premises` (array, required): Supporting premises
- `conclusion` (string, required): Logical conclusion
- `argumentType` (enum, required): Type of argument
- `confidence` (number, required): Confidence in argument (0-1)
- `nextArgumentNeeded` (boolean, required): Whether another argument is needed

**Usage Examples**:
```
"Build structured argument for this architectural decision"
"Apply dialectical reasoning to this design debate"
"Analyze counterarguments for this proposed solution"
```

#### visualreasoning
**Purpose**: Visual thinking, problem-solving, and communication
**Schema**:
- `operation` (enum, required): Visual operation to perform
- `diagramId` (string, required): Unique diagram identifier
- `diagramType` (enum, required): Type of diagram
- `iteration` (integer, required): Current iteration
- `nextOperationNeeded` (boolean, required): Whether another operation is needed

**Usage Examples**:
```
"Create a flowchart for this complex process"
"Build a concept map for this system architecture"
"Transform this diagram to show alternative solutions"
```

## Usage Examples & Best Practices

### Query Examples for Gemini CLI

#### Mastra Documentation Queries
```
"Show me examples of creating custom tools in Mastra"
"Get the latest changelog for @mastra/mcp package"
"Find documentation about MCP client configuration"
"Show me how to use RuntimeContext in tools"
```

#### Tool Configuration Examples
```
"Create an MCP client for stock price and weather tools"
"Configure SSE transport for weather API"
"Set up stdio transport for local tools"
"Show me how to handle tool authentication"
```

### Best Practices

#### MCP Tool Usage Patterns
- **Sequential Processing**: Use tools in logical sequence (vibe_check → lotuswisdom → clear-thought tools)
- **Iterative Refinement**: Call tools multiple times with different parameters for deeper analysis
- **Context Preservation**: Maintain conversation context across tool calls
- **Error Recovery**: Handle tool failures gracefully and provide fallback approaches

#### Tool-Specific Best Practices

**Vibe-Check Tools:**
- Always include original user request for alignment checking
- Use thinking logs for comprehensive analysis
- Apply before major decisions or implementations
- Track patterns across multiple sessions

**Lotus Wisdom:**
- Use step-by-step process (open → engage → transform → express → OUTPUT)
- Include meditation pauses for complex problems
- Apply multiple wisdom techniques sequentially
- Set appropriate meditation durations (5-30 seconds)

**Clear-Thought Tools:**
- Choose appropriate tool for problem type (mentalmodel for analysis, debuggingapproach for issues)
- Use sequentialthinking for complex multi-step problems
- Apply metacognitivemonitoring for self-assessment
- Use collaborativereasoning for multi-perspective analysis

#### Integration Strategies
- **Tool Chaining**: Use output from one tool as input for another
- **Parallel Processing**: Run multiple tools simultaneously when appropriate
- **Conditional Logic**: Use tool results to determine next steps
- **Result Synthesis**: Combine insights from multiple tools for comprehensive solutions

#### Performance & Reliability
- **Timeout Management**: Set appropriate timeouts for long-running operations
- **Retry Logic**: Implement intelligent retry mechanisms for failed operations
- **Resource Monitoring**: Track tool usage and performance metrics
- **Fallback Mechanisms**: Provide alternative approaches when tools fail

### Clear-Thought Tools Usage Guidelines

#### ⚠️ CRITICAL: Always Iterate When Required
**When a clear-thought tool returns `nextStageNeeded: true` or `nextThoughtNeeded: true` or `nextAssessmentNeeded: true`, you MUST continue iterating with the same tool using the next logical parameters.**

**NEVER SKIP ITERATION** - This will result in:
- Incomplete analysis and missing insights
- Assumptions that lead to incorrect conclusions
- Gaps in understanding and documentation
- Suboptimal decision-making and problem-solving

#### Iteration Patterns by Tool Type

**Sequential Thinking:**
- Start with `thoughtNumber: 1, totalThoughts: estimated_number`
- Continue incrementing `thoughtNumber` until `nextThoughtNeeded: false`
- Update `totalThoughts` as you progress if needed
- Use `isRevision: true` and `revisesThought: X` when correcting previous thoughts

**Scientific Method:**
- Follow stages: observation → question → hypothesis → experiment → analysis → conclusion
- Each stage returns `nextStageNeeded: true` until conclusion
- Use same `inquiryId` across all iterations
- Increment `iteration` number for each call

**Meta-Cognitive Monitoring:**
- Continue with same `monitoringId` and increment `iteration`
- Stop only when `nextAssessmentNeeded: false`
- Use `suggestedAssessments` from previous response for next iteration

**Decision Framework:**
- Progress through stages: evaluation → analysis → recommendation
- Each stage returns `nextStageNeeded: true` until recommendation complete
- Use same `decisionId` and increment `iteration`

#### Common Iteration Mistakes to Avoid
- ❌ Stopping early when `nextXNeeded: true`
- ❌ Changing tool parameters incorrectly between iterations
- ❌ Not using the same session/decision/inquiry IDs
- ❌ Ignoring `suggestedNextTypes` or `suggestedAssessments`
- ❌ Not incrementing iteration counters properly

#### Best Practices for Tool Iteration
- ✅ Always check the `nextXNeeded` flag in responses
- ✅ Use consistent IDs across iterations (sessionId, monitoringId, decisionId, inquiryId)
- ✅ Increment iteration numbers appropriately
- ✅ Follow suggested next steps from tool responses
- ✅ Document each iteration's insights before moving to next
- ✅ Use tool results to inform subsequent tool usage

### Troubleshooting Tips
- **Connection Issues**: Check transport configuration (stdio vs SSE)
- **Authentication Errors**: Verify API keys and token formats
- **Tool Not Found**: Ensure server is running and tools are properly registered
- **Type Errors**: Update Zod schemas to match current API requirements

---

## AI Assistant Guidelines

When working with this codebase:

1. **Understand the Architecture**: This is a complex AI orchestration system with multiple specialized components
2. **Respect the Patterns**: Follow established patterns for agents, workflows, tools, and memory processors
3. **Maintain Type Safety**: All code must be fully typed with proper Zod validation
4. **Follow Research Ethics**: Ensure responsible AI practices and proper attribution
5. **Optimize Performance**: Consider token limits, caching, and resource usage
6. **Document Thoroughly**: Provide comprehensive documentation for all new features
7. **Test Extensively**: Ensure robust testing for AI-generated content and workflows

## Import References

## GEMINI.md Import Hierarchy

### Primary GEMINI.md Files (All imported by main GEMINI.md)
@/docs/GEMINI.md
@/src/mastra/GEMINI.md
@/src/mastra/agents/GEMINI.md
@/src/mastra/tools/GEMINI.md
@/src/mastra/workflows/GEMINI.md
@/docs/ARCHITECTURE_DIAGRAMS.md
@/docs/PROJECT_DOCUMENTATION.md

### Supporting Documentation Files
@README.md
@package.json
@.env.example
@tsconfig.json
@eslint.config.js
@/templates/agent-file-template.md
@/templates/plan-template.md
@/templates/spec-template.md
@/templates/task-template.md
@/.gemini/commands/specify.toml
@/.gemini/commands/plan.toml
@/.gemini/commands/task.toml
@/memory/constitution.md
@/memory/constitution_update_checklist.md
@/scripts/check-task-prerequisites.sh
@/scripts/common.sh
@/scripts/create-new-feature.sh
@/scripts/get-feature-paths.sh
@/scripts/setup-plan.sh
@/scripts/update-agent-context.sh
