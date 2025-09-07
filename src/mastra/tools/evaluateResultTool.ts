import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const evaluateResultTool = createTool({
  id: 'evaluate-result',
  description: 'Evaluate if a search result is relevant to the research query',
  inputSchema: z.object({
    query: z.string().describe('The original research query'),
    result: z
      .object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
      })
      .describe('The search result to evaluate'),
    existingUrls: z.array(z.string()).describe('URLs that have already been processed').optional(),
  }),
  execute: async ({ context, mastra }) => {
    try {
      const { query, result, existingUrls = [] } = context;
      logger.info('Evaluating result', { context });

      // Check if URL already exists (only if existingUrls was provided)
      if (existingUrls && existingUrls.includes(result.url)) {
        return {
          isRelevant: false,
          reason: 'URL already processed',
        };
      }

      const evaluationAgent = mastra!.getAgent('evaluationAgent');

      const response = await evaluationAgent.generate(
        [
          {
            role: 'user',
            content: `Evaluate whether this search result is relevant and will help answer the query: "${query}".

        Search result:
        Title: ${result.title}
        URL: ${result.url}
        Content snippet: ${result.content.substring(0, 500)}...

        Respond with a JSON object containing:
        - isRelevant: boolean indicating if the result is relevant
        - reason: brief explanation of your decision`,
          },
        ],
        {
          experimental_output: z.object({
            isRelevant: z.boolean(),
            reason: z.string(),
          }),
        },
      );

      return response.object;
    } catch (error) {
      logger.error('Error evaluating result:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        isRelevant: false,
        reason: 'Error in evaluation',
      };
    }
  },
});
