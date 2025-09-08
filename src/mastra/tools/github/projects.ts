import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const listProjectCards = createTool({
  id: 'listProjectCards',
  description: 'Lists project cards.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const cards = await octokit.request('GET /projects/columns/{column_id}/cards', context);
      logger.info('Project cards listed successfully');
      return cards.data;
    } catch (error: unknown) {
      logger.info('Error listing project cards');
      throw error;
    }
  },
});

export const getProjectCard = createTool({
  id: 'getProjectCard',
  description: 'Gets a project card.',
  inputSchema: z.object({
    card_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const card = await octokit.request('GET /projects/columns/cards/{card_id}', context);
      logger.info('Project card retrieved successfully');
      return card.data;
    } catch (error: unknown) {
      logger.info('Error getting project card');
      throw error;
    }
  },
});

export const createProjectCard = createTool({
  id: 'createProjectCard',
  description: 'Creates a project card.',
  inputSchema: z.object({
    column_id: z.number(),
    note: z.string().optional(),
    content_id: z.number().optional(),
    content_type: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      // Build params to satisfy the typed Octokit union:
      // - If content_id/content_type are provided, send those.
      // - Otherwise send note (explicitly null when not provided).
      const params: any = { column_id: context.column_id };
      if (typeof context.content_id !== 'undefined' && typeof context.content_type !== 'undefined') {
        params.content_id = context.content_id;
        params.content_type = context.content_type;
      } else {
        params.note = typeof context.note !== 'undefined' ? context.note : null;
      }

      const card = await octokit.request('POST /projects/columns/{column_id}/cards', params as any);
      logger.info('Project card created successfully');
      return card.data;
    } catch (error: unknown) {
      logger.info('Error creating project card');
      throw error;
    }
  },
});

export const updateProjectCard = createTool({
  id: 'updateProjectCard',
  description: 'Updates a project card.',
  inputSchema: z.object({
    card_id: z.number(),
    note: z.string().optional(),
    archived: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const card = await octokit.request('PATCH /projects/columns/cards/{card_id}', context);
      logger.info('Project card updated successfully');
      return card.data;
    } catch (error: unknown) {
      logger.info('Error updating project card');
      throw error;
    }
  },
});

export const deleteProjectCard = createTool({
  id: 'deleteProjectCard',
  description: 'Deletes a project card.',
  inputSchema: z.object({
    card_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.request('DELETE /projects/columns/cards/{card_id}', context);
      logger.info('Project card deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting project card');
      throw error;
    }
  },
});

export const moveProjectCard = createTool({
  id: 'moveProjectCard',
  description: 'Moves a project card.',
  inputSchema: z.object({
    card_id: z.number(),
    position: z.string(),
    column_id: z.number().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const card = await octokit.request('POST /projects/columns/cards/{card_id}/moves', context);
      logger.info('Project card moved successfully');
      return card.data;
    } catch (error: unknown) {
      logger.info('Error moving project card');
      throw error;
    }
  },
});

export const listProjectColumns = createTool({
  id: 'listProjectColumns',
  description: 'Lists project columns.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const columns = await octokit.request('GET /projects/{project_id}/columns', context);
      logger.info('Project columns listed successfully');
      return columns.data;
    } catch (error: unknown) {
      logger.info('Error listing project columns');
      throw error;
    }
  },
});

export const getProjectColumn = createTool({
  id: 'getProjectColumn',
  description: 'Gets a project column.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const column = await octokit.request('GET /projects/columns/{column_id}', context);
      logger.info('Project column retrieved successfully');
      return column.data;
    } catch (error: unknown) {
      logger.info('Error getting project column');
      throw error;
    }
  },
});

export const createProjectColumn = createTool({
  id: 'createProjectColumn',
  description: 'Creates a project column.',
  inputSchema: z.object({
    project_id: z.number(),
    name: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const column = await octokit.request('POST /projects/{project_id}/columns', context);
      logger.info('Project column created successfully');
      return column.data;
    } catch (error: unknown) {
      logger.info('Error creating project column');
      throw error;
    }
  },
});

export const updateProjectColumn = createTool({
  id: 'updateProjectColumn',
  description: 'Updates a project column.',
  inputSchema: z.object({
    column_id: z.number(),
    name: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const column = await octokit.request('PATCH /projects/columns/{column_id}', context);
      logger.info('Project column updated successfully');
      return column.data;
    } catch (error: unknown) {
      logger.info('Error updating project column');
      throw error;
    }
  },
});

export const deleteProjectColumn = createTool({
  id: 'deleteProjectColumn',
  description: 'Deletes a project column.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.request('DELETE /projects/columns/{column_id}', context);
      logger.info('Project column deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting project column');
      throw error;
    }
  },
});

export const moveProjectColumn = createTool({
  id: 'moveProjectColumn',
  description: 'Moves a project column.',
  inputSchema: z.object({
    column_id: z.number(),
    position: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const column = await octokit.request('POST /projects/columns/{column_id}/moves', context);
      logger.info('Project column moved successfully');
      return column.data;
    } catch (error: unknown) {
      logger.info('Error moving project column');
      throw error;
    }
  },
});

export const listProjects = createTool({
  id: 'listProjects',
  description: 'Lists projects for an organization or repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
  }),
  execute: async ({ context }) => {
    try {
      if (context.repo) {
        const projects = await octokit.request('GET /repos/{owner}/{repo}/projects', { ...context, owner: context.owner, repo: context.repo });
        logger.info('Projects listed successfully for repository');
        return projects.data;
      } else {
        const projects = await octokit.request('GET /orgs/{owner}/projects', context);
        logger.info('Projects listed successfully for organization');
        return projects.data;
      }
    } catch (error: unknown) {
      logger.info('Error listing projects');
      throw error;
    }
  },
});

export const getProject = createTool({
  id: 'getProject',
  description: 'Gets a project.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      const project = await octokit.request('GET /projects/{project_id}', context);
      logger.info('Project retrieved successfully');
      return project.data;
    } catch (error: unknown) {
      logger.info('Error getting project');
      throw error;
    }
  },
});

export const createProject = createTool({
  id: 'createProject',
  description: 'Creates a project for an organization or repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string().optional(),
    name: z.string(),
    body: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      if (context.repo) {
        // Build explicit params to ensure `repo` is a string for the typed octokit request
        const params = {
          owner: context.owner,
          repo: context.repo as string,
          name: context.name,
          ...(typeof context.body !== 'undefined' ? { body: context.body } : {}),
        };
        const project = await octokit.request('POST /repos/{owner}/{repo}/projects', params as any);
        logger.info('Project created successfully for repository');
        return project.data;
      } else {
        const params = {
          owner: context.owner,
          name: context.name,
          ...(typeof context.body !== 'undefined' ? { body: context.body } : {}),
        };
        const project = await octokit.request('POST /orgs/{owner}/projects', params as any);
        logger.info('Project created successfully for organization');
        return project.data;
      }
    } catch (error: unknown) {
      logger.info('Error creating project');
      throw error;
    }
  },
});

export const updateProject = createTool({
  id: 'updateProject',
  description: 'Updates a project.',
  inputSchema: z.object({
    project_id: z.number(),
    name: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
    organization_permission: z.enum(['read', 'write', 'admin']).optional(),
    private: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const project = await octokit.request('PATCH /projects/{project_id}', context);
      logger.info('Project updated successfully');
      return project.data;
    } catch (error: unknown) {
      logger.info('Error updating project');
      throw error;
    }
  },
});

export const deleteProject = createTool({
  id: 'deleteProject',
  description: 'Deletes a project.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      await octokit.request('DELETE /projects/{project_id}', context);
      logger.info('Project deleted successfully');
      return { success: true };
    } catch (error: unknown) {
      logger.info('Error deleting project');
      throw error;
    }
  },
});