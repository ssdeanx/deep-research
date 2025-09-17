import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
import { comprehensiveResearchWorkflow } from './workflows/comprehensiveResearchWorkflow';
import { complexResearchNetwork } from './networks/complexResearchNetwork';
import { ragAgent } from './agents/ragAgent';
import { githubAgent } from './agents/githubAgent';
import { monitorAgent } from './agents/monitorAgent';
import { planningAgent } from './agents/planningAgent';
import { qualityAssuranceAgent } from './agents/qualityAssuranceAgent';
import { githubPlanningWorkflow } from './workflows/githubPlanningWorkflow';
import { githubQualityWorkflow } from './workflows/githubQualityWorkflow';
import { PinoLogger } from "@mastra/loggers";
import { publisherAgent } from "./agents/publisherAgent";
import { copywriterAgent } from "./agents/copywriterAgent";
import { editorAgent } from "./agents/editorAgent";
import { assistant } from './agents/assistant';
import { LangfuseExporter } from '@mastra/langfuse';
import { SamplingStrategyType } from '@mastra/core/ai-tracing';
//import { voiceAgent } from './agents/v';
//import { server } from './mcp/server';
import { FileTransport } from "@mastra/loggers/file";

export const logger = new PinoLogger({
  level: 'warn',
//  transports: {
//    file: new FileTransport({ path: "../../mastra.log" })
//  }
});

logger.info('Starting Mastra application')

export const mastra = new Mastra({
   storage: new LibSQLStore({
     url: 'file:./mastra.db',
     initialBackoffMs: 50
   }),
   agents: {
     researchAgent,
     reportAgent,
     evaluationAgent,
     learningExtractionAgent,
     webSummarizationAgent,
     ragAgent,
     githubAgent,
     monitorAgent,
     planningAgent,
     qualityAssuranceAgent,
     publisherAgent,
     copywriterAgent,
     editorAgent,
     assistant,
   },
   workflows: { generateReportWorkflow, researchWorkflow, comprehensiveResearchWorkflow, githubPlanningWorkflow, githubQualityWorkflow },
   vnext_networks: {
     complexResearchNetwork,
   },
   observability: {
     configs: {
       langfuse: {
         serviceName: process.env.SERVICE_NAME ?? 'mastra',
         sampling: { type: SamplingStrategyType.ALWAYS },
         exporters: [
           new LangfuseExporter({
             publicKey: process.env.LANGFUSE_PUBLIC_KEY,
             secretKey: process.env.LANGFUSE_SECRET_KEY,
             baseUrl: process.env.LANGFUSE_BASE_URL, // Optional
             realtime: process.env.NODE_ENV === 'development',
           }),
         ],
       },
     },
   },
   logger // Use the configured logger instance
 });
