
import { Agent } from "@mastra/core/agent";
import { createGemini25Provider } from "../config/googleProvider";
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Copywriter Agent...');

const memory = createResearchMemory();
export const copywriterAgent = new Agent({
  name: "copywriter-agent",
  instructions: "You are a copywriter agent that writes blog post copy.",
  model: createGemini25Provider('gemini-2.5-flash-lite', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    mediaResolution: "MEDIA_RESOLUTION_LOW",
    useSearchGrounding: false, // We use our own vector search
    dynamicRetrieval: false,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  memory
});