import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubPullRequests', level: 'info' });

// Consolidated pull request schemas to eliminate duplicates
const PullRequestUserSchema = z.object({
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

const PullRequestLabelSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string().url(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  default: z.boolean()
});

const PullRequestMilestoneSchema = z.object({
  url: z.string().url(),
  html_url: z.string().url(),
  labels_url: z.string().url(),
  id: z.number(),
  node_id: z.string(),
  number: z.number(),
  state: z.enum(['open', 'closed']),
  title: z.string(),
  description: z.string().nullable(),
  creator: PullRequestUserSchema.nullable(),
  open_issues: z.number(),
  closed_issues: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().nullable(),
  due_on: z.string().datetime().nullable()
});

const PullRequestSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string().url(),
  html_url: z.string().url(),
  diff_url: z.string().url(),
  patch_url: z.string().url(),
  issue_url: z.string().url(),
  commits_url: z.string().url(),
  review_comments_url: z.string().url(),
  review_comment_url: z.string().url(),
  comments_url: z.string().url(),
  statuses_url: z.string().url(),
  number: z.number(),
  state: z.enum(['open', 'closed']),
  locked: z.boolean(),
  title: z.string(),
  user: PullRequestUserSchema,
  body: z.string().nullable(),
  labels: z.array(PullRequestLabelSchema),
  milestone: PullRequestMilestoneSchema.nullable(),
  active_lock_reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().nullable(),
  merged_at: z.string().datetime().nullable(),
  merge_commit_sha: z.string().nullable(),
  assignee: PullRequestUserSchema.nullable(),
  assignees: z.array(PullRequestUserSchema),
  requested_reviewers: z.array(PullRequestUserSchema),
  requested_teams: z.array(z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string().url(),
    html_url: z.string().url(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    privacy: z.enum(['open', 'closed', 'secret']),
    permission: z.string(),
    members_url: z.string().url(),
    repositories_url: z.string().url(),
    parent: z.record(z.any()).nullable()
  })),
  head: z.object({
    label: z.string(),
    ref: z.string(),
    sha: z.string(),
    user: PullRequestUserSchema,
    repo: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: PullRequestUserSchema,
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
    }).nullable()
  }),
  base: z.object({
    label: z.string(),
    ref: z.string(),
    sha: z.string(),
    user: PullRequestUserSchema,
    repo: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: PullRequestUserSchema,
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
    })
  }),
  _links: z.object({
    self: z.object({ href: z.string().url() }),
    html: z.object({ href: z.string().url() }),
    issue: z.object({ href: z.string().url() }),
    comments: z.object({ href: z.string().url() }),
    review_comments: z.object({ href: z.string().url() }),
    review_comment: z.object({ href: z.string().url() }),
    commits: z.object({ href: z.string().url() }),
    statuses: z.object({ href: z.string().url() })
  }),
  author_association: z.enum(['COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN', 'MEMBER', 'NONE', 'OWNER']),
  auto_merge: z.object({
    enabled_by: PullRequestUserSchema,
    merge_method: z.enum(['merge', 'squash', 'rebase']),
    commit_title: z.string(),
    commit_message: z.string()
  }).nullable(),
  draft: z.boolean().optional(),
  merged: z.boolean(),
  mergeable: z.boolean().nullable(),
  rebaseable: z.boolean().nullable(),
  mergeable_state: z.enum(['behind', 'blocked', 'clean', 'dirty', 'draft', 'has_hooks', 'unknown', 'unstable']),
  merged_by: PullRequestUserSchema.nullable(),
  comments: z.number(),
  review_comments: z.number(),
  maintainer_can_modify: z.boolean(),
  commits: z.number(),
  additions: z.number(),
  deletions: z.number(),
  changed_files: z.number()
}).partial({
  body: true,
  milestone: true,
  active_lock_reason: true,
  closed_at: true,
  merged_at: true,
  merge_commit_sha: true,
  assignee: true,
  requested_teams: true,
  _links: true,
  auto_merge: true,
  draft: true,
  mergeable: true,
  rebaseable: true,
  merged_by: true
});

const PullRequestCommentSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string().url(),
  html_url: z.string().url(),
  body: z.string(),
  user: PullRequestUserSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  issue_url: z.string().url(),
  author_association: z.enum(['COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN', 'MEMBER', 'NONE', 'OWNER']),
  performed_via_github_app: z.record(z.any()).nullable().optional(),
  reactions: z.object({
    url: z.string().url(),
    total_count: z.number(),
    '+1': z.number(),
    '-1': z.number(),
    laugh: z.number(),
    hooray: z.number(),
    confused: z.number(),
    heart: z.number(),
    rocket: z.number(),
    eyes: z.number()
  }).optional()
}).partial({
  performed_via_github_app: true,
  reactions: true
});

const PullRequestReviewSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  user: PullRequestUserSchema,
  body: z.string().nullable(),
  state: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
  html_url: z.string().url(),
  pull_request_url: z.string().url(),
  _links: z.object({
    html: z.object({ href: z.string().url() }),
    pull_request: z.object({ href: z.string().url() })
  }),
  submitted_at: z.string().datetime().nullable(),
  commit_id: z.string(),
  author_association: z.enum(['COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN', 'MEMBER', 'NONE', 'OWNER'])
}).partial({
  body: true,
  submitted_at: true,
  _links: true
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

// Create specific schema for pull requests list
const PullRequestsListOutputSchema = BaseOutputSchema(z.array(PullRequestSchema.pick({
  id: true,
  number: true,
  title: true,
  state: true,
  user: true,
  body: true,
  html_url: true,
  created_at: true,
  updated_at: true,
  merged: true,
  mergeable: true,
  comments: true,
  review_comments: true,
  commits: true,
  additions: true,
  deletions: true,
  changed_files: true
})));

// GitHub error parsing utility
const parseGitHubError = (error: unknown) => {
  if (error !== null && typeof error === 'object' && 'status' in (error as Record<string, unknown>)) {
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

// Enhanced listPullRequests with pagination and better error handling
export const listPullRequests = createTool({
  id: 'listPullRequests',
  description: 'Lists pull requests for a repository with pagination support. Supports filtering by state and handles large result sets efficiently.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    state: z.enum(['open', 'closed', 'all']).optional().default('open').describe('Filter by pull request state'),
    per_page: z.number().min(1).max(100).optional().default(30).describe('Number of results per page'),
    page: z.number().min(1).optional().default(1).describe('Page number for pagination'),
    sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional().default('created').describe('Sort order'),
    direction: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort direction')
  }),
  outputSchema: PullRequestsListOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_requests',
      input: { owner: context.owner, repo: context.repo, state: context.state, per_page: context.per_page, page: context.page }
    });

    try {
      const prs = await octokit.pulls.list({
        owner: context.owner,
        repo: context.repo,
        state: context.state,
        per_page: context.per_page,
        page: context.page,
        sort: context.sort,
        direction: context.direction
      });

      logger.info('Pull requests listed successfully', {
        count: prs.data.length,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        output: { prs_count: prs.data.length, has_more: prs.data.length === context.per_page },
        metadata: {
          operation: 'list_pull_requests',
          rate_limit_remaining: prs.headers?.['x-ratelimit-remaining'],
          rate_limit_reset: prs.headers?.['x-ratelimit-reset']
        }
      });

      return BaseOutputSchema(z.array(PullRequestSchema.pick({
        id: true,
        number: true,
        title: true,
        state: true,
        user: true,
        body: true,
        html_url: true,
        created_at: true,
        updated_at: true,
        merged: true,
        mergeable: true,
        comments: true,
        review_comments: true,
        commits: true,
        additions: true,
        deletions: true,
        changed_files: true
      }))).parse({
        status: 'success',
        data: prs.data,
        metadata: {
          request_id: prs.headers?.['x-github-request-id'],
          rate_limit_remaining: (prs.headers?.['x-ratelimit-remaining'] !== undefined) ? parseInt(prs.headers['x-ratelimit-remaining']) : undefined,
          rate_limit_reset: (prs.headers?.['x-ratelimit-reset'] !== undefined) ? new Date(parseInt(prs.headers['x-ratelimit-reset']) * 1000).toISOString() : undefined
        }
      });
    } catch (error: unknown) {
      const parsedError = parseGitHubError(error);
      logger.error('Error listing pull requests', {
        error: parsedError.message,
        status: parsedError.status,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        metadata: {
          error: parsedError.message,
          status: parsedError.status,
          operation: 'list_pull_requests',
          rate_limit_remaining: parsedError.rate_limit_remaining,
          rate_limit_reset: parsedError.rate_limit_reset
        }
      });

      return BaseOutputSchema(z.array(PullRequestSchema.pick({
        id: true,
        number: true,
        title: true,
        state: true,
        user: true,
        body: true,
        html_url: true,
        created_at: true,
        updated_at: true,
        merged: true,
        mergeable: true,
        comments: true,
        review_comments: true,
        commits: true,
        additions: true,
        deletions: true,
        changed_files: true
      }))).parse({
        status: 'error',
        errorMessage: parsedError.message,
        metadata: {
          request_id: parsedError.request_id,
          rate_limit_remaining: parsedError.rate_limit_remaining,
          rate_limit_reset: parsedError.rate_limit_reset
        }
      });
    }
  },
});

const getPullRequestOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    html_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting pull request')
}).strict();

export const getPullRequest = createTool({
  id: 'getPullRequest',
  description: 'Gets a pull request from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number()
  }),
  outputSchema: getPullRequestOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const pr = await octokit.pulls.get(context);
      logger.info('Pull request retrieved successfully');

      spanName?.end({
        output: { pr_number: pr.data.number, title: pr.data.title },
        metadata: { operation: 'get_pull_request' }
      });
      return getPullRequestOutputSchema.parse({ status: 'success', data: pr.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting pull request');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_pull_request'
        }
      });
      return getPullRequestOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createPullRequestOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    html_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating pull request')
}).strict();

export const createPullRequest = createTool({
  id: 'createPullRequest',
  description: 'Creates a new pull request in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    head: z.string(),
    base: z.string(),
    body: z.string().optional(),
    draft: z.boolean().optional()
  }),
  outputSchema: createPullRequestOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request',
      input: { owner: context.owner, repo: context.repo, title: context.title, head: context.head, base: context.base }
    });

    try {
      const pr = await octokit.pulls.create(context);
      logger.info('Pull request created successfully');

      spanName?.end({
        output: { pr_number: pr.data.number },
        metadata: { operation: 'create_pull_request' }
      });
      return createPullRequestOutputSchema.parse({ status: 'success', data: pr.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating pull request');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_pull_request'
        }
      });
      return createPullRequestOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updatePullRequestOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    html_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating pull request')
}).strict();

export const updatePullRequest = createTool({
  id: 'updatePullRequest',
  description: 'Updates a pull request in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional()
  }),
  outputSchema: updatePullRequestOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const pr = await octokit.pulls.update(context);
      logger.info('Pull request updated successfully');

      spanName?.end({
        output: { pr_number: pr.data.number },
        metadata: { operation: 'update_pull_request' }
      });
      return updatePullRequestOutputSchema.parse({ status: 'success', data: pr.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating pull request');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_pull_request'
        }
      });
      return updatePullRequestOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const mergePullRequestOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    merged: z.boolean(),
    sha: z.string(),
    message: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error merging pull request')
}).strict();

export const mergePullRequest = createTool({
  id: 'mergePullRequest',
  description: 'Merges a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
    commit_title: z.string().optional(),
    commit_message: z.string().optional(),
    merge_method: z.enum(['merge', 'squash', 'rebase']).optional()
  }),
  outputSchema: mergePullRequestOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'merge_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number, merge_method: context.merge_method }
    });

    try {
      const result = await octokit.pulls.merge(context);
      logger.info('Pull request merged successfully');

      spanName?.end({
        output: { merged: result.data.merged, sha: result.data.sha },
        metadata: { operation: 'merge_pull_request' }
      });
      return mergePullRequestOutputSchema.parse({ status: 'success', data: result.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error merging pull request');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'merge_pull_request'
        }
      });
      return mergePullRequestOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listPullRequestCommentsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    body: z.string(),
    user: z.object({ login: z.string() }),
    created_at: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing pull request comments')
}).strict();

export const listPullRequestComments = createTool({
  id: 'listPullRequestComments',
  description: 'Lists comments on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  outputSchema: listPullRequestCommentsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_request_comments',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comments = await octokit.issues.listComments(context);
      logger.info('Pull request comments listed successfully');

      spanName?.end({
        output: { comments_count: comments.data.length },
        metadata: { operation: 'list_pull_request_comments' }
      });
      return listPullRequestCommentsOutputSchema.parse({ status: 'success', data: comments.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing pull request comments');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_pull_request_comments'
        }
      });
      return listPullRequestCommentsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createPullRequestCommentOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    body: z.string(),
    user: z.object({ login: z.string() }),
    created_at: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating pull request comment')
}).strict();

export const createPullRequestComment = createTool({
  id: 'createPullRequestComment',
  description: 'Creates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    body: z.string()
  }),
  outputSchema: createPullRequestCommentOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comment = await octokit.issues.createComment(context);
      logger.info('Pull request comment created successfully');

      spanName?.end({
        output: { comment_id: comment.data.id },
        metadata: { operation: 'create_pull_request_comment' }
      });
      return createPullRequestCommentOutputSchema.parse({ status: 'success', data: comment.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating pull request comment');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_pull_request_comment'
        }
      });
      return createPullRequestCommentOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updatePullRequestCommentOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    body: z.string(),
    user: z.object({ login: z.string() }),
    updated_at: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating pull request comment')
}).strict();

export const updatePullRequestComment = createTool({
  id: 'updatePullRequestComment',
  description: 'Updates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    body: z.string(),
  }),
  outputSchema: updatePullRequestCommentOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, comment_id: context.comment_id }
    });

    try {
      const comment = await octokit.issues.updateComment(context);
      logger.info('Pull request comment updated successfully');

      spanName?.end({
        output: { comment_id: comment.data.id },
        metadata: { operation: 'update_pull_request_comment' }
      });
      return updatePullRequestCommentOutputSchema.parse({ status: 'success', data: comment.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating pull request comment');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_pull_request_comment'
        }
      });
      return updatePullRequestCommentOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deletePullRequestCommentOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }).optional(),
  errorMessage: z.string().optional().describe('Error deleting pull request comment')
}).strict();

export const deletePullRequestComment = createTool({
  id: 'deletePullRequestComment',
  description: 'Deletes a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  outputSchema: deletePullRequestCommentOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, comment_id: context.comment_id }
    });

    try {
      await octokit.issues.deleteComment(context);
      logger.info('Pull request comment deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_pull_request_comment' }
      });
      return deletePullRequestCommentOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting pull request comment');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_pull_request_comment'
        }
      });
      return deletePullRequestCommentOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});
const listPullRequestReviewsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    user: z.object({ login: z.string() }),
    state: z.string(),
    body: z.string().optional(),
    submitted_at: z.string().optional()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing pull request reviews')
}).strict();

export const listPullRequestReviews = createTool({
  id: 'listPullRequestReviews',
  description: 'Lists reviews on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
  }),
  outputSchema: listPullRequestReviewsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_request_reviews',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const reviews = await octokit.pulls.listReviews(context);
      logger.info('Pull request reviews listed successfully');

      spanName?.end({
        output: { reviews_count: reviews.data.length },
        metadata: { operation: 'list_pull_request_reviews' }
      });
      return listPullRequestReviewsOutputSchema.parse({ status: 'success', data: reviews.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing pull request reviews');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_pull_request_reviews'
        }
      });
      return listPullRequestReviewsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const createPullRequestReviewOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    user: z.object({ login: z.string() }),
    state: z.string(),
    body: z.string().optional(),
    submitted_at: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating pull request review')
}).strict();

export const createPullRequestReview = createTool({
  id: 'createPullRequestReview',
  description: 'Creates a review on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
    body: z.string().optional(),
    event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']).optional(),
    comments: z.array(z.object({
      path: z.string(),
      position: z.number(),
      body: z.string()
    })).optional()
  }),
  outputSchema: createPullRequestReviewOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request_review',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const review = await octokit.pulls.createReview(context);
      logger.info('Pull request review created successfully');

      spanName?.end({
        output: { review_id: review.data.id },
        metadata: { operation: 'create_pull_request_review' }
      });
      return createPullRequestReviewOutputSchema.parse({ status: 'success', data: review.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating pull request review');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_pull_request_review'
        }
      });
      return createPullRequestReviewOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
