import { chunkerTool } from './chunker-tool';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { createLibSQLStore, createLibSQLVectorStore } from '../config/libsql-storage';

async function runChunkerTest() {
  const memory = new Memory({
    storage: createLibSQLStore(),
    vector: createLibSQLVectorStore(),
  });

  const runtimeContext = new RuntimeContext();
  runtimeContext.set('user-id', 'test-user');
  runtimeContext.set('session-id', 'test-session');

  try {
    const result = await chunkerTool.execute({
      context: {
        document: {
          content: "This is a test document for chunker tool. It has several sentences and aims to verify basic chunking functionality.",
          type: "text"
        },
        chunkParams: {
          strategy: 'recursive',
          size: 100,
          overlap: 20,
          separator: '\n',
          preserveStructure: true,
          minChunkSize: 100,
          maxChunkSize: 2048
        },
        outputFormat: 'detailed', // Added missing property
        includeStats: true, // Added missing property
        vectorOptions: {
          createEmbeddings: true,
          upsertToVector: true,
          indexName: 'test_documents_chunker',
          createIndex: true,
        },
        extractParams: {
            title: true,
            keywords: true
        }
      },
      runtimeContext: runtimeContext,
      tracingContext: {}, // Provide a dummy empty object for tracingContext
      memory: memory // Pass memory directly to execute method
    });

    console.log("Chunker Tool Test Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.chunks.length > 0 && result.stats.totalChunks > 0) {
      console.log("Chunker Tool functionality verified successfully!");
    } else {
      console.error("Chunker Tool test failed: No chunks generated or stats are invalid.");
    }

  } catch (error) {
    console.error("Error running chunker tool test:", error);
  }
}

runChunkerTest();