import { mcp } from "./mcp";

// Get resources from all connected MCP servers
const resources = await mcp.getResources();

// Access resources from a specific server
if (resources.filesystem) {
  const resource = resources.filesystem.find(
    (r) => r.uri === "filesystem://Downloads",
  );
  console.log(`Resource: ${resource?.name}`);
}
