import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { researchAgent } from '../agents/researchAgent';
import { ragAgent } from '../agents/ragAgent';
import { reportAgent } from '../agents/reportAgent';
import { evaluationAgent } from '../agents/evaluationAgent';
import { learningExtractionAgent } from '../agents/learningExtractionAgent';
import { webSummarizationAgent } from '../agents/webSummarizationAgent';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// --- Step 1: Get User Query ---
const getUserQueryStep = createStep({
  id: 'get-user-query',
  inputSchema: z.object({}),
  outputSchema: z.object({
    query: z.string(),
  }),
  resumeSchema: z.object({
    query: z.string(),
  }),
  suspendSchema: z.object({
    message: z.object({
      query: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        query: resumeData.query || '',
      };
    }

    await suspend({
      message: {
        query: 'What would you like to research?',
      },
    });

    return {
      query: '',
    };
  },
});

// --- Step 2: Conduct Web Research ---
const conductWebResearchStep = createStep({
  id: 'conduct-web-research',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    searchResults: z.array(z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    })),
    learnings: z.array(z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string(),
    })),
    completedQueries: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { query } = inputData;
    logger.info(`Starting web research for query: ${query}`);

    try {
      const result = await researchAgent.generate(
        [
          {
            role: 'user',
            content: `Research the following topic thoroughly using the two-phase process: "${query}".
            Phase 1: Search for 2-3 initial queries about this topic
            Phase 2: Search for follow-up questions from the learnings (then STOP)
            Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`,
          },
        ],
        {
          experimental_output: z.object({
            queries: z.array(z.string()),
            searchResults: z.array(
              z.object({
                title: z.string(),
                url: z.string(),
                relevance: z.string().optional(),
                content: z.string(),
              }),
            ),
            learnings: z.array(
              z.object({
                learning: z.string(),
                followUpQuestions: z.array(z.string()),
                source: z.string(),
              }),
            ),
            completedQueries: z.array(z.string()),
            phase: z.string().optional(),
          }),
        },
      );

      if (!result.object) {
        logger.warn(`researchAgent.generate did not return an object for query: ${query}`);
        return {
          searchResults: [],
          learnings: [],
          completedQueries: [],
        };
      }

      logger.info(`Web research completed for query: ${query}`);
      return {
        searchResults: result.object.searchResults,
        learnings: result.object.learnings,
        completedQueries: result.object.completedQueries,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error && (error.stack !== null) ? error.stack : undefined;
      logger.error('Error in conductWebResearchStep', { error: errMsg, stack: errStack });
      return {
        searchResults: [],
        learnings: [],
        completedQueries: [],
      };
    }
  },
});

// --- Step 3: Evaluate and Extract Learnings from a single search result ---
const evaluateAndExtractStep = createStep({
  id: 'evaluate-and-extract',
  inputSchema: z.object({
    query: z.string(),
    searchResult: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    }),
  }),
  outputSchema: z.object({
    isRelevant: z.boolean(),
    reason: z.string(),
    learning: z.string().optional(),
    followUpQuestions: z.array(z.string()).optional(),
    processedUrl: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { query, searchResult } = inputData;
    logger.info(`Evaluating and extracting from search result: ${searchResult.url}`);

    try {
      const evaluationResult = await evaluationAgent.generate(
        [
          {
            role: 'user',
            content: `Evaluate whether this search result is relevant to the query: "${query}".
            Search result: Title: ${searchResult.title}, URL: ${searchResult.url}, Content snippet: ${searchResult.content.substring(0, 500)}...
            Respond with JSON { isRelevant: boolean, reason: string }`,
          },
        ],
        {
          experimental_output: z.object({
            isRelevant: z.boolean(),
            reason: z.string(),
          }),
        },
      );

      if (!evaluationResult.object) {
        logger.warn(`evaluationAgent.generate did not return an object for search result: ${searchResult.url}`);
        return {
          isRelevant: false,
          reason: 'Evaluation agent did not return a valid object.',
          processedUrl: searchResult.url,
        };
      }

      if (!evaluationResult.object.isRelevant) {
        logger.info(`Search result not relevant: ${searchResult.url}`);
        return {
          isRelevant: false,
          reason: evaluationResult.object.reason,
          processedUrl: searchResult.url,
        };
      }

      const extractionResult = await learningExtractionAgent.generate(
        [
          {
            role: 'user',
            content: `The user is researching "${query}". Extract a key learning and generate up to 1 follow-up question from this search result:
            Title: ${searchResult.title}, URL: ${searchResult.url}, Content: ${searchResult.content.substring(0, 1500)}...
            Respond with JSON { learning: string, followUpQuestions: string[] }`,
          },
        ],
        {
          experimental_output: z.object({
            learning: z.string(),
            followUpQuestions: z.array(z.string()).max(1),
          }),
        },
      );

      if (!extractionResult.object) {
        logger.warn(`learningExtractionAgent.generate did not return an object for search result: ${searchResult.url}`);
        return {
          isRelevant: true,
          reason: 'Extraction agent did not return a valid object.',
          learning: undefined,
          followUpQuestions: undefined,
          processedUrl: searchResult.url,
        };
      }

      logger.info(`Extracted learning from: ${searchResult.url}`);
      return {
        isRelevant: true,
        reason: evaluationResult.object.reason,
        learning: extractionResult.object.learning,
        followUpQuestions: extractionResult.object.followUpQuestions,
        processedUrl: searchResult.url,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error && (error.stack !== null) ? error.stack : undefined;
      logger.error('Error in evaluateAndExtractStep', { error: errMsg, stack: errStack });
      return {
        isRelevant: false,
        reason: `Error during evaluation or extraction: ${errMsg}`,
        processedUrl: searchResult.url,
      };
    }
  },
});

// --- Step 4: Consolidate Research Data ---
const consolidateResearchDataStep = createStep({
  id: 'consolidate-research-data',
  inputSchema: z.object({
    allLearnings: z.array(z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string(),
    })),
    allRelevantContent: z.array(z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    })),
    originalQuery: z.string(),
  }),
  outputSchema: z.object({
    consolidatedText: z.string(),
    allFollowUpQuestions: z.array(z.string()),
    originalQuery: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { allLearnings, allRelevantContent, originalQuery } = inputData;
    logger.info('Consolidating research data.');

    const combinedLearnings = allLearnings.map(l => l.learning).join('\n\n');
    const combinedContent = allRelevantContent.map(c => `Title: ${c.title}\nURL: ${c.url}\nContent: ${c.content}`).join('\n\n---\n\n');
    const allFollowUpQuestions = allLearnings.flatMap(l => l.followUpQuestions);

    const consolidatedText = `Original Query: ${originalQuery}\n\nLearnings:\n${combinedLearnings}\n\nRelevant Content:\n${combinedContent}`;

    logger.info('Research data consolidated.');
    return {
      consolidatedText,
      allFollowUpQuestions,
      originalQuery,
    };
  },
});

// --- Step 5: Process with RAG and Retrieve ---
const processAndRetrieveStep = createStep({
  id: 'process-and-retrieve',
  inputSchema: z.object({
    consolidatedText: z.string(),
    originalQuery: z.string(),
  }),
  outputSchema: z.object({
    refinedContext: z.string(),
  }),
  execute: async ({ inputData, runtimeContext, tracingContext }) => {
    const { consolidatedText, originalQuery } = inputData;
    logger.info('Starting RAG processing and retrieval.');

    try {
      const chunkingResult = await ragAgent.tools.graphRAGUpsertTool.execute({
        input: {
          document: {
            text: consolidatedText,
            type: 'text',
            metadata: {},
          },
          indexName: 'comprehensive_research_data',
          createIndex: true,
          vectorProfile: 'libsql',
        },
        context: {
          document: {
            text: '',
            type: 'text',
            metadata: {},
          },
          indexName: '',
          createIndex: false,
          vectorProfile: 'libsql'
        },
        runtimeContext,
        tracingContext,
      });

      logger.info(`Chunked and upserted ${chunkingResult.chunkIds.length} chunks to comprehensive_research_data index.`);

      const rerankedResults = await ragAgent.tools.graphRAGQueryTool.execute({
        input: {
          query: originalQuery,
          topK: 10,
          threshold: 0.5,
          indexName: 'comprehensive_research_data',
          vectorProfile: 'libsql',
          includeVector: false,
          minScore: 0.0,
        },
        context: {
          query: '',
          topK: 0,
          threshold: 0,
          indexName: '',
          vectorProfile: 'libsql',
          includeVector: false,
          minScore: 0
        },
        runtimeContext,
        tracingContext,
      });

      const refinedContext = rerankedResults.sources.map(s => s.content).join('\n\n');

      logger.info('RAG processing and retrieval complete.');
      return {
        refinedContext,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error && (error.stack !== null) ? error.stack : undefined;
      logger.error('Error in processAndRetrieveStep:', { error: errMsg, stack: errStack });
      return {
        refinedContext: `Error during RAG processing: ${errMsg}`,
      };
    }
  },
});

// --- Step 6: Synthesize Final Content ---
const synthesizeFinalContentStep = createStep({
  id: 'synthesize-final-content',
  inputSchema: z.object({
    refinedContext: z.string(),
    originalQuery: z.string(),
  }),
  outputSchema: z.object({
    finalSynthesizedContent: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { refinedContext, originalQuery } = inputData;
    logger.info('Synthesizing final content.');

    try {
      const summaryResponse = await webSummarizationAgent.generate([
        {
          role: 'user',
          content: `Synthesize the following refined context into a comprehensive and coherent summary, directly addressing the original query: "${originalQuery}".
          Refined Context: ${refinedContext}`,
        },
      ]);
      logger.info('Final content synthesized.');
      return {
        finalSynthesizedContent: summaryResponse.text,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error && (error.stack !== null) ? error.stack : undefined;
      logger.error('Error in synthesizeFinalContentStep:', { error: errMsg, stack: errStack });
      return {
        finalSynthesizedContent: `Error during content synthesis: ${errMsg}`,
      };
    }
  },
});

// --- Step 7: Generate Final Report ---
const generateFinalReportStep = createStep({
  id: 'generate-final-report',
  inputSchema: z.object({
    finalSynthesizedContent: z.string(),
    originalQuery: z.string(),
  }),
  outputSchema: z.object({
    report: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { finalSynthesizedContent, originalQuery } = inputData;
    logger.info('Generating final report.');

    try {
      const report = await reportAgent.generate([
        {
          role: 'user',
          content: `Generate a comprehensive report based on the following synthesized content, addressing the original research query: "${originalQuery}".
          Content: ${finalSynthesizedContent}`,
        },
      ]);
      logger.info('Final report generated.');
      return { report: report.text };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return { report: `Error generating report: ${errMsg}` };
    }
  },
});

// --- Step 8: Report Approval (Human-in-the-Loop) ---
const reportApprovalStep = createStep({
  id: 'report-approval',
  inputSchema: z.object({
    report: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    finalReport: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
  }),
  suspendSchema: z.object({
    message: z.string(),
    reportPreview: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { report } = inputData;
    const { approved } = resumeData ?? {};

    if (approved === undefined) {
      logger.info('Suspending for report approval.');
      await suspend({
        message: 'Review the generated report. Do you approve it? (true/false)',
        reportPreview: report.substring(0, 1000) + '...',
      });
      return { approved: false, finalReport: report };
    }

    logger.info(`Report approval received: ${approved}`);
    return {
      approved,
      finalReport: report,
    };
  },
});

// --- Nested Iterative Research Loop Workflow ---
let _currentIterationCount: number;
const iterativeResearchLoopWorkflow = createWorkflow({
  id: 'iterative-research-loop',
  inputSchema: z.object({
    query: z.string(),
    iterationCount: z.number().optional(),
    allLearnings: z.array(z.any()).optional(),
    allRelevantContent: z.array(z.any()).optional(),
    currentFollowUpQuestions: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    allLearnings: z.array(z.any()),
    allRelevantContent: z.array(z.any()),
    newFollowUpQuestions: z.array(z.string()),
    iterationCount: z.number(),
  }),
  steps: [conductWebResearchStep, evaluateAndExtractStep],
})
  .map(async ({ inputData }) => {
    const { query, iterationCount = 0, allLearnings = [], allRelevantContent = [], currentFollowUpQuestions = [] } = inputData;
    const newIterationCount = iterationCount + 1;
    _currentIterationCount = newIterationCount;

    const researchQuery = newIterationCount > 1 && currentFollowUpQuestions.length > 0
      ? currentFollowUpQuestions.join(' OR ')
      : query;

    logger.info(`Starting iterative research iteration ${newIterationCount} with query: ${researchQuery}`);

    return {
      query: researchQuery,
      allLearnings,
      allRelevantContent,
      iterationCount: newIterationCount,
      currentFollowUpQuestions,
    };
  })
  .then(conductWebResearchStep)
  .map(async ({ inputData }) => {
    return inputData.searchResults;
  })
  .foreach(evaluateAndExtractStep, { concurrency: 1 })
  .map(async ({ getStepResult }) => {
    const iterationLearnings: ReadonlyArray<{ learning: string; followUpQuestions: string[]; source: string }> =
      getStepResult(conductWebResearchStep).learnings;
    const iterationSearchResults: ReadonlyArray<{ title?: string; url?: string; content?: string }> =
      getStepResult(conductWebResearchStep).searchResults;

    const _rawEvaluateResults = getStepResult(evaluateAndExtractStep);
    interface EvaluateResultType {
      isRelevant: boolean;
      reason?: string;
      learning?: string;
      followUpQuestions?: string[];
      processedUrl?: string;
    }
    const evaluateResults: EvaluateResultType[] = (Array.isArray(_rawEvaluateResults) ? _rawEvaluateResults : [_rawEvaluateResults]) as EvaluateResultType[];

    const relevantLearnings: Array<{ learning: string; followUpQuestions: string[]; source: string }> = [];
    const relevantContent: Array<{ title: string; url: string; content: string }> = [];
    const newFollowUpQuestions: string[] = [];

    for (const evalResult of evaluateResults) {
      const processedUrl = typeof evalResult.processedUrl === 'string' ? evalResult.processedUrl.trim() : '';
      if (evalResult.isRelevant && processedUrl !== '') {
        const originalSearchResult = iterationSearchResults.find(sr => sr.url === processedUrl);
        const hasValidTitle = typeof originalSearchResult?.title === 'string' && originalSearchResult.title.trim() !== '';
        const hasValidUrl = typeof originalSearchResult?.url === 'string' && originalSearchResult.url.trim() !== '';
        const hasValidContent = typeof originalSearchResult?.content === 'string' && originalSearchResult.content.trim() !== '';

        if (hasValidTitle && hasValidUrl && hasValidContent) {
          const sr = originalSearchResult as { title: string; url: string; content: string };
          relevantContent.push({
            title: sr.title,
            url: sr.url,
            content: sr.content,
          });
        }

        const originalLearning = iterationLearnings.find(l => l.source === processedUrl);
        if (originalLearning) {
          relevantLearnings.push(originalLearning);
          newFollowUpQuestions.push(...(originalLearning.followUpQuestions ?? []));
        }
      }
    }

    return {
      allLearnings: relevantLearnings,
      allRelevantContent: relevantContent,
      newFollowUpQuestions,
      iterationCount: _currentIterationCount,
    };
  })
  .commit();

// --- Comprehensive Research Workflow Definition ---
export const comprehensiveResearchWorkflow = createWorkflow({
  id: 'comprehensive-research-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    finalReport: z.string(),
    approved: z.boolean(),
  }),
  steps: [
    getUserQueryStep,
    iterativeResearchLoopWorkflow,
    consolidateResearchDataStep,
    processAndRetrieveStep,
    synthesizeFinalContentStep,
    generateFinalReportStep,
    reportApprovalStep,
  ],
});

// --- Workflow Control Flow ---
comprehensiveResearchWorkflow
  .then(getUserQueryStep)
  .dowhile(
    iterativeResearchLoopWorkflow,
    async ({ inputData }) => {
      const MAX_ITERATIONS = 7;
      const hasNewFollowUpQuestions = Array.isArray(inputData.newFollowUpQuestions) && inputData.newFollowUpQuestions.length > 0;
      const notMaxIterations = inputData.iterationCount < MAX_ITERATIONS;

      logger.debug(`Loop condition check: hasNewFollowUpQuestions=${hasNewFollowUpQuestions}, notMaxIterations=${notMaxIterations}`);
      return hasNewFollowUpQuestions && notMaxIterations;
    }
  )
  .map(async ({ getStepResult }) => {
    const overallLearnings = getStepResult(iterativeResearchLoopWorkflow as any).allLearnings;
    const overallRelevantContent = getStepResult(iterativeResearchLoopWorkflow as any).allRelevantContent;
    const originalQuery = (getStepResult(getUserQueryStep as any) as { query: string }).query;

    return {
      allLearnings: overallLearnings,
      allRelevantContent: overallRelevantContent,
      originalQuery,
    };
  })
  .then(consolidateResearchDataStep)
  .map(async ({ inputData }) => {
    const { consolidatedText, originalQuery } = inputData;
    return {
      consolidatedText,
      originalQuery,
    };
  })
  .then(processAndRetrieveStep)
  .map(async ({ inputData, getStepResult }) => {
    const { refinedContext } = inputData;
    const originalQuery = (getStepResult(getUserQueryStep as any) as { query: string }).query;
    return {
      refinedContext,
      originalQuery,
    };
  })
  .then(synthesizeFinalContentStep)
  .map(async ({ inputData, getStepResult }) => {
    const { finalSynthesizedContent } = inputData;
    const originalQuery = (getStepResult(getUserQueryStep as any) as { query: string }).query;
    return {
      finalSynthesizedContent,
      originalQuery,
    };
  })
  .then(generateFinalReportStep)
  .map(async ({ inputData }) => {
    const { report } = inputData;
    return {
      report,
    };
  })
  .then(reportApprovalStep)
  .commit();
