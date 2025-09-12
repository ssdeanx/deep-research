import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listWorkflowRunsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    name: z.string(),
    status: z.enum(['queued', 'in_progress', 'completed', 'cancelled'])
  })).optional(),
  errorMessage: z.string().optional().describe('Error in listing workflow runs')
}).strict();

export const listWorkflowRuns = createTool({
  id: 'listWorkflowRuns',
  description: 'Lists workflow runs for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    workflow_id: z.union([z.number(), z.string()]),
  }),
  outputSchema: listWorkflowRunsOutputSchema,
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
      return listWorkflowRunsOutputSchema.parse({ status: 'success', data: runs.data.workflow_runs });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow runs');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_runs'
        }
      });
      return listWorkflowRunsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable(),
    run_number: z.number(),
    created_at: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting workflow run details')
}).strict();

export const getWorkflowRun = createTool({
  id: 'getWorkflowRun',
  description: 'Gets a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: getWorkflowRunOutputSchema,
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
      return getWorkflowRunOutputSchema.parse({ status: 'success', data: run.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_workflow_run'
        }
      });
      return getWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const cancelWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }),
  errorMessage: z.string().optional().describe('Error in cancelling workflow run')
}).strict();

export const cancelWorkflowRun = createTool({
  id: 'cancelWorkflowRun',
  description: 'Cancels a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: cancelWorkflowRunOutputSchema,
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
      return cancelWorkflowRunOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error cancelling workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'cancel_workflow_run'
        }
      });
      return cancelWorkflowRunOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});

const rerunWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }),
  errorMessage: z.string().optional().describe('Error rerunning workflow run')
}).strict();

export const rerunWorkflowRun = createTool({
  id: 'rerunWorkflowRun',
  description: 'Reruns a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: rerunWorkflowRunOutputSchema,
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
      return rerunWorkflowRunOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error rerunning workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'rerun_workflow_run'
        }
      });
      return rerunWorkflowRunOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});

const listJobsForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable(),
    started_at: z.string().optional()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing jobs for workflow run')
}).strict();

export const listJobsForWorkflowRun = createTool({
  id: 'listJobsForWorkflowRun',
  description: 'Lists jobs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: listJobsForWorkflowRunOutputSchema,
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
      return listJobsForWorkflowRunOutputSchema.parse({ status: 'success', data: jobs.data.jobs  });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing jobs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_jobs_for_workflow_run'
        }
      });
      return listJobsForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getJobForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable(),
    completed_at: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting job details')
}).strict();

export const getJobForWorkflowRun = createTool({
  id: 'getJobForWorkflowRun',
  description: 'Gets a job for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  outputSchema: getJobForWorkflowRunOutputSchema,
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
      return getJobForWorkflowRunOutputSchema.parse({ status: 'success', data: job.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting job for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_job_for_workflow_run'
        }
      });
      return getJobForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const downloadJobLogsForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.unknown().optional(),
  errorMessage: z.string().optional().describe('Error downloading job logs')
}).strict();

export const downloadJobLogsForWorkflowRun = createTool({
  id: 'downloadJobLogsForWorkflowRun',
  description: 'Downloads job logs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  outputSchema: downloadJobLogsForWorkflowRunOutputSchema,
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
      return downloadJobLogsForWorkflowRunOutputSchema.parse({ status: 'success', data: logs });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading job logs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_job_logs_for_workflow_run'
        }
      });
      return downloadJobLogsForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listWorkflowRunArtifactsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    name: z.string(),
    size_in_bytes: z.number(),
    created_at: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing workflow run artifacts')
}).strict();

export const listWorkflowRunArtifacts = createTool({
  id: 'listWorkflowRunArtifacts',
  description: 'Lists artifacts for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: listWorkflowRunArtifactsOutputSchema,
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
      return listWorkflowRunArtifactsOutputSchema.parse({ status: 'success', data: artifacts.data.artifacts });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow run artifacts');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_run_artifacts'
        }
      });
      return listWorkflowRunArtifactsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const downloadWorkflowRunArtifactOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.unknown().optional(),
  errorMessage: z.string().optional().describe('Error downloading workflow run artifact')
}).strict();

export const downloadWorkflowRunArtifact = createTool({
  id: 'downloadWorkflowRunArtifact',
  description: 'Downloads a workflow run artifact.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    artifact_id: z.number(),
    archive_format: z.enum(['zip', 'tar']).optional(),
  }),
  outputSchema: downloadWorkflowRunArtifactOutputSchema,
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
      const artifact = await octokit.actions.downloadArtifact(params);
      logger.info('Workflow run artifact downloaded successfully');

      spanName?.end({
        output: { artifact_id: context.artifact_id, archive_format: params.archive_format },
        metadata: { operation: 'download_workflow_run_artifact' }
      });
      return downloadWorkflowRunArtifactOutputSchema.parse({ status: 'success', data: artifact });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading workflow run artifact');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_workflow_run_artifact'
        }
      });
      return downloadWorkflowRunArtifactOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
