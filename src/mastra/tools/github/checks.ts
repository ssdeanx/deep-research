import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubChecks', level: 'info' });

logger.info(`Creating check run`);

export const createCheckRun = createTool({
  id: 'createCheckRun',
  description: 'Creates a new check run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    name: z.string(),
    head_sha: z.string(),
    status: z.enum(['queued', 'in_progress', 'completed']).optional(),
    conclusion: z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required']).optional(),
    started_at: z.string().optional(),
    completed_at: z.string().optional(),
    output: z.object({
      title: z.string(),
      summary: z.string(),
      text: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      // Log the creation of the check run
      type: AISpanType.GENERIC,
      name: 'create_check_run',
      input: {
        owner: context.owner,
        repo: context.repo,
        name: context.name,
        head_sha: context.head_sha,
        status: context.status,
        conclusion: context.conclusion
      }
    });

    try {
      const checkRun = await octokit.checks.create(context);

      spanName?.end({
        output: { check_run_id: checkRun.data.id, status: checkRun.data.status },
        metadata: { operation: 'create_check_run' }
      });
      return checkRun.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_check_run'
        }
      });
      throw error;
    }
  },
});

export const getCheckRun = createTool({
  id: 'getCheckRun',
  description: 'Gets a check run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    check_run_id: z.number(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_check_run',
      input: { owner: context.owner, repo: context.repo, check_run_id: context.check_run_id }
    });

    try {
      const checkRun = await octokit.checks.get(context);

      spanName?.end({
        output: { check_run_id: checkRun.data.id, status: checkRun.data.status },
        metadata: { operation: 'get_check_run' }
      });
      return checkRun.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_check_run'
        }
      });
      throw error;
    }
  },
});

export const updateCheckRun = createTool({
  id: 'updateCheckRun',
  description: 'Updates a check run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    check_run_id: z.number(),
    name: z.string().optional(),
    status: z.enum(['queued', 'in_progress', 'completed']).optional(),
    conclusion: z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required']).optional(),
    started_at: z.string().optional(),
    completed_at: z.string().optional(),
    output: z.object({
      title: z.string(),
      summary: z.string(),
      text: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_check_run',
      input: {
        owner: context.owner,
        repo: context.repo,
        check_run_id: context.check_run_id,
        name: context.name,
        status: context.status,
        conclusion: context.conclusion
      }
    });

    try {
      const checkRun = await octokit.checks.update(context);

      spanName?.end({
        output: { check_run_id: checkRun.data.id, status: checkRun.data.status },
        metadata: { operation: 'update_check_run' }
      });
      return checkRun.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_check_run'
        }
      });
      throw error;
    }
  },
});

export const listCheckRunsForRef = createTool({
  id: 'listCheckRunsForRef',
  description: 'Lists check runs for a Git reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_check_runs_for_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref }
    });

    try {
      const checkRuns = await octokit.checks.listForRef(context);

      spanName?.end({
        output: { check_runs_count: checkRuns.data.check_runs?.length || 0 },
        metadata: { operation: 'list_check_runs_for_ref' }
      });
      return checkRuns.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_check_runs_for_ref'
        }
      });
      throw error;
    }
  },
});

export const listCheckSuitesForRef = createTool({
  id: 'listCheckSuitesForRef',
  description: 'Lists check suites for a Git reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_check_suites_for_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref }
    });

    try {
      const checkSuites = await octokit.checks.listSuitesForRef(context);

      spanName?.end({
        output: { check_suites_count: checkSuites.data.check_suites?.length || 0 },
        metadata: { operation: 'list_check_suites_for_ref' }
      });
      return checkSuites.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_check_suites_for_ref'
        }
      });
      throw error;
    }
  },
});

export const getCheckSuite = createTool({
  id: 'getCheckSuite',
  description: 'Gets a check suite.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    check_suite_id: z.number(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_check_suite',
      input: { owner: context.owner, repo: context.repo, check_suite_id: context.check_suite_id }
    });

    try {
      const checkSuite = await octokit.checks.getSuite(context);

      spanName?.end({
        output: { check_suite_id: checkSuite.data.id, status: checkSuite.data.status },
        metadata: { operation: 'get_check_suite' }
      });
      return checkSuite.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_check_suite'
        }
      });
      throw error;
    }
  },
});

export const createCheckSuite = createTool({
  id: 'createCheckSuite',
  description: 'Creates a new check suite.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    head_sha: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_check_suite',
      input: { owner: context.owner, repo: context.repo, head_sha: context.head_sha }
    });

    try {
      const checkSuite = await octokit.checks.createSuite(context);

      spanName?.end({
        output: { check_suite_id: checkSuite.data.id, status: checkSuite.data.status },
        metadata: { operation: 'create_check_suite' }
      });
      return checkSuite.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_check_suite'
        }
      });
      throw error;
    }
  },
});
