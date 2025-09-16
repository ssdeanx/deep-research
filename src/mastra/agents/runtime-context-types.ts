import { z } from 'zod';

// Base runtime context interface
export interface BaseRuntimeContext {
  userId?: string;
  sessionId?: string;
  language?: string;
  timezone?: string;
}

// Research Agent Runtime Context
export interface ResearchAgentRuntimeContext extends BaseRuntimeContext {
  researchDepth: 'shallow' | 'moderate' | 'deep';
  sourcePreference: 'academic' | 'news' | 'general' | 'technical';
  maxSources: number;
  includeImages: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export const ResearchAgentRuntimeContextSchema = z.object({
  researchDepth: z.enum(['shallow', 'moderate', 'deep']).default('moderate'),
  sourcePreference: z.enum(['academic', 'news', 'general', 'technical']).default('general'),
  maxSources: z.number().min(1).max(20).default(5),
  includeImages: z.boolean().default(false),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Content Generation Runtime Context
export interface ContentGenerationRuntimeContext extends BaseRuntimeContext {
  tone: 'professional' | 'casual' | 'academic' | 'creative';
  targetAudience: 'general' | 'technical' | 'business' | 'academic';
  contentLength: 'short' | 'medium' | 'long';
  includeEmojis: boolean;
  formattingStyle: 'markdown' | 'html' | 'plain';
}

export const ContentGenerationRuntimeContextSchema = z.object({
  tone: z.enum(['professional', 'casual', 'academic', 'creative']).default('professional'),
  targetAudience: z.enum(['general', 'technical', 'business', 'academic']).default('general'),
  contentLength: z.enum(['short', 'medium', 'long']).default('medium'),
  includeEmojis: z.boolean().default(false),
  formattingStyle: z.enum(['markdown', 'html', 'plain']).default('markdown'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// GitHub Agent Runtime Context
export interface GitHubAgentRuntimeContext extends BaseRuntimeContext {
  defaultRepository?: string;
  defaultOrganization?: string;
  preferredBranch: string;
  autoCreateBranch: boolean;
  commitMessageStyle: 'conventional' | 'simple' | 'detailed';
  pullRequestTemplate?: string;
}

export const GitHubAgentRuntimeContextSchema = z.object({
  defaultRepository: z.string().optional(),
  defaultOrganization: z.string().optional(),
  preferredBranch: z.string().default('main'),
  autoCreateBranch: z.boolean().default(true),
  commitMessageStyle: z.enum(['conventional', 'simple', 'detailed']).default('conventional'),
  pullRequestTemplate: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// RAG Agent Runtime Context
export interface RAGAgentRuntimeContext extends BaseRuntimeContext {
  retrievalStrategy: 'semantic' | 'keyword' | 'hybrid';
  maxResults: number;
  similarityThreshold: number;
  includeMetadata: boolean;
  rerankResults: boolean;
}

export const RAGAgentRuntimeContextSchema = z.object({
  retrievalStrategy: z.enum(['semantic', 'keyword', 'hybrid']).default('hybrid'),
  maxResults: z.number().min(1).max(50).default(10),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  includeMetadata: z.boolean().default(true),
  rerankResults: z.boolean().default(true),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Quality Assurance Runtime Context
export interface QualityAssuranceRuntimeContext extends BaseRuntimeContext {
  testingStandards: 'basic' | 'comprehensive' | 'enterprise';
  qualityThresholds: {
    coverage: number;
    performance: number;
    security: number;
  };
  autoFixEnabled: boolean;
  reportFormat: 'json' | 'markdown' | 'html';
}

export const QualityAssuranceRuntimeContextSchema = z.object({
  testingStandards: z.enum(['basic', 'comprehensive', 'enterprise']).default('comprehensive'),
  qualityThresholds: z.object({
    coverage: z.number().min(0).max(100).default(80),
    performance: z.number().min(0).max(100).default(90),
    security: z.number().min(0).max(100).default(85)
  }),
  autoFixEnabled: z.boolean().default(false),
  reportFormat: z.enum(['json', 'markdown', 'html']).default('markdown'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Monitoring Agent Runtime Context
export interface MonitoringAgentRuntimeContext extends BaseRuntimeContext {
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
  monitoringInterval: number; // minutes
  notificationChannels: string[];
  logRetentionDays: number;
}

export const MonitoringAgentRuntimeContextSchema = z.object({
  alertThresholds: z.object({
    cpu: z.number().min(0).max(100).default(80),
    memory: z.number().min(0).max(100).default(85),
    disk: z.number().min(0).max(100).default(90),
    responseTime: z.number().min(0).default(5000) // milliseconds
  }),
  monitoringInterval: z.number().min(1).max(60).default(5),
  notificationChannels: z.array(z.string()).default(['email']),
  logRetentionDays: z.number().min(1).max(365).default(30),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Planning Agent Runtime Context
export interface PlanningAgentRuntimeContext extends BaseRuntimeContext {
  planningMethodology: 'agile' | 'waterfall' | 'kanban' | 'scrum';
  riskTolerance: 'low' | 'medium' | 'high';
  timelinePreference: 'aggressive' | 'balanced' | 'conservative';
  stakeholderCommunication: 'minimal' | 'regular' | 'frequent';
}

export const PlanningAgentRuntimeContextSchema = z.object({
  planningMethodology: z.enum(['agile', 'waterfall', 'kanban', 'scrum']).default('agile'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  timelinePreference: z.enum(['aggressive', 'balanced', 'conservative']).default('balanced'),
  stakeholderCommunication: z.enum(['minimal', 'regular', 'frequent']).default('regular'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Voice Agent Runtime Context
export interface VoiceAgentRuntimeContext extends BaseRuntimeContext {
  voiceSettings: {
    speaker: string;
    speed: number;
    pitch: number;
    volume: number;
  };
  conversationStyle: 'professional' | 'casual' | 'friendly';
  responseLength: 'brief' | 'normal' | 'detailed';
  interruptionHandling: 'strict' | 'flexible' | 'adaptive';
}

export const VoiceAgentRuntimeContextSchema = z.object({
  voiceSettings: z.object({
    speaker: z.string().default('Puck'),
    speed: z.number().min(0.5).max(2.0).default(1.0),
    pitch: z.number().min(0.5).max(2.0).default(1.0),
    volume: z.number().min(0.1).max(2.0).default(1.0)
  }),
  conversationStyle: z.enum(['professional', 'casual', 'friendly']).default('professional'),
  responseLength: z.enum(['brief', 'normal', 'detailed']).default('normal'),
  interruptionHandling: z.enum(['strict', 'flexible', 'adaptive']).default('adaptive'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Web Summarization Runtime Context
export interface WebSummarizationRuntimeContext extends BaseRuntimeContext {
  summaryLength: 'brief' | 'standard' | 'detailed';
  focusAreas: string[];
  includeQuotes: boolean;
  preserveStructure: boolean;
  outputFormat: 'markdown' | 'json' | 'html';
}

export const WebSummarizationRuntimeContextSchema = z.object({
  summaryLength: z.enum(['brief', 'standard', 'detailed']).default('standard'),
  focusAreas: z.array(z.string()).default(['key-points', 'conclusions']),
  includeQuotes: z.boolean().default(true),
  preserveStructure: z.boolean().default(true),
  outputFormat: z.enum(['markdown', 'json', 'html']).default('markdown'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Evaluation Agent Runtime Context
export interface EvaluationAgentRuntimeContext extends BaseRuntimeContext {
  evaluationCriteria: {
    relevance: number;
    accuracy: number;
    credibility: number;
    recency: number;
  };
  strictness: 'lenient' | 'moderate' | 'strict';
  includeSuggestions: boolean;
  evaluationFormat: 'simple' | 'detailed' | 'comprehensive';
}

export const EvaluationAgentRuntimeContextSchema = z.object({
  evaluationCriteria: z.object({
    relevance: z.number().min(0).max(10).default(8),
    accuracy: z.number().min(0).max(10).default(9),
    credibility: z.number().min(0).max(10).default(7),
    recency: z.number().min(0).max(10).default(6)
  }),
  strictness: z.enum(['lenient', 'moderate', 'strict']).default('moderate'),
  includeSuggestions: z.boolean().default(true),
  evaluationFormat: z.enum(['simple', 'detailed', 'comprehensive']).default('detailed'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Learning Extraction Runtime Context
export interface LearningExtractionRuntimeContext extends BaseRuntimeContext {
  extractionDepth: 'surface' | 'moderate' | 'deep';
  focusKeywords: string[];
  maxLearnings: number;
  includeFollowUps: boolean;
  categorizationEnabled: boolean;
}

export const LearningExtractionRuntimeContextSchema = z.object({
  extractionDepth: z.enum(['surface', 'moderate', 'deep']).default('moderate'),
  focusKeywords: z.array(z.string()).default([]),
  maxLearnings: z.number().min(1).max(20).default(5),
  includeFollowUps: z.boolean().default(true),
  categorizationEnabled: z.boolean().default(true),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// MCP Agent Runtime Context
export interface MCPAgentRuntimeContext extends BaseRuntimeContext {
  serverEndpoints: string[];
  toolPermissions: string[];
  requestTimeout: number;
  retryAttempts: number;
  loggingLevel: 'error' | 'warn' | 'info' | 'debug';
}

export const MCPAgentRuntimeContextSchema = z.object({
  serverEndpoints: z.array(z.string()).default([]),
  toolPermissions: z.array(z.string()).default(['*']),
  requestTimeout: z.number().min(1000).max(30000).default(10000),
  retryAttempts: z.number().min(0).max(5).default(3),
  loggingLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Publisher Agent Runtime Context
export interface PublisherAgentRuntimeContext extends BaseRuntimeContext {
  publishingPlatform: 'blog' | 'social' | 'newsletter' | 'documentation';
  contentWorkflow: 'sequential' | 'parallel' | 'iterative';
  reviewRequired: boolean;
  autoPublish: boolean;
  schedulingEnabled: boolean;
}

export const PublisherAgentRuntimeContextSchema = z.object({
  publishingPlatform: z.enum(['blog', 'social', 'newsletter', 'documentation']).default('blog'),
  contentWorkflow: z.enum(['sequential', 'parallel', 'iterative']).default('sequential'),
  reviewRequired: z.boolean().default(true),
  autoPublish: z.boolean().default(false),
  schedulingEnabled: z.boolean().default(false),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

// Union type for all runtime contexts
export type AgentRuntimeContext =
  | ResearchAgentRuntimeContext
  | ContentGenerationRuntimeContext
  | GitHubAgentRuntimeContext
  | RAGAgentRuntimeContext
  | QualityAssuranceRuntimeContext
  | MonitoringAgentRuntimeContext
  | PlanningAgentRuntimeContext
  | VoiceAgentRuntimeContext
  | WebSummarizationRuntimeContext
  | EvaluationAgentRuntimeContext
  | LearningExtractionRuntimeContext
  | MCPAgentRuntimeContext
  | PublisherAgentRuntimeContext;

// Schema map for validation
export const RuntimeContextSchemas = {
  research: ResearchAgentRuntimeContextSchema,
  content: ContentGenerationRuntimeContextSchema,
  github: GitHubAgentRuntimeContextSchema,
  rag: RAGAgentRuntimeContextSchema,
  qa: QualityAssuranceRuntimeContextSchema,
  monitoring: MonitoringAgentRuntimeContextSchema,
  planning: PlanningAgentRuntimeContextSchema,
  voice: VoiceAgentRuntimeContextSchema,
  summarization: WebSummarizationRuntimeContextSchema,
  evaluation: EvaluationAgentRuntimeContextSchema,
  learning: LearningExtractionRuntimeContextSchema,
  mcp: MCPAgentRuntimeContextSchema,
  publisher: PublisherAgentRuntimeContextSchema
} as const;
