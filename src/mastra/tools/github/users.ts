import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubUsers', level: 'info' });

const FullUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().optional(),
  type: z.string(),
  avatar_url: z.string(),
  url: z.string(),
  html_url: z.string(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  organizations_url: z.string(),
  repos_url: z.string(),
  events_url: z.string(),
  received_events_url: z.string(),
  site_admin: z.boolean(),
  gravatar_id: z.string(),
});

const SimpleUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
  url: z.string(),
  type: z.string(),
  site_admin: z.boolean(),
});

const GetAuthenticatedUserOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: FullUserSchema.optional(),
  errorMessage: z.string().optional().describe('Error getting authenticated user')
}).strict();

export const getAuthenticatedUser = createTool({
  id: 'getAuthenticatedUser',
  description: 'Gets the authenticated user.',
  inputSchema: z.object({
    action: z.enum(["get"]).describe("Action to get authenticated user"),
  }),
  outputSchema: GetAuthenticatedUserOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { action: "get" }; tracingContext?: unknown }>) => {
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_authenticated_user',
      input: {}
    });

    try {
      logger.info(`Executing action: ${context.action}`);
      const user = await octokit.users.getAuthenticated();
      logger.info('Authenticated user retrieved successfully');

      spanName?.end({
        output: { username: user.data.login, user_id: user.data.id },
        metadata: { operation: 'get_authenticated_user' }
      });
      return GetAuthenticatedUserOutputSchema.parse({ status: 'success', data: user.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting authenticated user');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_authenticated_user'
        }
      });
      return GetAuthenticatedUserOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const GetUserOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: FullUserSchema.optional(),
  errorMessage: z.string().optional().describe('Error getting user')
}).strict();

export const getUser = createTool({
  id: 'getUser',
  description: 'Gets a user by username.',
  inputSchema: z.object({
    username: z.string(),
  }),
  outputSchema: GetUserOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { username: string }; tracingContext?: unknown }>) => {
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_user',
      input: { username: context.username }
    });

    try {
      const user = await octokit.users.getByUsername(context);
      logger.info('User retrieved successfully');

      spanName?.end({
        output: { username: user.data.login, user_id: user.data.id },
        metadata: { operation: 'get_user' }
      });
      return GetUserOutputSchema.parse({ status: 'success', data: user.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting user by username');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_user'
        }
      });
      return GetUserOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListUsersOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(SimpleUserSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing users')
}).strict();

export const listUsers = createTool({
  id: 'listUsers',
  description: 'Lists all users.',
  inputSchema: z.object({
    since: z.number().optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
  }),
  outputSchema: ListUsersOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { since?: number; per_page?: number; page?: number }; tracingContext?: unknown }>) => {
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_users',
      input: { since: context.since, per_page: context.per_page, page: context.page }
    });

    try {
      const users = await octokit.users.list(context);
      logger.info('Users listed successfully');

      spanName?.end({
        output: { users_count: users.data?.length || 0 },
        metadata: { operation: 'list_users' }
      });
      return ListUsersOutputSchema.parse({ status: 'success', data: users.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing users');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_users'
        }
      });
      return ListUsersOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
