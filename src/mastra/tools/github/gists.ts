import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from '@mastra/loggers';
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ name: 'GitHubGists', level: 'info' });

export const listGists = createTool({
  id: 'listGists',
  description: 'Lists gists for a user.',
  inputSchema: z.object({
    username: z.string().optional(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Listing gists for user: ${context.username || 'current user'}`);

    const listSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_gists',
      input: { username: context.username }
    });

    try {
      const gists = await octokit.gists.listForUser({ username: context.username || '' });
      listSpan?.end({ output: { count: gists.data.length } });
      logger.info(`Listed ${gists.data.length} gists for user: ${context.username || 'current user'}`);
      return gists.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      listSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to list gists for user ${context.username || 'current user'}: ${errorMessage}`);
      throw error;
    }
  },
});

export const getGist = createTool({
  id: 'getGist',
  description: 'Gets a gist.',
  inputSchema: z.object({
    gist_id: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Getting gist: ${context.gist_id}`);

    const getSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_gist',
      input: { gist_id: context.gist_id }
    });

    try {
      const gist = await octokit.gists.get({ gist_id: context.gist_id });
      getSpan?.end({ output: { gist_id: gist.data.id } });
      logger.info(`Retrieved gist: ${context.gist_id}`);
      return gist.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to get gist ${context.gist_id}: ${errorMessage}`);
      throw error;
    }
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
  execute: async ({ context, tracingContext }) => {
    logger.info(`Creating gist with ${Object.keys(context.files).length} files`);

    const createSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_gist',
      input: { fileCount: Object.keys(context.files).length, description: context.description, public: context.public }
    });

    try {
      const gist = await octokit.gists.create({ files: context.files, description: context.description, public: context.public });
      createSpan?.end({ output: { gist_id: gist.data.id } });
      logger.info(`Created gist: ${gist.data.id}`);
      return gist.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      createSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to create gist: ${errorMessage}`);
      throw error;
    }
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
  execute: async ({ context, tracingContext }) => {
    logger.info(`Updating gist: ${context.gist_id}`);

    const updateSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_gist',
      input: { gist_id: context.gist_id, fileCount: context.files ? Object.keys(context.files).length : 0 }
    });

    try {
      const gist = await octokit.gists.update({ gist_id: context.gist_id, files: context.files, description: context.description });
      updateSpan?.end({ output: { gist_id: gist.data.id } });
      logger.info(`Updated gist: ${context.gist_id}`);
      return gist.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to update gist ${context.gist_id}: ${errorMessage}`);
      throw error;
    }
  },
});

export const deleteGist = createTool({
  id: 'deleteGist',
  description: 'Deletes a gist.',
  inputSchema: z.object({
    gist_id: z.string(),
  }),
  execute: async ({ context, tracingContext }) => {
    logger.info(`Deleting gist: ${context.gist_id}`);

    const deleteSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_gist',
      input: { gist_id: context.gist_id }
    });

    try {
      await octokit.gists.delete({ gist_id: context.gist_id });
      deleteSpan?.end({ output: { success: true } });
      logger.info(`Deleted gist: ${context.gist_id}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      deleteSpan?.end({ metadata: { error: errorMessage } });
      logger.error(`Failed to delete gist ${context.gist_id}: ${errorMessage}`);
      throw error;
    }
  },
});