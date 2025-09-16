import { createTool } from '@mastra/core';
import { z } from 'zod';
import { octokit } from './octokit';
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';

const logger = new PinoLogger({ level: 'info' });

const getOrganizationOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.object({
    id: z.number(),
    login: z.string(),
    name: z.string(),
    description: z.string().optional(),
    html_url: z.string()
  }).optional(),
  errorMessage: z.string().optional().describe('Error getting organization')
}).strict();

export const getOrganization = createTool({
  id: 'getOrganization',
  description: 'Gets an organization by name.',
  inputSchema: z.object({
    org: z.string(),
  }),
  outputSchema: getOrganizationOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'get_organization',
      input: { org: context.org }
    });

    try {
      const org = await octokit.orgs.get(context);
      logger.info('Organization retrieved successfully');

      spanName?.end({
        output: { org_id: org.data.id },
        metadata: { operation: 'get_organization' }
      });
      return getOrganizationOutputSchema.parse({ status: 'success', data: org.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error getting organization');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'get_organization'
        }
      });
      return getOrganizationOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listOrganizationsOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    login: z.string(),
    description: z.string().optional(),
    html_url: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing organizations')
}).strict();

export const listOrganizations = createTool({
  id: 'listOrganizations',
  description: 'Lists all organizations.',
  inputSchema: z.object({
    since: z.number().optional(),
  }),
  outputSchema: listOrganizationsOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_organizations',
      input: { since: context.since }
    });

    try {
      const orgs = await octokit.orgs.list(context);
      logger.info('Organizations listed successfully');

      spanName?.end({
        output: { organizations_count: orgs.data.length },
        metadata: { operation: 'list_organizations' }
      });
      return listOrganizationsOutputSchema.parse({ status: 'success', data: orgs.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing organizations');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_organizations'
        }
      });
      return listOrganizationsOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});

const listOrganizationMembersOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  data: z.array(z.object({
    id: z.number(),
    login: z.string(),
    type: z.string(),
    html_url: z.string()
  })).optional(),
  errorMessage: z.string().optional().describe('Error listing organization members')
}).strict();

export const listOrganizationMembers = createTool({
  id: 'listOrganizationMembers',
  description: 'Lists members of an organization.',
  inputSchema: z.object({
    org: z.string(),
  }),
  outputSchema: listOrganizationMembersOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const spanName = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_organization_members',
      input: { org: context.org }
    });

    try {
      const members = await octokit.orgs.listMembers(context);
      logger.info('Organization members listed successfully');

      spanName?.end({
        output: { members_count: members.data.length },
        metadata: { operation: 'list_organization_members' }
      });
      return listOrganizationMembersOutputSchema.parse({ status: 'success', data: members.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.info('Error listing organization members');
      spanName?.end({
        metadata: {
          error: errorMessage,
          operation: 'list_organization_members'
        }
      });
      return listOrganizationMembersOutputSchema.parse({ status: 'error', data: null, errorMessage });
    }
  },
});
