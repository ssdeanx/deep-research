import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listRepoEventsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.any()).optional(),
  errorMessage: z.string().optional().describe('Error message for failed repository events listing')
}).strict();

export const listRepoEvents = createTool({
  id: 'listRepoEvents',
  description: 'Lists events for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: listRepoEventsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_repo_events',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const events = await octokit.activity.listRepoEvents(context);
      logger.info('Repository events listed successfully');

      spanName?.end({
        output: { events_count: events.data?.length || 0 },
        metadata: { operation: 'list_repo_events' }
      });
      return listRepoEventsOutputSchema.parse({ status: 'success', data: events.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing repository events');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_repo_events'
        }
      });
      return listRepoEventsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listPublicEventsOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.array(z.record(z.string(), z.unknown())).optional(),
  errorMessage: z.string().optional().describe('Error for public events retrieval')
}).strict();

export const listPublicEvents = createTool({
  id: 'listPublicEvents',
  description: 'Lists public events.',
  inputSchema: z.object({
    per_page: z.number().optional(),
    page: z.number().optional(),
  }),
  outputSchema: listPublicEventsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_public_events',
      input: { per_page: context.per_page, page: context.page }
    });

    try {
      const events = await octokit.activity.listPublicEvents(context);
      logger.info('Public events listed successfully');

      spanName?.end({
        output: { events_count: events.data?.length || 0 },
        metadata: { operation: 'list_public_events' }
      });
      return listPublicEventsOutputSchema.parse({ status: 'success', data: events.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing public events');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_public_events'
        }
      });
      return listPublicEventsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listRepoNotificationsOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.array(z.object({ id: z.string(), reason: z.string() })).optional(),
  errorMessage: z.string().optional().describe('Details on notification listing failure')
}).strict();

export const listRepoNotifications = createTool({
  id: 'listRepoNotifications',
  description: 'Lists notifications for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    all: z.boolean().optional(),
    participating: z.boolean().optional(),
    since: z.string().optional(),
    before: z.string().optional(),
  }),
  outputSchema: listRepoNotificationsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_repo_notifications',
      input: {
        owner: context.owner,
        repo: context.repo,
        all: context.all,
        participating: context.participating,
        since: context.since,
        before: context.before
      }
    });

    try {
      const notifications = await octokit.request('GET /repos/{owner}/{repo}/notifications', context);
      logger.info('Repository notifications listed successfully');

      spanName?.end({
        output: { notifications_count: notifications.data?.length || 0 },
        metadata: { operation: 'list_repo_notifications' }
      });
      return listRepoNotificationsOutputSchema.parse({ status: 'success', data: notifications.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing repository notifications');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_repo_notifications'
        }
      });
      return listRepoNotificationsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const markRepoNotificationsAsReadOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.literal(true) }),
  errorMessage: z.string().optional().describe('Failure in marking notifications read')
}).strict();

export const markRepoNotificationsAsRead = createTool({
  id: 'markRepoNotificationsAsRead',
  description: 'Marks notifications as read for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    last_read_at: z.string().optional(),
  }),
  outputSchema: markRepoNotificationsAsReadOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'mark_repo_notifications_as_read',
      input: { owner: context.owner, repo: context.repo, last_read_at: context.last_read_at }
    });

    try {
      await octokit.activity.markRepoNotificationsAsRead(context);
      logger.info('Repository notifications marked as read successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'mark_repo_notifications_as_read' }
      });
      return markRepoNotificationsAsReadOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error marking repository notifications as read');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'mark_repo_notifications_as_read'
        }
      });
      return markRepoNotificationsAsReadOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});

const getRepoSubscriptionOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.object({
    subscribed: z.boolean(),
    ignored: z.boolean(),
    reason: z.string().nullable(),
    created_at: z.string().optional(),
    url: z.string().optional()
  }).passthrough(),
  errorMessage: z.string().optional().describe('Subscription retrieval error')
}).strict();

export const getRepoSubscription = createTool({
  id: 'getRepoSubscription',
  description: 'Gets a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: getRepoSubscriptionOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_repo_subscription',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const subscription = await octokit.activity.getRepoSubscription(context);
      logger.info('Repository subscription retrieved successfully');

      spanName?.end({
        output: { subscribed: subscription.data.subscribed, ignored: subscription.data.ignored },
        metadata: { operation: 'get_repo_subscription' }
      });
      return getRepoSubscriptionOutputSchema.parse({ status: 'success', data: subscription.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting repository subscription');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_repo_subscription'
        }
      });
      return getRepoSubscriptionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const setRepoSubscriptionOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.object({
    subscribed: z.boolean(),
    ignored: z.boolean()
  }).passthrough(),
  errorMessage: z.string().optional().describe('Error updating subscription')
}).strict();

export const setRepoSubscription = createTool({
  id: 'setRepoSubscription',
  description: 'Sets a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    subscribed: z.boolean().optional(),
    ignored: z.boolean().optional(),
  }),
  outputSchema: setRepoSubscriptionOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'set_repo_subscription',
      input: {
        owner: context.owner,
        repo: context.repo,
        subscribed: context.subscribed,
        ignored: context.ignored
      }
    });

    try {
      const subscription = await octokit.activity.setRepoSubscription(context);
      logger.info('Repository subscription set successfully');

      spanName?.end({
        output: { subscribed: subscription.data.subscribed, ignored: subscription.data.ignored },
        metadata: { operation: 'set_repo_subscription' }
      });
      return setRepoSubscriptionOutputSchema.parse({ status: 'success', data: subscription.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error setting repository subscription');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'set_repo_subscription'
        }
      });
      return setRepoSubscriptionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deleteRepoSubscriptionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }),
  errorMessage: z.string().optional().describe('Details on subscription deletion failure')
}).strict();

export const deleteRepoSubscription = createTool({
  id: 'deleteRepoSubscription',
  description: 'Deletes a repository subscription.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: deleteRepoSubscriptionOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_repo_subscription',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      await octokit.activity.deleteRepoSubscription(context);
      logger.info('Repository subscription deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_repo_subscription' }
      });
      return deleteRepoSubscriptionOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting repository subscription');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_repo_subscription'
        }
      });
      return deleteRepoSubscriptionOutputSchema.parse({ status: 'error', data: { success: false }, errorMessage });
    }
  },
});
