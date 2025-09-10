
import { Agent } from "@mastra/core/agent";
//import { createGemini25Provider } from "../config/googleProvider";
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Copywriter Agent...');

const memory = createResearchMemory();
export const copywriterAgent = new Agent({
  name: "copywriter-agent",
  description: 'An expert copywriter agent that writes engaging and high-quality blog post content on specified topics.',
  instructions: "You are a copywriter agent that writes blog post copy.",
  model: google('gemini-2.5-flash'),
  memory
});
