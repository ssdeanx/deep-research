import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';

export const listPullRequests = createTool({
  id: 'listPullRequests',
  description: 'Lists pull requests for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  execute: async ({ context }) => {
    const prs = await octokit.pulls.list(context);
    return prs.data;
  },
});

export const getPullRequest = createTool({
  id: 'getPullRequest',
  description: 'Gets a pull request from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
  }),
  execute: async ({ context }) => {
    const pr = await octokit.pulls.get(context);
    return pr.data;
  },
});

export const createPullRequest = createTool({
  id: 'createPullRequest',
  description: 'Creates a new pull request in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    head: z.string(),
    base: z.string(),
    body: z.string().optional(),
    draft: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    const pr = await octokit.pulls.create(context);
    return pr.data;
  },
});

export const updatePullRequest = createTool({
  id: 'updatePullRequest',
  description: 'Updates a pull request in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
  }),
  execute: async ({ context }) => {
    const pr = await octokit.pulls.update(context);
    return pr.data;
  },
});

export const mergePullRequest = createTool({
  id: 'mergePullRequest',
  description: 'Merges a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
    commit_title: z.string().optional(),
    commit_message: z.string().optional(),
    merge_method: z.enum(['merge', 'squash', 'rebase']).optional(),
  }),
  execute: async ({ context }) => {
    const result = await octokit.pulls.merge(context);
    return result.data;
  },
});

export const listPullRequestComments = createTool({
  id: 'listPullRequestComments',
  description: 'Lists comments on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(), // Changed from pull_number to issue_number
  }),
  execute: async ({ context }) => {
    const comments = await octokit.issues.listComments(context);
    return comments.data;
  },
});

export const createPullRequestComment = createTool({
  id: 'createPullRequestComment',
  description: 'Creates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(), // Changed from pull_number to issue_number
    body: z.string(),
  }),
  execute: async ({ context }) => {
    const comment = await octokit.issues.createComment(context);
    return comment.data;
  },
});

export const updatePullRequestComment = createTool({
  id: 'updatePullRequestComment',
  description: 'Updates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    body: z.string(),
  }),
  execute: async ({ context }) => {
    const comment = await octokit.issues.updateComment(context);
    return comment.data;
  },
});

export const deletePullRequestComment = createTool({
  id: 'deletePullRequestComment',
  description: 'Deletes a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  execute: async ({ context }) => {
    await octokit.issues.deleteComment(context);
    return { success: true };
  },
});
