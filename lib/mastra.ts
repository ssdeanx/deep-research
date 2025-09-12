import { MastraClient } from "@mastra/client-js";

// Initialize Mastra client with configuration

export const mastraClient = new MastraClient({
  baseUrl: process.env.VITE_MASTRA_API_URL ?? "http://localhost:4111",
});

// Helper functions for common agent operations
export const getResearchAgent = () => mastraClient.getAgent("researchAgent");
export const getAssistantAgent = () => mastraClient.getAgent("assistant");
export const getGithubAgent = () => mastraClient.getAgent("githubAgent");
export const getReportAgent = () => mastraClient.getAgent("reportAgent");
export const getRagAgent = () => mastraClient.getAgent("ragAgent");

export const getCopywriterAgent = () => mastraClient.getAgent("copywriterAgent");
export const getEditorAgent = () => mastraClient.getAgent("editorAgent");
export const getEvaluationAgent = () => mastraClient.getAgent("evaluationAgent");
export const getLearningExtractionAgent = () => mastraClient.getAgent("learningExtractionAgent");
export const getMonitorAgent = () => mastraClient.getAgent("monitorAgent");
export const getPlanningAgent = () => mastraClient.getAgent("planningAgent");
export const getPublisherAgent = () => mastraClient.getAgent("publisherAgent");
export const getQualityAssuranceAgent = () => mastraClient.getAgent("qualityAssuranceAgent");
export const getWebSummarizationAgent = () => mastraClient.getAgent("webSummarizationAgent");
// Workflow helpers
export const getResearchWorkflow = () => mastraClient.getWorkflow("researchWorkflow");
export const getReportWorkflow = () => mastraClient.getWorkflow("generateReportWorkflow");
export const getGithubWorkflow = () => mastraClient.getWorkflow("githubPlanningWorkflow");

export default mastraClient;
