import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
//import { comprehensiveResearchWorkflow } from './workflows/comprehensiveResearchWorkflow';
import { complexResearchNetwork } from './networks/complexResearchNetwork';
import { ragAgent } from './agents/ragAgent';
import { PinoLogger } from '@mastra/loggers';

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
    ragAgent
  },
  workflows: { generateReportWorkflow, researchWorkflow },
  vnext_networks: {
    complexResearchNetwork,
  },
  logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
      formatters:   {
        level(label) {
          return { level: label };
        },
        /**
         * Returns an object containing the provided bindings.
         * Used to format logger bindings for output.
         *
         * Args:
         *   bindings: The logger bindings to include in the output.
         *
         * Returns:
         *   An object with a single property 'bindings' containing the input.
         */
        bindings(bindings) { return { bindings }; }, // This is a comment to avoid empty object lint error
        /**
         * Returns a shallow copy of the provided log object.
         * Used to format log entries for output.
         *
         * Args:
         *   object: The log object to be copied and formatted.
         *
         * Returns:
         *   A new object containing the same properties as the input object.
         */
        log(object) { return { ...object, time: new Date().toISOString() }; },
      },
  }),
});
