import { createStep, createWorkflow } from '@mastra/core/workflows';
import { researchWorkflow } from './researchWorkflow';
import { z } from 'zod';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// Map research output to report input and handle conditional logic
const processResearchResultStep = createStep({
  id: 'process-research-result',
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    // First determine if research was approved/successful
    const approved = inputData.approved && inputData.researchData !== undefined && inputData.researchData !== null;

    if (!approved) {
      logger.info('Research not approved or incomplete, ending workflow');
      return { completed: false };
    }

    // If approved, generate report
    try {
      logger.info('Generating report...');
      const agent = mastra.getAgent('reportAgent');
      const response = await agent.generate([
        {
          role: 'user',
          content: `Generate a report based on this research: ${JSON.stringify(inputData.researchData)}`,
        },
      ]);

      logger.info('Report generated successfully!');
      return { report: response.text, completed: true };
    } catch (error) {
      logger.error('Error generating report', { error });
      return { completed: false };
    }
  },
});

// Create the report generation workflow that iteratively researches and generates reports
export const generateReportWorkflow = createWorkflow({
  id: 'generate-report-workflow',
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({}),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
});

// The workflow logic:
// 1. Run researchWorkflow iteratively until approved
// 2. Process results and generate report if approved
generateReportWorkflow
  .dowhile(researchWorkflow, async ({ inputData }) => {
    const isCompleted = inputData.approved;
    return !isCompleted;
  })
  .then(processResearchResultStep)
  .commit();
