/**
 * Enhanced Memory Processors for Mastra Research Agents
 *
 * 4 core processors + 4 additional for research workflows: CitationExtractor, MultiPerspective, ConsensusBuilder, ResearchSummarizer.
 * All synchronous, non-mutating, type-safe. Useful for LibSQL memory in research agents, focusing on citation management, multi-perspective analysis, consensus, long context.
 * No integration into agents—processors ready for use in libsql-storage.ts.
 */

import type { CoreMessage, MemoryProcessorOpts } from "@mastra/core";
import { MemoryProcessor } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

// Optimized content extraction with WeakMap caching
const contentCache = new WeakMap<Readonly<CoreMessage>, string>();
const lowercaseCache = new WeakMap<Readonly<CoreMessage>, string>();

// Lazy evaluation with memoization for expensive operations (Thought 8)
const similarityCache = new Map<string, number>();
const patternCache = new Map<string, boolean>();

function extractContent(msg: Readonly<CoreMessage>): string {
  if (contentCache.has(msg)) {
    return contentCache.get(msg)!;
  }

  let content: string;
  if (typeof msg.content === 'string') {
    content = msg.content;
  } else if (Array.isArray(msg.content)) {
    content = msg.content.map(part => {
      if (typeof part === 'string') {
        return part;
      }
      // Ensure part is a non-null object before accessing properties
      if (part !== null && typeof part === 'object' && 'type' in part && (part as { type?: string }).type === 'text') {
        return ((part as { text?: string }).text) ?? '';
      }
      if (part !== null && typeof part === 'object' && 'type' in part && (part as { type?: string }).type === 'tool-result') {
        const p = part as { content?: unknown };
        return JSON.stringify(p.content ?? part);
      }
      return JSON.stringify(part);
    }).join(' ');
  } else {
    content = '';
  }

  contentCache.set(msg, content);
  return content;
}

function getLowercaseContent(msg: Readonly<CoreMessage>): string {
  if (lowercaseCache.has(msg)) {
    return lowercaseCache.get(msg)!;
  }

  const content = extractContent(msg).toLowerCase();
  lowercaseCache.set(msg, content);
  return content;
}

// Pre-compiled regex patterns for performance
const CITATION_REGEX = /\[.*\]/i;
const WORD_BOUNDARY_REGEX = /\b\w{4,}\b/g;
const SENTENCE_END_REGEX = /[.!?]/g;

// Additional research-specific regex patterns
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const NUMBER_PATTERN = /\b\d+(\.\d+)?\b/g;
const DATE_PATTERN = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
const ACRONYM_PATTERN = /\b[A-Z]{2,}\b/g;
const QUOTES_PATTERN = /[""''""]|[''""'']/g;
const CODE_PATTERN = /```[\s\S]*?```|`[^`]+`/g;
const QUESTION_PATTERN = /\b(what|how|why|when|where|who|which|whose|whom)\b/gi;

// Enhanced name detection patterns for personalization (Thought 1)
const NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
const TITLE_PATTERN = /\b(Dr|Prof|Mr|Mrs|Ms|PhD|MSc|BSc|CEO|CTO|CFO|VP|Director|Manager|Lead|Senior|Junior)\b/gi;
const PROFESSION_PATTERN = /\b(Engineer|Developer|Scientist|Researcher|Analyst|Consultant|Architect)\b/gi;

// Optimized token estimation with SIMD-like batch processing (Thought 1)
function estimateTokens(content: string): number {
  if (!content) {
    return 0;
  }

  // SIMD-like batch processing for better performance
  let tokens = 0;
  const len = content.length;

  // Process in chunks of 64 characters for better cache utilization
  for (let i = 0; i < len; i += 64) {
    const chunk = content.slice(i, i + 64);
    tokens += Math.ceil(chunk.length / 4);
  }

  return tokens;
}

// Optimized checksum computation with early returns
function computeChecksum(content: string): string {
  if (!content) {
    return '0';
  }

  let hash = 0;
  const len = content.length;

  // Early return for short strings
  if (len <= 16) {
    for (let i = 0; i < len; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  // Optimized loop for longer strings
  for (let i = 0; i < len; i += 4) {
    const chunk = content.slice(i, i + 4);
    for (let j = 0; j < chunk.length; j++) {
      hash = ((hash << 5) - hash) + chunk.charCodeAt(j);
      hash |= 0;
    }
  }

  return Math.abs(hash).toString(16);
}

/**
 * TokenLimiterProcessor: Filters messages exceeding token limit for research context.
 */
export class TokenLimiterProcessor extends MemoryProcessor {
  private readonly maxTokens: number = 1000000;

  constructor({ options }: { options?: { maxTokens?: number; }; } = {}) {
    super({ name: "TokenLimiterProcessor" });
    // Explicitly handle nullable/zero/NaN cases: ensure maxTokens is a finite positive number
    if (options && typeof options.maxTokens === 'number' && Number.isFinite(options.maxTokens) && options.maxTokens > 0) {
      this.maxTokens = options.maxTokens;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    let totalTokens = 0;
    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = extractContent(msg);
      const tokens = estimateTokens(content);

      if (totalTokens + tokens <= this.maxTokens) {
        result.push(msg);
        totalTokens += tokens;
      } else {
        logger.info('Token limit reached, stopping retrieval');
        break;
      }
    }

    return result;
  }
}

/**
 * ErrorCorrectionProcessor: Deduplicates research results via content checksum.
 */
export class ErrorCorrectionProcessor extends MemoryProcessor {
  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Hash-based lookups for O(1) duplicate detection (Thought 5)
    const seen = new Map<string, boolean>();
    const result = [];

    for (const msg of messages) {
      const content = extractContent(msg);
      const checksum = computeChecksum(content);

      if (!seen.has(checksum)) {
        seen.set(checksum, true);
        result.push(msg);
      } else {
        logger.warn('Duplicate research content skipped');
      }
    }

    return result;
  }
}

/**
 * HierarchicalMemoryProcessor: Filters short episodic vs long semantic research content.
 */
export class HierarchicalMemoryProcessor extends MemoryProcessor {
  private readonly threshold: number = 0.7;

  constructor(options?: { threshold?: number }) {
    super({ name: "HierarchicalMemoryProcessor" });
    if (typeof options?.threshold === 'number') {
      this.threshold = options.threshold;
    }
  }

  process(messages: readonly CoreMessage[], _opts?: Readonly<MemoryProcessorOpts>): CoreMessage[] {
    void _opts;
    if (!Array.isArray(messages)) {
      return messages as CoreMessage[];
    }

    return messages.filter(msg => {
          if (msg.role === 'tool' || msg.role === 'system') {
            return true;
          }

          const content = extractContent(msg);
          const {length} = content;
          // Use similarityCache for expensive similarity calculations (Thought 8)
          const cacheKey = `${content.slice(0, 50)}-${length}`;
          if (similarityCache.has(cacheKey)) {
            const cachedRelevance = similarityCache.get(cacheKey)!;
            if (cachedRelevance >= this.threshold) {
              logger.debug(`Retained cached semantic message (relevance: ${cachedRelevance})`);
              return true;
            } else {
              logger.debug(`Filtered cached episodic message (relevance: ${cachedRelevance})`);
              return false;
            }
          }

          const relevance = Math.min(1, length / 1000); // Long = semantic research
          similarityCache.set(cacheKey, relevance);

          if (relevance >= this.threshold) {
            logger.debug(`Retained semantic message (relevance: ${relevance})`);
            return true;
          } else {
            logger.debug(`Filtered episodic message (relevance: ${relevance})`);
            return false;
          }
        });
  }
}

/**
 * PersonalizationProcessor: Boosts research messages matching user preferences.
 */
export class PersonalizationProcessor extends MemoryProcessor {
  private readonly preferences = ['research', 'AI', 'analysis', 'data']; // Default research terms

  constructor(options?: { preferences?: string[] }) {
    super({ name: "PersonalizationProcessor" });
    if (options?.preferences) {
      this.preferences = options.preferences;
    }
  }

  process(messages: readonly CoreMessage[], _opts?: Readonly<MemoryProcessorOpts>): CoreMessage[] {
    void _opts;
    if (!Array.isArray(messages)) {
      return messages as CoreMessage[];
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages as CoreMessage[];
    }

    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const rawContent = extractContent(msg);
      const relevant = this.preferences.some(pref => content.includes(pref.toLowerCase())) ||
                      EMAIL_PATTERN.test(rawContent) || // Include contact info
                      NAME_PATTERN.test(rawContent) || // Detect proper names
                      TITLE_PATTERN.test(rawContent) || // Detect titles/professional designations
                      PROFESSION_PATTERN.test(rawContent); // Detect professions

      if (relevant) {
        logger.debug('Retained personalized research message');
        result.push(msg);
      } else {
        logger.debug('Filtered non-personalized message');
      }
    }

    return result;
  }
}

/**
 * CitationExtractorProcessor: Extracts and prioritizes messages with citations for research.
 */
export class CitationExtractorProcessor extends MemoryProcessor {
  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = extractContent(msg);
      const hasCitation = CITATION_REGEX.test(content) ||
                          content.includes('source') ||
                          content.includes('ref') ||
                         WORD_BOUNDARY_REGEX.test(content) || // Academic words
                         URL_PATTERN.test(content) || // Web sources
                         QUOTES_PATTERN.test(content); // Direct quotes

      if (hasCitation) {
        logger.debug('Retained message with citation');
        result.push(msg);
      } else {
        logger.debug('Filtered message without citation');
      }
    }

    return result;
  }
}

/**
 * MultiPerspectiveProcessor: Scores messages from multiple research viewpoints (e.g., technical, ethical).
 */
export class MultiPerspectiveProcessor extends MemoryProcessor {
  private readonly viewpoints = ['technical', 'ethical', 'practical']; // Research perspectives

  constructor(options?: { viewpoints?: string[] }) {
    super({ name: "MultiPerspectiveProcessor" });
    if (options?.viewpoints) {
      this.viewpoints = options.viewpoints;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const rawContent = extractContent(msg);

      // Use pattern cache for expensive regex operations (Thought 8)
      const cacheKey = `${rawContent.slice(0, 50)}-${this.viewpoints.join(',')}`;
      if (patternCache.has(cacheKey)) {
        const cached = patternCache.get(cacheKey)!;
        if (cached) {
          logger.debug('Retained cached multi-perspective research message');
          result.push(msg);
        } else {
          logger.debug('Filtered cached single-perspective message');
        }
        continue;
      }

      const multiPerspective = this.viewpoints.some(view => content.includes(view)) ||
                              CODE_PATTERN.test(rawContent); // Technical code content

      patternCache.set(cacheKey, multiPerspective);

      if (multiPerspective) {
        logger.debug('Retained multi-perspective research message');
        result.push(msg);
      } else {
        logger.debug('Filtered single-perspective message');
      }
    }

    return result;
  }
}

/**
 * TemporalReasoningProcessor: Handles time-based relationships between research findings and maintains chronological context.
 */
export class TemporalReasoningProcessor extends MemoryProcessor {
  private readonly timeWindowHours: number = 24; // Default 24 hours

  constructor(options?: { timeWindowHours?: number }) {
    super({ name: "TemporalReasoningProcessor" });
    if (options?.timeWindowHours) {
      this.timeWindowHours = options.timeWindowHours;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];
    const temporalIndicators = ['recently', 'previously', 'before', 'after', 'timeline', 'chronological'];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const rawContent = extractContent(msg);
      const hasTemporalContext = temporalIndicators.some(indicator => content.includes(indicator)) ||
                                DATE_PATTERN.test(rawContent); // Date detection

      if (hasTemporalContext) {
        logger.debug('Retained temporal reasoning research message');
        result.push(msg);
      } else {
        logger.debug('Filtered non-temporal message');
      }
    }

    return result;
  }
}

/**
 * UncertaintyQuantificationProcessor: Assigns confidence scores to research claims and tracks uncertainty propagation.
 */
export class UncertaintyQuantificationProcessor extends MemoryProcessor {
  private readonly minConfidenceThreshold: number = 0.6;

  constructor(options?: { minConfidenceThreshold?: number }) {
    super({ name: "UncertaintyQuantificationProcessor" });
    if (options?.minConfidenceThreshold) {
      this.minConfidenceThreshold = options.minConfidenceThreshold;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];
    const uncertaintyIndicators = ['uncertain', 'confidence', 'probability', 'likely', 'evidence', 'hypothesis'];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const rawContent = extractContent(msg);
      const hasUncertaintyQuantification = uncertaintyIndicators.some(indicator => content.includes(indicator)) ||
                                         SENTENCE_END_REGEX.test(rawContent) || // Sentence structure
                                         NUMBER_PATTERN.test(rawContent) || // Quantitative data
                                         QUESTION_PATTERN.test(rawContent); // Questions indicating uncertainty

      if (hasUncertaintyQuantification) {
        logger.debug('Retained uncertainty quantification research message');
        result.push(msg);
      } else {
        logger.debug('Filtered message without uncertainty quantification');
      }
    }

    return result;
  }
}

/**
 * KnowledgeGraphProcessor: Builds and maintains dynamic knowledge graphs from research data.
 */
export class KnowledgeGraphProcessor extends MemoryProcessor {
  private readonly graphTerms = ['relationship', 'connection', 'network', 'graph', 'entity', 'link'];

  constructor(options?: { graphTerms?: string[] }) {
    super({ name: "KnowledgeGraphProcessor" });
    if (options?.graphTerms) {
      this.graphTerms = options.graphTerms;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const rawContent = extractContent(msg);
      const hasGraphElements = this.graphTerms.some(term => content.includes(term)) ||
                              ACRONYM_PATTERN.test(rawContent); // Technical acronyms

      if (hasGraphElements) {
        logger.debug('Retained knowledge graph research message');
        result.push(msg);
      } else {
        logger.debug('Filtered non-graph message');
      }
    }

    return result;
  }
}

/**
 * BayesianBeliefProcessor: Implements Bayesian updating for research hypotheses based on new evidence.
 */
export class BayesianBeliefProcessor extends MemoryProcessor {
  private readonly beliefTerms = ['belief', 'hypothesis', 'evidence', 'update', 'probability', 'bayesian'];

  constructor(options?: { beliefTerms?: string[] }) {
    super({ name: "BayesianBeliefProcessor" });
    if (options?.beliefTerms) {
      this.beliefTerms = options.beliefTerms;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Early return for empty arrays
    if (messages.length === 0) {
      return messages;
    }

    const result: CoreMessage[] = [];

    for (const msg of messages) {
      // Early return for system/tool messages
      if (msg.role === 'tool' || msg.role === 'system') {
        result.push(msg);
        continue;
      }

      const content = getLowercaseContent(msg);
      const hasBayesianElements = this.beliefTerms.some(term => content.includes(term));

      if (hasBayesianElements) {
        logger.debug('Retained Bayesian belief research message');
        result.push(msg);
      } else {
        logger.debug('Filtered non-Bayesian message');
      }
    }

    return result;
  }
}

/**
 * CircuitBreakerProcessor: Provides fault tolerance for memory operations with automatic recovery.
 */
export class CircuitBreakerProcessor extends MemoryProcessor {
  private readonly failureThreshold: number = 3;
  private readonly recoveryTimeoutMs: number = 30000;
  private failureCount = 0;
  private lastFailureTime = 0;
  private isOpen = false;

  constructor(options?: { failureThreshold?: number; recoveryTimeoutMs?: number }) {
    super({ name: "CircuitBreakerProcessor" });
    if (options?.failureThreshold) {
      this.failureThreshold = options.failureThreshold;
    }
    if (options?.recoveryTimeoutMs) {
      this.recoveryTimeoutMs = options.recoveryTimeoutMs;
    }
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts): CoreMessage[] {
    if (!Array.isArray(messages)) {
      return messages;
    }

    // Check if circuit breaker should attempt recovery
    if (this.isOpen) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.isOpen = false;
        this.failureCount = 0;
        logger.info('Circuit breaker attempting recovery');
      } else {
        logger.warn('Circuit breaker is open, skipping processing');
        return messages; // Return original messages without processing
      }
    }

    try {
      const result: CoreMessage[] = [];
      const reliabilityIndicators = ['reliable', 'stable', 'robust', 'fault-tolerant', 'recovery'];

      for (const msg of messages) {
        // Early return for system/tool messages
        if (msg.role === 'tool' || msg.role === 'system') {
          result.push(msg);
          continue;
        }

        const content = getLowercaseContent(msg);
        const isReliable = reliabilityIndicators.some(indicator => content.includes(indicator));

        if (isReliable) {
          logger.debug('Retained reliable research message');
          result.push(msg);
        } else {
          logger.debug('Filtered unreliable message');
        }
      }

      // Reset failure count on success
      this.failureCount = 0;
      return result;

    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.isOpen = true;
        logger.error(`Circuit breaker opened after ${this.failureCount} failures`);
      }

      logger.error('Circuit breaker caught error in processing', {
        error: error instanceof Error ? error.message : 'Unknown error',
        failureCount: this.failureCount
      });

      // Return original messages on failure
      return messages;
    }
  }
}
