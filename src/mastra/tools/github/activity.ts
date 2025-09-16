import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const EventActorSchema = z.object({
  id: z.number(),
  login: z.string(),
  display_login: z.string(),
  gravatar_id: z.string(),
  url: z.string().url(),
  avatar_url: z.string().url()
});

const EventRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string().url()
});

const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: EventActorSchema,
  repo: EventRepoSchema,
  payload: z.object({}).strict(),
  public: z.boolean(),
  created_at: z.string().datetime()
});

const NotificationSchema = z.object({
  id: z.string(),
  thread_id: z.number(),
  repository: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean()
  }),
  reason: z.enum(['subscribed', 'mention', 'review_requested', 'ci_activity', 'review_request_removed', 'review_dismissed', 'review_re_request', 'repo', 'assigned', 'comment', 'team_mention', 'security_and_maintenance']),
  subject: z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['Issue', 'PullRequest', 'Release', 'RepositoryAdvisory', 'RepositoryVulnerabilityAlert', 'Discussion']),
    latest_comment_url: z.string().url().optional()
  }),
  url: z.string().url(),
  updated_at: z.string().datetime(),
  last_read_at: z.string().datetime().optional(),
  unsubscribe_url: z.string().url(),
  subscription_url: z.string().url()
});

const listRepoEventsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(EventSchema).optional(),
  errorMessage: z.string().optional().describe('Error message for failed repository events listing')
}).strict();

const listPublicEventsOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.array(EventSchema).optional(),
  errorMessage: z.string().optional().describe('Error for public events retrieval')
}).strict();

const listRepoNotificationsOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.array(NotificationSchema).optional(),
  errorMessage: z.string().optional().describe('Details on notification listing failure')
}).strict();

const markRepoNotificationsAsReadOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.literal(true) }),
  errorMessage: z.string().optional().describe('Failure in marking notifications read')
}).strict();

const getRepoSubscriptionOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.object({
    subscribed: z.boolean(),
    ignored: z.boolean(),
    reason: z.string().nullable(),
    created_at: z.string().datetime().optional(),
    url: z.string().url().optional(),
    repository_url: z.string().url().optional()
  }),
  errorMessage: z.string().optional().describe('Subscription retrieval error')
}).strict();

const setRepoSubscriptionOutputSchema = z.object({
  status: z.union([z.literal('success'), z.literal('error')]),
  data: z.object({
    subscribed: z.boolean(),
    ignored: z.boolean(),
    created_at: z.string().datetime().optional(),
    reason: z.string().nullable().optional(),
    url: z.string().url().optional(),
    repository_url: z.string().url().optional()
  }),
  errorMessage: z.string().optional().describe('Error updating subscription')
}).strict();

const deleteRepoSubscriptionOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({ success: z.boolean() }),
  errorMessage: z.string().optional().describe('Details on subscription deletion failure')
}).strict();

const EventActorSchema = z.object({
  id: z.number(),
  login: z.string(),
  display_login: z.string(),
  gravatar_id: z.string(),
  url: z.string().url(),
  avatar_url: z.string().url()
});

const EventRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string().url()
});

const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: EventActorSchema,
  repo: EventRepoSchema,
  payload: z.object({}).strict(),
  public: z.boolean(),
  created_at: z.string().datetime()
});

export const listRepoEvents = createTool({
  id: 'listRepoEvents',
  description: 'Lists events for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: z.object({
    status: z.enum(['success', 'error']),
    data: z.array(EventSchema).optional(),
    errorMessage: z.string().optional()
  }).strict(),
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


export const listPublicEvents = createTool({
  id: 'listPublicEvents',
  description: 'Lists public events.',
  inputSchema: z.object({
    per_page: z.number().optional(),
    page: z.number().optional(),
  }),
  outputSchema: z.object({
    status: z.union([z.literal('success'), z.literal('error')]),
    data: z.array(EventSchema).optional(),
    errorMessage: z.string().optional()
  }).strict(),
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


const NotificationSchema = z.object({
  id: z.string(),
  thread_id: z.number(),
  repository: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean()
  }),
  reason: z.enum(['subscribed', 'mention', 'review_requested', 'ci_activity', 'review_request_removed', 'review_dismissed', 'review_re_request', 'repo', 'assigned', 'comment', 'team_mention', 'security_and_maintenance']),
  subject: z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['Issue', 'PullRequest', 'Release', 'RepositoryAdvisory', 'RepositoryVulnerabilityAlert', 'Discussion']),
    latest_comment_url: z.string().url().optional()
  }),
  url: z.string().url(),
  updated_at: z.string().datetime(),
  last_read_at: z.string().datetime().optional(),
  unsubscribe_url: z.string().url(),
  subscription_url: z.string().url()
});

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
  outputSchema: z.object({
    status: z.union([z.literal('success'), z.literal('error')]),
    data: z.array(NotificationSchema).optional(),
    errorMessage: z.string().optional()
  }).strict(),
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
      return markRepoNotificationsAsReadOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});


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
      return deleteRepoSubscriptionOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
