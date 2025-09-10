import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info("Initializing Learning Extraction Agent...");

const memory = createResearchMemory();
export const learningExtractionAgent = new Agent({
  name: 'Learning Extraction Agent',
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
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
      // Response modalities - what types of content the model can generate
      responseModalities: ["TEXT"], // Can also include "IMAGE" for image generation
      // Thinking configuration for enhanced reasoning
      thinkingConfig: {
        thinkingBudget: -1, // -1 = dynamic budget, 0 = disabled, 1-24576 = fixed budget
        includeThoughts: true, // Include reasoning process in response for debugging
      },
      // Search grounding for real-time information access
      useSearchGrounding: true, // Enable Google Search integration for current events
      // Dynamic retrieval configuration
      dynamicRetrieval: true, // Let model decide when to use search grounding
      // Safety settings level
      safetyLevel: 'OFF', // Options: 'STRICT', 'MODERATE', 'PERMISSIVE', 'OFF'
      // Structured outputs for better tool integration

      // Cached content for cost optimization (if you have cached content)
      // cachedContent: 'your-cache-id', // Uncomment if using explicit caching
      // Langfuse tracing configuration
    }),
  memory,
});
