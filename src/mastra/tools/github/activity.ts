import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

// Consolidated base schemas to eliminate duplicates
const EventActorSchema = z.object({
  id: z.number(),
  login: z.string(),
  display_login: z.string().optional(),
  gravatar_id: z.string().optional(),
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
  payload: z.record(z.any()), // More flexible than strict empty object
  public: z.boolean(),
  created_at: z.string().datetime()
});

// Optimized notification schema with better structure
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

// Subscription schema with partial optimization
const SubscriptionSchema = z.object({
  subscribed: z.boolean(),
  ignored: z.boolean(),
  reason: z.string().nullable(),
  created_at: z.string().datetime().optional(),
  url: z.string().url().optional(),
  repository_url: z.string().url().optional()
}).partial({
  created_at: true,
  url: true,
  repository_url: true
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
  if (error !== null && error !== undefined && typeof error === 'object' && 'status' in (error)) {
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

//export const listRepoEvents = createTool({
//  id: 'listRepoEvents',
//  description: 'Lists events for a repository with pagination support. Returns recent activity including pushes, pull requests, issues, and more.',
//  inputSchema: z.object({
//    owner: z.string().describe('Repository owner (username or organization)'),
//    repo: z.string().describe('Repository name'),
//    per_page: z.number().min(1).max(100).optional().default(30).describe('Number of events per page'),
//    page: z.number().min(1).optional().default(1).describe('Page number for pagination')
//  }),
//  outputSchema: BaseOutputSchema(z.array(EventSchema)),
//  execute: async ({ context, tracingContext }) => {
//    const spanName = tracingContext?.currentSpan?.createChildSpan({
//      type: AISpanType.GENERIC,
//      name: 'list_repo_events',
//      input: { owner: context.owner, repo: context.repo, per_page: context.per_page, page: context.page }
//    });

//    try {
      // TODO: Repository events endpoint - API method needs to be verified
      // const events = await octokit.activity.listEventsForRepo({
      //   owner: context.owner,
      //   repo: context.repo,
      //   per_page: context.per_page ?? 30,
      //   page: context.page ?? 1
      // });
      // const events = []; // Placeholder until API method is fixed
      // return {
      //   success: true,
      //   count: events.data?.length ?? 0,
      //   output: { events_count: events.data?.length ?? 0 },
      //   data: events.data,
      //   metadata: {
      //     request_id: events.headers?.['x-github-request-id'],
      //     rate_limit_remaining: parseInt(events.headers?.['x-ratelimit-remaining'] ?? '0'),
      //     rate_limit_reset: events.headers?.['x-ratelimit-reset']
      //   }
      // };

//      logger.info('Repository events listed successfully', {
//        owner: context.owner,
//        repo: context.repo,
//        count: events.data?.length ?? 0
//      });

//      spanName?.end({
//        output: { events_count: events.data?.length ?? 0 },
//        metadata: { operation: 'list_repo_events' }
//      });

//      return BaseOutputSchema(z.array(EventSchema)).parse({
//        status: 'success',
//        data: events.data,
//        metadata: {
//          request_id: events.headers?.['x-github-request-id'],
//          rate_limit_remaining: parseInt(events.headers?.['x-ratelimit-remaining'] ?? '0'),
//          rate_limit_reset: events.headers?.['x-ratelimit-reset']
//        }
//      });
//    } catch (error: unknown) {
//      const githubError = parseGitHubError(error);
//      logger.error('GitHub API error in listRepoEvents', {
//        operation: 'list_repo_events',
//        status: githubError.status,
//        message: githubError.message,
//        owner: context.owner,
//        repo: context.repo
//      });

//      spanName?.end({
//        metadata: {
//          error: githubError.message,
//          status: githubError.status,
//          operation: 'list_repo_events'
//        }
//      });

//      return BaseOutputSchema(z.array(EventSchema)).parse({
//        status: 'error',
//        errorMessage: githubError.message,
//        metadata: {
//          request_id: githubError.request_id,
//          rate_limit_remaining: githubError.rate_limit_remaining,
//         rate_limit_reset: githubError.rate_limit_reset
//        }
//      });
//    }
//  },
//});

export const listPublicEvents = createTool({
  id: 'listPublicEvents',
  description: 'Lists public events across GitHub with pagination support. Returns recent public activity from all users and repositories.',
  inputSchema: z.object({
    per_page: z.number().min(1).max(100).optional().default(30).describe('Number of events per page'),
    page: z.number().min(1).optional().default(1).describe('Page number for pagination')
  }),
  outputSchema: BaseOutputSchema(z.array(EventSchema)),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_public_events',
      input: { per_page: context.per_page, page: context.page }
    });

    try {
      const events = await octokit.activity.listPublicEvents({
        per_page: context.per_page ?? 30,
        page: context.page ?? 1
      });

      logger.info('Public events listed successfully', {
        count: events.data?.length ?? 0
      });

      spanName?.end({
        output: { events_count: events.data?.length ?? 0 },
        metadata: { operation: 'list_public_events' }
      });

      return BaseOutputSchema(z.array(EventSchema)).parse({
        status: 'success',
        data: events.data,
        metadata: {
          request_id: events.headers?.['x-github-request-id'],
          rate_limit_remaining: parseInt(events.headers?.['x-ratelimit-remaining'] ?? '0'),
          rate_limit_reset: events.headers?.['x-ratelimit-reset']
        }
      });
    } catch (error: unknown) {
      const githubError = parseGitHubError(error);
      logger.error('GitHub API error in listPublicEvents', {
        operation: 'list_public_events',
        status: githubError.status,
        message: githubError.message
      });

      spanName?.end({
        metadata: {
          error: githubError.message,
          status: githubError.status,
          operation: 'list_public_events'
        }
      });

      return BaseOutputSchema(z.array(EventSchema)).parse({
        status: 'error',
        errorMessage: githubError.message,
        metadata: {
          request_id: githubError.request_id,
          rate_limit_remaining: githubError.rate_limit_remaining,
          rate_limit_reset: githubError.rate_limit_reset
        }
      });
    }
  },
});

//export const listRepoNotifications = createTool({
//  id: 'listRepoNotifications',
//  description: 'Lists notifications for a repository with filtering options. Returns unread notifications including mentions, reviews, and CI activity.',
//  inputSchema: z.object({
//    owner: z.string().describe('Repository owner (username or organization)'),
//    repo: z.string().describe('Repository name'),
//    all: z.boolean().optional().describe('Include all notifications, not just unread ones'),
//    participating: z.boolean().optional().describe('Only include notifications where user is participating'),
//    since: z.string().datetime().optional().describe('Only show notifications updated after this time'),
//    before: z.string().datetime().optional().describe('Only show notifications updated before this time'),
//    per_page: z.number().min(1).max(100).optional().default(50).describe('Number of notifications per page'),
//    page: z.number().min(1).optional().default(1).describe('Page number for pagination')
//  }),
//  outputSchema: BaseOutputSchema(z.array(NotificationSchema)),
//  execute: async ({ context, tracingContext }) => {
//    const spanName = tracingContext?.currentSpan?.createChildSpan({
//      type: AISpanType.GENERIC,
//      name: 'list_repo_notifications',
//      input: {
//        owner: context.owner,
//        repo: context.repo,
//        all: context.all,
//        participating: context.participating,
//        since: context.since,
//        before: context.before,
//        per_page: context.per_page,
//        page: context.page
//      }
//    });

//    try {
//      const notifications = await octokit.activity.listRepoNotifications({
//        owner: context.owner,
//        repo: context.repo,
//        all: context.all,
//        participating: context.participating ?? false,
//        since: context.since,
//        before: context.before,
//        per_page: context.per_page || 50,
//        page: context.page || 1
//      });

//      logger.info('Repository notifications listed successfully', {
//        owner: context.owner,
//        repo: context.repo,
//        count: notifications.data?.length ?? 0
//      });

//      spanName?.end({
//        output: { notifications_count: notifications.data?.length ?? 0 },
//        metadata: { operation: 'list_repo_notifications' }
//      });

//      return BaseOutputSchema(z.array(NotificationSchema)).parse({
//        status: 'success',
//        data: notifications.data,
//        metadata: {
//          request_id: notifications.headers?.['x-github-request-id'],
//          rate_limit_remaining: parseInt(notifications.headers?.['x-ratelimit-remaining'] ?? '0'),
//          rate_limit_reset: notifications.headers?.['x-ratelimit-reset']
//        }
//      });
//   } catch (error: unknown) {
//      const githubError = parseGitHubError(error);
//      logger.error('GitHub API error in listRepoNotifications', {
//        operation: 'list_repo_notifications',
//        status: githubError.status,
//        message: githubError.message,
//        owner: context.owner,
//        repo: context.repo
//      });

//      spanName?.end({
//        metadata: {
//          error: githubError.message,
//          status: githubError.status,
//          operation: 'list_repo_notifications'
//        }
//      });

//      return BaseOutputSchema(z.array(NotificationSchema)).parse({
//        status: 'error',
//        errorMessage: githubError.message,
//        metadata: {
//          request_id: githubError.request_id,
//          rate_limit_remaining: githubError.rate_limit_remaining,
//         rate_limit_reset: githubError.rate_limit_reset
//        }
//      });
//    }
//  },
//});

export const markRepoNotificationsAsRead = createTool({
  id: 'markRepoNotificationsAsRead',
  description: 'Marks all notifications as read for a repository. Useful for clearing notification backlog.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    last_read_at: z.string().datetime().optional().describe('Optional timestamp to mark notifications as read until')
  }),
  outputSchema: BaseOutputSchema(z.object({ success: z.boolean() })),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'mark_repo_notifications_as_read',
      input: { owner: context.owner, repo: context.repo, last_read_at: context.last_read_at }
    });

    try {
      await octokit.activity.markRepoNotificationsAsRead({
        owner: context.owner,
        repo: context.repo,
        last_read_at: context.last_read_at
      });

      logger.info('Repository notifications marked as read successfully', {
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'mark_repo_notifications_as_read' }
      });

      return BaseOutputSchema(z.object({ success: z.boolean() })).parse({
        status: 'success',
        data: { success: true }
      });
    } catch (error: unknown) {
      const githubError = parseGitHubError(error);
      logger.error('GitHub API error in markRepoNotificationsAsRead', {
        operation: 'mark_repo_notifications_as_read',
        status: githubError.status,
        message: githubError.message,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        metadata: {
          error: githubError.message,
          status: githubError.status,
          operation: 'mark_repo_notifications_as_read'
        }
      });

      return BaseOutputSchema(z.object({ success: z.boolean() })).parse({
        status: 'error',
        errorMessage: githubError.message,
        metadata: {
          request_id: githubError.request_id,
          rate_limit_remaining: githubError.rate_limit_remaining,
          rate_limit_reset: githubError.rate_limit_reset
        }
      });
    }
  },
});

export const getRepoSubscription = createTool({
  id: 'getRepoSubscription',
  description: 'Gets the current subscription status for a repository. Shows whether notifications are enabled and subscription preferences.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name')
  }),
  outputSchema: BaseOutputSchema(SubscriptionSchema),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_repo_subscription',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      const subscription = await octokit.activity.getRepoSubscription({
        owner: context.owner,
        repo: context.repo
      });

      logger.info('Repository subscription retrieved successfully', {
        owner: context.owner,
        repo: context.repo,
        subscribed: subscription.data.subscribed,
        ignored: subscription.data.ignored
      });

      spanName?.end({
        output: { subscribed: subscription.data.subscribed, ignored: subscription.data.ignored },
        metadata: { operation: 'get_repo_subscription' }
      });

      return BaseOutputSchema(SubscriptionSchema).parse({
        status: 'success',
        data: subscription.data,
        metadata: {
          request_id: subscription.headers?.['x-github-request-id'],
          rate_limit_remaining: parseInt(subscription.headers?.['x-ratelimit-remaining'] ?? '0'),
          rate_limit_reset: subscription.headers?.['x-ratelimit-reset']
        }
      });
    } catch (error: unknown) {
      const githubError = parseGitHubError(error);
      logger.error('GitHub API error in getRepoSubscription', {
        operation: 'get_repo_subscription',
        status: githubError.status,
        message: githubError.message,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        metadata: {
          error: githubError.message,
          status: githubError.status,
          operation: 'get_repo_subscription'
        }
      });

      return BaseOutputSchema(SubscriptionSchema).parse({
        status: 'error',
        errorMessage: githubError.message,
        metadata: {
          request_id: githubError.request_id,
          rate_limit_remaining: githubError.rate_limit_remaining,
          rate_limit_reset: githubError.rate_limit_reset
        }
      });
    }
  },
});

export const setRepoSubscription = createTool({
  id: 'setRepoSubscription',
  description: 'Sets notification subscription preferences for a repository. Control whether to receive notifications and subscription behavior.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    subscribed: z.boolean().optional().describe('Whether to subscribe to notifications'),
    ignored: z.boolean().optional().describe('Whether to ignore notifications (takes precedence over subscribed)')
  }),
  outputSchema: BaseOutputSchema(SubscriptionSchema),
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
      const subscription = await octokit.rest.activity.setRepoSubscription({
        owner: context.owner,
        repo: context.repo,
        subscribed: context.subscribed,
        ignored: context.ignored
      });

      logger.info('Repository subscription set successfully', {
        owner: context.owner,
        repo: context.repo,
        subscribed: subscription.data.subscribed,
        ignored: subscription.data.ignored
      });

      spanName?.end({
        output: { subscribed: subscription.data.subscribed, ignored: subscription.data.ignored },
        metadata: { operation: 'set_repo_subscription' }
      });

      return BaseOutputSchema(SubscriptionSchema).parse({
        status: 'success',
        data: subscription.data,
        metadata: {
          request_id: subscription.headers?.['x-github-request-id'],
          rate_limit_remaining: parseInt(subscription.headers?.['x-ratelimit-remaining'] ?? '0'),
          rate_limit_reset: subscription.headers?.['x-ratelimit-reset']
        }
      });
    } catch (error: unknown) {
      const githubError = parseGitHubError(error);
      logger.error('GitHub API error in setRepoSubscription', {
        operation: 'set_repo_subscription',
        status: githubError.status,
        message: githubError.message,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        metadata: {
          error: githubError.message,
          status: githubError.status,
          operation: 'set_repo_subscription'
        }
      });

      return BaseOutputSchema(SubscriptionSchema).parse({
        status: 'error',
        errorMessage: githubError.message,
        metadata: {
          request_id: githubError.request_id,
          rate_limit_remaining: githubError.rate_limit_remaining,
          rate_limit_reset: githubError.rate_limit_reset
        }
      });
    }
  },
});

export const deleteRepoSubscription = createTool({
  id: 'deleteRepoSubscription',
  description: 'Deletes the notification subscription for a repository. Stops receiving notifications for this repository.',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name')
  }),
  outputSchema: BaseOutputSchema(z.object({ success: z.boolean() })),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_repo_subscription',
      input: { owner: context.owner, repo: context.repo }
    });

    try {
      await octokit.rest.activity.deleteRepoSubscription({
        owner: context.owner,
        repo: context.repo
      });

      logger.info('Repository subscription deleted successfully', {
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_repo_subscription' }
      });

      return BaseOutputSchema(z.object({ success: z.boolean() })).parse({
        status: 'success',
        data: { success: true }
      });
    } catch (error: unknown) {
      const githubError = parseGitHubError(error);
      logger.error('GitHub API error in deleteRepoSubscription', {
        operation: 'delete_repo_subscription',
        status: githubError.status,
        message: githubError.message,
        owner: context.owner,
        repo: context.repo
      });

      spanName?.end({
        metadata: {
          error: githubError.message,
          status: githubError.status,
          operation: 'delete_repo_subscription'
        }
      });

      return BaseOutputSchema(z.object({ success: z.boolean() })).parse({
        status: 'error',
        errorMessage: githubError.message,
        metadata: {
          request_id: githubError.request_id,
          rate_limit_remaining: githubError.rate_limit_remaining,
          rate_limit_reset: githubError.rate_limit_reset
        }
      });
    }
  },
});
