import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const createIssue = createTool({
  id: 'createIssue',
  description: 'Creates a new issue in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    body: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const issue = await octokit.issues.create(context);
      logger.info('Issue created successfully', { issue: issue.data.number });
      return issue.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.info('Error creating issue');
      } else {
        logger.info('Unknown error creating issue', { error });
      }
      throw error;
    }
  },
});

export const getIssue = createTool({
  id: 'getIssue',
  description: 'Gets an issue from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const issue = await octokit.issues.get(context);
      logger.info('Issue retrieved successfully', { issue: issue.data.number });
      return issue.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.info( 'Error getting issue');
      } else {
        logger.info('Unknown error getting issue', { error });
      }
      throw error;
    }
  },
});

export const updateIssue = createTool({
  id: 'updateIssue',
  description: 'Updates an issue in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const issue = await octokit.issues.update(context);
      logger.info('Issue updated successfully', { issue: issue.data.number });
      return issue.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.info( 'Error updating issue');
      } else {
        logger.info('Unknown error updating issue', { error });
      }
      throw error;
    }
  },
});

export const listIssues = createTool({
  id: 'listIssues',
  description: 'Lists the issues for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const issues = await octokit.issues.listForRepo(context);
      logger.info('Issues listed successfully', { count: issues.data.length });
      return issues.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.info( 'Error listing issues');
      } else {
        logger.info('Unknown error listing issues', { error });
      }
      throw error;
    }
  },
});