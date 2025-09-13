import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubSearch', level: 'info' });

const searchCodeOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    total_count: z.number(),
    incomplete_results: z.boolean(),
    items: z.array(z.object({
      name: z.string(),
      path: z.string(),
      sha: z.string(),
      url: z.string().url(),
      html_url: z.string().url()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error searching code')
}).strict();

export const searchCode = createTool({
  id: 'searchCode',
  description: 'Searches code.',
  inputSchema: z.object({
    q: z.string(),
  }),
  outputSchema: searchCodeOutputSchema,
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
      return searchCodeOutputSchema.parse({ status: 'success', data: result.data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search code: ${errorMessage}`);
      return searchCodeOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const searchIssuesAndPullRequestsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    total_count: z.number(),
    incomplete_results: z.boolean(),
    items: z.array(z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      state: z.string(),
      html_url: z.string().url()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error searching issues and pull requests')
}).strict();

export const searchIssuesAndPullRequests = createTool({
  id: 'searchIssuesAndPullRequests',
  description: 'Searches issues and pull requests.',
  inputSchema: z.object({
    q: z.string(),
  }),
  outputSchema: searchIssuesAndPullRequestsOutputSchema,
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
      return searchIssuesAndPullRequestsOutputSchema.parse({ status: 'success', data: result.data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search issues/PRs: ${errorMessage}`);
      return searchIssuesAndPullRequestsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const searchRepositoriesOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    total_count: z.number(),
    incomplete_results: z.boolean(),
    items: z.array(z.object({
      id: z.number(),
      name: z.string(),
      full_name: z.string(),
      html_url: z.string().url()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error searching repositories')
}).strict();

export const searchRepositories = createTool({
  id: 'searchRepositories',
  description: 'Searches repositories.',
  inputSchema: z.object({
    q: z.string(),
  }),
  outputSchema: searchRepositoriesOutputSchema,
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
      return searchRepositoriesOutputSchema.parse({ status: 'success', data: result.data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search repositories: ${errorMessage}`);
      return searchRepositoriesOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const searchUsersOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    total_count: z.number(),
    incomplete_results: z.boolean(),
    items: z.array(z.object({
      login: z.string(),
      id: z.number(),
      avatar_url: z.string().url(),
      html_url: z.string().url()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error searching users')
}).strict();

export const searchUsers = createTool({
  id: 'searchUsers',
  description: 'Searches users.',
  inputSchema: z.object({
    q: z.string(),
  }),
  outputSchema: searchUsersOutputSchema,
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
      return searchUsersOutputSchema.parse({ status: 'success', data: result.data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      searchSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to search users: ${errorMessage}`);
      return searchUsersOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

