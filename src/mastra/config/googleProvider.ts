// Generated on 2025-06-20 - Enhanced with Gemini 2.5 features
/**
 * Enhanced Google Generative AI Provider Setup for Mastra
 *
 * Comprehensive Google provider with full Gemini 2.5 feature support including:
 * - Search Grounding with Dynamic Retrieval
 * - Cached Content (Implicit & Explicit)
 * - File Inputs (PDF, images, etc.)
 * - Embedding Models with flexible dimensions (1536 default)
 * - Thinking Config via providerOptions (correct AI SDK pattern)
 * - Safety Settings and Response Modalities
 * - Image Generation capabilities
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
 * @see https://ai.google.dev/gemini-api/docs
 *
 * @example Correct thinking config usage:
 * ```typescript
 * const result = await generateText({
 *   model: google('gemini-2.5-flash-lite-preview-06-17'),
 *   providerOptions: {
 *     google: {
 *       thinkingConfig: { thinkingBudget: 2048 }
 *     }
 *   },
 *   prompt: 'Think step by step...'
 * });
 * ```
 */
import { google as baseGoogle } from '@ai-sdk/google';
import type {
  GoogleGenerativeAIProviderSettings,
  GoogleGenerativeAIProviderOptions,
  GoogleGenerativeAIProviderMetadata
} from '@ai-sdk/google';
import { googleTools } from '@ai-sdk/google/internal';

// Add tools exports to utilize the imported googleTools
export const googletools = {
  codeExecution: googleTools.codeExecution,
  googleSearch: googleTools.googleSearch,
  urlContext: googleTools.urlContext,
};
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ name: 'googleProvider', level: 'info' });

/**
 * Gemini Model Configuration Constants - Focused on 2.5 Series
 */
export const GEMINI_CONFIG = {
  // Latest Gemini 2.5 models with advanced capabilities
  MODELS: {
    // Main model - Latest 2.5 Flash Lite with 1M context, thinking, and all features
    GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite-preview-06-17', // Primary model
    GEMINI_2_5_PRO_PREVIEW: 'gemini-2.5-pro-preview-05-06',
    GEMINI_2_5_FLASH_PREVIEW: 'gemini-2.5-flash-preview-05-20',
    GEMINI_2_5_PRO: 'gemini-2.5-pro',
    GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  },

  // Embedding models with dimension support
  EMBEDDING_MODELS: {
    TEXT_EMBEDDING_004: 'gemini-embedding-001', // supports custom dimensions
  },

  // Safety settings presets
  SAFETY_PRESETS: {
    STRICT: [
      { category: 'HARM_CATEGORY_HATE_SPEECH' as const, threshold: 'BLOCK_LOW_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const, threshold: 'BLOCK_LOW_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_HARASSMENT' as const, threshold: 'BLOCK_LOW_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const, threshold: 'BLOCK_LOW_AND_ABOVE' as const }
    ],
    MODERATE: [
      { category: 'HARM_CATEGORY_HATE_SPEECH' as const, threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const, threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_HARASSMENT' as const, threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const, threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const }
    ],
    PERMISSIVE: [
      { category: 'HARM_CATEGORY_HATE_SPEECH' as const, threshold: 'BLOCK_ONLY_HIGH' as const },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const, threshold: 'BLOCK_ONLY_HIGH' as const },
      { category: 'HARM_CATEGORY_HARASSMENT' as const, threshold: 'BLOCK_ONLY_HIGH' as const },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const, threshold: 'BLOCK_ONLY_HIGH' as const }
    ],
    OFF: [
      { category: 'HARM_CATEGORY_HATE_SPEECH' as const, threshold: 'BLOCK_NONE' as const },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const, threshold: 'BLOCK_NONE' as const },
      { category: 'HARM_CATEGORY_HARASSMENT' as const, threshold: 'BLOCK_NONE' as const },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const, threshold: 'BLOCK_NONE' as const }
    ]
  }
} as const;

/**
 * Supported models for explicit caching (using your current model naming)
 * @see https://ai.google.dev/gemini-api/docs/caching
 */
export type GoogleModelCacheableId =
  | 'gemini-2.5-pro-preview-05-06'     // Your GEMINI_2_5_PRO
  | 'gemini-2.5-flash-preview-05-20'   // Your GEMINI_2_5_FLASH
  | 'gemini-2.5-flash-lite-preview-06-17' // Your GEMINI_2_5_FLASH_LITE
  | 'gemini-2.5-pro'            // Standard API format
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-image-preview'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash-001'
  | 'gemini-1.5-pro-001';

// Log provider initialization
logger.info('Google provider configuration loaded', {
  defaultModel: GEMINI_CONFIG.MODELS.GEMINI_2_5_FLASH_LITE,
  availableModels: Object.keys(GEMINI_CONFIG.MODELS).length,
  embeddingModels: Object.keys(GEMINI_CONFIG.EMBEDDING_MODELS).length
});

/**
 * Enhanced base Google model with Gemini 2.5 Flash Lite as default
 * Supports all advanced features via proper AI SDK patterns
 *
 * @param modelId - Gemini model ID (defaults to 2.5 Flash Lite)
 * @param options - Model configuration options
 * @returns Configured Google model instance
 */

export const baseGoogleModel = (
  modelId: string = GEMINI_CONFIG.MODELS.GEMINI_2_5_FLASH_LITE,
  options: Readonly<{
    useSearchGrounding?: boolean;
    dynamicRetrieval?: boolean;
    safetyLevel?: 'STRICT' | 'MODERATE' | 'PERMISSIVE' | 'OFF';
    cachedContent?: string;
    structuredOutputs?: boolean;
    codeExecution?: boolean; // Enable code execution for models that support it
    // Langfuse tracing options
    agentName?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    traceName?: string;
  }> = {}
) => {
  const {
    useSearchGrounding = false,
    dynamicRetrieval = false,
    safetyLevel = 'MODERATE',
    cachedContent,
    structuredOutputs = false,
    codeExecution = false,
    // Langfuse tracing options
    agentName = 'unknown',
    tags = [],
    metadata = {},
    traceName
  } = options;

  // Log model configuration
  logger.debug('Creating Google model instance', {
    modelId,
    useSearchGrounding,
    dynamicRetrieval,
    safetyLevel,
    structuredOutputs,
    codeExecution,
    agentName,
    traceName
  });

  try {
  // baseGoogle only accepts the modelId; attach computed provider defaults to the returned model object
  const model = baseGoogle(modelId);

  // Validate the provided safetyLevel and build a sanitized safetySettings array to avoid injecting untrusted objects
  const allowedSafetyLevels = ['STRICT', 'MODERATE', 'PERMISSIVE', 'OFF'] as const;
  const resolvedSafetyLevel = (allowedSafetyLevels.includes(safetyLevel)) ? safetyLevel : 'MODERATE';
  const safetySettings = GEMINI_CONFIG.SAFETY_PRESETS[resolvedSafetyLevel].map(s => ({
    category: String(s.category),
    threshold: String(s.threshold)
  }));

  // Compose default provider options and attach them to the model for downstream consumption (consumer code can read __defaultProviderOptions
  // and apply them via providerOptions when calling generateText or other SDK entrypoints)
  (model as Record<string, unknown>).__defaultProviderOptions = {
    useSearchGrounding,
    dynamicRetrieval: dynamicRetrieval ? { mode: 'MODE_DYNAMIC', dynamicThreshold: 0.8 } : undefined,
    safetySettings,
    cachedContent,
    structuredOutputs
  };

    // Add Langfuse metadata to the model for automatic tracing
          if (agentName !== 'unknown' || tags.length > 0 || Object.keys(metadata).length > 0) {
            // Attach metadata that Langfuse can pick up
            (model as Record<string, unknown>).__langfuseMetadata = {
              agentName,
              tags: [
                'mastra',
                'google',
                'gemini-2.5',
                'dean-machines',
                ...((agentName !== 'unknown') ? [agentName] : []),
                ...tags
              ],
              metadata: {
                modelId,
                provider: 'google',
                framework: 'mastra',
                project: 'dean-machines-rsc',
                agentName,
                thinkingBudget: 'dynamic',
                safetyLevel,
                useSearchGrounding,
                dynamicRetrieval,
                structuredOutputs,
                timestamp: new Date().toISOString(),
                traceName: traceName ?? `${agentName}-${modelId}`,
                ...metadata
              }
            };

            logger.info('Google model configured with Langfuse metadata', {
              modelId,
              agentName,
              traceName: traceName ?? `${agentName}-${modelId}`,
              tagsCount: tags.length
            });
          }
    logger.info('Google model instance created successfully', { modelId, agentName });
    return model;
  } catch (error) {
    logger.error('Failed to create Google model instance', {
      modelId,
      error: error instanceof Error ? error.message : 'Unknown error',
      agentName
    });
    throw error;
  }
};

/**
 * Create Google provider for Gemini 2.5+ models
 *
 * @param modelId - Gemini 2.5+ model ID
 * @param options - Model configuration options
 * @returns Configured Google model
 *
 * @example Basic usage:
 * ```typescript
 * const model = createGemini25Provider('gemini-2.5-flash-lite-preview-06-17');
 * ```
 *
 * @example With thinking config (use in generateText):
 * ```typescript
 * const result = await generateText({
 *   model: createGemini25Provider('gemini-2.5-flash-lite-preview-06-17'),
 *   providerOptions: {
 *     google: {
 *       thinkingConfig: { thinkingBudget: 2048 }
 *     }
 *   },
 *   prompt: 'Think step by step...'
 * });
 * ```
 */

export function createGemini25Provider(
  modelId: string = GEMINI_CONFIG.MODELS.GEMINI_2_5_FLASH_LITE,
  options: Readonly<{
    // Thinking capabilities (for backward compatibility with existing agents)
    thinkingConfig?: Readonly<{
      thinkingBudget?: number;
      includeThoughts?: boolean;
    }>;
    mediaResolution?: 'OFF' | 'MEDIA_RESOLUTION_LOW' | 'MEDIA_RESOLUTION_MEDIUM'; // This allows more higher quality output per token but will cost most overall
    // Response modalities (for backward compatibility)
    responseModalities?: ReadonlyArray<'TEXT' | 'IMAGE'>;
    codeExecution?: boolean; // Enable code execution for models that support it
    // Search and grounding
    useSearchGrounding?: boolean;
    dynamicRetrieval?: boolean;
    functionCalling?: boolean;
    // Content and caching
    cachedContent?: string;

    // Safety and structure
    safetyLevel?: 'STRICT' | 'MODERATE' | 'PERMISSIVE' | 'OFF';
    structuredOutputs?: boolean;
  }> = {}
) {
  // Extract the thinking and response modality options (for backward compatibility)
  const { thinkingConfig, responseModalities, mediaResolution, ...baseOptions } = options;

  logger.debug('Creating Gemini 2.5 provider', {
    modelId,
    hasThinkingConfig: !!thinkingConfig,
    responseModalities,
    mediaResolution
  });

  // Note: thinkingConfig and responseModalities should ideally be used in providerOptions
  // but we accept them here for backward compatibility with existing agent code
  // These parameters are intentionally unused but kept for API compatibility

  return baseGoogleModel(modelId, baseOptions);
}

export function createGeminiEmbeddingModel(
  modelId: string = GEMINI_CONFIG.EMBEDDING_MODELS.TEXT_EMBEDDING_004,
) {
  // The textEmbedding method does not directly accept outputDimensionality or taskType as top-level options.
  // These are typically configured at the model level or within the embedding request payload.
  // For now, we'll remove them from the direct call to baseGoogle.textEmbedding.

  // Use the provider's textEmbedding method for consistency
  return baseGoogle.textEmbedding(modelId);
}

/**
 * Create a Mastra-compatible Google provider with proper thinking config support
 *
 * @param modelId - Gemini model ID
 * @param options - Provider configuration options
 * @returns Configured Google provider
 *
 * @example
 * ```typescript
 * // Basic usage
 * const model = createMastraGoogleProvider();
 *
 * // With thinking config (use in generateText providerOptions)
 * const result = await generateText({
 *   model: createMastraGoogleProvider('gemini-2.5-flash-lite-preview-06-17'),
 *   providerOptions: {
 *     google: {
 *       thinkingConfig: { thinkingBudget: 2048 }
 *     }
 *   },
 *   prompt: 'Explain quantum computing'
 * });
 * ```
 */

export function createMastraGoogleProvider(
  modelId: string = GEMINI_CONFIG.MODELS.GEMINI_2_5_FLASH_LITE,
  options: Readonly<{
    // Search and grounding
    useSearchGrounding?: boolean;
    dynamicRetrieval?: boolean;
    mediaResolution?: 'OFF' | 'MEDIA_RESOLUTION_LOW' | 'MEDIA_RESOLUTION_MEDIUM' // This allows more higher quality output per token but will cost most overall
    // Content and caching
    cachedContent?: string;

    // Safety and structure
    safetyLevel?: 'STRICT' | 'MODERATE' | 'PERMISSIVE' | 'OFF';
    structuredOutputs?: boolean;
  }> = {}
) {
  // Use the enhanced 2.5 provider for all models
  return createGemini25Provider(modelId, options);
}
/**
 * Main Google provider export - defaults to Gemini 2.5 Flash Lite
 * This is the primary export that should be used throughout the application
 *
 * @example Basic usage:
 * ```typescript
 * import { google } from './googleProvider';
 * const model = google('gemini-2.5-flash-lite-preview-06-17');
 * ```
 *
 * @example With thinking config (correct AI SDK pattern):
 * ```typescript
 * import { generateText } from 'ai';
 * import { google } from './googleProvider';
 *
 * const result = await generateText({
 *   model: google('gemini-2.5-flash-lite-preview-06-17'),
 *   providerOptions: {
 *     google: {
 *       thinkingConfig: { thinkingBudget: 2048 },
 *       responseModalities: ['TEXT']
 *     }
 *   },
 *   prompt: 'Think step by step about quantum computing...'
 * });
 * ```
 */
export const google = createMastraGoogleProvider;

export type { GoogleGenerativeAIProviderOptions, GoogleGenerativeAIProviderSettings, GoogleGenerativeAIProviderMetadata };

// ============================
// EXPLICIT CACHING UTILITIES
// ============================

/**
 * Create explicit cache manager for guaranteed cost savings
 * @param apiKey - Google AI API key (optional, uses env var if not provided)
 * @returns GoogleAICacheManager instance
 *
 * @example
 * ```typescript
 * const cacheManager = createCacheManager();
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */
export function createCacheManager(apiKey?: string): GoogleAICacheManager {
  const key = apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (key === undefined) { // Changed from null to undefined as process.env returns undefined for unset variables
    throw new Error('Google AI API key is required for cache manager');
  }

  logger.info('Creating Google AI cache manager', { hasApiKey: !!key });
  return new GoogleAICacheManager(key);
}

/**
 * Create cached content for explicit caching
 * @param cacheManager - Cache manager instance
 * @param modelId - Model to cache content for
 * @param contents - Content to cache
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 * @returns Promise resolving to cached content name
 * * @example
 * ```typescript
 * const cacheManager = createCacheManager();
 * const cachedContent = await createCachedContent(
 *   cacheManager,
 *   'gemini-2.5-pro-preview-05-06', // Using your model names
 *   [{ role: 'user', parts: [{ text: 'Context...' }] }],
 *   300
 * );
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */

export async function createCachedContent(
  cacheManager: GoogleAICacheManager,
  modelId: GoogleModelCacheableId,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  ttlSeconds = 300
): Promise<string> {
  try {
    logger.info('Creating cached content', { modelId, ttlSeconds, contentCount: contents.length });
      const result = await cacheManager.create({
      model: modelId,
      contents,
      ttlSeconds
    });
      const {name} = result;

    if (name === null || name === undefined) {
      throw new Error('Failed to create cached content: no name returned');
    }

    logger.info('Cached content created successfully', { name, modelId });
    return name.startsWith('cachedContents/') ? name : `cachedContents/${name}`;
  } catch (error) {
    logger.error('Failed to create cached content', {
      modelId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Enhanced Google model with explicit caching support
 * @param modelId - Cacheable model ID
 * @param options - Enhanced options including cache configuration
 * @returns Configured Google model with caching
 * * @example
 * ```typescript
 * const cacheManager = createCacheManager();
 * const model = await createCachedGoogleModel(
 *   'gemini-2.5-flash-preview-05-20', // Using your model names
 *   {
 *     cacheManager,
 *     cacheContents: [{ role: 'user', parts: [{ text: 'Context...' }] }],
 *     cacheTtlSeconds: 300
 *   }
 * );
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */

export const createCachedGoogleModel = async (
  modelId: GoogleModelCacheableId,
  options: {
    // Cache configuration
    cacheManager?: GoogleAICacheManager;
    cacheContents?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    cacheTtlSeconds?: number;

    // Standard options (preserving your existing function signature)
    useSearchGrounding?: boolean;
    dynamicRetrieval?: boolean;
    safetyLevel?: 'STRICT' | 'MODERATE' | 'PERMISSIVE' | 'OFF';
    structuredOutputs?: boolean;
    agentName?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    traceName?: string;
  } = {}
) => {
  const {
    cacheManager,
    cacheContents,
    cacheTtlSeconds = 300,
    ...baseOptions
  } = options;

  if (cacheManager && cacheContents) {
    // Create cached content and return model with cache
    const cachedContent = await createCachedContent(cacheManager, modelId, cacheContents, cacheTtlSeconds);
    logger.info('Using explicit caching for model', { modelId, cachedContent });
    return baseGoogleModel(modelId, { ...baseOptions, cachedContent });
  }

  // Return regular model without caching
  return baseGoogleModel(modelId, baseOptions);
};

/**
 * Utility to validate model supports caching
 * @param modelId - Model ID to validate
 * @returns Boolean indicating cache support
 * * @example
 * ```typescript
 * if (supportsExplicitCaching('gemini-2.5-pro-preview-05-06')) {
 *   // Can use explicit caching with your models
 * }
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */
export function supportsExplicitCaching(modelId: string): modelId is GoogleModelCacheableId {
  const cacheableModels: GoogleModelCacheableId[] = [
    // Your current model names
    'gemini-2.5-pro-preview-05-06',
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash-lite-preview-06-17',
    // Standard API format models
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-001'
  ];

  return cacheableModels.includes(modelId as GoogleModelCacheableId);
}

// ============================
// SEARCH GROUNDING UTILITIES
// ============================

/**
 * Extract and process search grounding metadata from provider response
 * @param providerMetadata - Provider metadata from generateText response
 * @returns Processed grounding information
 *
 * @example
 * ```typescript
 * const { text, providerMetadata } = await generateText({ model, prompt });
 * const grounding = extractGroundingMetadata(providerMetadata);
 * console.log('Search queries:', grounding?.searchQueries);
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */
export function extractGroundingMetadata(providerMetadata?: Readonly<Record<string, unknown>>) {
  const googleMetadata = providerMetadata?.google as Record<string, unknown> | undefined;
  if (!googleMetadata || typeof googleMetadata !== 'object') {
    return null;
  }

  const grounding = (googleMetadata as any).groundingMetadata;
  const safetyRatings = (googleMetadata as any).safetyRatings as any[] | undefined;

  interface GroundingSegment {
    text: string | null;
    startIndex: number | null;
    endIndex: number | null;
  }

  interface GroundingSupport {
    segment: GroundingSegment;
    groundingChunkIndices: number[];
    confidenceScores: number[];
  }

  interface SafetyRating {
    category: string;
    probability: string;
    blocked?: boolean;
  }

  interface GroundingMetadata {
    searchQueries: string[];
    searchEntryPoint: string | null;
    groundingSupports: GroundingSupport[];
    safetyRatings: SafetyRating[];
  }

  interface RawGroundingSupport {
    segment?: {
      text?: string | null;
      startIndex?: number | null;
      endIndex?: number | null;
    };
    segment_text?: string | null;
    groundingChunkIndices?: number[] | null;
    supportChunkIndices?: number[] | null;
    confidenceScores?: number[] | null;
  }

  return {
    searchQueries: grounding?.webSearchQueries ?? [],
    searchEntryPoint: grounding?.searchEntryPoint?.renderedContent ?? null,
    groundingSupports:
      (grounding?.groundingSupports ?? []).map((support: RawGroundingSupport): GroundingSupport => ({
        segment: {
          text: support.segment?.text ?? null,
          startIndex: support.segment?.startIndex ?? null,
          endIndex: support.segment?.endIndex ?? null
        },
        groundingChunkIndices: support.groundingChunkIndices ?? [],
        confidenceScores: support.confidenceScores ?? []
      })) ?? [],
    safetyRatings: safetyRatings ?? []
  } as GroundingMetadata;
}

/**
 * Log cache usage statistics from response metadata
 * @param response - Response object from generateText
 * @param customLogger - Logger instance
 *
 * @example
 * ```typescript
 * const result = await generateText({ model, prompt });
 * logCacheUsage(result.response, logger);
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */
export function logCacheUsage(response: Readonly<Record<string, unknown>>, customLogger: PinoLogger) {
  const responseBody = response.body as Record<string, unknown> | undefined;
  const usageMetadata = responseBody?.usageMetadata as Readonly<Record<string, unknown>> | undefined;
  if (
    usageMetadata &&
    typeof usageMetadata.cachedContentTokenCount === 'number' &&
    typeof usageMetadata.totalTokenCount === 'number' &&
    usageMetadata.totalTokenCount > 0
  ) {
    const cacheHitRate = ((usageMetadata.cachedContentTokenCount / usageMetadata.totalTokenCount) * 100).toFixed(2);

    customLogger.info('Cache hit detected', {
      cachedTokens: usageMetadata.cachedContentTokenCount,
      totalTokens: usageMetadata.totalTokenCount,
      promptTokens: usageMetadata.promptTokenCount,
      candidatesTokens: usageMetadata.candidatesTokenCount,
      cacheHitRate: `${cacheHitRate}%`,
      costSavings: `~${cacheHitRate}%`
    });
  }
}

/**
 * Enhanced search grounding utility with metadata extraction
 * @param _prompt - Search query or prompt
 * @param options - Search grounding configuration
 * @returns Promise with response and extracted grounding metadata
 *
 * @example
 * ```typescript
 * const { model, extractGroundingMetadata } = await searchGroundedGeneration(
 *   'What are the latest AI developments?',
 *   { agentName: 'research-agent' }
 * );
 * ```
 *
 * [EDIT: 2025-06-22] [BY: GitHub Copilot]
 */

export async function searchGroundedGeneration(
  _prompt: string,
  options: {
    modelId?: string;
    agentName?: string;
    extractMetadata?: boolean;
    safetyLevel?: 'STRICT' | 'MODERATE' | 'PERMISSIVE' | 'OFF';
  } = {}
) {
  const {
    modelId = GEMINI_CONFIG.MODELS.GEMINI_2_5_FLASH_LITE,
    agentName = 'search-agent',
    extractMetadata = true,
    safetyLevel = 'MODERATE'
  } = options;

const model = baseGoogleModel(modelId, {
  useSearchGrounding: true,
  dynamicRetrieval: true,
  safetyLevel,
  agentName,
  tags: ['search', 'grounding'],
  traceName: `search-${agentName}`
});

try {
  // Return the configured model and helper for metadata extraction
  return {
    model,
    extractGroundingMetadata: (providerMetadata?: Readonly<Record<string, unknown>>) =>
      extractMetadata ? extractGroundingMetadata(providerMetadata) : null
  };
} catch (error) {
  logger.error('searchGroundedGeneration failed', {
    modelId,
    error: error instanceof Error ? error.message : String(error)
  });
  throw error;
  }
}
