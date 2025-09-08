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

const logger = new PinoLogger({ level: 'info' });

logger.info('Starting Mastra application')

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: ':memory:',
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
  },
  workflows: { generateReportWorkflow, researchWorkflow, comprehensiveResearchWorkflow, githubPlanningWorkflow, githubQualityWorkflow },
  vnext_networks: {
    complexResearchNetwork,
  },
});
