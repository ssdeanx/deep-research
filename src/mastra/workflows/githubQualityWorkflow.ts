import { createStep, createWorkflow } from '@mastra/core/workflows';
import { githubPlanningWorkflow } from './githubPlanningWorkflow';
import { qualityAssuranceAgent } from '../agents/qualityAssuranceAgent';
import { z } from 'zod';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// Process planning results for QA
const processPlanningResultsStep = createStep({
  id: 'process-planning-results',
  inputSchema: z.object({
    plan: z.string(),
    monitoringReport: z.string(),
    tasks: z.string(),
  }),
  outputSchema: z.object({
    qaAnalysis: z.string(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { plan, monitoringReport, tasks } = inputData;

    try {
      const result = await qualityAssuranceAgent.generate([
        {
          role: 'user',
          content: `Perform quality assurance analysis on this GitHub project planning:

          Project Plan: ${plan}
          Monitoring Report: ${monitoringReport}
          Generated Tasks: ${tasks}

          Assess quality, identify risks, and provide recommendations.`,
        },
      ]);

      return { qaAnalysis: result.text, completed: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error in QA analysis', { error: message });
      return { qaAnalysis: `Error: ${message}`, completed: false };
    }
  },
});

// Create the QA workflow that uses the planning workflow
export const githubQualityWorkflow = createWorkflow({
  id: 'github-quality-workflow',
  steps: [githubPlanningWorkflow, processPlanningResultsStep],
  inputSchema: z.object({}),
  outputSchema: z.object({
    plan: z.string(),
    monitoringReport: z.string(),
    tasks: z.string(),
    qaAnalysis: z.string(),
    completed: z.boolean(),
  }),
});

// The workflow logic:
// 1. Run githubPlanningWorkflow to get planning data
// 2. Process results with QA analysis
githubQualityWorkflow
  .then(githubPlanningWorkflow)
  .then(processPlanningResultsStep)
  .commit();
