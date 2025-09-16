import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const listProjectCardsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    project_url: z.string(),
    column_url: z.string(),
    creator: z.object({
      login: z.string()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    archived: z.boolean(),
    content_url: z.string().optional()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing project cards')
}).strict();

export const listProjectCards = createTool({
  id: 'listProjectCards',
  description: 'Lists project cards.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  outputSchema: listProjectCardsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_project_cards',
      input: { column_id: context.column_id }
    });
    try {
      const cards = await octokit.request('GET /projects/columns/{column_id}/cards', context);
      logger.info('Project cards listed successfully');
      spanName?.end({
        output: { cards_count: cards.data?.length || 0 },
        metadata: { operation: 'list_project_cards' }
      });
      return listProjectCardsOutputSchema.parse({ status: 'success', data: cards.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing project cards');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_project_cards'
        }
      });
      return listProjectCardsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getProjectCardOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    project_url: z.string(),
    column_url: z.string(),
    creator: z.object({
      login: z.string()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    archived: z.boolean(),
    content_url: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting project card')
}).strict();

export const getProjectCard = createTool({
  id: 'getProjectCard',
  description: 'Gets a project card.',
  inputSchema: z.object({
    card_id: z.number(),
  }),
  outputSchema: getProjectCardOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_project_card',
      input: { card_id: context.card_id }
    });

    try {
      const card = await octokit.request('GET /projects/columns/cards/{card_id}', context);
      logger.info('Project card retrieved successfully');

      spanName?.end({
        output: { card_id: card.data?.id },
        metadata: { operation: 'get_project_card' }
      });
      return getProjectCardOutputSchema.parse({ status: 'success', data: card.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting project card');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_project_card'
        }
      });
      return getProjectCardOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createProjectCardOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    project_url: z.string(),
    column_url: z.string(),
    creator: z.object({
      login: z.string()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    archived: z.boolean(),
    content_url: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating project card')
}).strict();

export const createProjectCard = createTool({
  id: 'createProjectCard',
  description: 'Creates a project card.',
  inputSchema: z.object({
    column_id: z.number(),
    note: z.string().optional(),
    content_id: z.number().optional(),
    content_type: z.string().optional(),
  }),
  outputSchema: createProjectCardOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_project_card',
      input: {
        column_id: context.column_id,
        note: context.note,
        content_id: context.content_id,
        content_type: context.content_type
      }
    });

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

      const card = await octokit.request('POST /projects/columns/{column_id}/cards', params);
      logger.info('Project card created successfully');

      spanName?.end({
        output: { card_id: card.data?.id },
        metadata: { operation: 'create_project_card' }
      });
      return createProjectCardOutputSchema.parse({ status: 'success', data: card.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating project card');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_project_card'
        }
      });
      return createProjectCardOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const updateProjectCardOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    project_url: z.string(),
    column_url: z.string(),
    creator: z.object({
      login: z.string()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    archived: z.boolean(),
    content_url: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating project card')
}).strict();

export const updateProjectCard = createTool({
  id: 'updateProjectCard',
  description: 'Updates a project card.',
  inputSchema: z.object({
    card_id: z.number(),
    note: z.string().optional(),
    archived: z.boolean().optional(),
  }),
  outputSchema: updateProjectCardOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_project_card',
      input: {
        card_id: context.card_id,
        note: context.note,
        archived: context.archived
      }
    });

    try {
      const card = await octokit.request('PATCH /projects/columns/cards/{card_id}', context);
      logger.info('Project card updated successfully');

      spanName?.end({
        output: { card_id: card.data?.id },
        metadata: { operation: 'update_project_card' }
      });
      return updateProjectCardOutputSchema.parse({ status: 'success', data: card.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating project card');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_project_card'
        }
      });
      return updateProjectCardOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const deleteProjectCardOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    success: z.boolean()
  }).optional(),
  errorMessage: z.string().optional().describe('Error deleting project card')
}).strict();

export const deleteProjectCard = createTool({
  id: 'deleteProjectCard',
  description: 'Deletes a project card.',
  inputSchema: z.object({
    card_id: z.number(),
  }),
  outputSchema: deleteProjectCardOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_project_card',
      input: { card_id: context.card_id }
    });

    try {
      await octokit.request('DELETE /projects/columns/cards/{card_id}', context);
      logger.info('Project card deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_project_card' }
      });
      return deleteProjectCardOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting project card');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_project_card'
        }
      });
      return deleteProjectCardOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const moveProjectCardOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    project_url: z.string(),
    column_url: z.string(),
    creator: z.object({
      login: z.string()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    archived: z.boolean(),
    content_url: z.string().optional()
  }).optional(),
  errorMessage: z.string().optional().describe('Error moving project card')
}).strict();

export const moveProjectCard = createTool({
  id: 'moveProjectCard',
  description: 'Moves a project card.',
  inputSchema: z.object({
    card_id: z.number(),
    position: z.string(),
    column_id: z.number().optional(),
  }),
  outputSchema: moveProjectCardOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'move_project_card',
      input: {
        card_id: context.card_id,
        position: context.position,
        column_id: context.column_id
      }
    });

    try {
      const card = await octokit.request('POST /projects/columns/cards/{card_id}/moves', context);
      logger.info('Project card moved successfully');

      spanName?.end({
        output: { card_id: card.data?.id },
        metadata: { operation: 'move_project_card' }
      });
      return moveProjectCardOutputSchema.parse({ status: 'success', data: card.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error moving project card');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'move_project_card'
        }
      });
      return moveProjectCardOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listProjectColumnsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    url: z.string(),
    project_url: z.string(),
    cards_url: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing project columns')
}).strict();

export const listProjectColumns = createTool({
  id: 'listProjectColumns',
  description: 'Lists project columns.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  outputSchema: listProjectColumnsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_project_columns',
      input: { project_id: context.project_id }
    });

    try {
      const columns = await octokit.request('GET /projects/{project_id}/columns', context);
      logger.info('Project columns listed successfully');

      spanName?.end({
        output: { columns_count: columns.data?.length || 0 },
        metadata: { operation: 'list_project_columns' }
      });
      return listProjectColumnsOutputSchema.parse({ status: 'success', data: columns.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing project columns');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_project_columns'
        }
      });
      return listProjectColumnsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getProjectColumnOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    url: z.string(),
    project_url: z.string(),
    cards_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting project column')
}).strict();

export const getProjectColumn = createTool({
  id: 'getProjectColumn',
  description: 'Gets a project column.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  outputSchema: getProjectColumnOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_project_column',
      input: { column_id: context.column_id }
    });

    try {
      const column = await octokit.request('GET /projects/columns/{column_id}', context);
      logger.info('Project column retrieved successfully');

      spanName?.end({
        output: { column_id: column.data?.id },
        metadata: { operation: 'get_project_column' }
      });
      return getProjectColumnOutputSchema.parse({ status: 'success', data: column.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting project column');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_project_column'
        }
      });
      return getProjectColumnOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createProjectColumnOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    url: z.string(),
    project_url: z.string(),
    cards_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating project column')
}).strict();

export const createProjectColumn = createTool({
  id: 'createProjectColumn',
  description: 'Creates a project column.',
  inputSchema: z.object({
    project_id: z.number(),
    name: z.string(),
  }),
  outputSchema: createProjectColumnOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_project_column',
      input: {
        project_id: context.project_id,
        name: context.name
      }
    });

    try {
      const column = await octokit.request('POST /projects/{project_id}/columns', context);
      logger.info('Project column created successfully');

      spanName?.end({
        output: { column_id: column.data?.id },
        metadata: { operation: 'create_project_column' }
      });
      return createProjectColumnOutputSchema.parse({ status: 'success', data: column.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating project column');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_project_column'
        }
      });
      return createProjectColumnOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const updateProjectColumnOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    url: z.string(),
    project_url: z.string(),
    cards_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating project column')
}).strict();

export const updateProjectColumn = createTool({
  id: 'updateProjectColumn',
  description: 'Updates a project column.',
  inputSchema: z.object({
    column_id: z.number(),
    name: z.string(),
  }),
  outputSchema: updateProjectColumnOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_project_column',
      input: {
        column_id: context.column_id,
        name: context.name
      }
    });

    try {
      const column = await octokit.request('PATCH /projects/columns/{column_id}', context);
      logger.info('Project column updated successfully');

      spanName?.end({
        output: { column_id: column.data?.id },
        metadata: { operation: 'update_project_column' }
      });
      return updateProjectColumnOutputSchema.parse({ status: 'success', data: column.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating project column');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_project_column'
        }
      });
      return updateProjectColumnOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const deleteProjectColumnOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    success: z.boolean()
  }).optional(),
  errorMessage: z.string().optional().describe('Error deleting project column')
}).strict();

export const deleteProjectColumn = createTool({
  id: 'deleteProjectColumn',
  description: 'Deletes a project column.',
  inputSchema: z.object({
    column_id: z.number(),
  }),
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_project_column',
      input: { column_id: context.column_id }
    });

    try {
      await octokit.request('DELETE /projects/columns/{column_id}', context);
      logger.info('Project column deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_project_column' }
      });
      return deleteProjectColumnOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting project column');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_project_column'
        }
      });
      return deleteProjectColumnOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const moveProjectColumnOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    url: z.string(),
    project_url: z.string(),
    cards_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error moving project column')
}).strict();

export const moveProjectColumn = createTool({
  id: 'moveProjectColumn',
  description: 'Moves a project column.',
  inputSchema: z.object({
    column_id: z.number(),
    position: z.string(),
  }),
  outputSchema: moveProjectColumnOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'move_project_column',
      input: {
        column_id: context.column_id,
        position: context.position
      }
    });

    try {
      const column = await octokit.request('POST /projects/columns/{column_id}/moves', context);
      logger.info('Project column moved successfully');

      spanName?.end({
        output: { column_id: column.data?.id },
        metadata: { operation: 'move_project_column' }
      });
      return moveProjectColumnOutputSchema.parse({ status: 'success', data: column.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error moving project column');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'move_project_column'
        }
      });
      return moveProjectColumnOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const listProjectsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    body: z.string().nullable(),
    state: z.string(),
    html_url: z.string(),
    columns_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    closed_at: z.string().nullable(),
    organization_permission: z.string().optional(),
    private: z.boolean().optional(),
    owner_url: z.string().optional()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing projects')
}).strict();

export const listProjects = createTool({
  id: 'listProjects',
  description: 'Lists projects for an organization or repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
  }),
  outputSchema: listProjectsOutputSchema, // This line was already present in the full file content, but not in the diff.
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_projects',
      input: {
        owner: context.owner,
        repo: context.repo,
        state: context.state
      }
    });

    try {
      if (context.repo !== undefined) {
        const projects = await octokit.request('GET /repos/{owner}/{repo}/projects', { ...context, owner: context.owner, repo: context.repo });
        logger.info('Projects listed successfully for repository');

        spanName?.end({
          output: { projects_count: projects.data?.length || 0 },
          metadata: { operation: 'list_projects', type: 'repository' }
        });
        return listProjectsOutputSchema.parse({ status: 'success', data: projects.data });
      } else {
        const projects = await octokit.request('GET /orgs/{owner}/projects', context);
        logger.info('Projects listed successfully for organization');

        spanName?.end({
          output: { projects_count: projects.data?.length ?? 0 },
          metadata: { operation: 'list_projects', type: 'organization' }
        });
        return listProjectsOutputSchema.parse({ status: 'success', data: projects.data });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing projects');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_projects'
        }
      });
      return listProjectsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const getProjectOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    body: z.string().nullable(),
    state: z.string(),
    html_url: z.string(),
    columns_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    closed_at: z.string().nullable(),
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting project')
}).strict();

export const getProject = createTool({
  id: 'getProject',
  description: 'Gets a project.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  outputSchema: getProjectOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_project',
      input: { project_id: context.project_id }
    });

    try {
      const project = await octokit.request('GET /projects/{project_id}', context);
      logger.info('Project retrieved successfully');

      spanName?.end({
        output: { project_id: project.data?.id },
        metadata: { operation: 'get_project' }
      });
      return getProjectOutputSchema.parse({ status: 'success', data: project.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting project');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_project'
        }
      });
      return getProjectOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const createProjectOutputSchema = z.object({
  status
    : z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    body: z.string().nullable(),
    state: z.string(),
    html_url: z.string(),
    columns_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    closed_at: z.string().nullable(),
  }).optional(),
  errorMessage: z.string().optional().describe('Error creating project')
}).strict();

export const createProject = createTool({
  id: 'createProject',
  description: 'Creates a project for an organization or repository.',
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string().optional(),
    name: z.string(),
    body: z.string().optional(),
  }),
  outputSchema: createProjectOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'create_project',
      input: {
        owner: context.owner,
        repo: context.repo,
        name: context.name,
        body: context.body
      }
    });

    try {
      if (context.repo !== undefined) {
        // Build explicit params to ensure `repo` is a string for the typed octokit request
        const params = {
          owner: context.owner,
          repo: context.repo,
          name: context.name,
          ...(typeof context.body !== 'undefined' ? { body: context.body } : {}),
        };
        const project = await octokit.request('POST /repos/{owner}/{repo}/projects', params);
        logger.info('Project created successfully for repository');

        spanName?.end({
          output: { project_id: project.data?.id },
          metadata: { operation: 'create_project', type: 'repository' }
        });
        return createProjectOutputSchema.parse({ status: 'success', data: project.data });
      } else {
        const params = {
          owner: context.owner,
          name: context.name,
          ...(typeof context.body !== 'undefined' ? { body: context.body } : {}),
        };
        const project = await octokit.request('POST /orgs/{owner}/projects', params);
        logger.info('Project created successfully for organization');

        spanName?.end({
          output: { project_id: project.data?.id },
          metadata: { operation: 'create_project', type: 'organization' }
        });
        return createProjectOutputSchema.parse({ status: 'success', data: project.data });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error creating project');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'create_project'
        }
      });
      return createProjectOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const updateProjectOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    node_id: z.string(),
    name: z.string(),
    body: z.string().nullable(),
    state: z.string(),
    html_url: z.string(),
    columns_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    closed_at: z.string().nullable(),
  }).optional(),
  errorMessage: z.string().optional().describe('Error updating project')
}).strict();

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
  outputSchema: updateProjectOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'update_project',
      input: {
        project_id: context.project_id,
        name: context.name,
        body: context.body,
        state: context.state,
        organization_permission: context.organization_permission,
        private: context.private
      }
    });

    try {
      const project = await octokit.request('PATCH /projects/{project_id}', context);
      logger.info('Project updated successfully');

      spanName?.end({
        output: { project_id: project.data?.id },
        metadata: { operation: 'update_project' }
      });
      return updateProjectOutputSchema.parse({ status: 'success', data: project.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error updating project');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'update_project'
        }
      });
      return updateProjectOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
const deleteProjectOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    success: z.boolean()
  }).optional(),
  errorMessage: z.string().optional().describe('Error deleting project')
}).strict();

export const deleteProject = createTool({
  id: 'deleteProject',
  description: 'Deletes a project.',
  inputSchema: z.object({
    project_id: z.number(),
  }),
  outputSchema: deleteProjectOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'delete_project',
      input: { project_id: context.project_id }
    });

    try {
      await octokit.request('DELETE /projects/{project_id}', context);
      logger.info('Project deleted successfully');

      spanName?.end({
        output: { success: true },
        metadata: { operation: 'delete_project' }
      });
      return deleteProjectOutputSchema.parse({ status: 'success', data: { success: true } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error deleting project');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'delete_project'
        }
      });
      return deleteProjectOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
