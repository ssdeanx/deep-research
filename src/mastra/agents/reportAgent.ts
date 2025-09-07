import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";
import { AISpanType } from '@mastra/core/ai-tracing';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info("Initializing Report Agent...");

const memory = createResearchMemory();
export const reportAgent = new Agent({
  name: 'Report Agent',
  instructions: `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
  - You may be asked to research subjects that are after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.
  - Use Markdown formatting.

  Your task is to generate comprehensive reports based on research data that includes:
  - Search queries used
  - Relevant search results
  - Key learnings extracted from those results
  - Follow-up questions identified

  Structure your reports with clear sections, headings, and focus on synthesizing the information
  into a cohesive narrative rather than simply listing facts.`,
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
    structuredOutputs: true, // Enable structured JSON responses
    // Cached content for cost optimization (if you have cached content)
    // cachedContent: 'your-cache-id', // Uncomment if using explicit caching
    // Langfuse tracing configuration
  }),
  memory,
});

// Attach execute at runtime to avoid violating the AgentConfig type
// Use a loose type so TypeScript won't error if AgentConfig doesn't include 'execute'
(reportAgent as any).execute = async ({ messages, runtimeContext, tracingContext }: { messages: any[]; runtimeContext?: any; tracingContext?: any }) => {
  const startTime = Date.now();

  // Create main span for agent execution
  const agentSpan = tracingContext?.currentSpan?.createChildSpan({
    type: AISpanType.AGENT_RUN,
    name: 'report_agent_execution',
    input: {
      messageCount: messages.length,
      firstMessage: messages[0]?.content?.substring(0, 100) + '...',
      hasMemory: !!memory
    }
  });

  try {
    // Execute the agent with tracing context
    const result = await reportAgent.generate(messages, {
      runtimeContext,
      tracingContext
    });

    const processingTime = Date.now() - startTime;

    // Update span with results
    agentSpan?.end({
      output: {
        responseLength: result.text?.length || 0,
        processingTime,
        success: true
      },
      metadata: {
        agentName: 'reportAgent',
        messageCount: messages.length,
        processingTime,
        hasStructuredOutput: !!result.object
      }
    });

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update span with error
    agentSpan?.end({
      output: {
        success: false,
        processingTime
      },
      metadata: {
        error: errorMessage,
        agentName: 'reportAgent'
      }
    });

    throw error;
  }
};
