import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_issue_reactions',
      input: {
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issue_number
      }
    });

    try {
      const reactions = await octokit.reactions.listForIssue(context);
      logger.info('Issue reactions listed successfully');

      spanName?.end({
        output: { reactions_count: reactions.data?.length || 0 },
        metadata: { operation: 'list_issue_reactions' }
      });
      return reactions.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing issue reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_issue_reactions'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_issue_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issue_number,
        content: context.content
      }
    });

    try {
      const reaction = await octokit.reactions.createForIssue(context);
      logger.info('Issue reaction created successfully');

      spanName?.end({
        output: { reaction_id: reaction.data?.id },
        metadata: { operation: 'create_issue_reaction' }
      });
      return reaction.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating issue reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_issue_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_issue_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        issue_number: context.issue_number,
        reaction_id: context.reaction_id
      }
    });

    try {
      await octokit.reactions.deleteForIssue({ owner: context.owner, repo: context.repo, issue_number: context.issue_number, reaction_id: context.reaction_id });
      logger.info('Issue reaction deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_issue_reaction' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting issue reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_issue_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_commit_comment_reactions',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id
      }
    });

    try {
      const reactions = await octokit.reactions.listForCommitComment(context);
      logger.info('Commit comment reactions listed successfully');

      spanName?.end({
        output: { reactions_count: reactions.data?.length || 0 },
        metadata: { operation: 'list_commit_comment_reactions' }
      });
      return reactions.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing commit comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_commit_comment_reactions'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_commit_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        content: context.content
      }
    });

    try {
      const reaction = await octokit.reactions.createForCommitComment(context);
      logger.info('Commit comment reaction created successfully');

      spanName?.end({
        output: { reaction_id: reaction.data?.id },
        metadata: { operation: 'create_commit_comment_reaction' }
      });
      return reaction.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating commit comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_commit_comment_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_commit_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        reaction_id: context.reaction_id
      }
    });

    try {
      await octokit.reactions.deleteForCommitComment({ owner: context.owner, repo: context.repo, comment_id: context.comment_id, reaction_id: context.reaction_id });
      logger.info('Commit comment reaction deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_commit_comment_reaction' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting commit comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_commit_comment_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_issue_comment_reactions',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id
      }
    });

    try {
      const reactions = await octokit.reactions.listForIssueComment(context);
      logger.info('Issue comment reactions listed successfully');

      spanName?.end({
        output: { reactions_count: reactions.data?.length || 0 },
        metadata: { operation: 'list_issue_comment_reactions' }
      });
      return reactions.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing issue comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_issue_comment_reactions'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_issue_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        content: context.content
      }
    });

    try {
      const reaction = await octokit.reactions.createForIssueComment(context);
      logger.info('Issue comment reaction created successfully');

      spanName?.end({
        output: { reaction_id: reaction.data?.id },
        metadata: { operation: 'create_issue_comment_reaction' }
      });
      return reaction.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating issue comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_issue_comment_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_issue_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        reaction_id: context.reaction_id
      }
    });

    try {
      await octokit.reactions.deleteForIssueComment({ owner: context.owner, repo: context.repo, comment_id: context.comment_id, reaction_id: context.reaction_id });
      logger.info('Issue comment reaction deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_issue_comment_reaction' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting issue comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_issue_comment_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_pull_request_review_comment_reactions',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id
      }
    });

    try {
      const reactions = await octokit.reactions.listForPullRequestReviewComment(context);
      logger.info('Pull request review comment reactions listed successfully');

      spanName?.end({
        output: { reactions_count: reactions.data?.length || 0 },
        metadata: { operation: 'list_pull_request_review_comment_reactions' }
      });
      return reactions.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing pull request review comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_pull_request_review_comment_reactions'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_pull_request_review_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        content: context.content
      }
    });

    try {
      const reaction = await octokit.reactions.createForPullRequestReviewComment(context);
      logger.info('Pull request review comment reaction created successfully');

      spanName?.end({
        output: { reaction_id: reaction.data?.id },
        metadata: { operation: 'create_pull_request_review_comment_reaction' }
      });
      return reaction.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating pull request review comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_pull_request_review_comment_reaction'
        }
      });
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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_pull_request_review_comment_reaction',
      input: {
        owner: context.owner,
        repo: context.repo,
        comment_id: context.comment_id,
        reaction_id: context.reaction_id
      }
    });

    try {
      // The typed Octokit methods don't expose deleteForPullRequestReviewComment; delete the reaction by its id via a direct request.
      await octokit.request('DELETE /reactions/{reaction_id}', {
        reaction_id: context.reaction_id,
      });
      logger.info('Pull request review comment reaction deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_pull_request_review_comment_reaction' }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting pull request review comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_pull_request_review_comment_reaction'
        }
      });
      throw error;
    }
  },
});