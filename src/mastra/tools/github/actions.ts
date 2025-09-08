import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const listWorkflowRuns = createTool({
  id: 'listWorkflowRuns',
  description: 'Lists workflow runs for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    workflow_id: z.union([z.number(), z.string()]),
  }),
  execute: async ({ context }) => {
    try {
      const runs = await octokit.actions.listWorkflowRuns(context);
      logger.info('Workflow runs listed successfully');
      return runs.data;
    } catch (error: unknown) {
      logger.info('Error listing workflow runs');
      throw error;
    }
  },
});

export const getWorkflowRun = createTool({
  id: 'getWorkflowRun',
  description: 'Gets a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const run = await octokit.actions.getWorkflowRun(context);
      logger.info('Workflow run retrieved successfully');
      return run.data;
    } catch (error: unknown) {
      logger.info('Error getting workflow run');
      throw error;
    }
  },
});

export const cancelWorkflowRun = createTool({
  id: 'cancelWorkflowRun',
  description: 'Cancels a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.actions.cancelWorkflowRun(context);
      logger.info('Workflow run cancelled successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error cancelling workflow run');
      throw error;
    }
  },
});

export const rerunWorkflowRun = createTool({
  id: 'rerunWorkflowRun',
  description: 'Reruns a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.actions.reRunWorkflow(context);
      logger.info('Workflow run reran successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error rerunning workflow run');
      throw error;
    }
  },
});

export const listJobsForWorkflowRun = createTool({
  id: 'listJobsForWorkflowRun',
  description: 'Lists jobs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const jobs = await octokit.actions.listJobsForWorkflowRun(context);
      logger.info('Jobs for workflow run listed successfully');
      return jobs.data;
    } catch (error: unknown) {
      logger.info('Error listing jobs for workflow run');
      throw error;
    }
  },
});

export const getJobForWorkflowRun = createTool({
  id: 'getJobForWorkflowRun',
  description: 'Gets a job for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const job = await octokit.actions.getJobForWorkflowRun(context);
      logger.info('Job for workflow run retrieved successfully');
      return job.data;
    } catch (error: unknown) {
      logger.info('Error getting job for workflow run');
      throw error;
    }
  },
});

export const downloadJobLogsForWorkflowRun = createTool({
  id: 'downloadJobLogsForWorkflowRun',
  description: 'Downloads job logs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const logs = await octokit.actions.downloadJobLogsForWorkflowRun(context);
      logger.info('Job logs for workflow run downloaded successfully');
      return logs;
    } catch (error: unknown) {
      logger.info('Error downloading job logs for workflow run');
      throw error;
    }
  },
});

export const listWorkflowRunArtifacts = createTool({
  id: 'listWorkflowRunArtifacts',
  description: 'Lists artifacts for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const artifacts = await octokit.actions.listWorkflowRunArtifacts(context);
      logger.info('Workflow run artifacts listed successfully');
      return artifacts.data;
    } catch (error: unknown) {
      logger.info('Error listing workflow run artifacts');
      throw error;
    }
  },
});

export const downloadWorkflowRunArtifact = createTool({
  id: 'downloadWorkflowRunArtifact',
  description: 'Downloads a workflow run artifact.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    artifact_id: z.number(),
    archive_format: z.enum(['zip', 'tar']).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const params = { ...context, archive_format: context.archive_format ?? 'zip' };
      const artifact = await octokit.actions.downloadArtifact(params as any);
      logger.info('Workflow run artifact downloaded successfully');
      return artifact;
    } catch (error: unknown) {
      logger.info('Error downloading workflow run artifact');
      throw error;
    }
  },
});