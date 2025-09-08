import { Agent } from '@mastra/core';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import * as githubTools from '../tools/github';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing GitHub Agent...');

const memory = createResearchMemory();

export const githubAgent = new Agent({
  name: 'GitHub Agent',
  instructions: `You are an expert GitHub assistant. Your task is to help users interact with GitHub repositories.

  When responding to user requests:
  1.  Carefully analyze the user's request to understand what they want to do.
  2.  Use the available tools to interact with the GitHub API.
  3.  Provide clear and concise responses to the user.
  4.  Handle errors gracefully and provide helpful feedback to the user.

  You can perform the following actions:
  - Manage issues (create, get, update, list)
  - Manage repositories (list, create, get, update, delete)
  - Manage pull requests (list, get, create, update, merge, comments)
  - Manage users (get authenticated user, get user by username, list all users)
  - Manage organizations (get organization, list organizations, list organization members)

  Always be helpful and provide accurate information.`,
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ['TEXT'],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    ...githubTools,
  },
  memory,
});