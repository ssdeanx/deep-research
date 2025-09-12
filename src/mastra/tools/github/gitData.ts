import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const getCommitOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    sha: z.string(),
    message: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string()
    }),
    committer: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string()
    }),
    tree: z.object({
      sha: z.string()
    }),
    parents: z.array(z.object({
      sha: z.string()
    })).optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting commit')
}).strict();

export const getCommit = createTool({
  id: 'getCommit',
  description: 'Gets a commit.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    commit_sha: z.string(),
  }),
  outputSchema: getCommitOutputSchema,
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
      return getCommitOutputSchema.parse({ status: 'success', data: commit.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting commit');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_commit'
        }
      });
      return getCommitOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createCommitOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    sha: z.string(),
    tree: z.object({
      sha: z.string()
    }),
    parents: z.array(z.object({
      sha: z.string()
    })).optional(),
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string()
    }).optional(),
    committer: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string()
    }).optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating commit')
}).strict();

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
  outputSchema: createCommitOutputSchema,
  execute: async ({ context }) => {
    try {
      const commit = await octokit.git.createCommit(context);
      logger.info('Commit created successfully');
      return createCommitOutputSchema.parse({ status: 'success', data: commit.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating commit');
      return createCommitOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getTreeOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    sha: z.string(),
    url: z.string(),
    tree: z.array(z.object({
      path: z.string(),
      mode: z.string(),
      type: z.enum(['blob', 'tree', 'commit']),
      sha: z.string(),
      size: z.number().optional(),
      url: z.string()
    }))
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting tree')
}).strict();

export const getTree = createTool({
  id: 'getTree',
  description: 'Gets a tree.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    tree_sha: z.string(),
    recursive: z.union([z.boolean(), z.string()]).optional(),
  }),
  outputSchema: getTreeOutputSchema,
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
      return getTreeOutputSchema.parse({ status: 'success', data: tree.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting tree');
      return getTreeOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createTreeOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    sha: z.string(),
    url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating tree')
}).strict();

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
  outputSchema: createTreeOutputSchema,
  execute: async ({ context }) => {
    try {
      const tree = await octokit.git.createTree(context);
      logger.info('Tree created successfully');
      return createTreeOutputSchema.parse({ status: 'success', data: tree.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating tree');
      return createTreeOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getBlobOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    content: z.unknown(),
    encoding: z.string(),
    sha: z.string(),
    size: z.number(),
    url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting blob')
}).strict();

export const getBlob = createTool({
  id: 'getBlob',
  description: 'Gets a blob.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    file_sha: z.string(),
  }),
  outputSchema: getBlobOutputSchema,
  execute: async ({ context }) => {
    try {
      const blob = await octokit.git.getBlob(context);
      logger.info('Blob retrieved successfully');
      return getBlobOutputSchema.parse({ status: 'success', data: blob.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting blob');
      return getBlobOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createBlobOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    content: z.unknown(),
    encoding: z.string(),
    sha: z.string(),
    size: z.number(),
    url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating blob')
}).strict();

export const createBlob = createTool({
  id: 'createBlob',
  description: 'Creates a blob.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    content: z.string(),
    encoding: z.enum(['utf-8', 'base64']).optional(),
  }),
  outputSchema: createBlobOutputSchema,
  execute: async ({ context }) => {
    try {
      const blob = await octokit.git.createBlob(context);
      logger.info('Blob created successfully');
      return createBlobOutputSchema.parse({ status: 'success', data: blob.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating blob');
      return createBlobOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    ref: z.string(),
    object: z.object({
      sha: z.string(),
      type: z.string(),
      url: z.string()
    })
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting ref')
}).strict();

export const getRef = createTool({
  id: 'getRef',
  description: 'Gets a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  outputSchema: getRefOutputSchema,
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
      return getRefOutputSchema.parse({ status: 'success', data: ref.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_ref'
        }
      });
      return getRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    ref: z.string(),
    object: z.object({
      sha: z.string(),
      type: z.string(),
      url: z.string()
    })
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating ref')
}).strict();

export const createRef = createTool({
  id: 'createRef',
  description: 'Creates a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
    sha: z.string(),
  }),
  outputSchema: createRefOutputSchema,
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
      return createRefOutputSchema.parse({ status: 'success', data: ref.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_ref'
        }
      });
      return createRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updateRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    ref: z.string(),
    object: z.object({
      sha: z.string(),
      type: z.string(),
      url: z.string()
    })
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating ref')
}).strict();

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
  outputSchema: updateRefOutputSchema,
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
      return updateRefOutputSchema.parse({ status: 'success', data: ref.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_ref'
        }
      });
      return updateRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deleteRefOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }).optional(),
  errorMessage: z.string().optional().describe('Error deleting ref')
}).strict();

export const deleteRef = createTool({
  id: 'deleteRef',
  description: 'Deletes a reference.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    ref: z.string(),
  }),
  outputSchema: deleteRefOutputSchema,
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
      return deleteRefOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting reference');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_ref'
        }
      });
      return deleteRefOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
