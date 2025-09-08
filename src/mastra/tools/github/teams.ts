import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const getTeam = createTool({
  id: 'getTeam',
  description: 'Gets a team.',
  inputSchema: z.object({
    org: z.string(),
    team_slug: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const team = await octokit.teams.getByName(context);
      logger.info('Team retrieved successfully');
      return team.data;
    } catch (error: unknown) {
      logger.info('Error getting team');
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
  execute: async ({ context }) => {
    try {
      const teams = await octokit.teams.list(context);
      logger.info('Teams listed successfully');
      return teams.data;
    } catch (error: unknown) {
      logger.info('Error listing teams');
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
  execute: async ({ context }) => {
    try {
      const team = await octokit.teams.create(context);
      logger.info('Team created successfully');
      return team.data;
    } catch (error: unknown) {
      logger.info('Error creating team');
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
  execute: async ({ context }) => {
    try {
      const team = await octokit.request('PATCH /orgs/{org}/teams/{team_slug}', context);
      logger.info('Team updated successfully');
      return team.data;
    } catch (error: unknown) {
      logger.info('Error updating team');
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
  execute: async ({ context }) => {
    try {
      await octokit.teams.deleteInOrg(context);
      logger.info('Team deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting team');
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
  execute: async ({ context }) => {
    try {
      const members = await octokit.teams.listMembersInOrg(context);
      logger.info('Team members listed successfully');
      return members.data;
    } catch (error: unknown) {
      logger.info('Error listing team members');
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
  execute: async ({ context }) => {
    try {
      const member = await octokit.teams.addOrUpdateMembershipForUserInOrg(context);
      logger.info('Team member added successfully');
      return member.data;
    } catch (error: unknown) {
      logger.info('Error adding team member');
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
  execute: async ({ context }) => {
    try {
      await octokit.teams.removeMembershipForUserInOrg(context);
      logger.info('Team member removed successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error removing team member');
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
  execute: async ({ context }) => {
    try {
      const repos = await octokit.teams.listReposInOrg(context);
      logger.info('Team repositories listed successfully');
      return repos.data;
    } catch (error: unknown) {
      logger.info('Error listing team repositories');
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
  execute: async ({ context }) => {
    try {
      const repo = await octokit.teams.addOrUpdateRepoPermissionsInOrg(context);
      logger.info('Team repository added successfully');
      return repo.data;
    } catch (error: unknown) {
      logger.info('Error adding team repository');
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
  execute: async ({ context }) => {
    try {
      await octokit.teams.removeRepoInOrg(context);
      logger.info('Team repository removed successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error removing team repository');
      throw error;
    }
  },
});