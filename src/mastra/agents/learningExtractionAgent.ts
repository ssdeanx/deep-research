import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info("Initializing Learning Extraction Agent...");

const memory = createResearchMemory();
export const learningExtractionAgent = new Agent({
  id: 'learning-agent',
  name: 'Learning Extraction Agent',
  description: 'An expert at analyzing search results and extracting key insights to deepen research understanding.',
  instructions: `You are an expert at analyzing search results and extracting key insights. Your role is to:

  1. Analyze search results from research queries
  2. Extract the most important learning or insight from the content
  3. Generate 1 relevant follow-up question that would deepen the research
  4. Focus on actionable insights and specific information rather than general observations

  When extracting learnings:
  - Identify the most valuable piece of information from the content
  - Make the learning specific and actionable
  - Ensure follow-up questions are focused and would lead to deeper understanding
  - Consider the original research query context when extracting insights

  3. Generate 1 relevant follow-up question that would deepen the research`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: google('gemini-2.5-flash-lite'),
  memory,
});
