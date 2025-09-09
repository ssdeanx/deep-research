import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubPullRequests', level: 'info' });

export const listPullRequests = createTool({
  id: 'listPullRequests',
  description: 'Lists pull requests for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Listing pull requests for ${context.owner}/${context.repo}`);

    const listSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_requests',
      input: { owner: context.owner, repo: context.repo, state: context.state }
    });

    try {
      const prs = await octokit.pulls.list(context);
      listSpan?.end({ output: { count: prs.data.length } });
      logger.info(`Listed ${prs.data.length} pull requests for ${context.owner}/${context.repo}`);
      return prs.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      listSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to list pull requests for ${context.owner}/${context.repo}: ${errorMessage}`);
      throw error;
    }
  },
});

export const getPullRequest = createTool({
  id: 'getPullRequest',
  description: 'Gets a pull request from a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    pull_number: z.number(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Getting pull request ${context.pull_number} from ${context.owner}/${context.repo}`);

    const getSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const pr = await octokit.pulls.get(context);
      getSpan?.end({ output: { pr_number: pr.data.number, title: pr.data.title } });
      logger.info(`Retrieved pull request ${context.pull_number} from ${context.owner}/${context.repo}`);
      return pr.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to get pull request ${context.pull_number} from ${context.owner}/${context.repo}: ${errorMessage}`);
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    logger.info(`Creating pull request in ${context.owner}/${context.repo}: ${context.title}`);

    const createSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request',
      input: { owner: context.owner, repo: context.repo, title: context.title, head: context.head, base: context.base }
    });

    try {
      const pr = await octokit.pulls.create(context);
      createSpan?.end({ output: { pr_number: pr.data.number } });
      logger.info(`Created pull request ${pr.data.number} in ${context.owner}/${context.repo}`);
      return pr.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      createSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to create pull request in ${context.owner}/${context.repo}: ${errorMessage}`);
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    logger.info(`Updating pull request ${context.pull_number} in ${context.owner}/${context.repo}`);

    const updateSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number }
    });

    try {
      const pr = await octokit.pulls.update(context);
      updateSpan?.end({ output: { pr_number: pr.data.number } });
      logger.info(`Updated pull request ${context.pull_number} in ${context.owner}/${context.repo}`);
      return pr.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to update pull request ${context.pull_number} in ${context.owner}/${context.repo}: ${errorMessage}`);
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    logger.info(`Merging pull request ${context.pull_number} in ${context.owner}/${context.repo}`);

    const mergeSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'merge_pull_request',
      input: { owner: context.owner, repo: context.repo, pull_number: context.pull_number, merge_method: context.merge_method }
    });

    try {
      const result = await octokit.pulls.merge(context);
      mergeSpan?.end({ output: { merged: result.data.merged, sha: result.data.sha } });
      logger.info(`Merged pull request ${context.pull_number} in ${context.owner}/${context.repo}`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mergeSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to merge pull request ${context.pull_number} in ${context.owner}/${context.repo}: ${errorMessage}`);
      throw error;
    }
  },
});

export const listPullRequestComments = createTool({
  id: 'listPullRequestComments',
  description: 'Lists comments on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(), // Changed from pull_number to issue_number
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Listing comments for pull request ${context.issue_number} in ${context.owner}/${context.repo}`);

    const listCommentsSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_request_comments',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comments = await octokit.issues.listComments(context);
      listCommentsSpan?.end({ output: { count: comments.data.length } });
      logger.info(`Listed ${comments.data.length} comments for pull request ${context.issue_number}`);
      return comments.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      listCommentsSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to list comments for pull request ${context.issue_number}: ${errorMessage}`);
      throw error;
    }
  },
});

export const createPullRequestComment = createTool({
  id: 'createPullRequestComment',
  description: 'Creates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(), // Changed from pull_number to issue_number
    body: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Creating comment on pull request ${context.issue_number} in ${context.owner}/${context.repo}`);

    const createCommentSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, issue_number: context.issue_number }
    });

    try {
      const comment = await octokit.issues.createComment(context);
      createCommentSpan?.end({ output: { comment_id: comment.data.id } });
      logger.info(`Created comment ${comment.data.id} on pull request ${context.issue_number}`);
      return comment.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      createCommentSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to create comment on pull request ${context.issue_number}: ${errorMessage}`);
      throw error;
    }
  },
});

export const updatePullRequestComment = createTool({
  id: 'updatePullRequestComment',
  description: 'Updates a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    body: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Updating comment ${context.comment_id} in ${context.owner}/${context.repo}`);

    const updateCommentSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, comment_id: context.comment_id }
    });

    try {
      const comment = await octokit.issues.updateComment(context);
      updateCommentSpan?.end({ output: { comment_id: comment.data.id } });
      logger.info(`Updated comment ${context.comment_id}`);
      return comment.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateCommentSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to update comment ${context.comment_id}: ${errorMessage}`);
      throw error;
    }
  },
});

export const deletePullRequestComment = createTool({
  id: 'deletePullRequestComment',
  description: 'Deletes a comment on a pull request.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Deleting comment ${context.comment_id} in ${context.owner}/${context.repo}`);

    const deleteCommentSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_pull_request_comment',
      input: { owner: context.owner, repo: context.repo, comment_id: context.comment_id }
    });

    try {
      await octokit.issues.deleteComment(context);
      deleteCommentSpan?.end({ output: { success: true } });
      logger.info(`Deleted comment ${context.comment_id}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      deleteCommentSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to delete comment ${context.comment_id}: ${errorMessage}`);
      throw error;
    }
  },
});
