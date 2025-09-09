import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";

//import { vectorQueryTool } from '../tools/vectorQueryTool';
//import { chunkerTool } from '../tools/chunker-tool';
import { readDataFileTool, writeDataFileTool, deleteDataFileTool, listDataDirTool } from '../tools/data-file-manager';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
//import { graphRAGUpsertTool, graphRAGTool, graphRAGQueryTool } from '../tools/graphRAG';
//import { rerankTool } from '../tools/rerank-tool';
//import { weatherTool } from '../tools/weather-tool';
import { webScraperTool } from '../tools/web-scraper-tool';
//import { webSearchTool } from '../tools/webSearchTool';

const logger = new PinoLogger({ level: 'info' });

logger.info('Initializing OpenRouter Assistant Agent...');

const memory = createResearchMemory();

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

export const assistant = new Agent({
    name: "assistant",
    instructions: "You are a helpful assistant.",
    model: openrouter("openrouter/sonoma-sky-alpha",
    {
        extraBody: {
            reasoning: {
                max_tokens: 6144,
            },
        }
    }),
    memory,
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
})
logger.info('OpenRouter Assistant Agent Working...');
