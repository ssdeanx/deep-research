import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubTeams', level: 'info' });

const SuccessSchema = z.object({
  success: z.literal(true),
});

const UserSimpleSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
  url: z.string(),
  type: z.string(),
  site_admin: z.boolean(),
});

const RepoSimpleSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
});

const TeamSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  html_url: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  privacy: z.enum(['closed', 'secret']),
  permission: z.string().optional(),
  members_count: z.number().optional(),
  repos_count: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  parent: z.object({
    id: z.number().optional(),
    node_id: z.string().optional(),
    url: z.string().optional(),
    html_url: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().nullable().optional(),
    privacy: z.enum(['closed', 'secret']).optional(),
    permission: z.string().optional(),
    members_count: z.number().optional(),
    repos_count: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).optional(),
  organization: z.object({
    login: z.string(),
    id: z.number(),
    node_id: z.string(),
    avatar_url: z.string(),
    gravatar_id: z.string(),
    url: z.string(),
    html_url: z.string(),
    followers_url: z.string(),
    following_url: z.string(),
    hooks_url: z.string(),
    issues_url: z.string(),
    members_url: z.string(),
    public_members_url: z.string(),
    repos_url: z.string(),
    events_url: z.string(),
    received_events_url: z.string(),
    type: z.string(),
    site_admin: z.boolean(),
  }),
});

const TeamMembershipSchema = z.object({
  url: z.string(),
  state: z.enum(['active', 'pending']),
  role: z.enum(['member', 'maintainer']),
  organization_url: z.string(),
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
  }),
  team_slug: z.string(),
  organization: z.object({
    login: z.string(),
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    repos_url: z.string(),
    events_url: z.string(),
  }),
});

const RepoPermissionsSchema = z.object({
  permission: z.enum(['pull', 'push', 'admin']),
  role_name: z.string().optional(),
  url: z.string(),
  html_url: z.string(),
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
    site_admin: z.boolean(),
  }),
  description: z.string().nullable().optional(),
  fork: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().optional(),
  git_url: z.string(),
  ssh_url: z.string(),
  clone_url: z.string(),
  svn_url: z.string(),
  homepage: z.string().optional(),
  size: z.number(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  language: z.string().optional(),
  has_issues: z.boolean(),
  has_projects: z.boolean(),
  has_wiki: z.boolean(),
  has_pages: z.boolean(),
  has_downloads: z.boolean(),
  archived: z.boolean(),
  visibility: z.string(),
  permissions: z.object({
    admin: z.boolean(),
    maintain: z.boolean().optional(),
    push: z.boolean(),
    triage: z.boolean().optional(),
    pull: z.boolean(),
  }).optional(),
  default_branch: z.string(),
});

const GetTeamOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: TeamSchema.optional(),
  errorMessage: z.string().optional().describe('Error getting team')
}).strict();

export const getTeam = createTool({
  id: 'getTeam',
  description: 'Gets a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  outputSchema: GetTeamOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing getTeam for org: ${context.org}, team: ${context.team_slug}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
      type: AISpanType.GENERIC,
      name: 'get_team',
      input: {
        org: context.org,
        team_slug: context.team_slug
      }
    });

    try {
      const team = await octokit.teams.getByName(context);
      logger.info('Team retrieved successfully');

      spanName?.end({
        output: { team_id: team.data?.id },
        metadata: { operation: 'get_team' }
      });
      return GetTeamOutputSchema.parse({ status: 'success', data: team.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_team'
        }
      });
      return GetTeamOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListTeamsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(TeamSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing teams')
}).strict();

export const listTeams = createTool({
  id: 'listTeams',
  description: 'Lists teams for an organization.',
  inputSchema: z.object({
    org: z.string(),
  }),
  outputSchema: ListTeamsOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing listTeams for org: ${context.org}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_teams',
      input: { org: context.org }
    });

    try {
      const teams = await octokit.teams.list(context);
      logger.info('Teams listed successfully');

      spanName?.end({
        output: { teams_count: teams.data?.length || 0 },
        metadata: { operation: 'list_teams' }
      });
      return ListTeamsOutputSchema.parse({ status: 'success', data: teams.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing teams');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_teams'
        }
      });
      return ListTeamsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const CreateTeamOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: TeamSchema.optional(),
  errorMessage: z.string().optional().describe('Error creating team')
}).strict();

export const createTeam = createTool({
  id: 'createTeam',
  description: 'Creates a new team in an organization.',
  inputSchema: z.object({
    org: z.string(),
    name: z.string(),
    description: z.string().optional(),
    privacy: z.enum(['secret', 'closed']).optional(),
    parent_team_id: z.number().optional(),
  }),
  outputSchema: CreateTeamOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; name: string; description?: string; privacy?: "secret" | "closed"; parent_team_id?: number }; tracingContext?: unknown }>) => {
    logger.info(`Executing createTeam for org: ${context.org}, name: ${context.name}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_team',
      input: {
        org: context.org,
        name: context.name,
        description: context.description,
        privacy: context.privacy,
        parent_team_id: context.parent_team_id
      }
    });

    try {
      const team = await octokit.teams.create(context);
      logger.info('Team created successfully');

      spanName?.end({
        output: { team_id: team.data?.id },
        metadata: { operation: 'create_team' }
      });
      return CreateTeamOutputSchema.parse({ status: 'success', data: team.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_team'
        }
      });
      return CreateTeamOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const UpdateTeamOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: TeamSchema.optional(),
  errorMessage: z.string().optional().describe('Error updating team')
}).strict();

export const updateTeam = createTool({
  id: 'updateTeam',
  description: 'Updates a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    privacy: z.enum(['secret', 'closed']).optional(),
  }),
  outputSchema: UpdateTeamOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string; name?: string; description?: string; privacy?: "secret" | "closed" }; tracingContext?: unknown }>) => {
    logger.info(`Executing updateTeam for org: ${context.org}, team: ${context.team_slug}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
      type: AISpanType.GENERIC,
      name: 'update_team',
      input: {
        org: context.org,
        team_slug: context.team_slug,
        name: context.name,
        description: context.description,
        privacy: context.privacy
      }
    });

    try {
      const team = await octokit.request('PATCH /orgs/{org}/teams/{team_slug}', context);
      logger.info('Team updated successfully');

      spanName?.end({
        output: { team_id: team.data?.id },
        metadata: { operation: 'update_team' }
      });
      return UpdateTeamOutputSchema.parse({ status: 'success', data: team.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_team'
        }
      });
      return UpdateTeamOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const DeleteTeamOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error deleting team')
}).strict();

export const deleteTeam = createTool({
  id: 'deleteTeam',
  description: 'Deletes a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  outputSchema: DeleteTeamOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing deleteTeam for org: ${context.org}, team: ${context.team_slug}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan?.({
      type: AISpanType.GENERIC,
      name: 'delete_team',
      input: {
        org: context.org,
        team_slug: context.team_slug
      }
    });

    try {
      await octokit.teams.deleteInOrg(context);
      logger.info('Team deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_team' }
      });
      return DeleteTeamOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_team'
        }
      });
      return DeleteTeamOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListTeamMembersOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(UserSimpleSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing team members')
}).strict();

export const listTeamMembers = createTool({
  id: 'listTeamMembers',
  description: 'Lists members of a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  outputSchema: ListTeamMembersOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing listTeamMembers for org: ${context.org}, team: ${context.team_slug}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_team_members',
      input: {
        org: context.org,
        team_slug: context.team_slug
      }
    });

    try {
      const members = await octokit.teams.listMembersInOrg(context);
      logger.info('Team members listed successfully');

      spanName?.end({
        output: { members_count: members.data?.length || 0 },
        metadata: { operation: 'list_team_members' }
      });
      return ListTeamMembersOutputSchema.parse({ status: 'success', data: members.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing team members');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_team_members'
        }
      });
      return ListTeamMembersOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const AddTeamMemberOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: TeamMembershipSchema.optional(),
  errorMessage: z.string().optional().describe('Error adding team member')
}).strict();

export const addTeamMember = createTool({
  id: 'addTeamMember',
  description: 'Adds a member to a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    username: z.string(),
  }),
  outputSchema: AddTeamMemberOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string; username: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing addTeamMember for org: ${context.org}, team: ${context.team_slug}, user: ${context.username}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'add_team_member',
      input: {
        org: context.org,
        team_slug: context.team_slug,
        username: context.username
      }
    });

    try {
      const member = await octokit.teams.addOrUpdateMembershipForUserInOrg(context);
      logger.info('Team member added successfully');

      spanName?.end({
        output: { username: context.username },
        metadata: { operation: 'add_team_member' }
      });
      return AddTeamMemberOutputSchema.parse({ status: 'success', data: member.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error adding team member');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'add_team_member'
        }
      });
      return AddTeamMemberOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const RemoveTeamMemberOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error removing team member')
}).strict();

export const removeTeamMember = createTool({
  id: 'removeTeamMember',
  description: 'Removes a member from a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    username: z.string(),
  }),
  outputSchema: RemoveTeamMemberOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string; username: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing removeTeamMember for org: ${context.org}, team: ${context.team_slug}, user: ${context.username}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'remove_team_member',
      input: {
        org: context.org,
        team_slug: context.team_slug,
        username: context.username
      }
    });

    try {
      await octokit.teams.removeMembershipForUserInOrg(context);
      logger.info('Team member removed successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'remove_team_member' }
      });
      return RemoveTeamMemberOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error removing team member');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'remove_team_member'
        }
      });
      return RemoveTeamMemberOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const ListTeamReposOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(RepoSimpleSchema).optional(),
  errorMessage: z.string().optional().describe('Error listing team repositories')
}).strict();

export const listTeamRepos = createTool({
  id: 'listTeamRepos',
  description: 'Lists repositories for a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  outputSchema: ListTeamReposOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing listTeamRepos for org: ${context.org}, team: ${context.team_slug}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_team_repos',
      input: {
        org: context.org,
        team_slug: context.team_slug
      }
    });

    try {
      const repos = await octokit.teams.listReposInOrg(context);
      logger.info('Team repositories listed successfully');

      spanName?.end({
        output: { repos_count: repos.data?.length || 0 },
        metadata: { operation: 'list_team_repos' }
      });
      return ListTeamReposOutputSchema.parse({ status: 'success', data: repos.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing team repositories');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_team_repos'
        }
      });
      return ListTeamReposOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const AddTeamRepoOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: RepoPermissionsSchema.optional(),
  errorMessage: z.string().optional().describe('Error adding team repository')
}).strict();

export const addTeamRepo = createTool({
  id: 'addTeamRepo',
  description: 'Adds a repository to a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    owner: z.string(),
    repo: z.string(),
    permission: z.enum(['pull', 'push', 'admin']).optional(),
  }),
  outputSchema: AddTeamRepoOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string; owner: string; repo: string; permission?: "pull" | "push" | "admin" }; tracingContext?: unknown }>) => {
    logger.info(`Executing addTeamRepo for org: ${context.org}, team: ${context.team_slug}, repo: ${context.owner}/${context.repo}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'add_team_repo',
      input: {
        org: context.org,
        team_slug: context.team_slug,
        owner: context.owner,
        repo: context.repo,
        permission: context.permission
      }
    });

    try {
      const repo = await octokit.teams.addOrUpdateRepoPermissionsInOrg(context);
      logger.info('Team repository added successfully');

      spanName?.end({
        output: { repo_name: `${context.owner}/${context.repo}` },
        metadata: { operation: 'add_team_repo' }
      });
      return AddTeamRepoOutputSchema.parse({ status: 'success', data: repo.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error adding team repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'add_team_repo'
        }
      });
      return AddTeamRepoOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const RemoveTeamRepoOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: SuccessSchema.optional(),
  errorMessage: z.string().optional().describe('Error removing team repository')
}).strict();

export const removeTeamRepo = createTool({
  id: 'removeTeamRepo',
  description: 'Removes a repository from a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: RemoveTeamRepoOutputSchema,
  execute: async ({ context, tracingContext }: Readonly<{ context: { org: string; team_slug: string; owner: string; repo: string }; tracingContext?: unknown }>) => {
    logger.info(`Executing removeTeamRepo for org: ${context.org}, team: ${context.team_slug}, repo: ${context.owner}/${context.repo}`);
    const spanName = (tracingContext as any)?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'remove_team_repo',
      input: {
        org: context.org,
        team_slug: context.team_slug,
        owner: context.owner,
        repo: context.repo
      }
    });

    try {
      await octokit.teams.removeRepoInOrg(context);
      logger.info('Team repository removed successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'remove_team_repo' }
      });
      return RemoveTeamRepoOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error removing team repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'remove_team_repo'
        }
      });
      return RemoveTeamRepoOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
