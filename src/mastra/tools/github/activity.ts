import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const listRepoEvents = createTool({
  id: 'listRepoEvents',
  description: 'Lists events for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const events = await octokit.activity.listRepoEvents(context);
      logger.info('Repository events listed successfully');
      return events.data;
    } catch (error: unknown) {
      logger.info('Error listing repository events');
      throw error;
    }
  },
});

export const listPublicEvents = createTool({
  id: 'listPublicEvents',
  description: 'Lists public events.',
  inputSchema: z.object({
    per_page: z.number().optional(),
    page: z.number().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const events = await octokit.activity.listPublicEvents(context);
      logger.info('Public events listed successfully');
      return events.data;
    } catch (error: unknown) {
      logger.info('Error listing public events');
      throw error;
    }
  },
});

export const listRepoNotifications = createTool({
  id: 'listRepoNotifications',
  description: 'Lists notifications for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    all: z.boolean().optional(),
    participating: z.boolean().optional(),
    since: z.string().optional(),
    before: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const notifications = await octokit.request('GET /repos/{owner}/{repo}/notifications', context);
      logger.info('Repository notifications listed successfully');
      return notifications.data;
    } catch (error: unknown) {
      logger.info('Error listing repository notifications');
      throw error;
    }
  },
});

export const markRepoNotificationsAsRead = createTool({
  id: 'markRepoNotificationsAsRead',
  description: 'Marks notifications as read for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    last_read_at: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.activity.markRepoNotificationsAsRead(context);
      logger.info('Repository notifications marked as read successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error marking repository notifications as read');
      throw error;
    }
  },
});

export const getRepoSubscription = createTool({
  id: 'getRepoSubscription',
  description: 'Gets a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const subscription = await octokit.activity.getRepoSubscription(context);
      logger.info('Repository subscription retrieved successfully');
      return subscription.data;
    } catch (error: unknown) {
      logger.info('Error getting repository subscription');
      throw error;
    }
  },
});

export const setRepoSubscription = createTool({
  id: 'setRepoSubscription',
  description: 'Sets a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    subscribed: z.boolean().optional(),
    ignored: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const subscription = await octokit.activity.setRepoSubscription(context);
      logger.info('Repository subscription set successfully');
      return subscription.data;
    } catch (error: unknown) {
      logger.info('Error setting repository subscription');
      throw error;
    }
  },
});

export const deleteRepoSubscription = createTool({
  id: 'deleteRepoSubscription',
  description: 'Deletes a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.activity.deleteRepoSubscription(context);
      logger.info('Repository subscription deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting repository subscription');
      throw error;
    }
  },
});