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
  },
  workflows: { generateReportWorkflow, researchWorkflow, comprehensiveResearchWorkflow },
  vnext_networks: {
    complexResearchNetwork,
  },
});
