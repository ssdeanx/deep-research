# Workflows Documentation

This document provides comprehensive documentation for the workflow system in the Mastra Deep Research platform, including the new GitHub-specific workflows.

## Overview

Workflows in Mastra are orchestrated sequences of operations that coordinate multiple agents, tools, and processes to accomplish complex tasks. The system supports both linear and non-linear workflow patterns with human-in-the-loop capabilities.

## Core Workflow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Workflow      │    │   Steps         │    │   Agents        │
│   Definition    │───►│   Execution     │───►│   Coordination  │
│                 │    │                 │    │                 │
│ • Input Schema  │    │ • Sequential    │    │ • Tool Access   │
│ • Output Schema │    │ • Parallel      │    │ • Memory Mgmt   │
│ • Error Handling│    │ • Conditional   │    │ • State Sync    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Existing Workflows

### Comprehensive Research Workflow
End-to-end research pipeline with human-in-the-loop approval.

**Process Flow:**
1. Query Input (Human)
2. Web Research (Research Agent)
3. Content Evaluation (Evaluation Agent)
4. Learning Extraction (Learning Extraction Agent)
5. Data Consolidation
6. RAG Processing
7. Content Synthesis
8. Report Creation (Report Agent)
9. Human Approval

### Generate Report Workflow
Automated report generation from research data.

**Features:**
- Research data processing
- Structured report formatting
- Content organization
- Executive summaries
- Detailed analysis sections

### Research Workflow
Basic research orchestration for simpler use cases.

**Capabilities:**
- Query processing
- Web search execution
- Basic result evaluation
- Simple report generation

## New GitHub Workflows

### GitHub Planning Workflow (`githubPlanningWorkflow`)

A multi-agent workflow for comprehensive GitHub project management that combines planning, monitoring, and task generation capabilities.

#### Overview
The GitHub Planning Workflow orchestrates three specialized agents to create comprehensive project plans, monitor repository health, and generate actionable GitHub tasks.

#### Workflow Steps

##### 1. Get Project Details (`get-project-details`)
**Purpose:** Interactive step to collect project information from user
**Input:** None (suspended for user input)
**Output:** `projectName`, `repositoryUrl`
**Behavior:** Suspends workflow execution to request project details from user

##### 2. Create Project Plan (`create-project-plan`)
**Agent:** Planning Agent
**Purpose:** Generate detailed project plan with timeline and milestones
**Input:** `projectName`, `repositoryUrl`
**Output:** `plan` (comprehensive project plan)
**Capabilities:**
- Timeline development
- Milestone identification
- Resource allocation planning
- Risk assessment
- Task breakdown and dependencies

##### 3. Monitor Repository (`monitor-repository`)
**Agent:** Monitor Agent
**Purpose:** Assess current repository health and activity
**Input:** `repositoryUrl`, `plan`
**Output:** `monitoringReport`
**Capabilities:**
- Health status analysis
- Activity metrics collection
- Performance monitoring
- Issue and PR tracking
- Code quality assessment

##### 4. Generate GitHub Tasks (`generate-github-tasks`)
**Agent:** GitHub Agent
**Purpose:** Create actionable GitHub tasks based on planning and monitoring
**Input:** `plan`, `monitoringReport`
**Output:** `tasks` (suggested issues, milestones, project board items)
**Capabilities:**
- Issue creation suggestions
- Milestone planning
- Project board organization
- Task prioritization
- Dependency mapping

#### Usage Example

```typescript
import { githubPlanningWorkflow } from './workflows/githubPlanningWorkflow';

const result = await githubPlanningWorkflow.execute({
  // Workflow will suspend for user input
});

// Handle suspension for project details
if (result.status === 'suspended') {
  // Resume with user-provided project information
  const resumeResult = await result.resume({
    projectName: 'My Awesome Project',
    repositoryUrl: 'https://github.com/user/my-awesome-project'
  });
}

console.log('Project Plan:', resumeResult.plan);
console.log('Monitoring Report:', resumeResult.monitoringReport);
console.log('Generated Tasks:', resumeResult.tasks);
```

#### Output Structure

```json
{
  "plan": "Comprehensive project plan with timeline, milestones, and resource allocation...",
  "monitoringReport": "Repository health assessment, activity metrics, and recommendations...",
  "tasks": "Suggested GitHub issues, milestones, and project board items..."
}
```

### GitHub Quality Workflow (`githubQualityWorkflow`)

A quality-focused workflow that combines planning capabilities with comprehensive quality assurance analysis.

#### Overview
The GitHub Quality Workflow extends the planning workflow by adding quality assurance analysis to ensure project plans meet quality standards and identify potential risks.

#### Workflow Steps

##### 1. GitHub Planning Workflow (Nested)
**Purpose:** Execute complete planning workflow
**Input:** None (will suspend for project details)
**Output:** `plan`, `monitoringReport`, `tasks`

##### 2. Process Planning Results (`process-planning-results`)
**Agent:** Quality Assurance Agent
**Purpose:** Perform comprehensive QA analysis on planning results
**Input:** `plan`, `monitoringReport`, `tasks`
**Output:** `qaAnalysis`, `completed`
**Capabilities:**
- Quality assessment of project plans
- Risk identification and mitigation
- Process improvement recommendations
- Compliance checking
- Quality metrics evaluation

#### Usage Example

```typescript
import { githubQualityWorkflow } from './workflows/githubQualityWorkflow';

const result = await githubQualityWorkflow.execute({
  // Will suspend for project details input
});

// Handle initial suspension for project details
if (result.status === 'suspended') {
  const resumeResult = await result.resume({
    projectName: 'Quality-Focused Project',
    repositoryUrl: 'https://github.com/org/quality-project'
  });
}

console.log('QA Analysis:', resumeResult.qaAnalysis);
console.log('Completed:', resumeResult.completed);
```

#### Output Structure

```json
{
  "plan": "Project plan from planning workflow...",
  "monitoringReport": "Repository monitoring results...",
  "tasks": "Generated GitHub tasks...",
  "qaAnalysis": "Comprehensive quality assessment, risk analysis, and recommendations...",
  "completed": true
}
```

## Workflow Patterns

### Sequential Execution
Steps execute in order, with each step receiving output from the previous step.

```typescript
workflow
  .then(step1)
  .then(step2)
  .then(step3)
  .commit();
```

### Parallel Execution
Multiple steps can execute simultaneously when they don't depend on each other.

```typescript
workflow
  .then([step1, step2, step3]) // Parallel execution
  .then(step4)
  .commit();
```

### Conditional Branching
Workflows can branch based on conditions or step results.

```typescript
workflow
  .then(step1)
  .then((result) => {
    if (result.condition) {
      return step2a;
    } else {
      return step2b;
    }
  })
  .commit();
```

### Human-in-the-Loop
Workflows can suspend execution to request human input or approval.

```typescript
const step = createStep({
  suspendSchema: z.object({
    message: z.string()
  }),
  execute: async ({ suspend }) => {
    await suspend({
      message: 'Please provide additional information'
    });
  }
});
```

## Workflow Configuration

### Input/Output Schemas
Define data structures for workflow inputs and outputs using Zod schemas.

```typescript
const workflow = createWorkflow({
  id: 'custom-workflow',
  inputSchema: z.object({
    query: z.string(),
    options: z.object({
      depth: z.enum(['shallow', 'deep'])
    })
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    summary: z.string()
  })
});
```

### Error Handling
Workflows support comprehensive error handling and recovery.

```typescript
const step = createStep({
  execute: async ({ inputData }) => {
    try {
      // Step logic
      return { result: 'success' };
    } catch (error) {
      // Error handling
      return { error: error.message };
    }
  }
});
```

### State Management
Workflows maintain state across steps and support resumability.

```typescript
const workflow = createWorkflow({
  // Workflow configuration
});

const run = await workflow.createRunAsync();
const result = await run.start({ inputData: {} });

// Resume if suspended
if (result.status === 'suspended') {
  const resumeResult = await run.resume({
    step: 'suspended-step',
    resumeData: { userInput: 'data' }
  });
}
```

## Best Practices

### 1. Workflow Design
- Keep workflows focused on specific use cases
- Design for resumability and error recovery
- Use clear, descriptive step names
- Document input/output schemas thoroughly

### 2. Error Handling
- Implement comprehensive error handling in each step
- Use appropriate error schemas for different error types
- Provide meaningful error messages
- Design workflows to be resilient to failures

### 3. Human-in-the-Loop
- Use suspensions strategically for critical decisions
- Provide clear instructions for required inputs
- Validate user inputs before resuming
- Consider user experience in suspension design

### 4. Performance Optimization
- Minimize unnecessary data transfer between steps
- Use parallel execution when possible
- Implement caching for expensive operations
- Monitor workflow performance metrics

### 5. Testing and Validation
- Test workflows end-to-end
- Validate input/output schemas
- Test error conditions and recovery
- Document workflow behavior and edge cases

## Integration Examples

### REST API Integration

```typescript
app.post('/api/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { inputData } = req.body;

    const workflow = mastra.getWorkflow(workflowId);
    const run = await workflow.createRunAsync();
    const result = await run.start({ inputData });

    if (result.status === 'suspended') {
      return res.status(202).json({
        status: 'suspended',
        runId: run.id,
        suspendData: result.suspendData
      });
    }

    res.json({
      status: 'completed',
      result: result.output
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
```

### Workflow Monitoring

```typescript
class WorkflowMonitor {
  private activeWorkflows = new Map();

  async trackWorkflow(workflowId: string, run: WorkflowRun) {
    this.activeWorkflows.set(workflowId, {
      startTime: Date.now(),
      run,
      steps: []
    });

    run.on('step-completed', (stepResult) => {
      this.recordStepCompletion(workflowId, stepResult);
    });

    run.on('completed', (result) => {
      this.recordWorkflowCompletion(workflowId, result);
    });
  }

  private recordStepCompletion(workflowId: string, stepResult: any) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.steps.push({
        stepId: stepResult.stepId,
        duration: Date.now() - workflow.startTime,
        success: stepResult.success
      });
    }
  }
}
```

---

*This workflows documentation provides comprehensive guidance for implementing and using the workflow system in the Mastra Deep Research platform, with detailed examples of the new GitHub-specific workflows.*