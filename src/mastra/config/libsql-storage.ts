import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { createGeminiEmbeddingModel } from "./googleProvider";

/**
 * Complete LibSQL Storage Configuration for Mastra Deep Research Agent
 *
 * This file provides persistent storage and vector search capabilities for:
 * - Workflow snapshots and execution data
 * - Agent memory and conversation threads
 * - Evaluation results and scoring
 * - Vector embeddings for semantic search
 * - Resource working memory
 */

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * LibSQL Storage Configuration
 * Handles all persistent data storage for workflows, agents, and evaluations
 */
export const createLibSQLStore = () => {
  const databaseUrl = process.env.DATABASE_URL || "file:./deep-research.db";

  return new LibSQLStore({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN, // For Turso cloud databases
  });
};

// ============================================================================
// VECTOR STORE CONFIGURATION
// ============================================================================

/**
 * LibSQL Vector Store Configuration
 * Handles vector embeddings and semantic search for research data
 */
export const createLibSQLVectorStore = () => {
  const databaseUrl = process.env.DATABASE_URL || "file:./deep-research.db";

  return new LibSQLVector({
    connectionUrl: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN, // For Turso cloud databases
  });
};

// ============================================================================
// MEMORY CONFIGURATION
// ============================================================================

/**
 * Memory Configuration for Research Agents
 * Provides persistent conversation memory with semantic recall
 */
export const createResearchMemory = () => {
  const storage = createLibSQLStore();
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  return new Memory({
    storage,
    vector: vectorStore,
    embedder,
    options: {
      // Message history configuration
      lastMessages: 50, // Keep last 50 messages for context

      // Semantic recall for research context
      semanticRecall: {
        topK: 5, // Retrieve top 5 similar messages
        messageRange: {
          before: 3, // Include 3 messages before
          after: 2,   // Include 2 messages after
        },
      },

      // Working memory for user context
      workingMemory: {
        enabled: true,
        template: `# User Research Context
- **Research Interests**: Research topics and domains
- **Preferred Sources**: Trusted websites, publications, or platforms
- **Methodology Preferences**: Preferred research approaches or tools
- **Previous Research**: Summary of completed research sessions
- **Follow-up Questions**: Outstanding questions from previous research
- **Knowledge Gaps**: Areas needing further investigation
- **Contact Information**: Professional details for collaboration`,
      },

      // Thread management
      threads: {
        generateTitle: true, // Auto-generate meaningful thread titles
      },

      // Scope configuration for cross-conversation memory
 
    },
  });
};

/**
 * Memory Configuration for Report Generation Agents
 * Optimized for report writing and synthesis tasks
 */
export const createReportMemory = () => {
  const storage = createLibSQLStore();
  const vectorStore = createLibSQLVectorStore();
  const embedder = createGeminiEmbeddingModel("gemini-embedding-001");

  return new Memory({
    storage,
    vector: vectorStore,
    embedder,
    options: {
      lastMessages: 100, // Keep extensive context for report generation
      semanticRecall: {
        topK: 10, // Retrieve more context for comprehensive reports
        messageRange: {
          before: 5,
          after: 3,
        },
      },
      workingMemory: {
        enabled: true,
        template: `# Report Generation Context
- **Report Type**: Research summary, analysis, recommendations, etc.
- **Target Audience**: Who will read this report
- **Key Findings**: Important discoveries from research
- **Structure Preferences**: Preferred report format and sections
- **Citation Style**: Preferred citation format
- **Previous Reports**: Summary of previously generated reports
- **Client Requirements**: Specific requirements or constraints`,
      },
      threads: {
        generateTitle: true,
      },
    },
  });
};

