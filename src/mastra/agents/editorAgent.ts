import { Agent } from "@mastra/core/agent";
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Editor Agent...');

const memory = createResearchMemory();
export const editorAgent = new Agent({
  name: "Editor",
  instructions: "You are an editor agent that edits blog post copy.",
  model: createGemini25Provider('gemini-2.5-flash-lite', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    mediaResolution: "MEDIA_RESOLUTION_LOW",
  }),
  memory
});
