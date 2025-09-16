import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubChecks', level: 'info' });

logger.info(`Creating check run`);

const createCheckRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating check run')
}).strict();

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
  outputSchema: createCheckRunOutputSchema,
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
      return createCheckRunOutputSchema.parse({ status: 'success', data: checkRun.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_check_run'
        }
      });
      return createCheckRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getCheckRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable(),
    url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting check run')
}).strict();

export const getCheckRun = createTool({
  id: 'getCheckRun',
  description: 'Gets a check run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    check_run_id: z.number(),
  }),
  outputSchema: getCheckRunOutputSchema,
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
      return getCheckRunOutputSchema.parse({ status: 'success', data: checkRun.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_check_run'
        }
      });
      return getCheckRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updateCheckRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating check run')
}).strict();

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
  outputSchema: updateCheckRunOutputSchema,
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
      return updateCheckRunOutputSchema.parse({ status: 'success', data: checkRun.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_check_run'
        }
      });
      return updateCheckRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listCheckRunsForRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    check_runs: z.array(z.object({
      id: z.number(),
      name: z.string(),
      status: z.string()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error listing check runs for ref')
}).strict();

export const listCheckRunsForRef = createTool({
  id: 'listCheckRunsForRef',
  description: 'Lists check runs for a Git reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  outputSchema: listCheckRunsForRefOutputSchema,
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
      return listCheckRunsForRefOutputSchema.parse({ status: 'success', data: checkRuns.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_check_runs_for_ref'
        }
      });
      return listCheckRunsForRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listCheckSuitesForRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    check_suites: z.array(z.object({
      id: z.number(),
      status: z.string(),
      conclusion: z.string().nullable()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error listing check suites for ref')
}).strict();

export const listCheckSuitesForRef = createTool({
  id: 'listCheckSuitesForRef',
  description: 'Lists check suites for a Git reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  outputSchema: listCheckSuitesForRefOutputSchema,
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
      return listCheckSuitesForRefOutputSchema.parse({ status: 'success', data: checkSuites.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_check_suites_for_ref'
        }
      });
      return listCheckSuitesForRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getCheckSuiteOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting check suite')
}).strict();

export const getCheckSuite = createTool({
  id: 'getCheckSuite',
  description: 'Gets a check suite.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    check_suite_id: z.number(),
  }),
  outputSchema: getCheckSuiteOutputSchema,
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
      return getCheckSuiteOutputSchema.parse({ status: 'success', data: checkSuite.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_check_suite'
        }
      });
      return getCheckSuiteOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createCheckSuiteOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.string(),
    conclusion: z.string().nullable().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating check suite')
}).strict();

export const createCheckSuite = createTool({
  id: 'createCheckSuite',
  description: 'Creates a new check suite.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    head_sha: z.string(),
  }),
  outputSchema: createCheckSuiteOutputSchema,
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
      return createCheckSuiteOutputSchema.parse({ status: 'success', data: checkSuite.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_check_suite'
        }
      });
      return createCheckSuiteOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
