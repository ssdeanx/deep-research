import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubSearch', level: 'info' });

export const searchCode = createTool({
  id: 'searchCode',
  description: 'Searches code.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Searching code with query: ${context.q}`);

    const searchSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'search_code',
      input: { query: context.q }
    });

    try {
      const result = await octokit.search.code(context);
      searchSpan?.end({ output: { total_count: result.data.total_count } });
      logger.info(`Found ${result.data.total_count} code search results`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search code: ${errorMessage}`);
      throw error;
    }
  },
});

export const searchIssuesAndPullRequests = createTool({
  id: 'searchIssuesAndPullRequests',
  description: 'Searches issues and pull requests.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Searching issues and pull requests with query: ${context.q}`);

    const searchSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'search_issues_prs',
      input: { query: context.q }
    });

    try {
      const result = await octokit.search.issuesAndPullRequests(context);
      searchSpan?.end({ output: { total_count: result.data.total_count } });
      logger.info(`Found ${result.data.total_count} issues/PR search results`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search issues/PRs: ${errorMessage}`);
      throw error;
    }
  },
});

export const searchRepositories = createTool({
  id: 'searchRepositories',
  description: 'Searches repositories.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Searching repositories with query: ${context.q}`);

    const searchSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'search_repositories',
      input: { query: context.q }
    });

    try {
      const result = await octokit.search.repos(context);
      searchSpan?.end({ output: { total_count: result.data.total_count } });
      logger.info(`Found ${result.data.total_count} repository search results`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search repositories: ${errorMessage}`);
      throw error;
    }
  },
});

export const searchUsers = createTool({
  id: 'searchUsers',
  description: 'Searches users.',
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Searching users with query: ${context.q}`);

    const searchSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'search_users',
      input: { query: context.q }
    });

    try {
      const result = await octokit.search.users(context);
      searchSpan?.end({ output: { total_count: result.data.total_count } });
      logger.info(`Found ${result.data.total_count} user search results`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search users: ${errorMessage}`);
      throw error;
    }
  },
});