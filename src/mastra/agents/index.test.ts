import { describe, it, expect } from "vitest";
import { evaluate } from "@mastra/evals";
import { ToneConsistencyMetric } from "@mastra/evals/nlp";
import { researchAgent, assistant, learningExtractionAgent } from "./index.js";

describe("Agents", () => {
  it("researchAgent should validate tone consistency", async () => {
    const metric = new ToneConsistencyMetric();
    const result = await evaluate(researchAgent, "Hello, world!", metric);

    expect(result.score).toBe(1);
  });

  it("assistant should validate tone consistency", async () => {
    const metric = new ToneConsistencyMetric();
    const result = await evaluate(assistant, "Hello, world!", metric);

    expect(result.score).toBe(1);
  });

  it("learningExtractionAgent should validate tone consistency", async () => {
    const metric = new ToneConsistencyMetric();
    const result = await evaluate(learningExtractionAgent, "Hello, world!", metric);

    expect(result.score).toBe(1);
  });
});
