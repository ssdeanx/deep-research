import { beforeAll } from "vitest";
import { attachListeners } from "@mastra/evals";
import { mastra } from "./src/mastra/index";

beforeAll(async () => {
  // Store evals in Mastra Storage (requires storage to be enabled)
  await attachListeners(mastra);
});
