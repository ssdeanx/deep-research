import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const UserSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string().url(),
  gravatar_id: z.string(),
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
  type: z.string(),
  site_admin: z.boolean()
});

const CommentSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string().url(),
  html_url: z.string().url(),
  body: z.string().nullable(),
  user: UserSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  author_association: z.enum(['OWNER', 'COLLABORATOR', 'CONTRIBUTOR', 'MANNEQUIN', 'NONE', 'MEMBER']),
  reactions: z.object({
    url: z.string().url()
  }),
  issue_url: z.string().url()
});

const logger = new PinoLogger({ level: 'info' });

const createIssueOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    body: z.string().optional(),
    user: z.object({ login: z.string() }),
    created_at: z.string(),
    html_url: z.string()
  }).partial().optional(),
  errorMessage: z.string().optional().describe('Error creating issue')
}).strict();

export const createIssue = createTool({
  id: 'createIssue',
  description: 'Creates a new issue in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    body: z.string(),
  }),
  outputSchema: createIssueOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_issue',
      input: { owner: context.owner, repo: context.repo, title: context.title }
    });

    try {
      const issue = await octokit.issues.create(context);
      logger.info('Issue created successfully');

      spanName?.end({
        output: { issueNumber: issue.data.number },
        metadata: { operation: 'create_issue' }
      });
      return createIssueOutputSchema.parse({ status: 'success', data: issue.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating issue');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_issue'
        }
      });
      return createIssueOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getIssueOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    body: z.string().optional(),
    user: z.object({ login: z.string() }),
    created_at: z.string(),
    html_url: z.string()
  }).partial().optional(),
  errorMessage: z.string().optional().describe('Error getting issue')
}).strict();

export const getIssue = createTool({
  id: 'getIssue',
  description: 'Gets an issue from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  outputSchema: getIssueOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_issue',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const issue = await octokit.issues.get(context);
      logger.info('Issue retrieved successfully');

      spanName?.end({
        output: { issue_number: issue.data.number },
        metadata: { operation: 'get_issue' }
      });
      return getIssueOutputSchema.parse({ status: 'success', data: issue.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting issue');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_issue'
        }
      });
      return getIssueOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updateIssueOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    body: z.string().optional(),
    user: z.object({ login: z.string() }),
    updated_at: z.string(),
    html_url: z.string()
  }).partial().optional(),
  errorMessage: z.string().optional().describe('Error updating issue')
}).strict();

export const updateIssue = createTool({
  id: 'updateIssue',
  description: 'Updates an issue in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
  }),
  outputSchema: updateIssueOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_issue',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const issue = await octokit.issues.update(context);
      logger.info('Issue updated successfully');

      spanName?.end({
        output: { issue_number: issue.data.number },
        metadata: { operation: 'update_issue' }
      });
      return updateIssueOutputSchema.parse({ status: 'success', data: issue.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating issue');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_issue'
        }
      });
      return updateIssueOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listIssuesOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    body: z.string().optional(),
    user: z.object({ login: z.string() }),
    created_at: z.string(),
    html_url: z.string()
  }).partial()).optional(),
  errorMessage: z.string().optional().describe('Error listing issues')
}).strict();

export const listIssues = createTool({
  id: 'listIssues',
  description: 'Lists the issues for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  outputSchema: listIssuesOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_issues',
      input: { owner: context.owner, repo: context.repo, state: context.state }
    });

    try {
      const issues = await octokit.issues.listForRepo(context);
      logger.info('Issues listed successfully');

      spanName?.end({
        output: { issues_count: issues.data.length },
        metadata: { operation: 'list_issues' }
      });
      return listIssuesOutputSchema.parse({ status: 'success', data: issues.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing issues');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_issues'
        }
      });
      return listIssuesOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const closeIssueOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    body: z.string().optional(),
    user: z.object({ login: z.string() }),
    closed_at: z.string().optional(),
    html_url: z.string()
  }).partial().optional(),
  errorMessage: z.string().optional().describe('Error closing issue')
}).strict();

export const closeIssue = createTool({
  id: 'closeIssue',
  description: 'Closes an issue in a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  outputSchema: closeIssueOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'close_issue',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const issue = await octokit.issues.update({
        ...context,
        state: 'closed'
      });
      logger.info('Issue closed successfully');

      spanName?.end({
        output: { issue_number: issue.data.number },
        metadata: { operation: 'close_issue' }
      });
      return closeIssueOutputSchema.parse({ status: 'success', data: issue.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error closing issue');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'close_issue'
        }
      });
      return closeIssueOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const listCommentsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(CommentSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing comments')
}).strict();

export const listComments = createTool({
  id: 'listComments',
  description: 'Lists the comments for an issue or pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  outputSchema: listCommentsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_comments',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comments = await octokit.issues.listComments({
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issue_number,
      });
      logger.info('Comments listed successfully');

      spanName?.end({
        output: { comments_count: comments.data.length },
        metadata: { operation: 'list_comments' }
      });
      return listCommentsOutputSchema.parse({ status: 'success', data: comments.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing comments');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_comments'
        }
      });
      return listCommentsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const createCommentOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: CommentSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating comment')
}).strict();

export const createComment = createTool({
  id: 'createComment',
  description: 'Creates a comment on an issue or pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    body: z.string(),
  }),
  outputSchema: createCommentOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_comment',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comment = await octokit.issues.createComment({
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issue_number,
        body: context.body,
      });
      logger.info('Comment created successfully');

      spanName?.end({
        output: { comment_id: comment.data.id },
        metadata: { operation: 'create_comment' }
      });
      return createCommentOutputSchema.parse({ status: 'success', data: comment.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating comment');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_comment'
        }
      });
      return createCommentOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
