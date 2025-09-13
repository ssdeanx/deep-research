import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubReactions', level: 'info' });

const SuccessSchema = z.object({
  success: z.literal(true),
});

const ReactionSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  user: z.object({
    login: z.string(),
    id: z.number(),
    node_id: z.string(),
    avatar_url: z.string(),
    gravatar_id: z.string(),
    url: z.string(),
    html_url: z.string(),
    followers_url: z.string(),
    following_url: z.string(),
    gists_url: z.string(),
    starred_url: z.string(),
    subscriptions_url: z.string(),
    organizations_url: z.string(),
    repos_url: z.string(),
    events_url: z.string(),
    received_events_url: z.string(),
    type: z.string(),
    site_admin: z.boolean(),
  }).optional(),
  content: z.enum(['+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes']),
  created_at: z.string(),
  updated_at: z.string().optional(),
}).strict();

const reactionContentSchema = z.enum(['+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes']);

const ListIssueReactionsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(ReactionSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing issue reactions')
}).strict();

export const listIssueReactions = createTool({
  id: 'listIssueReactions',
  description: 'Lists reactions for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
  }),
  outputSchema: ListIssueReactionsOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; issue_number: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing listIssueReactions for repo: ${context.repo}, issue: ${context.issue_number}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
      return ListIssueReactionsOutputSchema.parse({ status: 'success', data: reactions.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing issue reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_issue_reactions'
        }
      });
      return ListIssueReactionsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const CreateIssueReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: ReactionSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating issue reaction')
}).strict();

export const createIssueReaction = createTool({
  id: 'createIssueReaction',
  description: 'Creates a reaction for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    content: reactionContentSchema,
  }),
  outputSchema: CreateIssueReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; issue_number: number; content: "+1" | "-1" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes" }; tracingContext?: unknown }>) => {
    logger.info(`Executing createIssueReaction for repo: ${context.repo}, issue: ${context.issue_number}, content: ${context.content}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reaction_id: reaction.data?.id, content: context.content },
        metadata: { operation: 'create_issue_reaction' }
      });
      return CreateIssueReactionOutputSchema.parse({ status: 'success', data: reaction.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating issue reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_issue_reaction'
        }
      });
      return CreateIssueReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const DeleteIssueReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error deleting issue reaction')
}).strict();

export const deleteIssueReaction = createTool({
  id: 'deleteIssueReaction',
  description: 'Deletes a reaction for an issue.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    issue_number: z.number(),
    reaction_id: z.number(),
  }),
  outputSchema: DeleteIssueReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; issue_number: number; reaction_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing deleteIssueReaction for repo: ${context.repo}, issue: ${context.issue_number}, reaction: ${context.reaction_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { success: true, reaction_id: context.reaction_id },
        metadata: { operation: 'delete_issue_reaction' }
      });
      return DeleteIssueReactionOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting issue reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_issue_reaction'
        }
      });
      return DeleteIssueReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListCommitCommentReactionsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(ReactionSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing commit comment reactions')
}).strict();

export const listCommitCommentReactions = createTool({
  id: 'listCommitCommentReactions',
  description: 'Lists reactions for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  outputSchema: ListCommitCommentReactionsOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing listCommitCommentReactions for repo: ${context.repo}, comment: ${context.comment_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reactions_count: reactions.data?.length || 0, comment_id: context.comment_id },
        metadata: { operation: 'list_commit_comment_reactions' }
      });
      return ListCommitCommentReactionsOutputSchema.parse({ status: 'success', data: reactions.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing commit comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_commit_comment_reactions'
        }
      });
      return ListCommitCommentReactionsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const CreateCommitCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: ReactionSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating commit comment reaction')
}).strict();

export const createCommitCommentReaction = createTool({
  id: 'createCommitCommentReaction',
  description: 'Creates a reaction for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  outputSchema: CreateCommitCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; content: "+1" | "-1" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes" }; tracingContext?: unknown }>) => {
    logger.info(`Executing createCommitCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, content: ${context.content}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reaction_id: reaction.data?.id, content: context.content, comment_id: context.comment_id },
        metadata: { operation: 'create_commit_comment_reaction' }
      });
      return CreateCommitCommentReactionOutputSchema.parse({ status: 'success', data: reaction.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating commit comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_commit_comment_reaction'
        }
      });
      return CreateCommitCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const DeleteCommitCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error deleting commit comment reaction')
}).strict();

export const deleteCommitCommentReaction = createTool({
  id: 'deleteCommitCommentReaction',
  description: 'Deletes a reaction for a commit comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  outputSchema: DeleteCommitCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; reaction_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing deleteCommitCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, reaction: ${context.reaction_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { success: true, reaction_id: context.reaction_id, comment_id: context.comment_id },
        metadata: { operation: 'delete_commit_comment_reaction' }
      });
      return DeleteCommitCommentReactionOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting commit comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_commit_comment_reaction'
        }
      });
      return DeleteCommitCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListIssueCommentReactionsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(ReactionSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing issue comment reactions')
}).strict();

export const listIssueCommentReactions = createTool({
  id: 'listIssueCommentReactions',
  description: 'Lists reactions for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  outputSchema: ListIssueCommentReactionsOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing listIssueCommentReactions for repo: ${context.repo}, comment: ${context.comment_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reactions_count: reactions.data?.length || 0, comment_id: context.comment_id },
        metadata: { operation: 'list_issue_comment_reactions' }
      });
      return ListIssueCommentReactionsOutputSchema.parse({ status: 'success', data: reactions.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing issue comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_issue_comment_reactions'
        }
      });
      return ListIssueCommentReactionsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const CreateIssueCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: ReactionSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating issue comment reaction')
}).strict();

export const createIssueCommentReaction = createTool({
  id: 'createIssueCommentReaction',
  description: 'Creates a reaction for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  outputSchema: CreateIssueCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; content: "+1" | "-1" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes" }; tracingContext?: unknown }>) => {
    logger.info(`Executing createIssueCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, content: ${context.content}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reaction_id: reaction.data?.id, content: context.content, comment_id: context.comment_id },
        metadata: { operation: 'create_issue_comment_reaction' }
      });
      return CreateIssueCommentReactionOutputSchema.parse({ status: 'success', data: reaction.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating issue comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_issue_comment_reaction'
        }
      });
      return CreateIssueCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const DeleteIssueCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error deleting issue comment reaction')
}).strict();

export const deleteIssueCommentReaction = createTool({
  id: 'deleteIssueCommentReaction',
  description: 'Deletes a reaction for an issue comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  outputSchema: DeleteIssueCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; reaction_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing deleteIssueCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, reaction: ${context.reaction_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { success: true, reaction_id: context.reaction_id, comment_id: context.comment_id },
        metadata: { operation: 'delete_issue_comment_reaction' }
      });
      return DeleteIssueCommentReactionOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting issue comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_issue_comment_reaction'
        }
      });
      return DeleteIssueCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListPullRequestReviewCommentReactionsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(ReactionSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing pull request review comment reactions')
}).strict();

export const listPullRequestReviewCommentReactions = createTool({
  id: 'listPullRequestReviewCommentReactions',
  description: 'Lists reactions for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
  }),
  outputSchema: ListPullRequestReviewCommentReactionsOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing listPullRequestReviewCommentReactions for repo: ${context.repo}, comment: ${context.comment_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reactions_count: reactions.data?.length || 0, comment_id: context.comment_id },
        metadata: { operation: 'list_pull_request_review_comment_reactions' }
      });
      return ListPullRequestReviewCommentReactionsOutputSchema.parse({ status: 'success', data: reactions.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing pull request review comment reactions');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_pull_request_review_comment_reactions'
        }
      });
      return ListPullRequestReviewCommentReactionsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const CreatePullRequestReviewCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: ReactionSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating pull request review comment reaction')
}).strict();

export const createPullRequestReviewCommentReaction = createTool({
  id: 'createPullRequestReviewCommentReaction',
  description: 'Creates a reaction for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    content: reactionContentSchema,
  }),
  outputSchema: CreatePullRequestReviewCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; content: "+1" | "-1" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes" }; tracingContext?: unknown }>) => {
    logger.info(`Executing createPullRequestReviewCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, content: ${context.content}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
        output: { reaction_id: reaction.data?.id, content: context.content, comment_id: context.comment_id },
        metadata: { operation: 'create_pull_request_review_comment_reaction' }
      });
      return CreatePullRequestReviewCommentReactionOutputSchema.parse({ status: 'success', data: reaction.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating pull request review comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_pull_request_review_comment_reaction'
        }
      });
      return CreatePullRequestReviewCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const DeletePullRequestReviewCommentReactionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error deleting pull request review comment reaction')
}).strict();

export const deletePullRequestReviewCommentReaction = createTool({
  id: 'deletePullRequestReviewCommentReaction',
  description: 'Deletes a reaction for a pull request review comment.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    comment_id: z.number(),
    reaction_id: z.number(),
  }),
  outputSchema: DeletePullRequestReviewCommentReactionOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { owner: string; repo: string; comment_id: number; reaction_id: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing deletePullRequestReviewCommentReaction for repo: ${context.repo}, comment: ${context.comment_id}, reaction: ${context.reaction_id}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
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
      await octokit.request('DELETE /reactions/{reaction_id}', {
        reaction_id: context.reaction_id,
      });
      logger.info('Pull request review comment reaction deleted successfully');

      spanName?.end({
        output: { success: true, reaction_id: context.reaction_id, comment_id: context.comment_id },
        metadata: { operation: 'delete_pull_request_review_comment_reaction' }
      });
      return DeletePullRequestReviewCommentReactionOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting pull request review comment reaction');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_pull_request_review_comment_reaction'
        }
      });
      return DeletePullRequestReviewCommentReactionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

