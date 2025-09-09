import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

export const getCommit = createTool({
  id: 'getCommit',
  description: 'Gets a commit.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    commit_sha: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_commit',
      input: { owner: context.owner, repo: context.repo, commit_sha: context.commit_sha }
    });

    try {
      const commit = await octokit.git.getCommit(context);
      logger.info('Commit retrieved successfully');

      spanName?.end({
        output: { commit_sha: commit.data.sha, message: commit.data.message?.substring(0, 50) },
        metadata: { operation: 'get_commit' }
      });
      return commit.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting commit');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_commit'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref }
    });

    try {
      const ref = await octokit.git.getRef(context);
      logger.info('Reference retrieved successfully');

      spanName?.end({
        output: { ref: ref.data.ref, sha: ref.data.object?.sha },
        metadata: { operation: 'get_ref' }
      });
      return ref.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_ref'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref, sha: context.sha }
    });

    try {
      const ref = await octokit.git.createRef(context);
      logger.info('Reference created successfully');

      spanName?.end({
        output: { ref: ref.data.ref, sha: ref.data.object?.sha },
        metadata: { operation: 'create_ref' }
      });
      return ref.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_ref'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref, sha: context.sha, force: context.force }
    });

    try {
      const ref = await octokit.git.updateRef(context);
      logger.info('Reference updated successfully');

      spanName?.end({
        output: { ref: ref.data.ref, sha: ref.data.object?.sha },
        metadata: { operation: 'update_ref' }
      });
      return ref.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_ref'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_ref',
      input: { owner: context.owner, repo: context.repo, ref: context.ref }
    });

    try {
      await octokit.git.deleteRef(context);
      logger.info('Reference deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_ref' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_ref'
        }
      });
      throw error;
    }
  },
});