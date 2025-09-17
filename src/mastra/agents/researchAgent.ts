import { Agent } from '@mastra/core/agent';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { webSearchTool } from '../tools/webSearchTool';
//import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { PinoLogger } from "@mastra/loggers";

import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ level: 'info' });

logger.info("Initializing Research Agent...");

const memory = createResearchMemory();

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  description: 'An expert research agent that conducts thorough research using web search and analysis tools.',
  instructions: `You are an expert research agent. Your goal is to research topics thoroughly by following this EXACT process:

  **PHASE 1: Initial Research**
  1. Break down the main topic into 2 specific, focused search queries
  2. For each query, use the webSearchTool to search the web
  3. Use evaluateResultTool to determine if results are relevant
  4. For relevant results, use extractLearningsTool to extract key learnings and follow-up questions

  **PHASE 2: Follow-up Research**
  1. After completing Phase 1, collect ALL follow-up questions from the extracted learnings
  2. Search for each follow-up question using webSearchTool
  3. Use evaluateResultTool and extractLearningsTool on these follow-up results
  4. **STOP after Phase 2 - do NOT search additional follow-up questions from Phase 2 results**

  **Important Guidelines:**
  - Keep search queries focused and specific - avoid overly general queries
  - Track all completed queries to avoid repetition
  - Only search follow-up questions from the FIRST round of learnings
  - Do NOT create infinite loops by searching follow-up questions from follow-up results

  **Output Structure:**
  Return findings in JSON format with:
  - queries: Array of all search queries used (initial + follow-up)
  - searchResults: Array of relevant search results found
  - learnings: Array of key learnings extracted from results
  - completedQueries: Array tracking what has been searched
  - phase: Current phase of research ("initial" or "follow-up")
  - runtimeConfig: Applied runtime configuration settings

  **Error Handling:**
  - If all searches fail, use your knowledge to provide basic information
  - Always complete the research process even if some searches fail

  Use all the tools available to you systematically and stop after the follow-up phase.
  `,
 evals: {
   contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
   completeness: new CompletenessMetric(),
   textualDifference: new TextualDifferenceMetric(),
   keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
   toneConsistency: new ToneConsistencyMetric(),
 },
 model: google('gemini-2.5-flash-lite'),
 tools: {
   webSearchTool,
   evaluateResultTool,
   extractLearningsTool,
 },
 memory
});
