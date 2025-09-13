import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listRepositoriesOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.any()).optional(),
  errorMessage: z.string().optional().describe('Error listing repositories')
}).strict();

export const listRepositories = createTool({
  id: 'listRepositories',
  description: 'Lists the repositories for the authenticated user.',
  inputSchema: z.object({}),
  outputSchema: listRepositoriesOutputSchema,
  execute: async ({ tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_repositories',
      input: {}
    });

    try {
      const repos = await octokit.repos.listForAuthenticatedUser();
      logger.info('Repositories listed successfully');

      spanName?.end({
        output: { repos_count: repos.data.length },
        metadata: { operation: 'list_repositories' }
      });
      return listRepositoriesOutputSchema.parse({ status: 'success', data: repos.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing repositories');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_repositories'
        }
      });
      return listRepositoriesOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.any().optional(),
  errorMessage: z.string().optional().describe('Error creating repository')
}).strict();

export const createRepository = createTool({
  id: 'createRepository',
  description: 'Creates a new repository for the authenticated user.',
  inputSchema: z.object({
    name: z.string(),
    description: z.string().optional(),
    private: z.boolean().optional(),
  }),
  outputSchema: createRepositoryOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_repository',
      input: { name: context.name, private: context.private }
    });

    try {
      const repo = await octokit.repos.createForAuthenticatedUser(context);
      logger.info('Repository created successfully');

      spanName?.end({
        output: { repo_id: repo.data.id },
        metadata: { operation: 'create_repository' }
      });
      return createRepositoryOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_repository'
        }
      });
      return createRepositoryOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.any().optional(),
  errorMessage: z.string().optional().describe('Error getting repository')
}).strict();

export const getRepository = createTool({
  id: 'getRepository',
  description: 'Gets a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: getRepositoryOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_repository',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const repo = await octokit.repos.get(context);
      logger.info('Repository retrieved successfully');

      spanName?.end({
        output: { repo_id: repo.data.id },
        metadata: { operation: 'get_repository' }
      });
      return getRepositoryOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_repository'
        }
      });
      return getRepositoryOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updateRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.any().optional(),
  errorMessage: z.string().optional().describe('Error updating repository')
}).strict();

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
  outputSchema: updateRepositoryOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_repository',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const repo = await octokit.repos.update(context);
      logger.info('Repository updated successfully');

      spanName?.end({
        output: { repo_id: repo.data.id },
        metadata: { operation: 'update_repository' }
      });
      return updateRepositoryOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_repository'
        }
      });
      return updateRepositoryOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deleteRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }).optional(),
  errorMessage: z.string().optional().describe('Error deleting repository')
}).strict();

export const deleteRepository = createTool({
  id: 'deleteRepository',
  description: 'Deletes a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: deleteRepositoryOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_repository',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      await octokit.repos.delete(context);
      logger.info('Repository deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_repository' }
      });
      return deleteRepositoryOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_repository'
        }
      });
      return deleteRepositoryOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});

const listBranchesOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    name: z.string(),
    commit: z.object({ sha: z.string() }),
    protected: z.boolean()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing branches')
}).strict();

export const listBranches = createTool({
  id: 'listBranches',
  description: 'Lists the branches for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: listBranchesOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_branches',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const branches = await octokit.repos.listBranches(context);
      logger.info('Branches listed successfully');

      spanName?.end({
        output: { branches_count: branches.data.length },
        metadata: { operation: 'list_branches' }
      });
      return listBranchesOutputSchema.parse({ status: 'success', data: branches.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing branches');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_branches'
        }
      });
      return listBranchesOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getBranchOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    name: z.string(),
    commit: z.object({ sha: z.string() }),
    protected: z.boolean()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting branch')
}).strict();

export const getBranch = createTool({
  id: 'getBranch',
  description: 'Gets a branch from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
  }),
  outputSchema: getBranchOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_branch',
      input: { owner: context.owner, repo: context.repo, branch: context.branch }
    });

    try {
      const branch = await octokit.repos.getBranch(context);
      logger.info('Branch retrieved successfully');

      spanName?.end({
        output: { branch_name: branch.data.name },
        metadata: { operation: 'get_branch' }
      });
      return getBranchOutputSchema.parse({ status: 'success', data: branch.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting branch');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_branch'
        }
      });
      return getBranchOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createBranchOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.any().optional(),
  errorMessage: z.string().optional().describe('Error creating branch')
}).strict();

export const createBranch = createTool({
  id: 'createBranch',
  description: 'Creates a new branch in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
    sha: z.string(),
  }),
  outputSchema: createBranchOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_branch',
      input: { owner: context.owner, repo: context.repo, branch: context.branch, sha: context.sha }
    });

    try {
      const branch = await octokit.git.createRef({
        owner: context.owner,
        repo: context.repo,
        ref: `refs/heads/${context.branch}`,
        sha: context.sha,
      });
      logger.info('Branch created successfully');

      spanName?.end({
        output: { branch_name: context.branch },
        metadata: { operation: 'create_branch' }
      });
      return createBranchOutputSchema.parse({ status: 'success', data: branch.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating branch');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_branch'
        }
      });
      return createBranchOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deleteBranchOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }).optional(),
  errorMessage: z.string().optional().describe('Error deleting branch')
}).strict();

export const deleteBranch = createTool({
  id: 'deleteBranch',
  description: 'Deletes a branch from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string(),
  }),
  outputSchema: deleteBranchOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_branch',
      input: { owner: context.owner, repo: context.repo, branch: context.branch }
    });

    try {
      await octokit.git.deleteRef({
        owner: context.owner,
        repo: context.repo,
        ref: `refs/heads/${context.branch}`,
      });
      logger.info('Branch deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_branch' }
      });
      return deleteBranchOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting branch');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_branch'
        }
      });
      return deleteBranchOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});
