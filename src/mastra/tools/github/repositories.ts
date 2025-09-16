import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

// Consolidated repository schemas to eliminate duplicates
const RepositoryOwnerSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string().url(),
  gravatar_id: z.string().optional(),
  url: z.string().url(),
  html_url: z.string().url(),
  followers_url: z.string().url(),
  following_url: z.string().url(),
  gists_url: z.string().url(),
  starred_url: z.string().url(),
  subscriptions_url: z.string().url(),
  organizations_url: z.string().url(),
  repos_url: z.string().url(),
  events_url: z.string().url(),
  received_events_url: z.string().url(),
  type: z.enum(['User', 'Organization']),
  site_admin: z.boolean()
});

const RepositorySchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  owner: RepositoryOwnerSchema,
  html_url: z.string().url(),
  description: z.string().nullable(),
  fork: z.boolean(),
  url: z.string().url(),
  archive_url: z.string().url(),
  assignees_url: z.string().url(),
  blobs_url: z.string().url(),
  branches_url: z.string().url(),
  collaborators_url: z.string().url(),
  comments_url: z.string().url(),
  commits_url: z.string().url(),
  compare_url: z.string().url(),
  contents_url: z.string().url(),
  contributors_url: z.string().url(),
  deployments_url: z.string().url(),
  downloads_url: z.string().url(),
  events_url: z.string().url(),
  forks_url: z.string().url(),
  git_commits_url: z.string().url(),
  git_refs_url: z.string().url(),
  git_tags_url: z.string().url(),
  git_url: z.string().url(),
  issue_comment_url: z.string().url(),
  issue_events_url: z.string().url(),
  issues_url: z.string().url(),
  keys_url: z.string().url(),
  labels_url: z.string().url(),
  languages_url: z.string().url(),
  merges_url: z.string().url(),
  milestones_url: z.string().url(),
  notifications_url: z.string().url(),
  pulls_url: z.string().url(),
  releases_url: z.string().url(),
  ssh_url: z.string(),
  stargazers_url: z.string().url(),
  statuses_url: z.string().url(),
  subscribers_url: z.string().url(),
  subscription_url: z.string().url(),
  tags_url: z.string().url(),
  teams_url: z.string().url(),
  trees_url: z.string().url(),
  clone_url: z.string().url(),
  mirror_url: z.string().url().nullable(),
  hooks_url: z.string().url(),
  svn_url: z.string().url(),
  homepage: z.string().nullable(),
  language: z.string().nullable(),
  forks_count: z.number(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  size: z.number(),
  default_branch: z.string(),
  open_issues_count: z.number(),
  is_template: z.boolean().optional(),
  topics: z.array(z.string()).optional(),
  has_issues: z.boolean(),
  has_projects: z.boolean(),
  has_wiki: z.boolean(),
  has_pages: z.boolean(),
  has_downloads: z.boolean(),
  archived: z.boolean(),
  disabled: z.boolean(),
  visibility: z.enum(['public', 'private']).optional(),
  pushed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  permissions: z.object({
    admin: z.boolean(),
    maintain: z.boolean().optional(),
    push: z.boolean(),
    triage: z.boolean().optional(),
    pull: z.boolean()
  }).optional(),
  allow_rebase_merge: z.boolean().optional(),
  temp_clone_token: z.string().optional(),
  allow_squash_merge: z.boolean().optional(),
  allow_auto_merge: z.boolean().optional(),
  delete_branch_on_merge: z.boolean().optional(),
  allow_merge_commit: z.boolean().optional(),
  subscribers_count: z.number().optional(),
  network_count: z.number().optional(),
  license: z.object({
    key: z.string(),
    name: z.string(),
    spdx_id: z.string().nullable(),
    url: z.string().url().nullable(),
    node_id: z.string()
  }).nullable().optional(),
  forks: z.number(),
  open_issues: z.number(),
  watchers: z.number()
}).partial({
  description: true,
  mirror_url: true,
  homepage: true,
  language: true,
  is_template: true,
  topics: true,
  visibility: true,
  pushed_at: true,
  permissions: true,
  allow_rebase_merge: true,
  temp_clone_token: true,
  allow_squash_merge: true,
  allow_auto_merge: true,
  delete_branch_on_merge: true,
  allow_merge_commit: true,
  subscribers_count: true,
  network_count: true,
  license: true
});

const BranchSchema = z.object({
  name: z.string(),
  commit: z.object({
    sha: z.string(),
    url: z.string().url()
  }),
  protected: z.boolean(),
  protection: z.object({
    required_status_checks: z.object({
      enforcement_level: z.string(),
      contexts: z.array(z.string())
    }).optional(),
    required_pull_request_reviews: z.object({
      required_approving_review_count: z.number(),
      dismiss_stale_reviews: z.boolean(),
      require_code_owner_reviews: z.boolean(),
      dismissal_restrictions: z.record(z.any()).optional()
    }).optional(),
    restrictions: z.object({
      users: z.array(z.string()),
      teams: z.array(z.string()),
      apps: z.array(z.string())
    }).optional(),
    enforce_admins: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    allow_force_pushes: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    allow_deletions: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    block_creations: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    required_linear_history: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    allow_fork_syncing: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional(),
    required_conversation_resolution: z.object({
      url: z.string().url(),
      enabled: z.boolean()
    }).optional()
  }).optional()
}).partial({
  protection: true
});

// Reusable base output schema
const BaseOutputSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  status: z.enum(['success', 'error']),
  data: dataSchema.optional(),
  errorMessage: z.string().optional(),
  metadata: z.object({
    request_id: z.string().optional(),
    rate_limit_remaining: z.number().optional(),
    rate_limit_reset: z.string().datetime().optional()
  }).optional()
}).strict();

// GitHub error parsing utility
const parseGitHubError = (error: unknown) => {
  if (error && typeof error === 'object' && 'status' in error) {
    const ghError = error as any;
    return {
      status: ghError.status,
      message: ghError.message ?? 'Unknown GitHub API error',
      documentation_url: ghError.documentation_url,
      request_id: ghError.request?.id,
      rate_limit_remaining: ghError.response?.headers?.['x-ratelimit-remaining'],
      rate_limit_reset: ghError.response?.headers?.['x-ratelimit-reset']
    };
  }
  return {
    status: 500,
    message: error instanceof Error ? error.message : String(error),
    documentation_url: undefined,
    request_id: undefined,
    rate_limit_remaining: undefined,
    rate_limit_reset: undefined
  };
};

export const listRepositories = createTool({
  id: 'listRepositories',
  description: 'Lists repositories for the authenticated user with pagination support. Returns user repositories including public, private, and forked repos.',
  inputSchema: z.object({
    type: z.enum(['all', 'owner', 'public', 'private', 'member']).optional().default('all').describe('Filter repositories by type'),
    sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional().default('full_name').describe('Sort repositories by criteria'),
    direction: z.enum(['asc', 'desc']).optional().default('asc').describe('Sort direction'),
    per_page: z.number().min(1).max(100).optional().default(30).describe('Number of repositories per page'),
    page: z.number().min(1).optional().default(1).describe('Page number for pagination')
  }),
  outputSchema: BaseOutputSchema(z.array(RepositorySchema)),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_repositories',
      input: {
        type: context.type,
        sort: context.sort,
        direction: context.direction,
        per_page: context.per_page,
        page: context.page
      }
    });

    try {
      const repos = await octokit.paginate(
        octokit.repos.listForAuthenticatedUser,
        {
          type: context.type ?? 'all',
          sort: context.sort ?? 'full_name',
          direction: context.direction ?? 'asc',
          per_page: context.per_page ?? 30,
          page: context.page ?? 1
        }
      );

      const parsedError = parseGitHubError(null);
      const metadata = {
        request_id: parsedError.request_id,
        rate_limit_remaining: parsedError.rate_limit_remaining,
        rate_limit_reset: (parsedError.rate_limit_reset) ? new Date(parsedError.rate_limit_reset * 1000).toISOString() : undefined
      };

      logger.info('Repositories listed successfully');

      spanName?.end({
        output: { repos_count: repos.length },
        metadata: { operation: 'list_repositories' }
      });

      return BaseOutputSchema(z.array(RepositorySchema)).parse({
        status: 'success',
        data: repos,
        metadata
      });
    } catch (error: unknown) {
      const parsedError = parseGitHubError(error);
      const errorMessage = parsedError.message;
      const metadata = {
        request_id: parsedError.request_id,
        rate_limit_remaining: parsedError.rate_limit_remaining,
        rate_limit_reset: parsedError.rate_limit_reset ? new Date(parsedError.rate_limit_reset * 1000).toISOString() : undefined
      };

      logger.error('Error listing repositories', { error: errorMessage });
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_repositories'
        }
      });

      return BaseOutputSchema(z.array(RepositorySchema)).parse({
        status: 'error',
        errorMessage,
        metadata
      });
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
