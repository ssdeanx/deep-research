import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const getOrganization = createTool({
  id: 'getOrganization',
  description: 'Gets an organization by name.',
  inputSchema: z.object({
    org: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const org = await octokit.orgs.get(context);
      logger.info('Organization retrieved successfully');
      return org.data;
    } catch (error: unknown) {
      logger.info('Error getting organization');
      throw error;
    }
  },
});

export const listOrganizations = createTool({
  id: 'listOrganizations',
  description: 'Lists all organizations.',
  inputSchema: z.object({
    since: z.number().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const orgs = await octokit.orgs.list(context);
      logger.info('Organizations listed successfully');
      return orgs.data;
    } catch (error: unknown) {
      logger.info('Error listing organizations');
      throw error;
    }
  },
});

export const listOrganizationMembers = createTool({
  id: 'listOrganizationMembers',
  description: 'Lists members of an organization.',
  inputSchema: z.object({
    org: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const members = await octokit.orgs.listMembers(context);
      logger.info('Organization members listed successfully');
      return members.data;
    } catch (error: unknown) {
      logger.info('Error listing organization members');
      throw error;
    }
  },
});