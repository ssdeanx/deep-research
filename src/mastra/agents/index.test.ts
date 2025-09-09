import { describe, it, expect } from "vitest";
import { evaluate } from "@mastra/evals";
import { ToneConsistencyMetric } from "@mastra/evals/nlp";
import { researchAgent } from "./index.js";

describe("My Agent", () => {
  it("should validate tone consistency", async () => {
    const metric = new ToneConsistencyMetric();
    const result = await evaluate(researchAgent, "Hello, world!", metric);

    expect(result.score).toBe(1);
  });
});
