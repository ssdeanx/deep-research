import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';

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
  execute: async ({ context }) => {
    const checkRun = await octokit.checks.create(context);
    return checkRun.data;
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
  execute: async ({ context }) => {
    const checkRun = await octokit.checks.get(context);
    return checkRun.data;
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
  execute: async ({ context }) => {
    const checkRun = await octokit.checks.update(context);
    return checkRun.data;
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
  execute: async ({ context }) => {
    const checkRuns = await octokit.checks.listForRef(context);
    return checkRuns.data;
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
  execute: async ({ context }) => {
    const checkSuites = await octokit.checks.listSuitesForRef(context);
    return checkSuites.data;
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
  execute: async ({ context }) => {
    const checkSuite = await octokit.checks.getSuite(context);
    return checkSuite.data;
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
  execute: async ({ context }) => {
    const checkSuite = await octokit.checks.createSuite(context);
    return checkSuite.data;
  },
});