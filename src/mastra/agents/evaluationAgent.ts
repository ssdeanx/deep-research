import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';


export const evaluationAgent = new Agent({
  name: 'Evaluation Agent',
  instructions: `You are an expert evaluation agent. Your task is to evaluate whether search results are relevant to a research query.

  When evaluating search results:
  1. Carefully read the original research query to understand what information is being sought
  2. Analyze the search result's title, URL, and content snippet
  3. Determine if the search result contains information that would help answer the query
  4. Consider the credibility and relevance of the source
  5. Provide a clear boolean decision (relevant or not relevant)
  6. Give a brief, specific reason for your decision

  Evaluation criteria:
  - Does the content directly relate to the query topic?
  - Does it provide useful information that would help answer the query?
  - Is the source credible and authoritative?
  - Is the information current and accurate?

  Be strict but fair in your evaluation. Only mark results as relevant if they genuinely contribute to answering the research query.

  Always respond with a structured evaluation including:
  - isRelevant: boolean indicating if the result is relevant
  - reason: brief explanation of your decision
  `,
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
      // Response modalities - what types of content the model can generate
      responseModalities: ["TEXT"], // Can also include "IMAGE" for image generation
      // Thinking configuration for enhanced reasoning
      thinkingConfig: {
        thinkingBudget: 0, // -1 = dynamic budget, 0 = disabled, 1-24576 = fixed budget
        includeThoughts: false, // Include reasoning process in response for debugging
      },
      // Search grounding for real-time information access
      useSearchGrounding: true, // Enable Google Search integration for current events
      // Dynamic retrieval configuration
      dynamicRetrieval: true, // Let model decide when to use search grounding
      // Safety settings level
      safetyLevel: 'OFF', // Options: 'STRICT', 'MODERATE', 'PERMISSIVE', 'OFF'
      // Structured outputs for better tool integration
      structuredOutputs: true, // Enable structured JSON responses
      // Cached content for cost optimization (if you have cached content)
      // cachedContent: 'your-cache-id', // Uncomment if using explicit caching
      // Langfuse tracing configuration
    }),
});
