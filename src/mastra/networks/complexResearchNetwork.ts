import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { createResearchMemory } from '../config/libsql-storage';
import { ragAgent } from '../agents/ragAgent';
import { researchAgent } from '../agents/researchAgent';
import { reportAgent } from '../agents/reportAgent';
import { assistant } from '../agents/assistant';
import { researchWorkflow } from '../workflows/researchWorkflow';
import { generateReportWorkflow } from '../workflows/generateReportWorkflow';
import { PinoLogger } from "@mastra/loggers";
import { google } from '@ai-sdk/google';
const logger = new PinoLogger({ level: 'info' });

logger.info('Complex Research Network initialized');

const memory = createResearchMemory();

export const complexResearchNetwork = new NewAgentNetwork({
  id: 'complex-research-network',
  name: 'Complex Research Network',
  instructions: `You are an advanced research and reporting network. Your goal is to thoroughly understand and respond to user queries by leveraging specialized agents and workflows.

  **Capabilities:**
  - **Information Retrieval (RAG Agent)**: Use the 'ragAgent' to perform vector-based searches and retrieve relevant information from a knowledge base.
  - **In-depth Research (Research Agent)**: Use the 'researchAgent' to conduct multi-phase web research, including initial and follow-up searches, and extract key learnings.
  - **Report Generation (Report Agent)**: Use the 'reportAgent' to synthesize research data into comprehensive, well-structured reports.
  - **Automated Research Workflow**: Use 'researchWorkflow' to guide users through a structured research process, including query definition and approval.
  - **Automated Report Generation Workflow**: Use 'generateReportWorkflow' to manage the end-to-end process of researching and generating a report, including user approval steps.

  **Decision-Making Guidelines:**
  - When the user asks for a specific search or retrieval from existing knowledge, prioritize 'ragAgent'.
  - When the user asks for in-depth investigation or web-based research, consider 'researchAgent' or 'researchWorkflow'. Use 'researchWorkflow' if the task requires user interaction (e.g., approval of research scope).
  - When the user asks for a comprehensive document or summary based on provided or gathered information, prioritize 'reportAgent' or 'generateReportWorkflow'. Use 'generateReportWorkflow' for a full end-to-end report creation process with potential user approvals.
  - Always aim to provide the most complete and accurate response possible by combining the strengths of your specialized components.
  - If a task involves multiple stages (e.g., research then report), consider which workflow (e.g., 'generateReportWorkflow') can handle the entire sequence.
  `,
  model: google('gemini-2.5-flash-lite'),
  agents: {
    ragAgent,
    researchAgent,
    reportAgent,
    assistant,
  },
  workflows: {
    researchWorkflow,
    generateReportWorkflow,
  },
  memory,
});

