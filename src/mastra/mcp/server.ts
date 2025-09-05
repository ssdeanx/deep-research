import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { mastra } from '../index';
import {
  chunkerTool,
  readDataFileTool,
  writeDataFileTool,
  deleteDataFileTool,
  listDataDirTool,
  evaluateResultTool,
  extractLearningsTool,
  graphRAGQueryTool,
  graphRAGUpsertTool,
  rerankTool,
  vectorQueryTool,
  weatherTool,
  webScraperTool,
  webSearchTool,
} from '../tools/index';

// #region Tool and Agent Configuration
interface McpTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any, any, any>;
  execute: (args: any) => Promise<any>;
}

const adaptMastraTool = (tool: any): McpTool => ({
  name: tool.id,
  description: tool.description,
  inputSchema: tool.inputSchema,
  execute: async (args: any) => tool.execute({ context: args, mastra }),
});

const toolRegistry: McpTool[] = [
  adaptMastraTool(chunkerTool),
  adaptMastraTool(readDataFileTool),
  adaptMastraTool(writeDataFileTool),
  adaptMastraTool(deleteDataFileTool),
  adaptMastraTool(listDataDirTool),
  adaptMastraTool(evaluateResultTool),
  adaptMastraTool(extractLearningsTool),
  adaptMastraTool(graphRAGQueryTool),
  adaptMastraTool(graphRAGUpsertTool),
  adaptMastraTool(rerankTool),
  adaptMastraTool(vectorQueryTool),
  adaptMastraTool(weatherTool),
  adaptMastraTool(webScraperTool),
  adaptMastraTool(webSearchTool),
];

const agentToolSchemas = {
  researchAgent: z.object({
    query: z.string().describe('The research query or topic to investigate'),
    depth: z.enum(['shallow', 'medium', 'deep']).default('medium').describe('Research depth level'),
  }),
  reportAgent: z.object({
    researchData: z.any().describe('Research data to generate report from'),
    format: z.enum(['markdown', 'json']).default('markdown').describe('Output format for the report'),
  }),
  evaluationAgent: z.object({
    query: z.string().describe('The original research query'),
    result: z.object({ title: z.string(), url: z.string(), content: z.string() }).describe('The search result to evaluate'),
  }),
  learningExtractionAgent: z.object({
    query: z.string().describe('The original research query'),
    result: z.object({ title: z.string(), url: z.string(), content: z.string() }).describe('The search result to process'),
  }),
  ragAgent: z.object({
    query: z.string().describe('The query for the RAG agent'),
  }),
  webSummarizationAgent: z.object({
    content: z.string().describe('The web content to summarize'),
    query: z.string().describe('The original research query'),
  }),
};

const createAgentTool = (agentName: keyof typeof agentToolSchemas, description: string): McpTool => {
  return {
    name: `${agentName}_run`,
    description,
    inputSchema: agentToolSchemas[agentName],
    execute: async (args: any) => {
      const agent = mastra.getAgent(agentName as any);
      const result = await agent.generate([{ role: 'user', content: JSON.stringify(args) }]);
      return { content: [{ type: 'text', text: result.text || JSON.stringify(result, null, 2) }] };
    },
  };
};

const agentTools: McpTool[] = [
  createAgentTool('researchAgent', 'Execute the research agent for comprehensive topic investigation'),
  createAgentTool('reportAgent', 'Generate a comprehensive report from research data'),
  createAgentTool('evaluationAgent', 'Evaluate if a search result is relevant to a research query'),
  createAgentTool('learningExtractionAgent', 'Extract key learnings and follow-up questions from a search result'),
  createAgentTool('ragAgent', 'Use the RAG agent to find and synthesize information'),
  createAgentTool('webSummarizationAgent', 'Summarize web content'),
];

const allTools: McpTool[] = [...toolRegistry, ...agentTools];

// #endregion

const server = new Server(
  { name: 'Mastra Deep Research Server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    const tool = allTools.find(t => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }
    const args = tool.inputSchema.parse(request.params.arguments);
    const result = await tool.execute(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{ type: 'text', text: `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Mastra Deep Research MCP Server started successfully');
}

main().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});

export { server };