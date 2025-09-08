import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';

export const listGists = createTool({
  id: 'listGists',
  description: 'Lists gists for a user.',
  inputSchema: z.object({
    username: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const gists = await octokit.gists.listForUser({ username: context.username || '' });
    return gists.data;
  },
});

export const getGist = createTool({
  id: 'getGist',
  description: 'Gets a gist.',
  inputSchema: z.object({
    gist_id: z.string(),
  }),
  execute: async ({ context }) => {
    const gist = await octokit.gists.get({ gist_id: context.gist_id });
    return gist.data;
  },
});

export const createGist = createTool({
  id: 'createGist',
  description: 'Creates a new gist.',
  inputSchema: z.object({
    files: z.record(z.object({
      content: z.string(),
    })),
    description: z.string().optional(),
    public: z.boolean().optional(),
  }),
  execute: async ({ context }) => {
    const gist = await octokit.gists.create({ files: context.files, description: context.description, public: context.public });
    return gist.data;
  },
});

export const updateGist = createTool({
  id: 'updateGist',
  description: 'Updates a gist.',
  inputSchema: z.object({
    gist_id: z.string(),
    files: z.record(z.object({
      content: z.string().optional(),
      filename: z.string().optional(),
    })).optional(),
    description: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const gist = await octokit.gists.update({ gist_id: context.gist_id, files: context.files, description: context.description });
    return gist.data;
  },
});

export const deleteGist = createTool({
  id: 'deleteGist',
  description: 'Deletes a gist.',
  inputSchema: z.object({
    gist_id: z.string(),
  }),
  execute: async ({ context }) => {
    await octokit.gists.delete({ gist_id: context.gist_id });
    return { success: true };
  },
});