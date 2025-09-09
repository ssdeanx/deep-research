import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

export const getTeam = createTool({
  id: 'getTeam',
  description: 'Gets a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return team.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_team'
        }
      });
      throw error;
    }
  },
});

export const listTeams = createTool({
  id: 'listTeams',
  description: 'Lists teams for an organization.',
  inputSchema: z.object({
    org: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return teams.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing teams');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_teams'
        }
      });
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return team.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_team'
        }
      });
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return team.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_team'
        }
      });
      throw error;
    }
  },
});

export const deleteTeam = createTool({
  id: 'deleteTeam',
  description: 'Deletes a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting team');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_team'
        }
      });
      throw error;
    }
  },
});

export const listTeamMembers = createTool({
  id: 'listTeamMembers',
  description: 'Lists members of a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return members.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing team members');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_team_members'
        }
      });
      throw error;
    }
  },
});

export const addTeamMember = createTool({
  id: 'addTeamMember',
  description: 'Adds a member to a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    username: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return member.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error adding team member');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'add_team_member'
        }
      });
      throw error;
    }
  },
});

export const removeTeamMember = createTool({
  id: 'removeTeamMember',
  description: 'Removes a member from a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    username: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error removing team member');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'remove_team_member'
        }
      });
      throw error;
    }
  },
});

export const listTeamRepos = createTool({
  id: 'listTeamRepos',
  description: 'Lists repositories for a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return repos.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing team repositories');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_team_repos'
        }
      });
      throw error;
    }
  },
});

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
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return repo.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error adding team repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'add_team_repo'
        }
      });
      throw error;
    }
  },
});

export const removeTeamRepo = createTool({
  id: 'removeTeamRepo',
  description: 'Removes a repository from a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
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
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error removing team repository');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'remove_team_repo'
        }
      });
      throw error;
    }
  },
});
