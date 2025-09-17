import { Agent } from "@mastra/core/agent";

import { copywriterTool } from "../tools/copywriter-agent-tool";
import { editorTool } from "../tools/editor-agent-tool";
//import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { webSearchTool } from "../tools/webSearchTool";
import { evaluateResultTool } from "../tools/evaluateResultTool";
import { extractLearningsTool } from "../tools/extractLearningsTool";
import { webScraperTool,
  batchWebScraperTool,
  siteMapExtractorTool,
  linkExtractorTool,
  htmlToMarkdownTool,
  contentCleanerTool
} from "../tools/web-scraper-tool";
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Publisher Agent...');

const memory = createResearchMemory();
export const publisherAgent = new Agent({
  id: "publisher-agent",
  name: "publisherAgent",
  description: "An agent that publishes blog posts by writing and editing content.",
  instructions:
    "You are a publisher agent that first calls the copywriter agent to write blog post copy about a specific topic and then calls the editor agent to edit the copy. Just return the final edited copy.",
    model: google('gemini-2.5-flash'),
  tools: { copywriterTool, editorTool, webSearchTool, evaluateResultTool, extractLearningsTool, "web-scraper": webScraperTool,
    batchWebScraperTool, siteMapExtractorTool, linkExtractorTool, htmlToMarkdownTool, contentCleanerTool },
  memory
});

logger.info('Publish Agent is working!')
