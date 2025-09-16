import { createStep, createWorkflow } from '@mastra/core/workflows';
import { planningAgent } from '../agents/planningAgent';
import { monitorAgent } from '../agents/monitorAgent';
import { githubAgent } from '../agents/githubAgent';
import { z } from 'zod';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// Step 1: Get project details
const getProjectDetailsStep = createStep({
  id: 'get-project-details',
  inputSchema: z.object({}),
  outputSchema: z.object({
    projectName: z.string(),
    repositoryUrl: z.string(),
  }),
  resumeSchema: z.object({
    projectName: z.string(),
    repositoryUrl: z.string(),
  }),
  suspendSchema: z.object({
    message: z.object({
      projectName: z.string(),
      repositoryUrl: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        projectName: resumeData.projectName || '',
        repositoryUrl: resumeData.repositoryUrl || '',
      };
    }

    await suspend({
      message: {
        projectName: 'Enter the GitHub project name',
        repositoryUrl: 'Enter the GitHub repository URL',
      },
    });

    return {
      projectName: '',
      repositoryUrl: '',
    };
  },
});

// Step 2: Create project plan
const createProjectPlanStep = createStep({
  id: 'create-project-plan',
  inputSchema: z.object({
    projectName: z.string(),
    repositoryUrl: z.string(),
  }),
  outputSchema: z.object({
    plan: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { projectName, repositoryUrl } = inputData;

    try {
      const result = await planningAgent.generate([
        {
          role: 'user',
          content: `Create a detailed project plan for GitHub repository: ${repositoryUrl}
          Project: ${projectName}

          Include timeline, milestones, and resource requirements.`,
        },
      ]);

      return { plan: result.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error creating project plan', { error: message });
      return { plan: `Error: ${message}` };
    }
  },
});

// Step 3: Monitor repository
const monitorRepositoryStep = createStep({
  id: 'monitor-repository',
  inputSchema: z.object({
    repositoryUrl: z.string(),
    plan: z.string(),
  }),
  outputSchema: z.object({
    monitoringReport: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { repositoryUrl, plan } = inputData;

    try {
      const result = await monitorAgent.generate([
        {
          role: 'user',
          content: `Monitor the GitHub repository: ${repositoryUrl}
          Project Plan: ${plan}

          Provide health status, activity metrics, and progress tracking.`,
        },
      ]);
      return { monitoringReport: result.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error monitoring repository', { error: message });
      return { monitoringReport: `Error: ${message}` };
    }
  },
});

// Step 4: Generate GitHub tasks
const generateGithubTasksStep = createStep({
  id: 'generate-github-tasks',
  inputSchema: z.object({
    plan: z.string(),
    monitoringReport: z.string(),
  }),
  outputSchema: z.object({
    tasks: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { plan, monitoringReport } = inputData;

    try {
      const result = await githubAgent.generate([
        {
          role: 'user',
          content: `Based on the project plan and monitoring report, suggest GitHub tasks to create:

          Plan: ${plan}
          Monitoring: ${monitoringReport}

          Suggest issues, milestones, and project board items.`,
        },
      ]);
      return { tasks: result.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error generating GitHub tasks', { error: message });
      return { tasks: `Error: ${message}` };
    }
  },
});

// Define the workflow
export const githubPlanningWorkflow = createWorkflow({
  id: 'github-planning-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    plan: z.string(),
    monitoringReport: z.string(),
    tasks: z.string(),
  }),
  steps: [getProjectDetailsStep, createProjectPlanStep, monitorRepositoryStep, generateGithubTasksStep],
});

githubPlanningWorkflow
  .then(getProjectDetailsStep)
  .then(createProjectPlanStep)
  .then(monitorRepositoryStep)
  .then(generateGithubTasksStep)
  .commit();
