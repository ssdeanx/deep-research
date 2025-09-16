import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubPullRequests', level: 'info' });

const listPullRequestsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    html_url: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing pull requests')
}).strict();

export const listPullRequests = createTool({
  id: 'listPullRequests',
  description: 'Lists pull requests for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  outputSchema: listPullRequestsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_requests',
      input: { owner: context.owner, repo: context.repo, state: context.state }
    });

    try {
      const prs = await octokit.pulls.list(context);
      logger.info('Pull requests listed successfully');

      spanName?.end({
        output: { prs_count: prs.data.length },
        metadata: { operation: 'list_pull_requests' }
      });
      return listPullRequestsOutputSchema.parse({ status: 'success', data: prs.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing pull requests');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_pull_requests'
        }
      });
      return listPullRequestsOutputSchema.parse({ status: 'error', data: null, errorMessage });
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
    pull_number: z.number(),
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
    draft: z.boolean().optional(),
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
    state: z.enum(['open', 'closed']).optional(),
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
    merge_method: z.enum(['merge', 'squash', 'rebase']).optional(),
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
    body: z.string(),
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
