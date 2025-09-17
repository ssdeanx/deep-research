
import { MCPServer } from "@mastra/mcp";
import { PinoLogger } from "@mastra/loggers";
import { assistant } from "../agents";
const logger = new PinoLogger({ level: "info" });

logger.info("Initializing MCP Server with Agent-Tool...");

export const server = new MCPServer({
  name: "My Custom Server with Agent-Tool",
  version: "1.0.0",
  tools: {

  },
  agents: { assistant }, // Exposes 'ask_generalHelper' tool
});
