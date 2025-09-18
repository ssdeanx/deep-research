
import { Agent } from "@mastra/core/agent";
//import { createGemini25Provider } from "../config/googleProvider";
import { createResearchMemory, STORAGE_CONFIG } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { webScraperTool,
  batchWebScraperTool,
  siteMapExtractorTool,
  linkExtractorTool,
  htmlToMarkdownTool,
  contentCleanerTool
} from "../tools/web-scraper-tool";
import { google } from '@ai-sdk/google';
import { LIBSQL_PROMPT } from "@mastra/libsql";
import { createVectorQueryTool } from "@mastra/rag";

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing Copywriter Agent...');

const memory = createResearchMemory();

const queryTool = createVectorQueryTool({
  vectorStoreName: "libsql",
  indexName: STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS, // Use research documents index
  model: google.textEmbedding("gemini-embedding-001"),
  enableFilter: true,
  description: "Search for semantically similar content in the LibSQL vector store using embeddings. Supports filtering, ranking, and context retrieval."
});

export const copywriterAgent = new Agent({
  id: "copywriter-agent",
  name: "copywriter-agent",
  description: 'An expert copywriter agent that writes engaging and high-quality blog post content on specified topics.',
  instructions: `You are a copywriter agent that writes blog post copy. Today is ${new Date().toISOString()}. Please provide a concise and accurate response. Your goal is to write a blog post & similar tasks.
    - The blog post should be well-structured, informative, and engaging.
    - Use the provided tools to gather information and ensure factual accuracy.
    - Ensure the content is original and free from plagiarism.
    - Write in a clear, concise, and engaging style.
    - Maintain a consistent tone and voice throughout the content.

    Process queries using the provided context. Structure responses to be concise and relevant.
  ${LIBSQL_PROMPT}
  `,
  model: google('gemini-2.5-flash'),
  memory,
  tools: {
    webScraperTool,
    queryTool,
//    batchWebScraperTool,
 //   siteMapExtractorTool,
//    linkExtractorTool,
    htmlToMarkdownTool,
//    contentCleanerTool
  }
});
