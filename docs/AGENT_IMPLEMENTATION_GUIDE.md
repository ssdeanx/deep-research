
# Agent Implementation Guide

This comprehensive guide covers the implementation of AI agents in the Mastra Deep Research System, including agent architecture, configuration, tool integration, memory systems, and advanced patterns.

## Overview

Agents in Mastra are specialized AI assistants that combine language models with tools, memory, and workflows to perform complex tasks. The system includes several specialized agents:

```
┌─────────────────────────────────────┐
│         Agent Architecture          │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │   Language  │  │    Tools    │   │
│  │    Model    │◄►│             │   │
│  └─────────────┘  └─────────────┘   │
│         │                  │        │
│         └─────────┬────────┘        │
│                   │                 │
│         ┌─────────▼─────────┐       │
│         │   Instructions    │       │
│         │   + Memory        │       │
│         │   + Context       │       │
│         └───────────────────┘       │
└─────────────────────────────────────┘
```

## Basic Agent Structure

### Creating a Simple Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from './config/googleProvider';

const simpleAgent = new Agent({
  name: 'Simple Assistant',
  instructions: `You are a helpful assistant that provides clear, accurate information.`,
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17'),
});

// Usage
const response = await simpleAgent.generate([
  { role: 'user', content: 'Hello, how can you help me?' }
]);

console.log(response.text);
```

### Agent Configuration Options

```typescript
const advancedAgent = new Agent({
  name: 'Advanced Research Agent',
  instructions: `You are an expert research assistant with the following capabilities...`,

  // Model configuration
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1, // Dynamic budget
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),

  // Tool integration
  tools: {
    webSearchTool,
    vectorQueryTool,
    chunkerTool,
  },

  // Memory system
  memory: createResearchMemory(),

  // Voice capabilities (optional)
  voice: new OpenAIVoice(),

  // Workflow integration
  workflows: {
    researchWorkflow,
    analysisWorkflow,
  },

  // Input/output processors
  inputProcessors: [
    new UnicodeNormalizer(),
    new ModerationProcessor(),
  ],
  outputProcessors: [
    new ContentFilter(),
  ],

  // Streaming configuration
  streaming: {
    enabled: true,
    chunkSize: 1024,
  },

  // Telemetry and monitoring
  telemetry: {
    enabled: true,
    traceId: 'research-agent-v1',
  }
});
```

## Specialized Agent Patterns

### Research Agent Implementation

```typescript
import { Agent } from '@mastra/core/agent';
import { webSearchTool } from '../tools/webSearchTool';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const researchAgent = new Agent({
  name: 'Research Agent',
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

  **Error Handling:**
  - If all searches fail, use your knowledge to provide basic information
  - Always complete the research process even if some searches fail

  Use all the tools available to you systematically and stop after the follow-up phase.`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),

  tools: {
    webSearchTool,
    evaluateResultTool,
    extractLearningsTool,
  },

  memory: createResearchMemory(),
});
```

### Report Generation Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

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
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: 0,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
});
```

### Web Summarization Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const webSummarizationAgent = new Agent({
  name: 'Web Summarization Agent',
  description: 'An agent that summarizes web content from search results to prevent token limit issues',
  instructions: `
You are a web content summarization specialist. Your role is to create concise, informative summaries of web content that capture the essential information while being significantly shorter than the original.

**🎯 YOUR MISSION**

Transform lengthy web content into clear, actionable summaries that preserve the most important information while reducing token usage by 80-95%.

**📋 SUMMARIZATION APPROACH**

When processing web content:

1. **Analysis Phase**:
   - Identify the content type (article, blog post, news, documentation, etc.)
   - Understand the main topic and key arguments
   - Note the credibility and source quality

2. **Extraction Phase**:
   - Extract the most critical information and insights
   - Identify key facts, statistics, and conclusions
   - Note important quotes or expert opinions
   - Preserve specific details that support main points

3. **Synthesis Phase**:
   - Organize information logically
   - Create a coherent narrative flow
   - Ensure all essential information is preserved

**✨ SUMMARY STRUCTURE**

Format your summaries with:

**Main Topic:**
- What the content is about
- Primary focus or thesis

**Key Insights:**
- 3-5 most important findings or points
- Critical facts and data
- Main conclusions or recommendations

**Supporting Details:**
- Specific examples or evidence
- Expert opinions or quotes
- Relevant statistics or research

**Context:**
- Publication source and date if available
- Author credentials if mentioned
- Relevance to research topic

**🎨 WRITING STYLE**

- Use clear, concise language
- Maintain factual accuracy
- - Preserve technical terms when necessary
- Keep sentences short but informative
- Use bullet points for better readability

**📏 LENGTH GUIDELINES**

- Aim for 200-500 words depending on source length
- Reduce original content by 80-95%
- Focus on information density
- Ensure all critical insights are preserved

**🔧 QUALITY STANDARDS**

- Accuracy: Faithfully represent the original content
- Completeness: Include all essential information
- Relevance: Focus on information relevant to the research query
- Clarity: Easy to understand and well-organized
- Conciseness: Maximum information in minimum words

Always provide summaries that capture the core value of the web content without losing critical details.
  `,
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
  memory,
});
```

### Evaluation Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const evaluationAgent = new Agent({
  name: 'Evaluation Agent',
  instructions: `You are a specialized content evaluation agent. Your role is to assess the quality, relevance, and usefulness of search results and content.

  **Evaluation Criteria:**
  1. **Relevance**: How well does the content address the original query?
  2. **Accuracy**: Is the information factually correct and well-supported?
  3. **Recency**: How current is the information?
  4. **Authority**: What is the credibility of the source?
  5. **Depth**: How comprehensive and detailed is the content?
  6. **Uniqueness**: Does this content offer new insights or perspectives?

  **Scoring System:**
  - Rate each criterion on a scale of 1-10
  - Provide specific reasoning for each score
  - Give an overall recommendation (Include/Exclude/Skip)

  **Output Format:**
  Return evaluation results in JSON format:
  {
    "relevance": { "score": number, "reasoning": "string" },
    "accuracy": { "score": number, "reasoning": "string" },
    "recency": { "score": number, "reasoning": "string" },
    "authority": { "score": number, "reasoning": "string" },
    "depth": { "score": number, "reasoning": "string" },
    "uniqueness": { "score": number, "reasoning": "string" },
    "overallScore": number,
    "recommendation": "Include" | "Exclude" | "Skip",
    "summary": "Brief explanation of the evaluation"
  }`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false,
    dynamicRetrieval: false,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),
});
```

### Learning Extraction Agent
```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const learningExtractionAgent = new Agent({
  name: 'Learning Extraction Agent',
  instructions: `You are a specialized agent for extracting key learnings and insights from research content.

  **Your Tasks:**
  1. **Identify Key Learnings**: Extract the most important facts, concepts, and insights
  2. **Generate Follow-up Questions**: Create specific questions that would deepen understanding
  3. **Categorize Information**: Organize learnings by topic, importance, and type
  4. **Identify Gaps**: Note areas where more research would be valuable

  **Learning Categories:**
  - **Factual Knowledge**: Specific facts, data points, and statistics
  - **Conceptual Understanding**: Theories, frameworks, and principles
  - **Practical Applications**: Real-world uses and implementations
  - **Trends and Patterns**: Emerging developments and future directions
  - **Challenges and Solutions**: Problems identified and proposed solutions

  **Follow-up Question Guidelines:**
  - Questions should be specific and researchable
  - Focus on gaps in current understanding
  - Prioritize questions that would provide the most value
  - Avoid overly broad or vague questions

  **Output Format:**
  Return extracted learnings in JSON format:
  {
    "learnings": [
      {
        "category": "factual" | "conceptual" | "practical" | "trends" | "challenges",
        "content": "The key learning or insight",
        "importance": "high" | "medium" | "low",
        "source": "Reference to source material"
      }
    ],
    "followUpQuestions": [
      {
        "question": "Specific research question",
        "category": "gap" | "depth" | "application" | "verification",
        "priority": "high" | "medium" | "low"
      }
    ],
    "summary": "Brief overview of the most important learnings"
  }`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false,
    dynamicRetrieval: false,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),
});
```

## Advanced Agent Patterns

### Dynamic Agent Configuration

```typescript
// Runtime-configurable agent
const createDynamicAgent = (config: {
  expertise: string;
  tools: string[];
  memoryType: 'short' | 'long' | 'persistent';
  safetyLevel: 'strict' | 'moderate' | 'permissive';
}) => {
  const { expertise, tools, memoryType, safetyLevel } = config;

  return new Agent({
    name: `${expertise} Agent`,
    instructions: `You are a specialized ${expertise} agent with the following characteristics:

    **Expertise Areas:**
    - ${expertise} concepts and principles
    - Current trends and developments in ${expertise}
    - Best practices and methodologies
    - Problem-solving approaches specific to ${expertise}

    **Capabilities:**
    - Analyze and explain ${expertise} topics
    - Provide practical recommendations
    - Identify trends and patterns
    - Suggest improvements and optimizations

    **Approach:**
    - Be thorough and accurate in your analysis
    - Provide concrete examples when possible
    - Explain complex concepts clearly
    - Focus on actionable insights`,

    model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
      responseModalities: ["TEXT"],
      thinkingConfig: {
        thinkingBudget: -1,
        includeThoughts: false,
      },
      useSearchGrounding: true,
      dynamicRetrieval: true,
      safetyLevel: safetyLevel.toUpperCase() as any,
      structuredOutputs: true,
    }),

    tools: tools.reduce((acc, toolName) => {
      acc[toolName] = mastra.getTool(toolName);
      return acc;
    }, {} as any),

    memory: createMemoryForType(memoryType),
  });
};

// Usage
const mlAgent = createDynamicAgent({
  expertise: 'Machine Learning',
  tools: ['webSearchTool', 'vectorQueryTool', 'chunkerTool'],
  memoryType: 'persistent',
  safetyLevel: 'moderate'
});
```

### Multi-Modal Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { OpenAIVoice } from '@mastra/voice-openai';
import { createGemini25Provider } from '../config/googleProvider';

const multimodalAgent = new Agent({
  name: 'Multimodal Assistant',
  instructions: `You are a multimodal AI assistant capable of:

  **Text Communication:**
  - Provide detailed, well-structured responses
  - Use markdown formatting for clarity
  - Explain complex concepts thoroughly

  **Voice Interaction:**
  - Speak clearly and at an appropriate pace
  - Use natural, conversational language
  - Confirm understanding of user requests
  - Ask clarifying questions when needed

  **Integration:**
  - Seamlessly switch between text and voice
  - Maintain context across modalities
  - Provide consistent information regardless of modality

  Always adapt your communication style to the current modality while maintaining the same level of helpfulness and accuracy.`,

  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),

  voice: new OpenAIVoice({
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
  }),

  tools: {
    webSearchTool,
    vectorQueryTool,
  },

  memory: createPersistentMemory(),
});
```

### Agent Networks and Collaboration

```typescript
// Agent network for collaborative research
class AgentNetwork {
  private agents: Map<string, Agent> = new Map();
  private communicationBus: EventEmitter;

  constructor() {
    this.communicationBus = new EventEmitter();
    this.setupCommunication();
  }

  registerAgent(name: string, agent: Agent) {
    this.agents.set(name, agent);
    this.setupAgentCommunication(name, agent);
  }

  private setupCommunication() {
    // Set up inter-agent communication channels
    this.communicationBus.on('agent-message', async (message) => {
      const { from, to, content, metadata } = message;

      if (this.agents.has(to)) {
        const recipientAgent = this.agents.get(to)!;

        // Process message through recipient agent
        const response = await recipientAgent.generate([
          {
            role: 'user',
            content: `Message from ${from}: ${content}`
          }
        ]);

        // Send response back
        this.communicationBus.emit('agent-message', {
          from: to,
          to: from,
          content: response.text,
          metadata: { ...metadata, responseTo: message.id }
        });
      }
    });
  }

  private setupAgentCommunication(name: string, agent: Agent) {
    // Add communication tools to agent
    const communicationTool = createTool({
      id: 'send-message',
      description: 'Send a message to another agent in the network',
      inputSchema: z.object({
        to: z.string(),
        content: z.string(),
        priority: z.enum(['low', 'normal', 'high']).default('normal')
      }),
      execute: async ({ context }) => {
        this.communicationBus.emit('agent-message', {
          from: name,
          to: context.to,
          content: context.content,
          metadata: { priority: context.priority, timestamp: Date.now() }
        });

        return { success: true, messageId: generateId() };
      }
    });

    // Add tool to agent (this would need to be done during agent creation)
    // agent.addTool(communicationTool);
  }

  async collaborate(query: string, primaryAgent: string, collaborators: string[]) {
    const results = new Map<string, any>();

    // Start with primary agent
    const primaryResult = await this.agents.get(primaryAgent)!.generate([
      { role: 'user', content: query }
    ]);
    results.set(primaryAgent, primaryResult);

    // Send results to collaborators for additional analysis
    for (const collaborator of collaborators) {
      if (this.agents.has(collaborator)) {
        const collaboratorAgent = this.agents.get(collaborator)!;

        const collaborativeResult = await collaboratorAgent.generate([
          {
            role: 'user',
            content: `Please analyze and enhance the following research results: ${primaryResult.text}`
          }
        ]);

        results.set(collaborator, collaborativeResult);
      }
    });
  }
}

// Usage
const agentNetwork = new AgentNetwork();

agentNetwork.registerAgent('research', researchAgent);
agentNetwork.registerAgent('analysis', analysisAgent);
agentNetwork.registerAgent('synthesis', synthesisAgent);

const collaborativeResults = await agentNetwork.collaborate(
  'Analyze the impact of AI on healthcare',
  'research',
  ['analysis', 'synthesis']
);
```

## Agent Monitoring and Observability

### Performance Metrics Collection

```typescript
class AgentMetricsCollector {
  private metrics = new Map<string, AgentMetrics>();

  recordExecution(agentName: string, execution: AgentExecution) {
    const metrics = this.metrics.get(agentName) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0,
      averageTokenUsage: 0,
      errorRate: 0,
      toolUsage: new Map<string, number>(),
    };

    metrics.totalExecutions++;
    if (execution.success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update average response time
    const totalTime = metrics.averageResponseTime * (metrics.totalExecutions - 1);
    metrics.averageResponseTime = (totalTime + execution.responseTime) / metrics.totalExecutions;

    // Update average token usage
    if (execution.tokenUsage) {
      const totalTokens = metrics.averageTokenUsage * (metrics.totalExecutions - 1);
      metrics.averageTokenUsage = (totalTokens + execution.tokenUsage) / metrics.totalExecutions;
    }

    // Update error rate
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions;

    // Record tool usage
    if (execution.toolsUsed) {
      execution.toolsUsed.forEach(tool => {
        const current = metrics.toolUsage.get(tool) || 0;
        metrics.toolUsage.set(tool, current + 1);
      });
    }

    this.metrics.set(agentName, metrics);
  }

  getMetrics(agentName: string): AgentMetrics | undefined {
    return this.metrics.get(agentName);
  }

  getAllMetrics(): Map<string, AgentMetrics> {
    return this.metrics;
  }
}

// Usage
const agentMetrics = new AgentMetricsCollector();

// Monitor agent execution
const startTime = Date.now();
const tokenUsage = { prompt: 100, completion: 50, total: 150 };

try {
  const result = await researchAgent.generate([
    { role: 'user', content: 'Research quantum computing' }
  ]);

  agentMetrics.recordExecution('research-agent', {
    success: true,
    responseTime: Date.now() - startTime,
    tokenUsage: tokenUsage.total,
    toolsUsed: ['webSearchTool', 'evaluateResultTool']
  });
} catch (error) {
  agentMetrics.recordExecution('research-agent', {
    success: false,
    responseTime: Date.now() - startTime,
    error: error.message
  });
}
```

### Agent Health Monitoring

```typescript
class AgentHealthMonitor {
  private healthStatus = new Map<string, AgentHealth>();

  async checkAgentHealth(agentName: string, agent: Agent): Promise<AgentHealth> {
    const health: AgentHealth = {
      agentName,
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      toolHealth: new Map<string, boolean>(),
    };

    try {
      const startTime = Date.now();

      // Perform health check by running a simple query
      const result = await agent.generate([
        { role: 'user', content: 'Health check: Please respond with "OK"' }
      ]);

      health.responseTime = Date.now() - startTime;
      health.status = result.text.includes('OK') ? 'healthy' : 'degraded';

      // Check tool health
      if (agent.tools) {
        for (const [toolName, tool] of Object.entries(agent.tools)) {
          try {
            // Perform basic tool health check
            await tool.execute({ context: {} });
            health.toolHealth.set(toolName, true);
          } catch (error) {
            health.toolHealth.set(toolName, false);
            health.errorCount++;
          }
        }
      }

      // Check memory usage (if available)
      if (process.memoryUsage) {
        health.memoryUsage = process.memoryUsage().heapUsed;
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.errorCount++;
    }

    this.healthStatus.set(agentName, health);
    return health;
  }

  async checkAllAgents(agents: Map<string, Agent>): Promise<Map<string, AgentHealth>> {
    const results = new Map<string, AgentHealth>();

    for (const [name, agent] of agents) {
      const health = await this.checkAgentHealth(name, agent);
      results.set(name, health);
    }

    return results;
  }

  getHealthStatus(agentName: string): AgentHealth | undefined {
    return this.healthStatus.get(agentName);
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Array.from(this.healthStatus.values()).map(h => h.status);

    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  }
}
```

## Best Practices

### 1. Agent Design Principles

- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Clear Instructions**: Provide detailed, unambiguous instructions
- **Consistent Behavior**: Maintain consistent behavior across interactions
- **Error Handling**: Implement robust error handling and recovery

### 2. Performance Optimization

- **Model Selection**: Choose appropriate models for specific tasks
- **Caching**: Implement caching for frequently accessed data
- **Batch Processing**: Use batch operations when possible
- **Resource Limits**: Set appropriate timeouts and resource limits

### 3. Security Considerations

- **Input Validation**: Validate all inputs to prevent injection attacks
- **Output Sanitization**: Sanitize outputs to prevent data leakage
- **Access Control**: Implement proper authorization for agent access
- **Audit Logging**: Log agent interactions for security auditing

### 4. Monitoring and Maintenance

- **Health Checks**: Implement regular health checks for all agents
- **Performance Monitoring**: Monitor response times and resource usage
- **Error Tracking**: Track and analyze errors for improvement
- **Version Management**: Maintain version control for agent configurations

### 5. Testing and Validation

- **Unit Tests**: Test individual agent components
- **Integration Tests**: Test agent interactions with tools and workflows
- **Performance Tests**: Test agent performance under load
- **User Acceptance Tests**: Validate agent behavior with real users

## Integration Examples

### REST API Integration

```typescript
// Express.js integration
app.post('/api/agents/:agentName/generate', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { messages, options } = req.body;

    const agent = mastra.getAgent(agentName);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const result = await agent.generate(messages, options);

    res.json({
      success: true,
      result: result.text,
      usage: result.usage,
      metadata: {
        agent: agentName,
        timestamp: new Date().toISOString(),
        model: result.model
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Streaming endpoint
app.post('/api/agents/:agentName/stream', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { messages, options } = req.body;

    const agent = mastra.getAgent(agentName);
    const stream = await agent.stream(messages, options);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream.textStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### WebSocket Integration

```typescript
// Real-time agent communication
io.on('connection', (socket) => {
  socket.on('join-agent-room', (agentName) => {
    socket.join(`agent-${agentName}`);
  });

  socket.on('agent-message', async (data) => {
    const { agentName, messages, options } = data;

    try {
      const agent = mastra.getAgent(agentName);
      const result = await agent.generate(messages, options);

      // Send result to all clients in the agent room
      io.to(`agent-${agentName}`).emit('agent-response', {
        agentName,
        result: result.text,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('agent-error', {
        agentName,
        error: error.message
      });
    }
  });

  socket.on('start-agent-stream', async (data) => {
    const { agentName, messages, options } = data;

    try {
      const agent = mastra.getAgent(agentName);
      const stream = await agent.stream(messages, options);

      for await (const chunk of stream.textStream) {
        socket.emit('agent-stream-chunk', {
          agentName,
          chunk,
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('agent-stream-end', { agentName });
    } catch (error) {
      socket.emit('agent-stream-error', {
        agentName,
        error: error.message
      });
    }
  });
});
```

---

*This comprehensive agent implementation guide provides detailed patterns and examples for building robust, scalable AI agents in the Mastra Deep Research System, covering everything from basic agent creation to advanced patterns like agent networks and real-time monitoring.*

## New Specialized Agents

### Monitor Agent

**Purpose**: Expert monitoring and observability specialist focused on proactive system health management.

```typescript
import { Agent } from '@mastra/core/agent';
import { readDataFileTool, writeDataFileTool, listDataDirTool, searchDataFilesTool, getDataFileInfoTool } from '../tools/data-file-manager';
import { webScraperTool } from '../tools/web-scraper-tool';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";

export const monitorAgent = new Agent({
  name: 'Monitor Agent',
  instructions: `You are an expert monitoring and observability specialist focused on proactive system health management...`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(),
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    readDataFileTool,
    writeDataFileTool,
    listDataDirTool,
    searchDataFilesTool,
    getDataFileInfoTool,
    webScraperTool,
    evaluateResultTool,
    extractLearningsTool,
  },
  memory: createResearchMemory(),
});
```

### Planning Agent

**Purpose**: Expert strategic planning and project management specialist.

```typescript
import { Agent } from '@mastra/core/agent';
// ... imports for planning agent tools and configuration

export const planningAgent = new Agent({
  name: 'Planning Agent',
  instructions: `You are an expert strategic planning and project management specialist...`,
  // ... planning agent configuration
});
```

### Quality Assurance Agent

**Purpose**: Expert quality assurance and testing specialist.

```typescript
import { Agent } from '@mastra/core/agent';
// ... imports for QA agent tools and configuration

export const qualityAssuranceAgent = new Agent({
  name: 'Quality Assurance Agent',
  instructions: `You are an expert quality assurance and testing specialist...`,
  // ... QA agent configuration
});
```</file>
</files><environment_details>
# VSCode Visible Files
../../../../request_2df690cf-ea8b-4dab-aedf-9f4790a6f315/0,src/mastra/agents/learningExtractionAgent.ts

# VSCode Open Tabs
GEMINI.md,src/mastra/index.ts,src/mastra/tools/web-scraper-tool.ts,src/mastra/tools/vectorQueryTool.ts,.github/prompts/archon.prompt.md,.kilocode/rules/archon.md,src/mastra/tools/rerank-tool.ts,src/mastra/tools/data-file-manager.ts,.env.example,README.md,src/mastra/networks/complexResearchNetwork.ts,package.json,src/mastra/workflows/comprehensiveResearchWorkflow.ts,src/mastra/config/googleProvider.ts,src/mastra/config/libsql-storage.ts,.gitignore,../../.config/goose/config.yaml,.specstory/history/2025-09-05_15-31Z-i-want-you-to-check-my-actual-project-&-its-current-state-looks-for-ways-to-improve-my-#file-readme-md-with-tech-badges-also-i-want-you-to-look-at-my-documentation-&-make-sure-its-up-to-date-&-in-s.md,../../../../snap/code/205/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.es5.d.ts,tsconfig.json,eslint.config.js,docs/PROJECT_DOCUMENTATION.md,docs/INTEGRATION_PATTERNS.md,docs/PERFORMANCE_OPTIMIZATION.md,.env,src/mastra/agents/reportAgent.ts,src/mastra/agents/webSummarizationAgent.ts,src/mastra/tools/chunker-tool.ts

# Current Time
Current time in ISO 8601 UTC format: 2025-09-06T04:43:50.052Z
User time zone: America/New_York, UTC-4:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>gemini-2.5-flash</model>
<role>You are Kilo Code, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.</role>
<custom_instructions>
====

USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

Language Preference:
You should always speak and think in the "English" (en) language unless the user gives you instructions below to do otherwise.

Rules:

# Rules from /home/sam/00-mastra/deep-research/.kilocode/rules/archon.md:
# Archon Integration & Workflow

**CRITICAL: This project uses Archon for knowledge management, task tracking, and project organization.**

## Core Archon Workflow Principles

### The Golden Rule: Task-Driven Development with Archon

**MANDATORY: Always complete the full Archon task cycle before any coding:**

1. **Check Current Task** → Review task details and requirements
2. **Research for Task** → Search relevant documentation and examples
3. **Implement the Task** → Write code based on research
4. **Update Task Status** → Move task from "todo" → "doing" → "review"
5. **Get Next Task** → Check for next priority task
6. **Repeat Cycle**

**Task Management Rules:**
- Update all actions to Archon
- Move tasks from "todo" → "doing" → "review" (not directly to complete)
- Maintain task descriptions and add implementation notes
- DO NOT MAKE ASSUMPTIONS - check project documentation for questions</custom_instructions>
====

REMINDERS

Below is your current list of reminders for this task. Keep them updated as you progress.

| # | Content | Status |
|---|---------|--------|
| 1 | Understand Mastra workflows, networks-vnext, and evals/scorers using mastraDocs. | Completed |
| 2 | Review existing folder contents (agents, config, workflows, networks, tools). | Completed |
| 3 | Design a new workflow for research and report generation, incorporating ragAgent and other relevant agents. | Completed |
| 4 | Implement the new workflow. | Completed |
| 5 | Replace console.log with logger.info in src/mastra/workflows/comprehensiveResearchWorkflow.ts. | Completed |
| 6 | Use visualReasoning from clear-thought MCP tool to visualize the workflow and iterate. | Completed |
| 7 | Refine the workflow based on user feedback. | Completed |
| 8 | Re-examine the roles of all agents in src/mastra/agents/. | Completed |
| 9 | Search mastraExamples for complex workflow patterns, especially those involving multiple agents and non-linear flow. | Completed |
| 10 | Examine workflow-with-inline-steps example. | Completed |
| 11 | Examine workflow-with-memory example. | Completed |
| 12 | Examine workflow-with-separate-steps example. | Completed |
| 13 | Examine workflow-with-suspend-resume example. | Completed |
| 14 | Redesign the comprehensiveResearchWorkflow to be more sophisticated, incorporating more agents and advanced workflow features (e.g., branching, loops, or network integration). | Completed |
| 15 | Re-implement the comprehensiveResearchWorkflow based on the new design. | Completed |
| 16 | Update the visualReasoning with the new workflow. | Completed |
| 17 | Generate a report using the new workflow. | Pending |
| 18 | Check evals/scoring information using mastraDocs. | Completed |
| 19 | Clarify what "more information" the user needs from Mastra MCP tools. | Completed |
| 20 | Provide instructions and examples for integrating and running `@mastra/evals` with custom agents. | Completed |
| 21 | Implement evals for each agent in `src/mastra/agents/`. | Completed |
| 22 | Integrate additional non-LLM evals (`KeywordCoverageMetric`, `ToneConsistencyMetric`) and configure existing ones with "all options" for each agent. | Completed |
| 23 | Clarify additional options for non-LLM evals. | Completed |
| 24 | Explore other ways to achieve keyword-based evaluation if KeywordCoverageMetric does not fit the requirement. | Completed |


IMPORTANT: When task status changes, remember to call the `update_todo_list` tool to update your progress.

</thinking>
The previous `apply_diff` failed because the search pattern did not match the file content exactly. This is likely due to the context of the search being too small, and the markdown formatting being sensitive. The error `Diff block is malformed: marker '^<<<<<<< SEARCH>?$' found in your diff content at line 1046.` suggests a problem with the diff block itself, perhaps a `<<<<<<< SEARCH` string appeared in the search content.

I will attempt to modify the `docs/AGENT_IMPLEMENTATION_GUIDE.md` file again using `write_to_file` to replace the entire content. This is the most reliable method for complex changes in markdown files.

I will now construct the entire content of `docs/AGENT_IMPLEMENTATION_GUIDE.md` with all the desired changes, including the `BaseMetric` import and the `evals` property in the `AgentConfig` interface. I will also update all the agent implementation examples to include the `evals` property.

This will be a large operation, so I will ensure the content is precise.

I will now write the full content to the file.</thinking>
<write_to_file>
<path>docs/AGENT_IMPLEMENTATION_GUIDE.md</path>
<content>
# Agent Implementation Guide

This comprehensive guide covers the implementation of AI agents in the Mastra Deep Research System, including agent architecture, configuration, tool integration, memory systems, and advanced patterns.

## Overview

Agents in Mastra are specialized AI assistants that combine language models with tools, memory, and workflows to perform complex tasks. The system includes several specialized agents:

```
┌─────────────────────────────────────┐
│         Agent Architecture          │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │   Language  │  │    Tools    │   │
│  │    Model    │◄►│             │   │
│  └─────────────┘  └─────────────┘   │
│         │                  │        │
│         └─────────┬────────┘        │
│                   │                 │
│         ┌─────────▼─────────┐       │
│         │   Instructions    │       │
│         │   + Memory        │       │
│         │   + Context       │       │
│         └───────────────────┘       │
└─────────────────────────────────────┘
```

## Basic Agent Structure

### Creating a Simple Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from './config/googleProvider';

const simpleAgent = new Agent({
  name: 'Simple Assistant',
  instructions: `You are a helpful assistant that provides clear, accurate information.`,
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17'),
});

// Usage
const response = await simpleAgent.generate([
  { role: 'user', content: 'Hello, how can you help me?' }
]);

console.log(response.text);
```

### Agent Configuration Options

```typescript
const advancedAgent = new Agent({
  name: 'Advanced Research Agent',
  instructions: `You are an expert research assistant with the following capabilities...`,

  // Model configuration
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1, // Dynamic budget
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),

  // Tool integration
  tools: {
    webSearchTool,
    vectorQueryTool,
    chunkerTool,
  },

  // Memory system
  memory: createResearchMemory(),

  // Voice capabilities (optional)
  voice: new OpenAIVoice(),

  // Workflow integration
  workflows: {
    researchWorkflow,
    analysisWorkflow,
  },

  // Input/output processors
  inputProcessors: [
    new UnicodeNormalizer(),
    new ModerationProcessor(),
  ],
  outputProcessors: [
    new ContentFilter(),
  ],

  // Streaming configuration
  streaming: {
    enabled: true,
    chunkSize: 1024,
  },

  // Telemetry and monitoring
  telemetry: {
    enabled: true,
    traceId: 'research-agent-v1',
  }
});
```

#### AgentConfig

```typescript
import { BaseMetric } from "@mastra/evals"; // Import BaseMetric for evals property

interface AgentConfig {
  name: string;
  description?: string;
  instructions: string | DynamicArgument<string>;
  model: Model | DynamicArgument<Model>;
  tools?: Record<string, Tool> | DynamicArgument<Record<string, Tool>>;
  memory?: Memory | DynamicArgument<Memory>;
  workflows?: Record<string, Workflow> | DynamicArgument<Record<string, Workflow>>;
  voice?: Voice | DynamicArgument<Voice>;
  inputProcessors?: Processor[];
  outputProcessors?: Processor[];
  onError?: (error: Error, context: any) => Promise<void>;
  circuitBreaker?: CircuitBreakerConfig;
  maxRetries?: number;
  timeout?: number;
  evals?: Record<string, BaseMetric<any>>; // Add evals property
}
```

## Specialized Agent Patterns

### Research Agent Implementation

```typescript
import { Agent } from '@mastra/core/agent';
import { webSearchTool } from '../tools/webSearchTool';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const researchAgent = new Agent({
  name: 'Research Agent',
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

  **Error Handling:**
  - If all searches fail, use your knowledge to provide basic information
  - Always complete the research process even if some searches fail

  Use all the tools available to you systematically and stop after the follow-up phase.`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),

  tools: {
    webSearchTool,
    evaluateResultTool,
    extractLearningsTool,
  },

  memory: createResearchMemory(),
});
```

### Report Generation Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

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
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: 0,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
});
```

### Web Summarization Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const webSummarizationAgent = new Agent({
  name: 'Web Summarization Agent',
  description: 'An agent that summarizes web content from search results to prevent token limit issues',
  instructions: `
You are a web content summarization specialist. Your role is to create concise, informative summaries of web content that capture the essential information while being significantly shorter than the original.

**🎯 YOUR MISSION**

Transform lengthy web content into clear, actionable summaries that preserve the most important information while reducing token usage by 80-95%.

**📋 SUMMARIZATION APPROACH**

When processing web content:

1. **Analysis Phase**:
   - Identify the content type (article, blog post, news, documentation, etc.)
   - Understand the main topic and key arguments
   - Note the credibility and source quality

2. **Extraction Phase**:
   - Extract the most critical information and insights
   - Identify key facts, statistics, and conclusions
   - Note important quotes or expert opinions
   - Preserve specific details that support main points

3. **Synthesis Phase**:
   - Organize information logically
   - Create a coherent narrative flow
   - Ensure all essential information is preserved

**✨ SUMMARY STRUCTURE**

Format your summaries with:

**Main Topic:**
- What the content is about
- Primary focus or thesis

**Key Insights:**
- 3-5 most important findings or points
- Critical facts and data
- Main conclusions or recommendations

**Supporting Details:**
- Specific examples or evidence
- Expert opinions or quotes
- Relevant statistics or research

**Context:**
- Publication source and date if available
- Author credentials if mentioned
- Relevance to research topic

**🎨 WRITING STYLE**

- Use clear, concise language
- Maintain factual accuracy
- - Preserve technical terms when necessary
- Keep sentences short but informative
- Use bullet points for better readability

**📏 LENGTH GUIDELINES**

- Aim for 200-500 words depending on source length
- Reduce original content by 80-95%
- Focus on information density
- Ensure all critical insights are preserved

**🔧 QUALITY STANDARDS**

- Accuracy: Faithfully represent the original content
- Completeness: Include all essential information
- Relevance: Focus on information relevant to the research query
- Clarity: Easy to understand and well-organized
- Conciseness: Maximum information in minimum words

Always provide summaries that capture the core value of the web content without losing critical details.
  `,
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
  memory,
});
```

### Evaluation Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const evaluationAgent = new Agent({
  name: 'Evaluation Agent',
  instructions: `You are a specialized content evaluation agent. Your role is to assess the quality, relevance, and usefulness of search results and content.

  **Evaluation Criteria:**
  1. **Relevance**: How well does the content address the original query?
  2. **Accuracy**: Is the information factually correct and well-supported?
  3. **Recency**: How current is the information?
  4. **Authority**: What is the credibility of the source?
  5. **Depth**: How comprehensive and detailed is the content?
  6. **Uniqueness**: Does this content offer new insights or perspectives?

  **Scoring System:**
  - Rate each criterion on a scale of 1-10
  - Provide specific reasoning for each score
  - Give an overall recommendation (Include/Exclude/Skip)

  **Output Format:**
  Return evaluation results in JSON format:
  {
    "relevance": { "score": number, "reasoning": "string" },
    "accuracy": { "score": number, "reasoning": "string" },
    "recency": { "score": number, "reasoning": "string" },
    "authority": { "score": number, "reasoning": "string" },
    "depth": { "score": number, "reasoning": "string" },
    "uniqueness": { "score": number, "reasoning": "string" },
    "overallScore": number,
    "recommendation": "Include" | "Exclude" | "Skip",
    "summary": "Brief explanation of the evaluation"
  }`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false,
    dynamicRetrieval: false,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),
});
```

### Learning Extraction Agent
```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp"; // Non-LLM evals

export const learningExtractionAgent = new Agent({
  name: 'Learning Extraction Agent',
  instructions: `You are a specialized agent for extracting key learnings and insights from research content.

  **Your Tasks:**
  1. **Identify Key Learnings**: Extract the most important facts, concepts, and insights
  2. **Generate Follow-up Questions**: Create specific questions that would deepen understanding
  3. **Categorize Information**: Organize learnings by topic, importance, and type
  4. **Identify Gaps**: Note areas where more research would be valuable

  **Learning Categories:**
  - **Factual Knowledge**: Specific facts, data points, and statistics
  - **Conceptual Understanding**: Theories, frameworks, and principles
  - **Practical Applications**: Real-world uses and implementations
  - **Trends and Patterns**: Emerging developments and future directions
  - **Challenges and Solutions**: Problems identified and proposed solutions

  **Follow-up Question Guidelines:**
  - Questions should be specific and researchable
  - Focus on gaps in current understanding
  - Prioritize questions that would provide the most value
  - Avoid overly broad or vague questions

  **Output Format:**
  Return extracted learnings in JSON format:
  {
    "learnings": [
      {
        "category": "factual" | "conceptual" | "practical" | "trends" | "challenges",
        "content": "The key learning or insight",
        "importance": "high" | "medium" | "low",
        "source": "Reference to source material"
      }
    ],
    "followUpQuestions": [
      {
        "question": "Specific research question",
        "category": "gap" | "depth" | "application" | "verification",
        "priority": "high" | "medium" | "low"
      }
    ],
    "summary": "Brief overview of the most important learnings"
  }`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false,
    dynamicRetrieval: false,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),
});
```

### GitHub Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import * as githubTools from '../tools/github';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";

export const githubAgent = new Agent({
  name: 'GitHub Agent',
  instructions: `You are an advanced AI-powered GitHub Assistant, meticulously designed to streamline and enhance user interactions with GitHub repositories and associated resources. Your primary role is to act as an intelligent interface, interpreting user commands, executing actions via the GitHub API, and providing comprehensive, actionable feedback. You manage various GitHub entities including repositories, issues, pull requests, users, and organizations.

**Core Capabilities:**
- **GitHub API Interaction:** You are equipped with a suite of specialized tools that directly interface with the GitHub API, enabling you to perform a wide range of operations.
- **Issue Management:** Create, retrieve, update, list, and manage comments on issues within repositories.
- **Repository Management:** List, create, retrieve, update, delete, and manage settings for repositories.
- **Pull Request Management:** List, retrieve, create, update, merge, close, and manage comments and reviews on pull requests.
- **User Management:** Retrieve information about the authenticated user, search for users by username, and list users within an organization or globally (where applicable and permitted).
- **Organization Management:** Retrieve organization details, list organizations, and list members of an organization.

**Behavioral Guidelines:**
- **Clarity and Conciseness:** Ensure all responses are easy to understand, directly address the user's query, and avoid unnecessary jargon.
- **Accuracy and Reliability:** Provide precise information based on real-time API responses and ensure all actions are executed correctly.
- **Helpfulness and Proactive Guidance:** Anticipate user needs, proactively offer relevant suggestions, clarifications, or next steps, and guide users effectively through complex operations.
- **Professionalism:** Maintain a polite, respectful, and professional tone in all interactions.
- **Robust Error Handling:** Gracefully handle API errors, invalid requests, or unexpected situations. When an error occurs, clearly explain the issue, suggest potential causes, and provide actionable next steps or alternative solutions to the user.

**Constraints & Boundaries:**
- **API-Centric Operations:** Strictly operate within the confines of the provided GitHub API tools. Never attempt to bypass API limitations, security protocols, or perform actions outside the scope of the API.
- **User Confirmation for Destructive Actions:** Do not perform any destructive or irreversible actions (e.g., deleting a repository, merging a pull request) without explicit, unambiguous user confirmation.
- **Rate Limit Adherence:** Strictly adhere to GitHub's API rate limits and usage policies to ensure service stability and prevent abuse.
- **Security and Privacy:** Handle all user data and GitHub resource information with the utmost confidentiality and security. Do not expose sensitive information or perform unauthorized data access.
- **Scope Limitation:** Do not engage in activities outside of GitHub resource management.

**Success Criteria:**
- **Efficient and Accurate Fulfillment:** User requests are fulfilled accurately, efficiently, and reliably, leading to successful task completion.
- **Exceptional User Experience:** Responses are consistently clear, helpful, and timely, minimizing user frustration and maximizing productivity.
- **Effective Error Resolution:** Errors are handled professionally and informatively, guiding users towards resolution and maintaining a positive interaction.
- **Operational Compliance:** All operations strictly adhere to GitHub's policies and API best practices.

**GitHub Copilot Agent Interaction:**
You possess the advanced capability to delegate tasks and request analysis from GitHub's native Copilot agent. This is a powerful feature for automating complex coding and review tasks. Your interaction with the Copilot agent is governed by two distinct mechanisms:

1. **Task Delegation via Issue Assignment:**
   * **Trigger:** Assigning a GitHub Issue to the user \`@github-copilot\`.
   * **Purpose:** To delegate a complete coding task, such as a feature implementation, bug fix, or code refactoring.
   * **Action:** When a user asks you to have Copilot build a feature, your tool must first create a highly detailed issue. The body of this issue serves as the primary prompt for the Copilot agent. Immediately after creation, your tool will assign this issue to \`@github-copilot\`.
   * **Outcome:** The Copilot agent will accept the task, create a new branch, write the code, and submit a new pull request linked to the original issue. You should inform the user that the task has been successfully delegated and a PR will be generated shortly.

2. **Code Analysis via Pull Request Comments:**
   * **Trigger:** Mentioning the user \`@github-copilot\` in a comment on a pull request.
   * **Purpose:** To request analysis, explanation, or suggestions on the code within that specific pull request. This is for review and understanding, not for writing new code.
   * **Action:** When a user asks for Copilot's opinion on a PR, your tool will create a comment on that PR, starting with \`@github-copilot\` followed by the user's question.
   * **Outcome:** The Copilot agent will post a reply to the comment thread with its analysis or answer.

**Prerequisites & Constraints for Copilot Interaction:**
- **Copilot Enterprise Required:** These features will only function in repositories that are part of an organization with an active GitHub Copilot Enterprise subscription. If an action fails, you should suggest this as a potential cause.
- **Clarity is Paramount:** The quality of the Copilot agent's work is directly proportional to the quality of your issue description or comment. Always create detailed, specific, and unambiguous prompts for the Copilot agent.`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(), // Keywords will be provided at runtime for evaluation
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash', {
    responseModalities: ['TEXT'],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    ...githubTools,
  },
  memory: createResearchMemory(),
});
```

## Advanced Agent Patterns

### Dynamic Agent Configuration

```typescript
// Runtime-configurable agent
const createDynamicAgent = (config: {
  expertise: string;
  tools: string[];
  memoryType: 'short' | 'long' | 'persistent';
  safetyLevel: 'strict' | 'moderate' | 'permissive';
}) => {
  const { expertise, tools, memoryType, safetyLevel } = config;

  return new Agent({
    name: `${expertise} Agent`,
    instructions: `You are a specialized ${expertise} agent with the following characteristics:

    **Expertise Areas:**
    - ${expertise} concepts and principles
    - Current trends and developments in ${expertise}
    - Best practices and methodologies
    - Problem-solving approaches specific to ${expertise}

    **Capabilities:**
    - Analyze and explain ${expertise} topics
    - Provide practical recommendations
    - Identify trends and patterns
    - Suggest improvements and optimizations

    **Approach:**
    - Be thorough and accurate in your analysis
    - Provide concrete examples when possible
    - Explain complex concepts clearly
    - Focus on actionable insights`,

    model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
      responseModalities: ["TEXT"],
      thinkingConfig: {
        thinkingBudget: -1,
        includeThoughts: false,
      },
      useSearchGrounding: true,
      dynamicRetrieval: true,
      safetyLevel: safetyLevel.toUpperCase() as any,
      structuredOutputs: true,
    }),

    tools: tools.reduce((acc, toolName) => {
      acc[toolName] = mastra.getTool(toolName);
      return acc;
    }, {} as any),

    memory: createMemoryForType(memoryType),
  });
};

// Usage
const mlAgent = createDynamicAgent({
  expertise: 'Machine Learning',
  tools: ['webSearchTool', 'vectorQueryTool', 'chunkerTool'],
  memoryType: 'persistent',
  safetyLevel: 'moderate'
});
```

### Multi-Modal Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { OpenAIVoice } from '@mastra/voice-openai';
import { createGemini25Provider } from '../config/googleProvider';

const multimodalAgent = new Agent({
  name: 'Multimodal Assistant',
  instructions: `You are a multimodal AI assistant capable of:

  **Text Communication:**
  - Provide detailed, well-structured responses
  - Use markdown formatting for clarity
  - Explain complex concepts thoroughly

  **Voice Interaction:**
  - Speak clearly and at an appropriate pace
  - Use natural, conversational language
  - Confirm understanding of user requests
  - Ask clarifying questions when needed

  **Integration:**
  - Seamlessly switch between text and voice
  - Maintain context across modalities
  - Provide consistent information regardless of modality

  Always adapt your communication style to the current modality while maintaining the same level of helpfulness and accuracy.`,

  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),

  voice: new OpenAIVoice({
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
  }),

  tools: {
    webSearchTool,
    vectorQueryTool,
  },

  memory: createPersistentMemory(),
});
```

### Agent Networks and Collaboration

```typescript
// Agent network for collaborative research
class AgentNetwork {
  private agents: Map<string, Agent> = new Map();
  private communicationBus: EventEmitter;

  constructor() {
    this.communicationBus = new EventEmitter();
    this.setupCommunication();
  }

  registerAgent(name: string, agent: Agent) {
    this.agents.set(name, agent);
    this.setupAgentCommunication(name, agent);
  }

  private setupCommunication() {
    // Set up inter-agent communication channels
    this.communicationBus.on('agent-message', async (message) => {
      const { from, to, content, metadata } = message;

      if (this.agents.has(to)) {
        const recipientAgent = this.agents.get(to)!;

        // Process message through recipient agent
        const response = await recipientAgent.generate([
          {
            role: 'user',
            content: `Message from ${from}: ${content}`
          }
        ]);

        // Send response back
        this.communicationBus.emit('agent-message', {
          from: to,
          to: from,
          content: response.text,
          metadata: { ...metadata, responseTo: message.id }
        });
      }
    });
  }

  private setupAgentCommunication(name: string, agent: Agent) {
    // Add communication tools to agent
    const communicationTool = createTool({
      id: 'send-message',
      description: 'Send a message to another agent in the network',
      inputSchema: z.object({
        to: z.string(),
        content: z.string(),
        priority: z.enum(['low', 'normal', 'high']).default('normal')
      }),
      execute: async ({ context }) => {
        this.communicationBus.emit('agent-message', {
          from: name,
          to: context.to,
          content: context.content,
          metadata: { priority: context.priority, timestamp: Date.now() }
        });

        return { success: true, messageId: generateId() };
      }
    });

    // Add tool to agent (this would need to be done during agent creation)
    // agent.addTool(communicationTool);
  }

  async collaborate(query: string, primaryAgent: string, collaborators: string[]) {
    const results = new Map<string, any>();

    // Start with primary agent
    const primaryResult = await this.agents.get(primaryAgent)!.generate([
      { role: 'user', content: query }
    ]);
    results.set(primaryAgent, primaryResult);

    // Send results to collaborators for additional analysis
    for (const collaborator of collaborators) {
      if (this.agents.has(collaborator)) {
        const collaboratorAgent = this.agents.get(collaborator)!;

        const collaborativeResult = await collaboratorAgent.generate([
          {
            role: 'user',
            content: `Please analyze and enhance the following research results: ${primaryResult.text}`
          }
        ]);

        results.set(collaborator, collaborativeResult);
      }
    });
  }
}

// Usage
const agentNetwork = new AgentNetwork();

agentNetwork.registerAgent('research', researchAgent);
agentNetwork.registerAgent('analysis', analysisAgent);
agentNetwork.registerAgent('synthesis', synthesisAgent);

const collaborativeResults = await agentNetwork.collaborate(
  'Analyze the impact of AI on healthcare',
  'research',
  ['analysis', 'synthesis']
);
```

## Agent Monitoring and Observability

### Performance Metrics Collection

```typescript
class AgentMetricsCollector {
  private metrics = new Map<string, AgentMetrics>();

  recordExecution(agentName: string, execution: AgentExecution) {
    const metrics = this.metrics.get(agentName) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0,
      averageTokenUsage: 0,
      errorRate: 0,
      toolUsage: new Map<string, number>(),
    };

    metrics.totalExecutions++;
    if (execution.success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update average response time
    const totalTime = metrics.averageResponseTime * (metrics.totalExecutions - 1);
    metrics.averageResponseTime = (totalTime + execution.responseTime) / metrics.totalExecutions;

    // Update average token usage
    if (execution.tokenUsage) {
      const totalTokens = metrics.averageTokenUsage * (metrics.totalExecutions - 1);
      metrics.averageTokenUsage = (totalTokens + execution.tokenUsage) / metrics.totalExecutions;
    }

    // Update error rate
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions;

    // Record tool usage
    if (execution.toolsUsed) {
      execution.toolsUsed.forEach(tool => {
        const current = metrics.toolUsage.get(tool) || 0;
        metrics.toolUsage.set(tool, current + 1);
      });
    }

    this.metrics.set(agentName, metrics);
  }

  getMetrics(agentName: string): AgentMetrics | undefined {
    return this.metrics.get(agentName);
  }

  getAllMetrics(): Map<string, AgentMetrics> {
    return this.metrics;
  }
}

// Usage
const agentMetrics = new AgentMetricsCollector();

// Monitor agent execution
const startTime = Date.now();
const tokenUsage = { prompt: 100, completion: 50, total: 150 };

try {
  const result = await researchAgent.generate([
    { role: 'user', content: 'Research quantum computing' }
  ]);

  agentMetrics.recordExecution('research-agent', {
    success: true,
    responseTime: Date.now() - startTime,
    tokenUsage: tokenUsage.total,
    toolsUsed: ['webSearchTool', 'evaluateResultTool']
  });
} catch (error) {
  agentMetrics.recordExecution('research-agent', {
    success: false,
    responseTime: Date.now() - startTime,
    error: error.message
  });
}
```

### Agent Health Monitoring

```typescript
class AgentHealthMonitor {
  private healthStatus = new Map<string, AgentHealth>();

  async checkAgentHealth(agentName: string, agent: Agent): Promise<AgentHealth> {
    const health: AgentHealth = {
      agentName,
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      toolHealth: new Map<string, boolean>(),
    };

    try {
      const startTime = Date.now();

      // Perform health check by running a simple query
      const result = await agent.generate([
        { role: 'user', content: 'Health check: Please respond with "OK"' }
      ]);

      health.responseTime = Date.now() - startTime;
      health.status = result.text.includes('OK') ? 'healthy' : 'degraded';

      // Check tool health
      if (agent.tools) {
        for (const [toolName, tool] of Object.entries(agent.tools)) {
          try {
            // Perform basic tool health check
            await tool.execute({ context: {} });
            health.toolHealth.set(toolName, true);
          } catch (error) {
            health.toolHealth.set(toolName, false);
            health.errorCount++;
          }
        }
      }

      // Check memory usage (if available)
      if (process.memoryUsage) {
        health.memoryUsage = process.memoryUsage().heapUsed;
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.errorCount++;
    }

    this.healthStatus.set(agentName, health);
    return health;
  }

  async checkAllAgents(agents: Map<string, Agent>): Promise<Map<string, AgentHealth>> {
    const results = new Map<string, AgentHealth>();

    for (const [name, agent] of agents) {
      const health = await this.checkAgentHealth(name, agent);
      results.set(name, health);
    }

    return results;
  }

  getHealthStatus(agentName: string): AgentHealth | undefined {
    return this.healthStatus.get(agentName);
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Array.from(this.healthStatus.values()).map(h => h.status);

    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  }
}
```

## Best Practices

### 1. Agent Design Principles

- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Clear Instructions**: Provide detailed, unambiguous instructions
- **Consistent Behavior**: Maintain consistent behavior across interactions
- **Error Handling**: Implement robust error handling and recovery

### 2. Performance Optimization

- **Model Selection**: Choose appropriate models for specific tasks
- **Caching**: Implement caching for frequently accessed data
- **Batch Processing**: Use batch operations when possible
- **Resource Limits**: Set appropriate timeouts and resource limits

### 3. Security Considerations

- **Input Validation**: Validate all inputs to prevent injection attacks
- **Output Sanitization**: Sanitize outputs to prevent data leakage
- **Access Control**: Implement proper authorization for agent access
- **Audit Logging**: Log agent interactions for security auditing

### 4. Monitoring and Maintenance

- **Health Checks**: Implement regular health checks for all agents
- **Performance Monitoring**: Monitor response times and resource usage
- **Error Tracking**: Track and analyze errors for improvement
- **Version Management**: Maintain version control for agent configurations

### 5. Testing and Validation

- **Unit Tests**: Test individual agent components
- **Integration Tests**: Test agent interactions with tools and workflows
- **Performance Tests**: Test agent performance under load
- **User Acceptance Tests**: Validate agent behavior with real users

## Integration Examples

### REST API Integration

```typescript
// Express.js integration
app.post('/api/agents/:agentName/generate', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { messages, options } = req.body;

    const agent = mastra.getAgent(agentName);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const result = await agent.generate(messages, options);

    res.json({
      success: true,
      result: result.text,
      usage: result.usage,
      metadata: {
        agent: agentName,
        timestamp: new Date().toISOString(),
        model: result.model
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Streaming endpoint
app.post('/api/agents/:agentName/stream', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { messages, options } = req.body;

    const agent = mastra.getAgent(agentName);
    const stream = await agent.stream(messages, options);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream.textStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### WebSocket Integration

```typescript
// Real-time agent communication
io.on('connection', (socket) => {
  socket.on('join-agent-room', (agentName) => {
    socket.join(`agent-${agentName}`);
  });

  socket.on('agent-message', async (data) => {
    const { agentName, messages, options } = data;

    try {
      const agent = mastra.getAgent(agentName);
      const result = await agent.generate(messages, options);

      // Send result to all clients in the agent room
      io.to(`agent-${agentName}`).emit('agent-response', {
        agentName,
        result: result.text,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('agent-error', {
        agentName,
        error: error.message
      });
    }
  });

  socket.on('start-agent-stream', async (data) => {
    const { agentName, messages, options } = data;

    try {
      const agent = mastra.getAgent(agentName);
      const stream = await agent.stream(messages, options);

      for await (const chunk of stream.textStream) {
        socket.emit('agent-stream-chunk', {
          agentName,
          chunk,
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('agent-stream-end', { agentName });
    } catch (error) {
      socket.emit('agent-stream-error', {
        agentName,
        error: error.message
      });
    }
  });
});
```

---

*This comprehensive agent implementation guide provides detailed patterns and examples for building robust, scalable AI agents in the Mastra Deep Research System, covering everything from basic agent creation to advanced patterns like agent networks and real-time monitoring.*

## New Specialized Agents

### Monitor Agent

**Purpose**: Expert monitoring and observability specialist focused on proactive system health management.

```typescript
import { Agent } from '@mastra/core/agent';
import { readDataFileTool, writeDataFileTool, listDataDirTool, searchDataFilesTool, getDataFileInfoTool } from '../tools/data-file-manager';
import { webScraperTool } from '../tools/web-scraper-tool';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';
import { ContentSimilarityMetric, CompletenessMetric, TextualDifferenceMetric, KeywordCoverageMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";

export const monitorAgent = new Agent({
  name: 'Monitor Agent',
  instructions: `You are an expert monitoring and observability specialist focused on proactive system health management...`,
  evals: {
    contentSimilarity: new ContentSimilarityMetric({ ignoreCase: true, ignoreWhitespace: true }),
    completeness: new CompletenessMetric(),
    textualDifference: new TextualDifferenceMetric(),
    keywordCoverage: new KeywordCoverageMetric(),
    toneConsistency: new ToneConsistencyMetric(),
  },
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: true,
    },
    useSearchGrounding: true,
    dynamicRetrieval: true,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    readDataFileTool,
    writeDataFileTool,
    listDataDirTool,
    searchDataFilesTool,
    getDataFileInfoTool,
    webScraperTool,
    evaluateResultTool,
    extractLearningsTool,
  },
  memory: createResearchMemory(),
});
```

### Planning Agent

**Purpose**: Expert strategic planning and project management specialist.

```typescript
import { Agent } from '@mastra/core/agent';
// ... imports for planning agent tools and configuration

export const planningAgent = new Agent({
  name: 'Planning Agent',
  instructions: `You are an expert strategic planning and project management specialist...`,
  // ... planning agent configuration
});
```

### Quality Assurance Agent

**Purpose**: Expert quality assurance and testing specialist.

```typescript
import { Agent } from '@mastra/core/agent';
// ... imports for QA agent tools and configuration

export const qualityAssuranceAgent = new Agent({
  name: 'Quality Assurance Agent',
  instructions: `You are an expert quality assurance and testing specialist...`,
  // ... QA agent configuration
});
```</write_to_file>