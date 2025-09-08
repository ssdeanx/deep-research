import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const getAuthenticatedUser = createTool({
  id: 'getAuthenticatedUser',
  description: 'Gets the authenticated user.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const user = await octokit.users.getAuthenticated();
      logger.info('Authenticated user retrieved successfully');
      return user.data;
    } catch (error: unknown) {
      logger.info('Error getting authenticated user');
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
  execute: async ({ context }) => {
    try {
      const user = await octokit.users.getByUsername(context);
      logger.info('User retrieved successfully');
      return user.data;
    } catch (error: unknown) {
      logger.info('Error getting user by username');
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
  execute: async ({ context }) => {
    try {
      const users = await octokit.users.list(context);
      logger.info('Users listed successfully');
      return users.data;
    } catch (error: unknown) {
      logger.info('Error listing users');
      throw error;
    }
  },
});