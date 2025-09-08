import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const listRepositories = createTool({
  id: 'listRepositories',
  description: 'Lists the repositories for the authenticated user.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const repos = await octokit.repos.listForAuthenticatedUser();
      logger.info('Repositories listed successfully'); // Corrected logging as per user's instruction
      return repos.data;
    } catch (error: unknown) {
      logger.info('Error listing repositories'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const createRepository = createTool({
  id: 'createRepository',
  description: 'Creates a new repository for the authenticated user.',
  inputSchema: z.object({
    name: z.string(),
    description: z.string().optional(),
    private: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const repo = await octokit.repos.createForAuthenticatedUser(context);
      logger.info('Repository created successfully'); // Corrected logging as per user's instruction
      return repo.data;
    } catch (error: unknown) {
      logger.info('Error creating repository'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const getRepository = createTool({
  id: 'getRepository',
  description: 'Gets a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const repo = await octokit.repos.get(context);
      logger.info('Repository retrieved successfully'); // Corrected logging as per user's instruction
      return repo.data;
    } catch (error: unknown) {
      logger.info('Error getting repository'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const updateRepository = createTool({
  id: 'updateRepository',
  description: 'Updates a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    private: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const repo = await octokit.repos.update(context);
      logger.info('Repository updated successfully'); // Corrected logging as per user's instruction
      return repo.data;
    } catch (error: unknown) {
      logger.info('Error updating repository'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const deleteRepository = createTool({
  id: 'deleteRepository',
  description: 'Deletes a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.repos.delete(context);
      logger.info('Repository deleted successfully'); // Corrected logging as per user's instruction
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting repository'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const listBranches = createTool({
  id: 'listBranches',
  description: 'Lists the branches for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const branches = await octokit.repos.listBranches(context);
      logger.info('Branches listed successfully'); // Corrected logging as per user's instruction
      return branches.data;
    } catch (error: unknown) {
      logger.info('Error listing branches'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const getBranch = createTool({
  id: 'getBranch',
  description: 'Gets a branch from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const branch = await octokit.repos.getBranch(context);
      logger.info('Branch retrieved successfully'); // Corrected logging as per user's instruction
      return branch.data;
    } catch (error: unknown) {
      logger.info('Error getting branch'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const createBranch = createTool({
  id: 'createBranch',
  description: 'Creates a new branch in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
    sha: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const branch = await octokit.git.createRef({
        owner: context.owner,
        repo: context.repo,
        ref: `refs/heads/${context.branch}`,
        sha: context.sha,
      });
      logger.info('Branch created successfully'); // Corrected logging as per user's instruction
      return branch.data;
    } catch (error: unknown) {
      logger.info('Error creating branch'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});

export const deleteBranch = createTool({
  id: 'deleteBranch',
  description: 'Deletes a branch from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.git.deleteRef({
        owner: context.owner,
        repo: context.repo,
        ref: `refs/heads/${context.branch}`,
      });
      logger.info('Branch deleted successfully'); // Corrected logging as per user's instruction
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting branch'); // Corrected logging as per user's instruction
      throw error;
    }
  },
});