import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listRepositoriesOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing repositories')
}).strict();

export const listRepositories = createTool({
  id: 'listRepositories',
  description: 'Lists the repositories for the authenticated user.',
  inputSchema: z.object({}),
  outputSchema: listRepositoriesOutputSchema,
  execute: async ({ tracingContext }) => {
    const listSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_repositories',
      input: {}
    });

    try {
      const repos = await octokit.repos.listForAuthenticatedUser();
      logger.info('Repositories listed successfully'); // Corrected logging as per user's instruction
      listSpan?.end({ output: { count: repos.data.length } });
      return listRepositoriesOutputSchema.parse({ status: 'success', data: repos.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      listSpan?.end({ metadata: { error: errorMessage } });
      logger.info('Error listing repositories'); // Corrected logging as per user's instruction
      return listRepositoriesOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string()
  }).optional(),
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
    const createSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_repository',
      input: { name: context.name, private: context.private }
    });

    try {
      const repo = await octokit.repos.createForAuthenticatedUser(context);
      logger.info('Repository created successfully'); // Corrected logging as per user's instruction
      createSpan?.end({ output: { repoName: repo.data.name, repoId: repo.data.id } });
      return createRepositoryOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      createSpan?.end({ metadata: { error: errorMessage } });
      logger.info('Error creating repository'); // Corrected logging as per user's instruction
      return createRepositoryOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getRepositoryOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string()
  }).optional(),
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
    const getSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_repository',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const repo = await octokit.repos.get(context);
      logger.info('Repository retrieved successfully'); // Corrected logging as per user's instruction
      getSpan?.end({ output: { repoName: repo.data.name, repoId: repo.data.id } });
      return getRepositoryOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getSpan?.end({ metadata: { error: errorMessage } });
      logger.info('Error getting repository'); // Corrected logging as per user's instruction
      return getRepositoryOutputSchema.parse({ status: 'error', data: null, errorMessage });
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
