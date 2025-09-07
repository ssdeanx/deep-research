# Research Workflows - Orchestrated Operations

## Workflows Overview
This directory contains 3 core workflows that orchestrate the research process in the Deep Research Assistant. Workflows provide structured, automated sequences of operations with human-in-the-loop approval capabilities.

## Workflow Architecture

### Base Workflow Pattern
All workflows follow a consistent architecture:
- **Declarative Definition**: Workflow DSL using `createWorkflow()` and `createStep()`
- **Step Orchestration**: Sequential and parallel execution support
- **State Management**: Workflow state persistence and recovery
- **Error Handling**: Comprehensive error recovery and logging
- **Human-in-the-Loop**: Interactive approval and refinement
- **Type Safety**: Full TypeScript typing with Zod validation

### Workflow Categories

#### 🔄 Comprehensive Research Workflow (`comprehensiveResearchWorkflow.ts`)
**Primary Function**: End-to-end research pipeline with human approval
**Process Flow**:
1. **Query Input**: Interactive user query collection and validation
2. **Web Research**: Multi-phase research execution across multiple agents
3. **Content Evaluation**: Relevance and quality assessment of findings
4. **Learning Extraction**: Key insights and pattern identification
5. **Data Consolidation**: Research data synthesis and organization
6. **RAG Processing**: Vector search and retrieval augmentation
7. **Content Synthesis**: Final content generation and structuring
8. **Report Creation**: Comprehensive report generation with formatting
9. **Human Approval**: Interactive approval workflow with refinement options

**Key Features**:
- Multi-agent coordination and communication
- Human-in-the-loop approval at critical decision points
- Comprehensive error handling and recovery
- Progress tracking and status reporting
- Result validation and quality assurance

#### 📝 Generate Report Workflow (`generateReportWorkflow.ts`)
**Primary Function**: Automated report generation from research data
**Process Flow**:
1. **Data Input**: Research data ingestion and validation
2. **Content Analysis**: Data structure and quality assessment
3. **Report Planning**: Report structure and outline generation
4. **Content Organization**: Information categorization and sequencing
5. **Report Generation**: Automated report creation with formatting
6. **Quality Review**: Generated content evaluation and refinement
7. **Finalization**: Report completion and delivery

**Key Features**:
- Template-based report generation
- Multiple output formats (Markdown, PDF, HTML)
- Content quality validation
- Automated formatting and styling
- Progress tracking and status updates

#### 🔍 Research Workflow (`researchWorkflow.ts`)
**Primary Function**: Basic research orchestration for simpler use cases
**Process Flow**:
1. **Query Processing**: User query analysis and optimization
2. **Web Search**: Targeted web content discovery
3. **Basic Evaluation**: Simple relevance and quality assessment
4. **Result Processing**: Content extraction and organization
5. **Summary Generation**: Basic report creation

**Key Features**:
- Streamlined research process
- Fast execution for simple queries
- Basic result validation
- Simple report formatting
- Resource-efficient processing

## Workflow Development Guidelines

### Workflow Creation Pattern
```typescript
// 1. Import required dependencies
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { researchAgent } from '../agents/researchAgent';
import { evaluationAgent } from '../agents/evaluationAgent';
import { learningExtractionAgent } from '../agents/learningExtractionAgent';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// 2. Define workflow steps - actual pattern from comprehensiveResearchWorkflow.ts
const getUserQueryStep = createStep({
  id: 'get-user-query',
  inputSchema: z.object({}),
  outputSchema: z.object({
    query: z.string(),
  }),
  resumeSchema: z.object({
    query: z.string(),
  }),
  suspendSchema: z.object({
    message: z.object({
      query: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        query: resumeData.query || '',
      };
    }

    await suspend({
      message: {
        query: 'What would you like to research?',
      },
    });

    return {
      query: '',
    };
  },
});

// 3. Create workflow definition
export const comprehensiveResearchWorkflow = createWorkflow({
  id: 'comprehensive-research-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    finalReport: z.string(),
    approved: z.boolean(),
  }),
  steps: [
    getUserQueryStep,
    // Other steps...
  ],
});

// 4. Define workflow control flow
comprehensiveResearchWorkflow
  .then(getUserQueryStep)
  .then(/* other steps */)
  .commit();
```

### Step Definition Pattern
```typescript
// Define individual workflow steps - actual pattern from implementation
const conductWebResearchStep = createStep({
  id: 'conduct-web-research',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    searchResults: z.array(z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    })),
    learnings: z.array(z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string(),
    })),
    completedQueries: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { query } = inputData;
    logger.info(`Starting web research for query: ${query}`);

    try {
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

      if (!result.object) {
        logger.warn(`researchAgent.generate did not return an object for query: ${query}`);
        return {
          searchResults: [],
          learnings: [],
          completedQueries: [],
        };
      }

      logger.info(`Web research completed for query: ${query}`);
      return {
        searchResults: result.object.searchResults,
        learnings: result.object.learnings,
        completedQueries: result.object.completedQueries,
      };
    } catch (error: any) {
      logger.error('Error in conductWebResearchStep', { error: error.message, stack: error.stack });
      return {
        searchResults: [],
        learnings: [],
        completedQueries: [],
      };
    }
  },
});
```

### Human-in-the-Loop Integration
```typescript
// Human approval step - actual pattern from implementation
const reportApprovalStep = createStep({
  id: 'report-approval',
  inputSchema: z.object({
    report: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    finalReport: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
  }),
  suspendSchema: z.object({
    message: z.string(),
    reportPreview: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { report } = inputData;
    const { approved } = resumeData ?? {};

    if (approved === undefined) {
      logger.info('Suspending for report approval.');
      await suspend({
        message: 'Review the generated report. Do you approve it? (true/false)',
        reportPreview: report.substring(0, 1000) + '...',
      });
      return { approved: false, finalReport: report };
    }

    logger.info(`Report approval received: ${approved}`);
    return {
      approved,
      finalReport: report,
    };
  },
});
```

## Workflow Execution Engine

### Execution Patterns
```typescript
// Synchronous execution
const result = await workflow.execute({
  inputData: { query: 'AI research trends' }
});

// Asynchronous execution with callbacks
const run = await workflow.createRunAsync();
const result = await run.start({
  inputData: { query: 'AI research trends' }
});

// Handle suspension for human input
if (result.status === 'suspended') {
  const resumeResult = await run.resume({
    step: 'human-approval',
    resumeData: { approved: true, feedback: 'Excellent work' }
  });
}
```

### State Management
```typescript
// Workflow state persistence - actual pattern from implementation
const workflowState = {
  id: 'workflow-run-123',
  status: 'running',
  currentStep: 'web-research',
  completedSteps: ['query-input'],
  pendingSteps: ['evaluation', 'report-generation'],
  data: {
    query: 'AI trends',
    researchResults: [...],
    metadata: { ... }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Error Recovery
```typescript
// Error handling and recovery - actual pattern from implementation
const workflowWithErrorHandling = createWorkflow({
  id: 'robust-research-workflow',
  errorHandling: {
    globalRetry: { attempts: 3, backoff: 'exponential' },
    stepFailures: {
      'web-research': { fallback: 'cached-research' },
      'report-generation': { skip: true, continue: true }
    },
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 60000
    }
  }
});
```

## Workflow Optimization

### Performance Optimization
- **Parallel Execution**: Concurrent step processing where possible
- **Caching Strategy**: Result caching for repeated operations
- **Batch Processing**: Optimized bulk data operations
- **Connection Pooling**: Efficient resource management
- **Rate Limiting**: API quota management
- **Lazy Evaluation**: Deferred computation for optional steps

### Memory Management
```typescript
// Memory-efficient workflow execution
const optimizedWorkflow = createWorkflow({
  id: 'memory-efficient-workflow',
  memoryManagement: {
    maxContextSize: 4000,
    compression: {
      enabled: true,
      algorithm: 'semantic-compression'
    },
    cleanup: {
      removeCompletedSteps: true,
      archiveOldRuns: true,
      retentionPeriod: 86400000 // 24 hours
    }
  }
});
```

## Quality Assurance

### Workflow Testing Strategy
- **Unit Tests**: Individual step functionality verification
- **Integration Tests**: End-to-end workflow execution
- **Performance Tests**: Execution time and resource usage
- **Reliability Tests**: Error handling and recovery
- **User Acceptance Tests**: Human-in-the-loop validation

### Testing Patterns
```typescript
describe('ComprehensiveResearchWorkflow', () => {
  it('should complete full research pipeline', async () => {
    const workflow = mastra.getWorkflow('comprehensive-research-workflow');
    const run = await workflow.createRunAsync();

    const result = await run.start({
      inputData: { query: 'test research topic' }
    });

    expect(result.status).toBe('success');
    expect(result.output.report).toBeDefined();
    expect(result.output.metadata.qualityScore).toBeGreaterThan(0.7);
  });

  it('should handle human approval correctly', async () => {
    const workflow = mastra.getWorkflow('comprehensive-research-workflow');
    const run = await workflow.createRunAsync();

    // Start workflow
    let result = await run.start({
      inputData: { query: 'test topic' }
    });

    // Handle suspension
    if (result.status === 'suspended') {
      result = await run.resume({
        step: 'human-approval',
        resumeData: { approved: true }
      });
    }

    expect(result.status).toBe('success');
  });
});
```

## Monitoring & Observability

### Workflow Metrics
- **Execution Time**: Total and per-step timing
- **Success Rate**: Workflow completion statistics
- **Step Performance**: Individual step efficiency
- **Error Patterns**: Failure analysis and trends
- **Resource Usage**: Memory and CPU consumption
- **User Interaction**: Approval and refinement patterns

### Tracing Integration
```typescript
// Tracing pattern from actual implementation
async execute(context: ToolContext): Promise<ToolResult> {
  const span = tracer.startSpan('workflow-execution', {
    attributes: {
      'workflow.name': this.name,
      'workflow.step': currentStep,
      'workflow.input': JSON.stringify(context)
    }
  });

  try {
    const result = await performOperation(context);
    span.setAttributes({
      'workflow.success': true,
      'workflow.result_size': JSON.stringify(result).length
    });
    return result;
  } catch (error) {
    span.setAttributes({
      'workflow.success': false,
      'workflow.error': error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

## Security Considerations

### Workflow Security
- **Input Validation**: Comprehensive parameter sanitization
- **Access Control**: Workflow execution permissions
- **Data Protection**: Sensitive information handling
- **Audit Logging**: Execution tracking and monitoring
- **Rate Limiting**: Abuse prevention mechanisms

### Human-in-the-Loop Security
```typescript
// Secure human approval process - actual pattern from implementation
const secureApprovalStep = {
  name: 'secure-human-approval',
  security: {
    authentication: {
      required: true,
      methods: ['oauth', 'api-key']
    },
    authorization: {
      roles: ['researcher', 'reviewer'],
      permissions: ['approve', 'reject', 'modify']
    },
    audit: {
      logActions: true,
      logData: false, // Don't log sensitive content
      retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
    }
  }
};
```

## Development Workflow

### Workflow Development Process
1. **Requirements Analysis**: Define workflow requirements and user stories
2. **Design Phase**: Create workflow diagram and step definitions
3. **Implementation**: Write workflow logic with error handling
4. **Integration**: Connect agents, tools, and external services
5. **Testing**: Comprehensive unit and integration testing
6. **Documentation**: Complete workflow documentation and examples
7. **Deployment**: Register workflow with Mastra framework

### Workflow Maintenance
1. **Performance Monitoring**: Track execution times and success rates
2. **User Feedback**: Incorporate user suggestions and improvements
3. **Step Optimization**: Improve individual step efficiency
4. **Error Pattern Analysis**: Identify and fix common failure points
5. **Feature Enhancement**: Add new capabilities based on user needs

## AI Assistant Guidelines for Workflow Development

When working with workflows:

1. **Understand Workflow Purpose**: Each workflow serves specific research needs
2. **Design for Reliability**: Include comprehensive error handling and recovery
3. **Optimize for Performance**: Efficient execution and resource usage
4. **Ensure User Experience**: Clear progress tracking and feedback
5. **Maintain Flexibility**: Support different execution modes and parameters
6. **Document Thoroughly**: Clear documentation for all workflow capabilities
7. **Test Extensively**: Robust testing for all execution paths
8. **Monitor Continuously**: Track performance and user satisfaction

## Import References

