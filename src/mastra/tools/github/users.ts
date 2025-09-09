import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

export const getAuthenticatedUser = createTool({
  id: 'getAuthenticatedUser',
  description: 'Gets the authenticated user.',
  inputSchema: z.object({}),
  execute: async ({ tracingContext }: Readonly<{ context: any; tracingContext?: any }>) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_authenticated_user',
      input: {}
    });

    try {
      const user = await octokit.users.getAuthenticated();
      logger.info('Authenticated user retrieved successfully');

      spanName?.end({
        output: { username: user.data.login, user_id: user.data.id },
        metadata: { operation: 'get_authenticated_user' }
      });
      return user.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting authenticated user');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_authenticated_user'
        }
      });
      throw error;
    }
  },
});

export const getUser = createTool({
  id: 'getUser',
  description: 'Gets a user by username.',
  inputSchema: z.object({
    username: z.string(),
  }),
  execute: async ({ context, tracingContext }: Readonly<{ context: { username: string }; tracingContext?: any }>) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return user.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting user by username');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_user'
        }
      });
      throw error;
    }
  },
});

export const listUsers = createTool({
  id: 'listUsers',
  description: 'Lists all users.',
  inputSchema: z.object({
    since: z.number().optional(),
  }),
  execute: async ({ context, tracingContext }: Readonly<{ context: { since?: number }; tracingContext?: any }>) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_users',
      input: { since: context.since }
    });

    try {
      const users = await octokit.users.list(context);
      logger.info('Users listed successfully');

      spanName?.end({
        output: { users_count: users.data?.length || 0 },
        metadata: { operation: 'list_users' }
      });
      return users.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing users');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_users'
        }
      });
      throw error;
    }
  },
});
