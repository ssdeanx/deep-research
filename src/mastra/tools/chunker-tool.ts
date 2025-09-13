/* eslint-disable tsdoc/syntax */
/**
 * Chunker Tool - Production-ready implementation for Dean Machines RSC
 *
 * This module provides a comprehensive document chunking tool supporting multiple formats (text, HTML, Markdown, JSON, LaTeX, CSV, XML)
 * with configurable strategies and runtime context integration. It integrates with LibSQL for vector storage.
 *
 * Key Features:
 * - Multiple document types: text, HTML, markdown, JSON, LaTeX, CSV, XML
 * - Multiple chunking strategies: recursive, sentence, paragraph, fixed, semantic
 * - ExtractParams support for metadata extraction (title, summary, keywords, questions)
 * - LibSQL Vector integration with Gemini embeddings (1536 dimensions)
 * - Runtime context support for dynamic configuration
 * - Comprehensive error handling and logging
 *
 * @author dm-mastra-training
 * @version 2.0.0
 */
import { createTool } from '@mastra/core/tools';
import { MDocument } from '@mastra/rag';
import { z } from 'zod';
import { generateId } from 'ai';
import { PinoLogger } from '@mastra/loggers';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { AISpanType } from '@mastra/core/ai-tracing';
import {
  upsertVectors,
  extractChunkMetadata,
  type ExtractParams,
  STORAGE_CONFIG // Import STORAGE_CONFIG
} from '../config/libsql-storage';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ name: 'ChunkerTool', level: 'info' });

/**
 * Comprehensive Zod schemas for document chunking validation
 */
const chunkingStrategySchema = z.enum(['recursive', 'sentence', 'paragraph', 'fixed', 'semantic']).describe('Strategy for chunking documents');

const chunkParamsSchema = z.object({
  strategy: chunkingStrategySchema.default('recursive').describe('The chunking strategy to use'),
  size: z.number().int().positive().default(512).describe('Target size of each chunk in tokens/characters'),
  overlap: z.number().int().min(0).default(50).describe('Number of overlapping tokens/characters between chunks'),
  separator: z.string().default('\n').describe('Character(s) to use as chunk separator'),
  preserveStructure: z.boolean().default(true).describe('Whether to preserve document structure (headings, paragraphs)'),
  minChunkSize: z.number().int().positive().default(100).describe('Minimum size for a valid chunk'),
  maxChunkSize: z.number().int().positive().default(2048).describe('Maximum size for a chunk before forced splitting')
}).strict();

const documentTypeSchema = z.enum(['text', 'html', 'markdown', 'json', 'latex', 'csv', 'xml']).describe('Type of document content');

const documentMetadataSchema = z.record(z.string(), z.any()).describe('Chunk metadata including position, type, etc.');

const documentInputSchema = z.object({
  content: z.string().min(1).describe('The document content to process'),
  type: documentTypeSchema.default('text').describe('Type of document content'),
  title: z.string().optional().describe('Optional document title'),
  source: z.string().optional().describe('Source URL or file path'),
  metadata: documentMetadataSchema.optional()
}).strict();

const chunkerInputSchema = z.object({
  document: documentInputSchema,
  chunkParams: chunkParamsSchema.optional().describe('Parameters for document chunking'),
  outputFormat: z.enum(['simple', 'detailed', 'embeddings']).default('detailed').describe('Format of output chunks'),
  includeStats: z.boolean().default(true).describe('Whether to include chunking statistics'),
  vectorOptions: z.object({
    createEmbeddings: z.boolean().default(false).describe('Whether to create embeddings for chunks'),
    upsertToVector: z.boolean().default(false).describe('Whether to upsert chunks to LibSQL vector store'),
    indexName: z.string().default(STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS).describe('Vector index name for upserting'),
    createIndex: z.boolean().default(true).describe('Whether to create the vector index if it does not exist'),
  }).optional().describe('Vector store integration options'),
  extractParams: z.object({
    title: z.union([z.boolean(), z.object({
      nodes: z.number().optional(),
      nodeTemplate: z.string().optional(),
      combineTemplate: z.string().optional()
    })]).optional().describe('Extract document titles'),
    summary: z.union([z.boolean(), z.object({
      summaries: z.array(z.enum(['self', 'prev', 'next'])).optional(),
      promptTemplate: z.string().optional()
    })]).optional().describe('Extract section summaries'),
    keywords: z.union([z.boolean(), z.object({
      keywords: z.number().optional(),
      promptTemplate: z.string().optional()
    })]).optional().describe('Extract keywords from chunks'),
    questions: z.union([z.boolean(), z.object({
      questions: z.number().optional(),
      promptTemplate: z.string().optional(),
      embeddingOnly: z.boolean().optional()
    })]).optional().describe('Extract questions that chunks can answer')
  }).optional().describe('Metadata extraction parameters following Mastra ExtractParams patterns')
}).strict();

const chunkSchema = z.object({
  id: z.string().describe('Unique chunk identifier'),
  content: z.string().describe('Chunk text content'),
  index: z.number().int().min(0).describe('Position index in the document'),
  size: z.number().int().min(0).describe('Size of the chunk in characters'),
  metadata: z.record(z.string(), z.any()).describe('Chunk metadata including position, type, etc.'),
  source: z.string().optional().describe('Source document identifier'),
  tokens: z.number().int().min(0).optional().describe('Estimated token count'),
  embedding: z.array(z.number()).optional().describe('Vector embedding for the chunk (384 dimensions)'),
  vectorId: z.string().optional().describe('Vector store ID if upserted to Pinecone')
}).strict();

const chunkingStatsSchema = z.object({
  totalChunks: z.number().int().min(0).describe('Total number of chunks created'),
  avgChunkSize: z.number().min(0).describe('Average chunk size in characters'),
  minChunkSize: z.number().min(0).describe('Smallest chunk size'),
  maxChunkSize: z.number().min(0).describe('Largest chunk size'),
  strategy: z.string().describe('Chunking strategy used'),
  processingTime: z.number().min(0).describe('Time taken to chunk the document in milliseconds'),
  overlap: z.number().min(0).describe('Overlap between chunks'),
  contentCoverage: z.number().min(0).max(1).describe('Percentage of original content preserved')
}).strict();

const chunkerOutputSchema = z.object({
  chunks: z.array(chunkSchema).describe('Array of document chunks with their content and metadata'),
  stats: chunkingStatsSchema.describe('Statistics about the chunking process'),
  originalLength: z.number().int().min(0).describe('Length of original document in characters'),
  totalProcessed: z.number().int().min(0).describe('Total characters processed across all chunks'),
  vectorStats: z.object({
    embeddingsCreated: z.number().int().min(0).describe('Number of embeddings created'),
    vectorsUpserted: z.number().int().min(0).describe('Number of vectors upserted to store'),
    indexName: z.string().optional().describe('Vector index used'),
    embeddingDimension: z.number().int().optional().describe('Embedding vector dimension'),
    vectorProcessingTime: z.number().min(0).optional().describe('Time taken for vector operations in milliseconds')
  }).optional().describe('Vector processing statistics')
}).strict();

/**
 * Runtime context type for the chunker tool
 */
export interface ChunkerToolRuntimeContext {
  'user-id': string;
  'session-id': string;
  'chunk-strategy': 'recursive' | 'sentence' | 'paragraph' | 'fixed' | 'semantic';
  'chunk-size': number;
  'chunk-overlap': number;
  'preserve-structure': boolean;
  'include-metadata': boolean;
  'processing-priority': 'speed' | 'quality' | 'balanced';
  'cache-chunks': boolean;
  'max-processing-time': number;
}

/**
 * Comprehensive document chunker tool supporting multiple formats and strategies
 * Integrates with upstashMemory.ts for optimal processing and vector storage
 *
 * Features:
 * - Multiple document types: text, HTML, markdown, JSON, LaTeX, CSV, XML
 * - Multiple chunking strategies: recursive, sentence, paragraph, fixed, semantic
 * - ExtractParams support for metadata extraction (title, summary, keywords, questions)
 * - LibSQL Vector integration with Gemini embeddings (1536 dimensions)
 * - Runtime context support for dynamic configuration
 * - Comprehensive error handling and logging
 *
 * @param input - Document and chunking configuration
 * @param input.document - Document content and metadata
 * @param input.chunkParams - Chunking strategy and parameters
 * @param input.extractParams - Metadata extraction configuration (Mastra ExtractParams)
 * @param input.vectorOptions - Vector store integration options
 * @param runtimeContext - Dynamic runtime configuration
 * @returns Promise resolving to chunked document with statistics and vector data
 *
 * @example
 * ```typescript
 * const result = await chunkerTool.execute({
 *   input: {
 *     document: {
 *       content: 'Long document text...',
 *       type: 'markdown',
 *       title: 'My Document'
 *     },
 *     chunkParams: {
 *       strategy: 'recursive',
 *       size: 1024,
 *       overlap: 100
 *     },
 *     extractParams: {
 *       title: true,
 *       summary: { summaries: ['self'] },
 *       keywords: { keywords: 5 }
 *     },
 *     vectorOptions: {
 *       createEmbeddings: true,
 *       upsertToVector: true,
 *       indexName: 'documents'
 *     }
 *   },
 *   runtimeContext
 * });
 * ```
 *
 * @see {@link https://maistra.ai/en/examples/rag/chunking | Maistra Chunking Documentation}
 * @see {@link https://maistra.ai/en/reference/rag/extract-params | ExtractParams Reference}
 *
 * @version 2.0.0
 * @author Dean Machines RSC Project
 * @date 2025-06-21
 */
export const chunkerTool = createTool({
  id: 'comprehensive_chunker',
  description: 'Advanced document chunking tool supporting multiple formats (text, HTML, Markdown, JSON, LaTeX, CSV, XML) with configurable strategies and runtime context integration',
  inputSchema: chunkerInputSchema,
  outputSchema: chunkerOutputSchema,
  execute: async ({ context, runtimeContext, tracingContext }) => {
    const startTime = Date.now();

    try {
      // Validate input against schema
      const validatedInput = chunkerInputSchema.parse(context);
      logger.info('Document chunker input validated', {
        documentType: validatedInput.document.type,
        strategy: validatedInput.chunkParams?.strategy ?? 'recursive'
      });
      // Get runtime context values with defaults
      const contextChunkSize = Number(runtimeContext?.get('chunk-size') ?? validatedInput.chunkParams?.size ?? 512);
      const contextOverlap = Number(runtimeContext?.get('chunk-overlap') ?? validatedInput.chunkParams?.overlap ?? 50);
      // Resolve strategy with runtime override and validate allowed values
      const rawStrategy = runtimeContext?.get('chunk-strategy');
      const allowedStrategies = ['recursive', 'sentence', 'paragraph', 'fixed', 'semantic'] as const;
      let contextStrategy: ChunkConfig['strategy'] = validatedInput.chunkParams?.strategy ?? 'recursive';
      if (typeof rawStrategy === 'string' && (allowedStrategies as readonly string[]).includes(rawStrategy)) {
        contextStrategy = rawStrategy as ChunkConfig['strategy'];
      }
      const preserveStructure = Boolean(runtimeContext?.get('preserve-structure') ?? validatedInput.chunkParams?.preserveStructure ?? true);
      const includeMetadata = Boolean(runtimeContext?.get('include-metadata') ?? true);
      // Get the embedder - always use gemini profile as it's the only one
      const embedder = google.textEmbedding('gemini-embedding-001');
      // Create MDocument based on document type
      let doc: MDocument;
      const { content, type, title, source, metadata } = validatedInput.document;

      switch (type) {
        case 'html':
          doc = MDocument.fromHTML(content, { title, source, ...metadata });
          break;
        case 'markdown':
          doc = MDocument.fromMarkdown(content, { title, source, ...metadata });
          break;
        case 'json':
          doc = MDocument.fromJSON(content, { title, source, ...metadata });
          break;
        case 'latex': {
          // For LaTeX, treat as text with special preprocessing
          const preprocessedLatex = preprocessLatex(content);
          doc = MDocument.fromText(preprocessedLatex, { title, source, type: 'latex', ...metadata });
          break;
        }
        case 'csv': {
          // Convert CSV to structured text format
          const csvText = preprocessCSV(content);
          doc = MDocument.fromText(csvText, { title, source, type: 'csv', ...metadata });
          break;
        }
        case 'xml': {
          // Convert XML to readable text format
          const xmlText = preprocessXML(content);
          doc = MDocument.fromText(xmlText, { title, source, type: 'xml', ...metadata });
          break;
        }
        case 'text':
        default:
          doc = MDocument.fromText(content, { title, source, ...metadata });
          break;
      }      // Configure chunking parameters
      const chunkConfig: ChunkConfig = {
        strategy: contextStrategy,
        size: contextChunkSize,
        overlap: contextOverlap,
        preserveStructure,
        minChunkSize: validatedInput.chunkParams?.minChunkSize ?? 100,
        maxChunkSize: validatedInput.chunkParams?.maxChunkSize ?? 2048,
        separator: validatedInput.chunkParams?.separator ?? getDefaultSeparator(type)
      };// Perform chunking based on strategy
      let rawChunks: Array<{ content?: string; text?: string; pageContent?: string; metadata?: Record<string, unknown> }>;
      switch (chunkConfig.strategy) {
        case 'recursive':
          rawChunks = await doc.chunk({
            size: chunkConfig.size,
            overlap: chunkConfig.overlap
          });
          break;
        case 'sentence':
          rawChunks = await chunkBySentence(content, chunkConfig);
          break;
        case 'paragraph':
          rawChunks = await chunkByParagraph(content, chunkConfig);
          break;
        case 'fixed':
          rawChunks = await chunkFixed(content, chunkConfig);
          break;
        case 'semantic':
          rawChunks = await chunkSemantic(content, chunkConfig);
          break;
        default:
          rawChunks = await doc.chunk({
            size: chunkConfig.size,
            overlap: chunkConfig.overlap
          });
      }

      // Transform chunks to match our schema
      const chunks: Array<{
        id: string;
        content: string;
        index: number;
        size: number;
        metadata: Record<string, unknown>;
        source: string;
        tokens: number;
        embedding?: number[];
        vectorId?: string;
      }> = rawChunks.map((chunk: { content?: string; text?: string; pageContent?: string; metadata?: Record<string, unknown> }, index: number) => {
        const chunkContent = (chunk.content ?? chunk.text) ?? chunk.pageContent ?? '';
        const chunkId = generateId();

        return {
          id: chunkId,
          content: chunkContent,
          index,
          size: chunkContent.length,
          metadata: {
            ...chunk.metadata,
            chunkIndex: index,
            strategy: chunkConfig.strategy,
            originalType: type,
            title: title ?? 'Unknown',
            source: source ?? 'Direct input',
            ...(includeMetadata && metadata)
          },
          source: source ?? title ?? `chunk-${chunkId}`,
          tokens: estimateTokenCount(chunkContent)
        };
      });

      // Metadata extraction if requested (following Mastra ExtractParams patterns)
      if (validatedInput.extractParams) {
        logger.info('Starting metadata extraction for chunks', {
          chunkCount: chunks.length,
          extractParams: Object.keys(validatedInput.extractParams)
        });

        const enhancedChunks = extractChunkMetadata(
          chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            metadata: chunk.metadata
          })),
          validatedInput.extractParams as ExtractParams
        );

        // Update chunks with extracted metadata
        enhancedChunks.forEach((enhanced, index) => {
          if (chunks[index]) {
            // Defensive: Only merge plain object keys to prevent prototype pollution
            const safeEnhancedMetadata: Record<string, unknown> = {};
            if (enhanced && typeof enhanced.metadata === "object" && enhanced.metadata !== null) {
              for (const key of Object.keys(enhanced.metadata)) {
                if (
                  typeof key === "string" &&
                  !Object.hasOwn(Object.prototype, key)
                ) {
                  safeEnhancedMetadata[key] = enhanced.metadata[key];
                }
              }
            }
            chunks[index].metadata = { ...chunks[index].metadata, ...safeEnhancedMetadata };
          }
        });

        logger.info('Metadata extraction completed', {
          chunkCount: chunks.length,
          extractedFields: Object.keys(validatedInput.extractParams)
        });
      }

      // Vector processing if requested
      let vectorStats;
      const vectorStartTime = Date.now();

      if (validatedInput.vectorOptions?.createEmbeddings || validatedInput.vectorOptions?.upsertToVector) {
        // Conditional tracing span for vector processing if tracing is enabled
        interface TracingChildSpanOptions {
          type: AISpanType;
          name: string;
          input?: Record<string, unknown>;
        }
        const vectorProcessingSpan = tracingContext?.currentSpan ? tracingContext.currentSpan.createChildSpan({
          type: AISpanType.GENERIC,
          name: 'vector_processing',
          input: {
            createEmbeddings: validatedInput.vectorOptions?.createEmbeddings,
            upsertToVector: validatedInput.vectorOptions?.upsertToVector,
            chunkCount: chunks.length
          }
        } as TracingChildSpanOptions) : undefined;
        logger.info('Starting vector processing for chunks', {
          createEmbeddings: validatedInput.vectorOptions?.createEmbeddings,
          upsertToVector: validatedInput.vectorOptions?.upsertToVector,
          indexName: validatedInput.vectorOptions?.indexName,
        });

        // Create embeddings for chunks using the selected embedder
        const chunkTexts = chunks.map(chunk => chunk.content);
        const { embeddings } = await embedMany({
          model: embedder,
          values: chunkTexts
        });

        // Add embeddings to chunks
        chunks.forEach((chunk, index) => {
          chunk.embedding = embeddings[index];
        });

        let vectorsUpserted = 0;
        // Upsert to vector store if requested
        if (validatedInput.vectorOptions?.upsertToVector) {
          let indexName = validatedInput.vectorOptions.indexName || STORAGE_CONFIG.VECTOR_INDEXES.RESEARCH_DOCUMENTS;
          // Conditional for report context
          if (runtimeContext?.get('useReport') || validatedInput.document.metadata?.useReport) {
            indexName = STORAGE_CONFIG.VECTOR_INDEXES.REPORTS;
          }
          logger.info('Upserting to vector store', {
            indexName,
            profileIndexName: indexName
          });
          // Prepare metadata for vector store
          const vectorMetadata = chunks.map((chunk, index) => ({
            id: chunk.id,
            text: chunk.content,
            ...chunk.metadata,
            chunkIndex: index,
            totalChunks: chunks.length,
            documentType: type,
            strategy: chunkConfig.strategy,
          }));

          // Upsert vectors using the helper function from upstashMemory.ts
          const upsertResult = await upsertVectors(
            indexName,
            embeddings,
            vectorMetadata,
            chunks.map(chunk => chunk.id)
          );

          if (upsertResult.success) {
            vectorsUpserted = upsertResult.count ?? 0;
            // Add vector IDs to chunks
            chunks.forEach((chunk) => {
              chunk.vectorId = chunk.id; // Vector ID is same as chunk ID
            });
          } else {
            logger.error('Failed to upsert vectors during chunking', {
              indexName,
              error: upsertResult.error
            });
          }
        }

        // End tracing span if enabled
        if (vectorProcessingSpan) {
          vectorProcessingSpan.end({
            output: {
              embeddingsCreated: embeddings.length,
              vectorsUpserted,
              processingTime: Date.now() - vectorStartTime
            },
            metadata: {
              operation: 'vector_processing'
            }
          });
        }

        vectorStats = {
          embeddingsCreated: embeddings.length,
          vectorsUpserted,
          indexName: validatedInput.vectorOptions?.indexName,
          embeddingDimension: STORAGE_CONFIG.DEFAULT_DIMENSION, // Use STORAGE_CONFIG.DEFAULT_DIMENSION
          vectorProcessingTime: Date.now() - vectorStartTime
        };

        logger.info('Vector processing completed', vectorStats);
      }

      const processingTime = Date.now() - startTime;
      const originalLength = content.length;
      const totalProcessed = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

      // Calculate statistics
      const chunkSizes = chunks.map(c => c.size);
      const stats = {
        totalChunks: chunks.length,
        avgChunkSize: chunks.length > 0 ? totalProcessed / chunks.length : 0,
        minChunkSize: chunks.length > 0 ? Math.min(...chunkSizes) : 0,
        maxChunkSize: chunks.length > 0 ? Math.max(...chunkSizes) : 0,
        strategy: chunkConfig.strategy,
        processingTime,
        overlap: chunkConfig.overlap,
        contentCoverage: originalLength > 0 ? Math.min(totalProcessed / originalLength, 1) : 0
      };

      const result = {
        chunks,
        stats,
        originalLength,
        totalProcessed,
        vectorStats
      };

      logger.info('Document chunking completed successfully', {
        totalChunks: result.chunks.length,
        strategy: chunkConfig.strategy,
        processingTime: result.stats.processingTime,
        avgChunkSize: result.stats.avgChunkSize
      });

      // Validate output
      return chunkerOutputSchema.parse(result);

    } catch (error) {      logger.error('Document chunking failed', {
        error: error instanceof Error ? error.message : String(error),
        context
      });
      throw new Error(`Document chunking failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * Configuration type for chunking operations
 */
interface ChunkConfig {
  strategy: 'recursive' | 'sentence' | 'paragraph' | 'fixed' | 'semantic';
  size: number;
  overlap: number;
  preserveStructure: boolean;
  minChunkSize: number;
  maxChunkSize: number;
  separator: string;
}

/**
 * Raw chunk interface for internal processing
 */
interface RawChunk {
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Preprocessors for different document types
 */
function preprocessLatex(content: string): string {
  // Remove LaTeX commands and keep readable text
  return content
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '') // Remove commands with braces
    .replace(/\\[a-zA-Z]+/g, '') // Remove simple commands
    .replace(/\$[^$]*\$/g, '[MATH]') // Replace inline math
    .replace(/\$\$[^$]*\$\$/g, '[MATH_BLOCK]') // Replace block math
    .replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, '[ENVIRONMENT]') // Replace environments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function preprocessCSV(content: string): string {
  try {
    const lines = content.split('\n');
    if (lines.length === 0) {
      return content;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const result = [`Headers: ${headers.join(', ')}\n`];

    for (let i = 1; i < Math.min(lines.length, 100); i++) { // Limit to first 100 rows
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        // Defensive: Only use header if it's a string and not a prototype property
        const row = headers.map((header, idx) => {
          if (
            typeof header === "string" &&
            Object.hasOwn(headers, idx) &&
            !Object.hasOwn(Object.prototype, header)
          ) {
            return `${header}: ${values[idx]}`;
          }
          return "";
        }).filter(Boolean).join(', ');
        result.push(`Row ${i}: ${row}`);
      }
    }
      return result.join('\n');
  } catch {
    return content; // Fallback to original content
  }
}

function preprocessXML(content: string): string {
  // Extract text content from XML while preserving some structure
  return content
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Extract CDATA
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/<[^>]+>/g, ' ') // Remove tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get default separator based on document type
 */
function getDefaultSeparator(type: string): string {
  switch (type) {
    case 'html':
    case 'xml':
      return '</p>';
    case 'markdown':
      return '\n## ';
    case 'json':
      return '}, {';
    case 'csv':
      return '\n';
    case 'latex':
      return '\\section';
    default:
      return '\n\n';
  }
}

/**
 * Alternative chunking strategies
 */
function chunkBySentence(content: string, config: ChunkConfig): Promise<RawChunk[]> {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: RawChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) {
      continue;
    }

    if (currentChunk.length + trimmedSentence.length > config.size && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { strategy: 'sentence', index: chunkIndex++ }
      });
      // Apply overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(config.overlap / 6)); // Rough word estimate
      currentChunk = `${overlapWords.join(' ')} ${trimmedSentence}`;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { strategy: 'sentence', index: chunkIndex }
    });
  }

  return Promise.resolve(chunks);
}

async function chunkByParagraph(content: string, config: ChunkConfig): Promise<RawChunk[]> {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: RawChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) {
      continue;
    }

    if (currentChunk.length + trimmedParagraph.length > config.size && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { strategy: 'paragraph', index: chunkIndex++ }
      });
      currentChunk = trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { strategy: 'paragraph', index: chunkIndex }
    });
  }

  return chunks;
}

async function chunkFixed(content: string, config: ChunkConfig): Promise<RawChunk[]> {
  const chunks: RawChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < content.length; i += config.size - config.overlap) {
    const end = Math.min(i + config.size, content.length);
    const chunkContent = content.substring(i, end);

    if (chunkContent.trim().length >= config.minChunkSize) {
      chunks.push({
        content: chunkContent,
        metadata: {
          strategy: 'fixed',
          index: chunkIndex++,
          startPos: i,
          endPos: end
        }
      });
    }
  }

  return chunks;
}

async function chunkSemantic(content: string, config: ChunkConfig): Promise<RawChunk[]> {
  // Simple semantic chunking based on topic boundaries
  // In a real implementation, this might use embeddings to detect topic changes
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: RawChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    // Defensive: Only use index if it's a valid array index and not a prototype property
    if (!Object.hasOwn(sentences, i)) {
      continue;
    }
    const sentence = sentences[i].trim();
    if (!sentence) {
      continue;
    }

    // Simple heuristic: start new chunk if sentence begins with certain patterns
    const isNewTopic = /^(However|Moreover|Furthermore|In addition|On the other hand|Meanwhile|Therefore|Thus|Consequently|In conclusion)/i.test(sentence);
    // If it's a new topic or exceeds max size, create a new chunk
    if (isNewTopic && currentChunk.length > config.minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { strategy: 'semantic', index: chunkIndex++, topicBoundary: true }
      });
      currentChunk = sentence;
    } else if (currentChunk.length + sentence.length > config.maxChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { strategy: 'semantic', index: chunkIndex++, topicBoundary: false }
      });
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { strategy: 'semantic', index: chunkIndex, topicBoundary: false }
    });
  }

  return chunks;
}

/**
 * Estimate token count for a chunk (rough approximation)
 */
function estimateTokenCount(text: string): number {
  // Rough estimate: 4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Runtime context for chunker tool configuration
 */
export const chunkerRuntimeContext = new RuntimeContext<ChunkerToolRuntimeContext>();

// Set default runtime context values
chunkerRuntimeContext.set('user-id', 'anonymous');
chunkerRuntimeContext.set('session-id', `session-${Date.now()}`);
chunkerRuntimeContext.set('chunk-strategy', 'recursive');
chunkerRuntimeContext.set('chunk-size', 512);
chunkerRuntimeContext.set('chunk-overlap', 50);
chunkerRuntimeContext.set('preserve-structure', true);
chunkerRuntimeContext.set('include-metadata', true);
chunkerRuntimeContext.set('processing-priority', 'balanced');
chunkerRuntimeContext.set('cache-chunks', true);
chunkerRuntimeContext.set('max-processing-time', 30000);

// Generated on 2025-06-16 - Comprehensive document chunking tool with runtime context support
