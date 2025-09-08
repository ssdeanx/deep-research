import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const getCommit = createTool({
  id: 'getCommit',
  description: 'Gets a commit.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    commit_sha: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const commit = await octokit.git.getCommit(context);
      logger.info('Commit retrieved successfully');
      return commit.data;
    } catch (error: unknown) {
      logger.info('Error getting commit');
      throw error;
    }
  },
});

export const createCommit = createTool({
  id: 'createCommit',
  description: 'Creates a commit.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    message: z.string(),
    tree: z.string(),
    parents: z.array(z.string()).optional(),
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string().optional(),
    }).optional(),
    committer: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const commit = await octokit.git.createCommit(context);
      logger.info('Commit created successfully');
      return commit.data;
    } catch (error: unknown) {
      logger.info('Error creating commit');
      throw error;
    }
  },
});

export const getTree = createTool({
  id: 'getTree',
  description: 'Gets a tree.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    tree_sha: z.string(),
    recursive: z.union([z.boolean(), z.string()]).optional(),
  }),
  execute: async ({ context }) => {
    try {
      // Octokit expects the 'recursive' query param as a string (e.g. "1"), so coerce boolean input to string.
      const params = {
        ...context,
        recursive:
          typeof context.recursive === 'boolean'
            ? String(Number(context.recursive))
            : context.recursive,
      };
      const tree = await octokit.git.getTree(params as any);
      logger.info('Tree retrieved successfully');
      return tree.data;
    } catch (error: unknown) {
      logger.info('Error getting tree');
      throw error;
    }
  },
});

export const createTree = createTool({
  id: 'createTree',
  description: 'Creates a tree.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    tree: z.array(z.object({
      path: z.string().optional(),
      mode: z.enum(['100644', '100755', '040000', '160000', '120000']).optional(),
      type: z.enum(['blob', 'tree', 'commit']).optional(),
      sha: z.string().nullable().optional(),
      content: z.string().optional(),
    })),
    base_tree: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const tree = await octokit.git.createTree(context);
      logger.info('Tree created successfully');
      return tree.data;
    } catch (error: unknown) {
      logger.info('Error creating tree');
      throw error;
    }
  },
});

export const getBlob = createTool({
  id: 'getBlob',
  description: 'Gets a blob.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    file_sha: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const blob = await octokit.git.getBlob(context);
      logger.info('Blob retrieved successfully');
      return blob.data;
    } catch (error: unknown) {
      logger.info('Error getting blob');
      throw error;
    }
  },
});

export const createBlob = createTool({
  id: 'createBlob',
  description: 'Creates a blob.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    content: z.string(),
    encoding: z.enum(['utf-8', 'base64']).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const blob = await octokit.git.createBlob(context);
      logger.info('Blob created successfully');
      return blob.data;
    } catch (error: unknown) {
      logger.info('Error creating blob');
      throw error;
    }
  },
});

export const getRef = createTool({
  id: 'getRef',
  description: 'Gets a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const ref = await octokit.git.getRef(context);
      logger.info('Reference retrieved successfully');
      return ref.data;
    } catch (error: unknown) {
      logger.info('Error getting reference');
      throw error;
    }
  },
});

export const createRef = createTool({
  id: 'createRef',
  description: 'Creates a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
    sha: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const ref = await octokit.git.createRef(context);
      logger.info('Reference created successfully');
      return ref.data;
    } catch (error: unknown) {
      logger.info('Error creating reference');
      throw error;
    }
  },
});

export const updateRef = createTool({
  id: 'updateRef',
  description: 'Updates a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
    sha: z.string(),
    force: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const ref = await octokit.git.updateRef(context);
      logger.info('Reference updated successfully');
      return ref.data;
    } catch (error: unknown) {
      logger.info('Error updating reference');
      throw error;
    }
  },
});

export const deleteRef = createTool({
  id: 'deleteRef',
  description: 'Deletes a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.git.deleteRef(context);
      logger.info('Reference deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting reference');
      throw error;
    }
  },
});