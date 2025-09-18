import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { UnicodeNormalizer } from "@mastra/core/processors"
import { BatchPartsProcessor } from "@mastra/core/processors";
//import { vectorQueryTool } from '../tools/vectorQueryTool';
//import { chunkerTool } from '../tools/chunker-tool';
import { readDataFileTool, writeDataFileTool, deleteDataFileTool, listDataDirTool } from '../tools/data-file-manager';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
//import { graphRAGUpsertTool, graphRAGTool, graphRAGQueryTool } from '../tools/graphRAG';
//import { rerankTool } from '../tools/rerank-tool';
//import { weatherTool } from '../tools/weather-tool';
import { webScraperTool,
  batchWebScraperTool,
  siteMapExtractorTool,
  linkExtractorTool,
  htmlToMarkdownTool,
  contentCleanerTool
} from "../tools/web-scraper-tool";
import { FileTransport } from "@mastra/loggers/file";
//import { webSearchTool } from '../tools/webSearchTool';
import { agentMemory } from "../config/pg-storage";
const logger = new PinoLogger({ level: 'info',
   });

logger.info('Initializing OpenRouter Assistant Agent...');

const memory = createResearchMemory();

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

export const assistant = new Agent({
    id: "assistant",
    name: "assistant",
    description: 'A helpful assistant.',
    instructions: `You are a helpful assistant. Today is ${new Date().toISOString()}. Please provide a concise and accurate response.
    Your goal is to help the user with their research tasks or anything else they need.
    `,
    model: openrouter("openrouter/sonoma-sky-alpha",
    {
        extraBody: {
            reasoning: {
                max_tokens: 6144,
            },
        }
    }),
    memory: agentMemory,
    evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
    },
    tools: { // Corrected indentation for the 'tools' object
    readDataFileTool,
    writeDataFileTool,
    deleteDataFileTool,
    listDataDirTool,
    evaluateResultTool,
    extractLearningsTool,
    batchWebScraperTool,
    siteMapExtractorTool,
    linkExtractorTool,
    htmlToMarkdownTool,
    contentCleanerTool,
    //vectorQueryTool,
    //chunkerTool,
    //graphRAGUpsertTool,
    //graphRAGTool,
    //graphRAGQueryTool,
    //rerankTool,
    //weatherTool,
    webScraperTool,
    //webSearchTool,
    },
    inputProcessors: [
    new UnicodeNormalizer({
      stripControlChars: true,
      collapseWhitespace: true,
      preserveEmojis: true,
      trim: true,
    }),
  ],
  outputProcessors: [
    new BatchPartsProcessor({
      batchSize: 10, // Maximum parts to batch together
      maxWaitTime: 50, // Maximum time to wait before emitting (ms)
      emitOnNonText: true, // Emit immediately on non-text parts
    }),
  ],
})
logger.info('OpenRouter Assistant Agent Working...');
