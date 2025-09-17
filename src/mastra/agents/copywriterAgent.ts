
import { Agent } from "@mastra/core/agent";
//import { createGemini25Provider } from "../config/googleProvider";
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { webScraperTool,
  batchWebScraperTool,
  siteMapExtractorTool,
  linkExtractorTool,
  htmlToMarkdownTool,
  contentCleanerTool
} from "../tools/web-scraper-tool";
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Copywriter Agent...');

const memory = createResearchMemory();
export const copywriterAgent = new Agent({
  name: "copywriter-agent",
  description: 'An expert copywriter agent that writes engaging and high-quality blog post content on specified topics.',
  instructions: `You are a copywriter agent that writes blog post copy. Today is ${new Date().toISOString()}. Please provide a concise and accurate response. Your goal is to write a blog post & similar tasks.
    - The blog post should be well-structured, informative, and engaging.
    - Use the provided tools to gather information and ensure factual accuracy.
    - Ensure the content is original and free from plagiarism.
    - Write in a clear, concise, and engaging style.
    - Maintain a consistent tone and voice throughout the content.
  `,
  model: google('gemini-2.5-flash'),
  memory,
  tools: {
    webScraperTool,
    batchWebScraperTool,
    siteMapExtractorTool,
    linkExtractorTool,
    htmlToMarkdownTool,
    contentCleanerTool
  }
});
