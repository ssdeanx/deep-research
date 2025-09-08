import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';

export const searchCode = createTool({
  id: 'searchCode',
  description: 'Searches code.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await octokit.search.code(context);
    return result.data;
  },
});

export const searchIssuesAndPullRequests = createTool({
  id: 'searchIssuesAndPullRequests',
  description: 'Searches issues and pull requests.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await octokit.search.issuesAndPullRequests(context);
    return result.data;
  },
});

export const searchRepositories = createTool({
  id: 'searchRepositories',
  description: 'Searches repositories.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await octokit.search.repos(context);
    return result.data;
  },
});

export const searchUsers = createTool({
  id: 'searchUsers',
  description: 'Searches users.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await octokit.search.users(context);
    return result.data;
  },
});