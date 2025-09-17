import { Agent } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { google } from '@ai-sdk/google';
import { createResearchMemory } from '../config/libsql-storage';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// Create the agent first, without any tools
const mcpAgent = new Agent({
  id: "mcp-agent",
  name: "Multi-tool Agent",
  instructions: "You help users check stocks and weather.",
  model: google("gemini-2.5-flash"),
  memory: createResearchMemory()
});

// Later, configure MCP with user-specific settings
const mcp = new MCPClient({
  servers: {
    stockPrice: {
      command: "npx",
      args: ["tsx", "stock-price.ts"],
      env: {
        API_KEY: "user-123-api-key",
      },
      timeout: 20000, // Server-specific timeout
    },
    weather: {
      url: new URL("http://localhost:8080/sse"),
      requestInit: {
        headers: {
          Authorization: `Bearer user-123-token`,
        },
      },
    },
  },
});

// Pass all toolsets to stream() or generate() using the mcpAgent
const response = await mcpAgent.stream(
  "How is AAPL doing and what is the weather?",
  {
    toolsets: await mcp.getToolsets(),
  });

// Cast to AsyncIterable to satisfy TypeScript that the result is async-iterable
for await (const part of response as unknown as AsyncIterable<{ content: string }>) {
  logger.info(part.content);
}

