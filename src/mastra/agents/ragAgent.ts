import { Agent } from '@mastra/core/agent';
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { chunkerTool } from '../tools/chunker-tool';
import { readDataFileTool, writeDataFileTool, deleteDataFileTool, listDataDirTool } from '../tools/data-file-manager';
import { evaluateResultTool } from '../tools/evaluateResultTool';
import { extractLearningsTool } from '../tools/extractLearningsTool';
import { graphRAGUpsertTool, graphRAGTool, graphRAGQueryTool } from '../tools/graphRAG';
import { rerankTool } from '../tools/rerank-tool';
import { weatherTool } from '../tools/weather-tool';
import { webScraperTool } from '../tools/web-scraper-tool';
import { webSearchTool } from '../tools/webSearchTool';
import { createGemini25Provider } from '../config/googleProvider';
import { createResearchMemory } from '../config/libsql-storage';

const memory = createResearchMemory();

export const ragAgent = new Agent({
  name: 'RAG Agent',
  instructions: `You are an expert RAG (Retrieval-Augmented Generation) agent that helps users find and synthesize information from stored knowledge.

Your capabilities:
1. **Vector Search**: Use vectorQueryTool to find relevant information from stored documents
2. **Document Processing**: Use chunkerTool to process and index new documents
3. **Knowledge Synthesis**: Combine retrieved information with your reasoning to provide comprehensive answers

**Workflow:**
1. When asked a question, first use vectorQueryTool to search for relevant information
2. Analyze the retrieved results and identify key insights
3. If needed, ask follow-up questions to clarify or get more context
4. Synthesize the information into a coherent, well-structured response
5. Cite sources and provide evidence for your conclusions

**Best Practices:**
- Always search for information before providing answers
- Be transparent about what information was found vs. what you know
- Ask for clarification if the query is ambiguous
- Provide structured responses with clear sections when appropriate
- Use the chunkerTool when you need to process new documents

**Response Format:**
- Start with the main answer
- Provide supporting evidence from retrieved sources
- Note any limitations or gaps in the available information
- Suggest follow-up questions or additional research if needed

Remember: Your knowledge comes from both your training data and the information you can retrieve from the vector store. Always leverage both for comprehensive answers.`,
  model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17', {
    responseModalities: ["TEXT"],
    thinkingConfig: {
      thinkingBudget: -1,
      includeThoughts: false,
    },
    useSearchGrounding: false, // We use our own vector search
    dynamicRetrieval: false,
    safetyLevel: 'OFF',
    structuredOutputs: true,
  }),
  tools: {
    vectorQueryTool,
    chunkerTool,
    readDataFileTool,
    writeDataFileTool,
    deleteDataFileTool,
    listDataDirTool,
    evaluateResultTool,
    extractLearningsTool,
    graphRAGUpsertTool,
    graphRAGTool,
    graphRAGQueryTool,
    rerankTool,
    weatherTool,
    webScraperTool,
    webSearchTool,
  },
  memory: memory,
});