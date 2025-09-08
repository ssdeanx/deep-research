import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

const reactionContentSchema = z.enum(['+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes']);

export const listIssueReactions = createTool({
  id: 'listIssueReactions',
  description: 'Lists reactions for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const reactions = await octokit.reactions.listForIssue(context);
      logger.info('Issue reactions listed successfully');
      return reactions.data;
    } catch (error: unknown) {
      logger.info('Error listing issue reactions');
      throw error;
    }
  },
});

export const createIssueReaction = createTool({
  id: 'createIssueReaction',
  description: 'Creates a reaction for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    content: reactionContentSchema,
  }),
  execute: async ({ context }) => {
    try {
      const reaction = await octokit.reactions.createForIssue(context);
      logger.info('Issue reaction created successfully');
      return reaction.data;
    } catch (error: unknown) {
      logger.info('Error creating issue reaction');
      throw error;
    }
  },
});

export const deleteIssueReaction = createTool({
  id: 'deleteIssueReaction',
  description: 'Deletes a reaction for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    reaction_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.reactions.deleteForIssue({ owner: context.owner, repo: context.repo, issue_number: context.issue_number, reaction_id: context.reaction_id });
      logger.info('Issue reaction deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting issue reaction');
      throw error;
    }
  },
});

export const listCommitCommentReactions = createTool({
  id: 'listCommitCommentReactions',
  description: 'Lists reactions for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const reactions = await octokit.reactions.listForCommitComment(context);
      logger.info('Commit comment reactions listed successfully');
      return reactions.data;
    } catch (error: unknown) {
      logger.info('Error listing commit comment reactions');
      throw error;
    }
  },
});

export const createCommitCommentReaction = createTool({
  id: 'createCommitCommentReaction',
  description: 'Creates a reaction for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  execute: async ({ context }) => {
    try {
      const reaction = await octokit.reactions.createForCommitComment(context);
      logger.info('Commit comment reaction created successfully');
      return reaction.data;
    } catch (error: unknown) {
      logger.info('Error creating commit comment reaction');
      throw error;
    }
  },
});

export const deleteCommitCommentReaction = createTool({
  id: 'deleteCommitCommentReaction',
  description: 'Deletes a reaction for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.reactions.deleteForCommitComment({ owner: context.owner, repo: context.repo, comment_id: context.comment_id, reaction_id: context.reaction_id });
      logger.info('Commit comment reaction deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting commit comment reaction');
      throw error;
    }
  },
});

export const listIssueCommentReactions = createTool({
  id: 'listIssueCommentReactions',
  description: 'Lists reactions for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const reactions = await octokit.reactions.listForIssueComment(context);
      logger.info('Issue comment reactions listed successfully');
      return reactions.data;
    } catch (error: unknown) {
      logger.info('Error listing issue comment reactions');
      throw error;
    }
  },
});

export const createIssueCommentReaction = createTool({
  id: 'createIssueCommentReaction',
  description: 'Creates a reaction for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  execute: async ({ context }) => {
    try {
      const reaction = await octokit.reactions.createForIssueComment(context);
      logger.info('Issue comment reaction created successfully');
      return reaction.data;
    } catch (error: unknown) {
      logger.info('Error creating issue comment reaction');
      throw error;
    }
  },
});

export const deleteIssueCommentReaction = createTool({
  id: 'deleteIssueCommentReaction',
  description: 'Deletes a reaction for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.reactions.deleteForIssueComment({ owner: context.owner, repo: context.repo, comment_id: context.comment_id, reaction_id: context.reaction_id });
      logger.info('Issue comment reaction deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting issue comment reaction');
      throw error;
    }
  },
});

export const listPullRequestReviewCommentReactions = createTool({
  id: 'listPullRequestReviewCommentReactions',
  description: 'Lists reactions for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const reactions = await octokit.reactions.listForPullRequestReviewComment(context);
      logger.info('Pull request review comment reactions listed successfully');
      return reactions.data;
    } catch (error: unknown) {
      logger.info('Error listing pull request review comment reactions');
      throw error;
    }
  },
});

export const createPullRequestReviewCommentReaction = createTool({
  id: 'createPullRequestReviewCommentReaction',
  description: 'Creates a reaction for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  execute: async ({ context }) => {
    try {
      const reaction = await octokit.reactions.createForPullRequestReviewComment(context);
      logger.info('Pull request review comment reaction created successfully');
      return reaction.data;
    } catch (error: unknown) {
      logger.info('Error creating pull request review comment reaction');
      throw error;
    }
  },
});

export const deletePullRequestReviewCommentReaction = createTool({
  id: 'deletePullRequestReviewCommentReaction',
  description: 'Deletes a reaction for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      // The typed Octokit methods don't expose deleteForPullRequestReviewComment; delete the reaction by its id via a direct request.
      await octokit.request('DELETE /reactions/{reaction_id}', {
        reaction_id: context.reaction_id,
      });
      logger.info('Pull request review comment reaction deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting pull request review comment reaction');
      throw error;
    }
  },
});