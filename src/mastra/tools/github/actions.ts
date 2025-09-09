import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

export const listWorkflowRuns = createTool({
  id: 'listWorkflowRuns',
  description: 'Lists workflow runs for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    workflow_id: z.union([z.number(), z.string()]),
  }),
  execute: async (args: Readonly<{ context: Readonly<Record<string, unknown>>; tracingContext?: any }>) => {
    const { context, tracingContext } = args;

    // Safely coerce expected required params from the untyped context
    const owner = String((context as any).owner ?? '');
    const repo = String((context as any).repo ?? '');
    const workflow_id = (context as any).workflow_id as string | number | undefined;

    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_workflow_runs',
      input: { owner, repo, workflow_id }
    });

    try {
      // Build explicit params object to satisfy typed Octokit API
      const params: { owner: string; repo: string; workflow_id: string | number } = {
        owner,
        repo,
        workflow_id: workflow_id as string | number
      };

      const runs = await octokit.actions.listWorkflowRuns(params as any);
      logger.info('Workflow runs listed successfully');

      spanName?.end({
        output: { workflow_runs_count: runs.data.workflow_runs?.length || 0 },
        metadata: { operation: 'list_workflow_runs' }
      });
      return runs.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow runs');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_runs'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const run = await octokit.actions.getWorkflowRun(context);
      logger.info('Workflow run retrieved successfully');

      spanName?.end({
        output: { run_id: run.data.id, status: run.data.status },
        metadata: { operation: 'get_workflow_run' }
      });
      return run.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'cancel_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      await octokit.actions.cancelWorkflowRun(context);
      logger.info('Workflow run cancelled successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'cancel_workflow_run' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error cancelling workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'cancel_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'rerun_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      await octokit.actions.reRunWorkflow(context);
      logger.info('Workflow run reran successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'rerun_workflow_run' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error rerunning workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'rerun_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_jobs_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const jobs = await octokit.actions.listJobsForWorkflowRun(context);
      logger.info('Jobs for workflow run listed successfully');

      spanName?.end({
        output: { jobs_count: jobs.data.jobs?.length || 0 },
        metadata: { operation: 'list_jobs_for_workflow_run' }
      });
      return jobs.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing jobs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_jobs_for_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_job_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, job_id: context.job_id }
    });

    try {
      const job = await octokit.actions.getJobForWorkflowRun(context);
      logger.info('Job for workflow run retrieved successfully');

      spanName?.end({
        output: { job_id: job.data.id, status: job.data.status },
        metadata: { operation: 'get_job_for_workflow_run' }
      });
      return job.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting job for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_job_for_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'download_job_logs_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, job_id: context.job_id }
    });

    try {
      const logs = await octokit.actions.downloadJobLogsForWorkflowRun(context);
      logger.info('Job logs for workflow run downloaded successfully');

      spanName?.end({
        output: { logs_downloaded: true },
        metadata: { operation: 'download_job_logs_for_workflow_run' }
      });
      return logs;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading job logs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_job_logs_for_workflow_run'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_workflow_run_artifacts',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const artifacts = await octokit.actions.listWorkflowRunArtifacts(context);
      logger.info('Workflow run artifacts listed successfully');

      spanName?.end({
        output: { artifacts_count: artifacts.data.artifacts?.length || 0 },
        metadata: { operation: 'list_workflow_run_artifacts' }
      });
      return artifacts.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow run artifacts');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_run_artifacts'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'download_workflow_run_artifact',
      input: {
        owner: context.owner,
        repo: context.repo,
        artifact_id: context.artifact_id,
        archive_format: context.archive_format ?? 'zip'
      }
    });

    try {
      const params = { ...context, archive_format: context.archive_format ?? 'zip' };
      const artifact = await octokit.actions.downloadArtifact(params as any);
      logger.info('Workflow run artifact downloaded successfully');

      spanName?.end({
        output: { artifact_id: context.artifact_id, archive_format: params.archive_format },
        metadata: { operation: 'download_workflow_run_artifact' }
      });
      return artifact;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading workflow run artifact');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_workflow_run_artifact'
        }
      });
      throw error;
    }
  },
});
