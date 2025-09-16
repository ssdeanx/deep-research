import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listWorkflowRunsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    total_count: z.number(),
    workflow_runs: z.array(z.object({
      id: z.number(),
      name: z.string(),
      node_id: z.string(),
      head_branch: z.string(),
      head_sha: z.string(),
      path: z.string(),
      run_number: z.number(),
      event: z.string(),
      display_title: z.string(),
      status: z.enum(['queued', 'in_progress', 'completed', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', 'pending']),
      conclusion: z.nullable(z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required', 'skipped', 'stale'])),
      workflow_id: z.number(),
      url: z.string(),
      html_url: z.string(),
      pull_requests: z.array(z.object({
        id: z.number(),
        number: z.number(),
        state: z.enum(['open', 'closed']),
        locked: z.boolean(),
        title: z.string(),
        body: z.string().optional(),
        created_at: z.string(),
        updated_at: z.string(),
        closed_at: z.string().optional(),
        merged_at: z.string().optional(),
        merge_commit_sha: z.string().optional(),
        assignee: z.object({
          login: z.string(),
          id: z.number()
        }).optional(),
        assignees: z.array(z.object({
          login: z.string(),
          id: z.number()
        })),
        requested_reviewers: z.array(z.object({
          login: z.string(),
          id: z.number()
        })),
        requested_teams: z.array(z.object({
          name: z.string(),
          id: z.number()
        })),
        labels: z.array(z.object({
          id: z.number(),
          name: z.string()
        })),
        milestone: z.object({
          id: z.number(),
          title: z.string()
        }).optional(),
        head: z.object({
          label: z.string(),
          ref: z.string(),
          sha: z.string(),
          user: z.object({
            login: z.string(),
            id: z.number()
          })
        }),
        base: z.object({
          label: z.string(),
          ref: z.string(),
          sha: z.string(),
          user: z.object({
            login: z.string(),
            id: z.number()
          })
        }),
        author_association: z.enum(['OWNER', 'COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'FIRST_TIMER', 'MEMBER', 'NONE', 'OUTSIDE_COLLABORATOR']),
        auto_merge: z.null(),
        draft: z.boolean(),
        merged: z.boolean().optional(),
        mergeable: z.boolean().optional(),
        rebaseable: z.boolean().optional(),
        mergeable_state: z.enum(['unknown', 'behind', 'has_hooks', 'blocker']),
        merged_by: z.object({
          login: z.string(),
          id: z.number()
        }).optional(),
        comments: z.number(),
        review_comments: z.number(),
        maintainer_can_modify: z.boolean(),
        commits: z.number(),
        additions: z.number(),
        deletions: z.number(),
        changed_files: z.number().optional()
      })),
      created_at: z.string(),
      updated_at: z.string(),
      actor: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string().optional(),
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
        site_admin: z.boolean()
      }),
      run_attempt: z.number(),
      run_started_at: z.string(),
      triggering_actor: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string().optional(),
        url: z.string(),
        html_url: z.string(),
        type: z.string(),
        site_admin: z.boolean()
      }),
      head_commit: z.object({
        id: z.string(),
        tree_id: z.string(),
        message: z.string(),
        timestamp: z.string(),
        author: z.object({
          name: z.string(),
          email: z.string()
        }),
        committer: z.object({
          name: z.string(),
          email: z.string()
        })
      }),
      repository: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean(),
        owner: z.object({
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
          site_admin: z.boolean()
        }),
        html_url: z.string(),
        description: z.string(),
        fork: z.boolean(),
        url: z.string(),
        forks_url: z.string(),
        keys_url: z.string(),
        collaborators_url: z.string(),
        teams_url: z.string(),
        hooks_url: z.string(),
        issue_events_url: z.string(),
        events_url: z.string(),
        assignees_url: z.string(),
        branches_url: z.string(),
        tags_url: z.string(),
        blobs_url: z.string(),
        git_tags_url: z.string(),
        git_refs_url: z.string(),
        trees_url: z.string(),
        statuses_url: z.string(),
        languages_url: z.string(),
        stargazers_url: z.string(),
        contributors_url: z.string(),
        subscribers_url: z.string(),
        subscription_url: z.string(),
        commits_url: z.string(),
        git_commits_url: z.string(),
        comments_url: z.string(),
        issues_url: z.string(),
        pulls_url: z.string(),
        milestones_url: z.string(),
        notifications_url: z.string(),
        labels_url: z.string(),
        releases_url: z.string(),
        deployments_url: z.string(),
        downloads_url: z.string(),
        archive_url: z.string(),
        compare_url: z.string(),
        contents_url: z.string(),
        merges_url: z.string(),
        clone_url: z.string(),
        mirror_url: z.string(),
        svn_url: z.string(),
        homepage: z.string(),
        language: z.string().optional(),
        forks_count: z.number(),
        stargazers_count: z.number(),
        watchers_count: z.number(),
        size: z.number(),
        default_branch: z.string(),
        open_issues_count: z.number(),
        is_template: z.boolean(),
        topics: z.array(z.string()),
        has_issues: z.boolean(),
        has_projects: z.boolean(),
        has_wiki: z.boolean(),
        has_pages: z.boolean(),
        has_downloads: z.boolean(),
        archived: z.boolean(),
        disabled: z.boolean(),
        visibility: z.string(),
        permissions: z.object({
          admin: z.boolean(),
          maintain: z.boolean(),
          push: z.boolean(),
          triage: z.boolean(),
          pull: z.boolean()
        }).optional()
      }),
      head_repository: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean(),
        owner: z.object({
          login: z.string(),
          id: z.number(),
          node_id: z.string(),
          avatar_url: z.string(),
          gravatar_id: z.string(),
          url: z.string(),
          html_url: z.string(),
          type: z.string(),
          site_admin: z.boolean()
        }),
        html_url: z.string(),
        description: z.string(),
        fork: z.boolean(),
        url: z.string(),
        forks_url: z.string(),
        permissions: z.object({
          admin: z.boolean(),
          push: z.boolean(),
          pull: z.boolean()
        }),
        organization: z.object({
          login: z.string(),
          id: z.number(),
          node_id: z.string(),
          avatar_url: z.string(),
          gravatar_id: z.string(),
          url: z.string(),
          html_url: z.string(),
          type: z.string(),
          site_admin: z.boolean()
        }).optional(),
        parent: z.object({
          id: z.number(),
          node_id: z.string(),
          name: z.string(),
          full_name: z.string(),
          private: z.boolean()
        }).optional(),
        source: z.object({
          id: z.number(),
          node_id: z.string(),
          name: z.string(),
          full_name: z.string(),
          private: z.boolean()
        }).optional(),
        license: z.object({
          key: z.string(),
          name: z.string(),
          spdx_id: z.string(),
          url: z.string().optional(),
          node_id: z.string()
        }).optional(),
        code_of_conduct: z.object({
          url: z.string(),
          key: z.string(),
          name: z.string(),
          body: z.string()
        }).optional(),
        features: z.object({
          issues: z.boolean(),
          wiki: z.boolean(),
          discussions_in_collaborators_only: z.boolean(),
          fuzzymatcher: z.boolean(),
          copilot: z.boolean(),
          copilot_code_completions: z.boolean(),
          copilot_business: z.boolean(),
          interactions: z.boolean(),
          security: z.boolean(),
          dependabot: z.boolean(),
          pages: z.boolean(),
          code_scanning: z.boolean(),
          secret_scanning: z.boolean(),
          secret_scanning_push_protection: z.boolean()
        }).optional(),
        allow_forking: z.boolean(),
        is_template: z.boolean(),
        web_commit_signoff_required: z.boolean(),
        workflows: z.object({
          default_workflow_permissions: z.enum(['read', 'write']),
          can_approve_pull_request_reviews: z.boolean()
        }).optional(),
        delete_branch_on_merge: z.boolean(),
        subscribers_count: z.number(),
        network_count: z.number()
      }),
      jobs_url: z.string(),
      logs_url: z.string(),
      check_suite_url: z.string(),
      artifacts_url: z.string(),
      cancel_url: z.string(),
      rerun_url: z.string(),
      workflow_url: z.string(),
      check_suite_id: z.number().optional(),
      check_suite_node_id: z.string().optional()
    }))
  }),
  errorMessage: z.string().optional().describe('Error in listing workflow runs')
}).strict();

export const listWorkflowRuns = createTool({
  id: 'listWorkflowRuns',
  description: 'Lists workflow runs for a repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    workflow_id: z.union([z.number(), z.string()]),
  }),
  outputSchema: listWorkflowRunsOutputSchema,
  execute: async (args: Readonly<{ context: Readonly<Record<string, unknown>>; tracingContext?: any }>) => {
    const { context, tracingContext } = args;

    // Safely coerce expected required params from the untyped context
    const owner = String((context as any).owner ?? '');
    const repo = String((context as any).repo ?? '');
    const workflow_id = (context as any).workflow_id as string | number | undefined;

    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_workflow_runs',
      input: { owner, repo, workflow_id }
    });

    try {
      // Build explicit params object to satisfy typed Octokit API
      const params: { owner: string; repo: string; workflow_id: string | number } = {
        owner,
        repo,
        workflow_id: workflow_id as string | number
      };

      const runs = await octokit.actions.listWorkflowRuns(params as any);
      logger.info('Workflow runs listed successfully');

      spanName?.end({
        output: { workflow_runs_count: runs.data.workflow_runs?.length || 0 },
        metadata: { operation: 'list_workflow_runs' }
      });
      return listWorkflowRunsOutputSchema.parse({ status: 'success', data: runs.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow runs');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_runs'
        }
      });
      return listWorkflowRunsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    name: z.string(),
    node_id: z.string(),
    head_branch: z.string(),
    head_sha: z.string(),
    path: z.string(),
    run_number: z.number(),
    event: z.string(),
    display_title: z.string(),
    status: z.enum(['queued', 'in_progress', 'completed', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', 'pending']),
    conclusion: z.nullable(z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required', 'skipped', 'stale'])),
    workflow_id: z.number(),
    url: z.string(),
    html_url: z.string(),
    pull_requests: z.array(z.object({
      id: z.number(),
      number: z.number(),
      state: z.enum(['open', 'closed']),
      locked: z.boolean(),
      title: z.string(),
      body: z.string().optional(),
      created_at: z.string(),
      updated_at: z.string(),
      closed_at: z.string().optional(),
      merged_at: z.string().optional(),
      merge_commit_sha: z.string().optional(),
      assignee: z.object({
        login: z.string(),
        id: z.number()
      }).optional(),
      assignees: z.array(z.object({
        login: z.string(),
        id: z.number()
      })),
      requested_reviewers: z.array(z.object({
        login: z.string(),
        id: z.number()
      })),
      requested_teams: z.array(z.object({
        name: z.string(),
        id: z.number()
      })),
      labels: z.array(z.object({
        id: z.number(),
        name: z.string()
      })),
      milestone: z.object({
        id: z.number(),
        title: z.string()
      }).optional(),
      head: z.object({
        label: z.string(),
        ref: z.string(),
        sha: z.string(),
        user: z.object({
          login: z.string(),
          id: z.number()
        })
      }),
      base: z.object({
        label: z.string(),
        ref: z.string(),
        sha: z.string(),
        user: z.object({
          login: z.string(),
          id: z.number()
        })
      }),
      author_association: z.enum(['OWNER', 'COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'FIRST_TIMER', 'MEMBER', 'NONE', 'OUTSIDE_COLLABORATOR']),
      auto_merge: z.null(),
      draft: z.boolean(),
      merged: z.boolean().optional(),
      mergeable: z.boolean().optional(),
      rebaseable: z.boolean().optional(),
      mergeable_state: z.enum(['unknown', 'behind', 'has_hooks', 'blocker']),
      merged_by: z.object({
        login: z.string(),
        id: z.number()
      }).optional(),
      comments: z.number(),
      review_comments: z.number(),
      maintainer_can_modify: z.boolean(),
      commits: z.number(),
      additions: z.number(),
      deletions: z.number(),
      changed_files: z.number().optional()
    })),
    created_at: z.string(),
    updated_at: z.string(),
    actor: z.object({
      login: z.string(),
      id: z.number(),
      node_id: z.string(),
      avatar_url: z.string(),
      gravatar_id: z.string().optional(),
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
      site_admin: z.boolean()
    }),
    run_attempt: z.number(),
    run_started_at: z.string(),
    triggering_actor: z.object({
      login: z.string(),
      id: z.number(),
      node_id: z.string(),
      avatar_url: z.string(),
      gravatar_id: z.string().optional(),
      url: z.string(),
      html_url: z.string(),
      type: z.string(),
      site_admin: z.boolean()
    }),
    head_commit: z.object({
      id: z.string(),
      tree_id: z.string(),
      message: z.string(),
      timestamp: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string()
      }),
      committer: z.object({
        name: z.string(),
        email: z.string()
      })
    }),
    repository: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: z.object({
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
        site_admin: z.boolean()
      }),
      html_url: z.string(),
      description: z.string(),
      fork: z.boolean(),
      url: z.string(),
      forks_url: z.string(),
      keys_url: z.string(),
      collaborators_url: z.string(),
      teams_url: z.string(),
      hooks_url: z.string(),
      issue_events_url: z.string(),
      events_url: z.string(),
      assignees_url: z.string(),
      branches_url: z.string(),
      tags_url: z.string(),
      blobs_url: z.string(),
      git_tags_url: z.string(),
      git_refs_url: z.string(),
      trees_url: z.string(),
      statuses_url: z.string(),
      languages_url: z.string(),
      stargazers_url: z.string(),
      contributors_url: z.string(),
      subscribers_url: z.string(),
      subscription_url: z.string(),
      commits_url: z.string(),
      git_commits_url: z.string(),
      comments_url: z.string(),
      issues_url: z.string(),
      pulls_url: z.string(),
      milestones_url: z.string(),
      notifications_url: z.string(),
      labels_url: z.string(),
      releases_url: z.string(),
      deployments_url: z.string(),
      downloads_url: z.string(),
      archive_url: z.string(),
      compare_url: z.string(),
      contents_url: z.string(),
      merges_url: z.string(),
      clone_url: z.string(),
      mirror_url: z.string(),
      svn_url: z.string(),
      homepage: z.string(),
      language: z.string().optional(),
      forks_count: z.number(),
      stargazers_count: z.number(),
      watchers_count: z.number(),
      size: z.number(),
      default_branch: z.string(),
      open_issues_count: z.number(),
      is_template: z.boolean(),
      topics: z.array(z.string()),
      has_issues: z.boolean(),
      has_projects: z.boolean(),
      has_wiki: z.boolean(),
      has_pages: z.boolean(),
      has_downloads: z.boolean(),
      archived: z.boolean(),
      disabled: z.boolean(),
      visibility: z.string(),
      permissions: z.object({
        admin: z.boolean(),
        maintain: z.boolean(),
        push: z.boolean(),
        triage: z.boolean(),
        pull: z.boolean()
      }).optional()
    }),
    head_repository: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string(),
        url: z.string(),
        html_url: z.string(),
        type: z.string(),
        site_admin: z.boolean()
      }),
      html_url: z.string(),
      description: z.string(),
      fork: z.boolean(),
      url: z.string(),
      forks_url: z.string(),
      permissions: z.object({
        admin: z.boolean(),
        push: z.boolean(),
        pull: z.boolean()
      }),
      organization: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string(),
        url: z.string(),
        html_url: z.string(),
        type: z.string(),
        site_admin: z.boolean()
      }).optional(),
      parent: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean()
      }).optional(),
      source: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean()
      }).optional(),
      license: z.object({
        key: z.string(),
        name: z.string(),
        spdx_id: z.string(),
        url: z.string().optional(),
        node_id: z.string()
      }).optional(),
      code_of_conduct: z.object({
        url: z.string(),
        key: z.string(),
        name: z.string(),
        body: z.string()
      }).optional(),
      features: z.object({
        issues: z.boolean(),
        wiki: z.boolean(),
        discussions_in_collaborators_only: z.boolean(),
        fuzzymatcher: z.boolean(),
        copilot: z.boolean(),
        copilot_code_completions: z.boolean(),
        copilot_business: z.boolean(),
        interactions: z.boolean(),
        security: z.boolean(),
        dependabot: z.boolean(),
        pages: z.boolean(),
        code_scanning: z.boolean(),
        secret_scanning: z.boolean(),
        secret_scanning_push_protection: z.boolean()
      }).optional(),
      allow_forking: z.boolean(),
      is_template: z.boolean(),
      web_commit_signoff_required: z.boolean(),
      workflows: z.object({
        default_workflow_permissions: z.enum(['read', 'write']),
        can_approve_pull_request_reviews: z.boolean()
      }).optional(),
      delete_branch_on_merge: z.boolean(),
      subscribers_count: z.number(),
      network_count: z.number()
    }),
    jobs_url: z.string(),
    logs_url: z.string(),
    check_suite_url: z.string(),
    artifacts_url: z.string(),
    cancel_url: z.string(),
    rerun_url: z.string(),
    workflow_url: z.string(),
    check_suite_id: z.number().optional(),
    check_suite_node_id: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting workflow run details')
}).strict();

export const getWorkflowRun = createTool({
  id: 'getWorkflowRun',
  description: 'Gets a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: getWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const run = await octokit.actions.getWorkflowRun(context);
      logger.info('Workflow run retrieved successfully');

      spanName?.end({
        output: { run_id: run.data.id, status: run.data.status },
        metadata: { operation: 'get_workflow_run' }
      });
      return getWorkflowRunOutputSchema.parse({ status: 'success', data: run.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_workflow_run'
        }
      });
      return getWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const cancelWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({}),
  errorMessage: z.string().optional().describe('Error in cancelling workflow run')
}).strict();

export const cancelWorkflowRun = createTool({
  id: 'cancelWorkflowRun',
  description: 'Cancels a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: cancelWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'cancel_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      await octokit.actions.cancelWorkflowRun(context);
      logger.info('Workflow run cancelled successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'cancel_workflow_run' }
      });
      return cancelWorkflowRunOutputSchema.parse({ status: 'success', data: {} });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error cancelling workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'cancel_workflow_run'
        }
      });
      return cancelWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const rerunWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    name: z.string(),
    node_id: z.string(),
    head_branch: z.string(),
    head_sha: z.string(),
    path: z.string(),
    run_number: z.number(),
    event: z.string(),
    display_title: z.string(),
    status: z.enum(['queued', 'in_progress', 'completed', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', 'pending']),
    conclusion: z.nullable(z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required', 'skipped', 'stale'])),
    workflow_id: z.number(),
    url: z.string(),
    html_url: z.string(),
    pull_requests: z.array(z.object({
      id: z.number(),
      number: z.number(),
      state: z.enum(['open', 'closed']),
      locked: z.boolean(),
      title: z.string(),
      body: z.string().optional(),
      created_at: z.string(),
      updated_at: z.string(),
      closed_at: z.string().optional(),
      merged_at: z.string().optional(),
      merge_commit_sha: z.string().optional(),
      assignee: z.object({
        login: z.string(),
        id: z.number()
      }).optional(),
      assignees: z.array(z.object({
        login: z.string(),
        id: z.number()
      })),
      requested_reviewers: z.array(z.object({
        login: z.string(),
        id: z.number()
      })),
      requested_teams: z.array(z.object({
        name: z.string(),
        id: z.number()
      })),
      labels: z.array(z.object({
        id: z.number(),
        name: z.string()
      })),
      milestone: z.object({
        id: z.number(),
        title: z.string()
      }).optional(),
      head: z.object({
        label: z.string(),
        ref: z.string(),
        sha: z.string(),
        user: z.object({
          login: z.string(),
          id: z.number()
        })
      }),
      base: z.object({
        label: z.string(),
        ref: z.string(),
        sha: z.string(),
        user: z.object({
          login: z.string(),
          id: z.number()
        })
      }),
      author_association: z.enum(['OWNER', 'COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'FIRST_TIMER', 'MEMBER', 'NONE', 'OUTSIDE_COLLABORATOR']),
      auto_merge: z.null(),
      draft: z.boolean(),
      merged: z.boolean().optional(),
      mergeable: z.boolean().optional(),
      rebaseable: z.boolean().optional(),
      mergeable_state: z.enum(['unknown', 'behind', 'has_hooks', 'blocker']),
      merged_by: z.object({
        login: z.string(),
        id: z.number()
      }).optional(),
      comments: z.number(),
      review_comments: z.number(),
      maintainer_can_modify: z.boolean(),
      commits: z.number(),
      additions: z.number(),
      deletions: z.number(),
      changed_files: z.number().optional()
    })),
    created_at: z.string(),
    updated_at: z.string(),
    actor: z.object({
      login: z.string(),
      id: z.number(),
      node_id: z.string(),
      avatar_url: z.string(),
      gravatar_id: z.string().optional(),
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
      site_admin: z.boolean()
    }),
    run_attempt: z.number(),
    run_started_at: z.string(),
    triggering_actor: z.object({
      login: z.string(),
      id: z.number(),
      node_id: z.string(),
      avatar_url: z.string(),
      gravatar_id: z.string().optional(),
      url: z.string(),
      html_url: z.string(),
      type: z.string(),
      site_admin: z.boolean()
    }),
    head_commit: z.object({
      id: z.string(),
      tree_id: z.string(),
      message: z.string(),
      timestamp: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string()
      }),
      committer: z.object({
        name: z.string(),
        email: z.string()
      })
    }),
    repository: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: z.object({
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
        site_admin: z.boolean()
      }),
      html_url: z.string(),
      description: z.string(),
      fork: z.boolean(),
      url: z.string(),
      forks_url: z.string(),
      keys_url: z.string(),
      collaborators_url: z.string(),
      teams_url: z.string(),
      hooks_url: z.string(),
      issue_events_url: z.string(),
      events_url: z.string(),
      assignees_url: z.string(),
      branches_url: z.string(),
      tags_url: z.string(),
      blobs_url: z.string(),
      git_tags_url: z.string(),
      git_refs_url: z.string(),
      trees_url: z.string(),
      statuses_url: z.string(),
      languages_url: z.string(),
      stargazers_url: z.string(),
      contributors_url: z.string(),
      subscribers_url: z.string(),
      subscription_url: z.string(),
      commits_url: z.string(),
      git_commits_url: z.string(),
      comments_url: z.string(),
      issues_url: z.string(),
      pulls_url: z.string(),
      milestones_url: z.string(),
      notifications_url: z.string(),
      labels_url: z.string(),
      releases_url: z.string(),
      deployments_url: z.string(),
      downloads_url: z.string(),
      archive_url: z.string(),
      compare_url: z.string(),
      contents_url: z.string(),
      merges_url: z.string(),
      clone_url: z.string(),
      mirror_url: z.string(),
      svn_url: z.string(),
      homepage: z.string(),
      language: z.string().optional(),
      forks_count: z.number(),
      stargazers_count: z.number(),
      watchers_count: z.number(),
      size: z.number(),
      default_branch: z.string(),
      open_issues_count: z.number(),
      is_template: z.boolean(),
      topics: z.array(z.string()),
      has_issues: z.boolean(),
      has_projects: z.boolean(),
      has_wiki: z.boolean(),
      has_pages: z.boolean(),
      has_downloads: z.boolean(),
      archived: z.boolean(),
      disabled: z.boolean(),
      visibility: z.string(),
      permissions: z.object({
        admin: z.boolean(),
        maintain: z.boolean(),
        push: z.boolean(),
        triage: z.boolean(),
        pull: z.boolean()
      }).optional()
    }),
    head_repository: z.object({
      id: z.number(),
      node_id: z.string(),
      name: z.string(),
      full_name: z.string(),
      private: z.boolean(),
      owner: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string(),
        url: z.string(),
        html_url: z.string(),
        type: z.string(),
        site_admin: z.boolean()
      }),
      html_url: z.string(),
      description: z.string(),
      fork: z.boolean(),
      url: z.string(),
      forks_url: z.string(),
      permissions: z.object({
        admin: z.boolean(),
        push: z.boolean(),
        pull: z.boolean()
      }),
      organization: z.object({
        login: z.string(),
        id: z.number(),
        node_id: z.string(),
        avatar_url: z.string(),
        gravatar_id: z.string(),
        url: z.string(),
        html_url: z.string(),
        type: z.string(),
        site_admin: z.boolean()
      }).optional(),
      parent: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean()
      }).optional(),
      source: z.object({
        id: z.number(),
        node_id: z.string(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean()
      }).optional(),
      license: z.object({
        key: z.string(),
        name: z.string(),
        spdx_id: z.string(),
        url: z.string().optional(),
        node_id: z.string()
      }).optional(),
      code_of_conduct: z.object({
        url: z.string(),
        key: z.string(),
        name: z.string(),
        body: z.string()
      }).optional(),
      features: z.object({
        issues: z.boolean(),
        wiki: z.boolean(),
        discussions_in_collaborators_only: z.boolean(),
        fuzzymatcher: z.boolean(),
        copilot: z.boolean(),
        copilot_code_completions: z.boolean(),
        copilot_business: z.boolean(),
        interactions: z.boolean(),
        security: z.boolean(),
        dependabot: z.boolean(),
        pages: z.boolean(),
        code_scanning: z.boolean(),
        secret_scanning: z.boolean(),
        secret_scanning_push_protection: z.boolean()
      }).optional(),
      allow_forking: z.boolean(),
      is_template: z.boolean(),
      web_commit_signoff_required: z.boolean(),
      workflows: z.object({
        default_workflow_permissions: z.enum(['read', 'write']),
        can_approve_pull_request_reviews: z.boolean()
      }).optional(),
      delete_branch_on_merge: z.boolean(),
      subscribers_count: z.number(),
      network_count: z.number()
    }),
    jobs_url: z.string(),
    logs_url: z.string(),
    check_suite_url: z.string(),
    artifacts_url: z.string(),
    cancel_url: z.string(),
    rerun_url: z.string(),
    workflow_url: z.string(),
    check_suite_id: z.number().optional(),
    check_suite_node_id: z.string().optional()
  }),
  errorMessage: z.string().optional().describe('Error rerunning workflow run')
}).strict();

export const rerunWorkflowRun = createTool({
  id: 'rerunWorkflowRun',
  description: 'Reruns a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: rerunWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'rerun_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      await octokit.actions.reRunWorkflow(context);
      logger.info('Workflow run reran successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'rerun_workflow_run' }
      });
      return rerunWorkflowRunOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error rerunning workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'rerun_workflow_run'
        }
      });
      return rerunWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listJobsForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    status: z.enum(['queued', 'in_progress', 'completed', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', 'pending']),
    conclusion: z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required', 'skipped', 'stale']).nullable(),
    started_at: z.string().optional()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing jobs for workflow run')
}).strict();

export const listJobsForWorkflowRun = createTool({
  id: 'listJobsForWorkflowRun',
  description: 'Lists jobs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: listJobsForWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_jobs_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const jobs = await octokit.actions.listJobsForWorkflowRun(context);
      logger.info('Jobs for workflow run listed successfully');

      spanName?.end({
        output: { jobs_count: jobs.data.jobs?.length || 0 },
        metadata: { operation: 'list_jobs_for_workflow_run' }
      });
      return listJobsForWorkflowRunOutputSchema.parse({ status: 'success', data: jobs.data.jobs  });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing jobs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_jobs_for_workflow_run'
        }
      });
      return listJobsForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getJobForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    status: z.enum(['queued', 'in_progress', 'completed', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', 'stale', 'pending']),
    conclusion: z.enum(['success', 'failure', 'neutral', 'cancelled', 'timed_out', 'action_required', 'skipped', 'stale']).nullable(),
    completed_at: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting job details')
}).strict();

export const getJobForWorkflowRun = createTool({
  id: 'getJobForWorkflowRun',
  description: 'Gets a job for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  outputSchema: getJobForWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_job_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, job_id: context.job_id }
    });

    try {
      const job = await octokit.actions.getJobForWorkflowRun(context);
      logger.info('Job for workflow run retrieved successfully');

      spanName?.end({
        output: { job_id: job.data.id, status: job.data.status },
        metadata: { operation: 'get_job_for_workflow_run' }
      });
      return getJobForWorkflowRunOutputSchema.parse({ status: 'success', data: job.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting job for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_job_for_workflow_run'
        }
      });
      return getJobForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const downloadJobLogsForWorkflowRunOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.unknown().optional(),
  errorMessage: z.string().optional().describe('Error downloading job logs')
}).strict();

export const downloadJobLogsForWorkflowRun = createTool({
  id: 'downloadJobLogsForWorkflowRun',
  description: 'Downloads job logs for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    job_id: z.number(),
  }),
  outputSchema: downloadJobLogsForWorkflowRunOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'download_job_logs_for_workflow_run',
      input: { owner: context.owner, repo: context.repo, job_id: context.job_id }
    });

    try {
      const logs = await octokit.actions.downloadJobLogsForWorkflowRun(context);
      logger.info('Job logs for workflow run downloaded successfully');

      spanName?.end({
        output: { logs_downloaded: true },
        metadata: { operation: 'download_job_logs_for_workflow_run' }
      });
      return downloadJobLogsForWorkflowRunOutputSchema.parse({ status: 'success', data: logs });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading job logs for workflow run');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_job_logs_for_workflow_run'
        }
      });
      return downloadJobLogsForWorkflowRunOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listWorkflowRunArtifactsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    name: z.string(),
    size_in_bytes: z.number(),
    created_at: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing workflow run artifacts')
}).strict();

export const listWorkflowRunArtifacts = createTool({
  id: 'listWorkflowRunArtifacts',
  description: 'Lists artifacts for a workflow run.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    run_id: z.number(),
  }),
  outputSchema: listWorkflowRunArtifactsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_workflow_run_artifacts',
      input: { owner: context.owner, repo: context.repo, run_id: context.run_id }
    });

    try {
      const artifacts = await octokit.actions.listWorkflowRunArtifacts(context);
      logger.info('Workflow run artifacts listed successfully');

      spanName?.end({
        output: { artifacts_count: artifacts.data.artifacts?.length || 0 },
        metadata: { operation: 'list_workflow_run_artifacts' }
      });
      return listWorkflowRunArtifactsOutputSchema.parse({ status: 'success', data: artifacts.data.artifacts });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing workflow run artifacts');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_workflow_run_artifacts'
        }
      });
      return listWorkflowRunArtifactsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const downloadWorkflowRunArtifactOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.unknown().optional(),
  errorMessage: z.string().optional().describe('Error downloading workflow run artifact')
}).strict();

export const downloadWorkflowRunArtifact = createTool({
  id: 'downloadWorkflowRunArtifact',
  description: 'Downloads a workflow run artifact.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    artifact_id: z.number(),
    archive_format: z.enum(['zip', 'tar']).optional(),
  }),
  outputSchema: downloadWorkflowRunArtifactOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'download_workflow_run_artifact',
      input: {
        owner: context.owner,
        repo: context.repo,
        artifact_id: context.artifact_id,
        archive_format: context.archive_format ?? 'zip'
      }
    });

    try {
      const params = { ...context, archive_format: context.archive_format ?? 'zip' };
      const artifact = await octokit.actions.downloadArtifact(params);
      logger.info('Workflow run artifact downloaded successfully');

      spanName?.end({
        output: { artifact_id: context.artifact_id, archive_format: params.archive_format },
        metadata: { operation: 'download_workflow_run_artifact' }
      });
      return downloadWorkflowRunArtifactOutputSchema.parse({ status: 'success', data: artifact });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error downloading workflow run artifact');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'download_workflow_run_artifact'
        }
      });
      return downloadWorkflowRunArtifactOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
