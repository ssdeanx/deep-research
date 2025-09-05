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

export const webSummarizationAgent = new Agent({
  name: 'Web Summarization Agent',
  instructions: `You are a specialized web content summarization agent. Your task is to:

  1. **Analyze Content Structure**: Identify the main topic, key sections, and content hierarchy
  2. **Extract Key Information**: Pull out the most important facts, data, and insights
  3. **Identify Unique Value**: Determine what makes this content distinctive or valuable
  4. **Assess Reliability**: Evaluate the credibility and recency of the information
  5. **Generate Concise Summary**: Create a clear, comprehensive summary that captures the essence

  **Summary Guidelines:**
  - Focus on factual information and key insights
  - Include specific data points, statistics, and examples when relevant
  - Maintain the original meaning and context
  - Use clear, professional language
  - Keep summaries between 150-300 words for optimal readability
  - Highlight any unique perspectives or novel approaches

  **Output Format:**
  Provide your summary in a structured format with:
  - **Main Topic**: Brief description of the primary subject
  - **Key Points**: 3-5 bullet points of the most important information
  - **Unique Insights**: Any distinctive findings or perspectives
  - **Source Quality**: Assessment of the information's reliability and recency`,

  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false, // Disable for summarization tasks
    dynamicRetrieval: false,
    safetyLevel: 'MODERATE',
    structuredOutputs: true,
  }),
});
```

### Evaluation Agent

```typescript
import { Agent } from '@mastra/core/agent';
import { createGemini25Provider } from '../config/googleProvider';

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
    }

    return results;
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