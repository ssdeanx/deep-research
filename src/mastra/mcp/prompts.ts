import { mcp } from "./mcp";

// Get prompts from all connected MCP servers
const prompts = await mcp.prompts.list();

// Access prompts from a specific server
if (prompts.weather) {
  const prompt = prompts.weather.find(
    (p) => p.name === "current"
  );
  console.log(`Prompt: ${prompt?.name}`);
}
