# Mastra Deep Research System - API Reference

This comprehensive API reference covers all classes, methods, interfaces, and types used in the Mastra Deep Research System.

## Table of Contents

- [Core Classes](#core-classes)
  - [Mastra](#mastra)
  - [Agent](#agent)
  - [Workflow](#workflow)
  - [Tool](#tool)
- [Configuration Classes](#configuration-classes)
  - [Storage](#storage)
  - [Memory](#memory)
  - [Logger](#logger)
- [Utility Classes](#utility-classes)
  - [RuntimeContext](#runtimecontext)
  - [Error Classes](#error-classes)
- [Type Definitions](#type-definitions)
- [Integration APIs](#integration-apis)

## Core Classes

### Mastra

The main orchestration class for the Mastra system.

```typescript
class Mastra {
  constructor(config: MastraConfig);

  // Agent management
  getAgent(name: string): Agent;
  getAgents(): Record<string, Agent>;

  // Workflow management
  getWorkflow(name: string): Workflow;
  getWorkflows(): Record<string, Workflow>;

  // Tool management
  getTool(name: string): Tool;
  getTools(): Record<string, Tool>;

  // Storage access
  getStorage(): Storage;

  // Lifecycle methods
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
```

#### MastraConfig

```typescript
interface MastraConfig {
  agents?: Record<string, Agent>;
  workflows?: Record<string, Workflow>;
  tools?: Record<string, Tool>;
  storage?: Storage;
  memory?: Memory;
  logger?: Logger;
  server?: ServerConfig;
  deployer?: Deployer;
}
```

### Agent

Represents an AI agent with memory, tools, and execution capabilities.

```typescript
class Agent {
  constructor(config: AgentConfig);

  // Core methods
  generate(messages: Message[], options?: GenerateOptions): Promise<GenerateResult>;
  stream(messages: Message[], options?: StreamOptions): Promise<StreamResult>;
  streamVNext(messages: Message[], options?: StreamOptions): Promise<StreamResult>;

  // Configuration access
  getInstructions(options?: { runtimeContext?: RuntimeContext }): Promise<string>;
  getModel(options?: { runtimeContext?: RuntimeContext }): Promise<Model>;
  getTools(options?: { runtimeContext?: RuntimeContext }): Promise<Record<string, Tool>>;
  getMemory(options?: { runtimeContext?: RuntimeContext }): Promise<Memory>;
  getWorkflows(options?: { runtimeContext?: RuntimeContext }): Promise<Record<string, Workflow>>;
  getVoice(options?: { runtimeContext?: RuntimeContext }): Promise<Voice>;

  // Utility methods
  getDescription(): string;
  getName(): string;
  isInitialized(): boolean;
}
```

#### AgentConfig
```typescript
import { BaseMetric } from "@mastra/evals"; // Import BaseMetric for evals property

interface AgentConfig {
  name: string;
  description?: string;
  instructions: string | DynamicArgument<string>;
  model: Model | DynamicArgument<Model>;
  tools?: Record<string, Tool> | DynamicArgument<Record<string, Tool>>;
  memory?: Memory | DynamicArgument<Memory>;
  workflows?: Record<string, Workflow> | DynamicArgument<Record<string, Workflow>>;
  voice?: Voice | DynamicArgument<Voice>;
  inputProcessors?: Processor[];
  outputProcessors?: Processor[];
  onError?: (error: Error, context: any) => Promise<void>;
  circuitBreaker?: CircuitBreakerConfig;
  maxRetries?: number;
  timeout?: number;
  evals?: Record<string, BaseMetric<any>>; // Add evals property
}
```

### Workflow

Manages complex sequences of operations with branching and state management.

```typescript
class Workflow {
  constructor(config: WorkflowConfig);

  // Builder methods
  then(step: Step | Workflow): Workflow;
  parallel(steps: Step[]): Workflow;
  branch(branches: Branch[]): Workflow;
  dountil(step: Step, condition: Condition): Workflow;
  dowhile(step: Step, condition: Condition): Workflow;
  foreach(step: Step, options?: ForeachOptions): Workflow;
  map(transformer: Transformer): Workflow;
  sleep(duration: number | Date | Condition): Workflow;
  sleepUntil(target: Date | Condition): Workflow;
  waitForEvent(eventName: string, step: Step): Workflow;
  sendEvent(eventName: string, step: Step): Workflow;
  bail(result: any): Workflow;

  // Execution methods
  createRunAsync(runId?: string): Promise<Run>;
  execute(inputData: any, options?: ExecuteOptions): Promise<any>;

  // Utility methods
  commit(): Workflow;
  clone(id?: string): Workflow;
  getId(): string;
  getName(): string;
  getDescription(): string;
}
```

#### WorkflowConfig

```typescript
interface WorkflowConfig {
  id: string;
  name?: string;
  description?: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  steps?: Record<string, Step>;
  maxExecutionTime?: number;
  retryPolicy?: RetryPolicy;
  errorHandler?: ErrorHandler;
}
```

### Tool

Represents a reusable function that can be called by agents.

```typescript
class Tool {
  constructor(config: ToolConfig);

  // Execution methods
  execute(input: any, context?: ToolContext): Promise<any>;
  validate(input: any): ValidationResult;
  getSchema(): ToolSchema;

  // Utility methods
  getId(): string;
  getName(): string;
  getDescription(): string;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
}
```

#### ToolConfig

```typescript
interface ToolConfig {
  id: string;
  name?: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  execute: (input: any, context?: ToolContext) => Promise<any>;
  validate?: (input: any) => ValidationResult;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  rateLimit?: RateLimit;
  cache?: CacheConfig;
}
```

## Configuration Classes

### Storage

Handles data persistence and retrieval.

```typescript
class Storage {
  constructor(config: StorageConfig);

  // Message operations
  createMessage(message: Message): Promise<string>;
  getMessage(id: string): Promise<Message>;
  getMessages(filter: MessageFilter): Promise<Message[]>;
  updateMessage(id: string, updates: Partial<Message>): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // Thread operations
  createThread(thread: Thread): Promise<string>;
  getThread(id: string): Promise<Thread>;
  getThreads(filter: ThreadFilter): Promise<Thread[]>;
  updateThread(id: string, updates: Partial<Thread>): Promise<void>;
  deleteThread(id: string): Promise<void>;

  // Resource operations
  createResource(resource: Resource): Promise<string>;
  getResource(id: string): Promise<Resource>;
  getResources(filter: ResourceFilter): Promise<Resource[]>;
  updateResource(id: string, updates: Partial<Resource>): Promise<void>;
  deleteResource(id: string): Promise<void>;

  // Workflow operations
  saveWorkflowSnapshot(workflowId: string, snapshot: WorkflowSnapshot): Promise<void>;
  getWorkflowSnapshot(workflowId: string): Promise<WorkflowSnapshot>;
  listWorkflowSnapshots(workflowId: string): Promise<WorkflowSnapshot[]>;

  // Vector operations
  createVectorIndex(index: VectorIndex): Promise<void>;
  deleteVectorIndex(indexName: string): Promise<void>;
  upsertVectors(indexName: string, vectors: Vector[]): Promise<void>;
  searchVectors(indexName: string, query: VectorQuery): Promise<VectorResult[]>;

  // Utility methods
  healthCheck(): Promise<HealthStatus>;
  getStats(): Promise<StorageStats>;
  optimize(): Promise<void>;
  backup(): Promise<string>;
  restore(backupPath: string): Promise<void>;
}
```

#### StorageConfig

```typescript
interface StorageConfig {
  type: 'libsql' | 'postgres' | 'mysql' | 'mongodb' | 'redis';
  connection: ConnectionConfig;
  options?: StorageOptions;
}
```

### Memory

Manages conversation context and state.

```typescript
class Memory {
  constructor(config: MemoryConfig);

  // Message management
  addMessage(threadId: string, message: Message): Promise<void>;
  getMessages(threadId: string, options?: MessageQuery): Promise<Message[]>;
  updateMessage(threadId: string, messageId: string, updates: Partial<Message>): Promise<void>;
  deleteMessage(threadId: string, messageId: string): Promise<void>;

  // Thread management
  createThread(thread: Thread): Promise<string>;
  getThread(threadId: string): Promise<Thread>;
  updateThread(threadId: string, updates: Partial<Thread>): Promise<void>;
  deleteThread(threadId: string): Promise<void>;
  listThreads(resourceId: string): Promise<Thread[]>;

  // Working memory
  setWorkingMemory(resourceId: string, data: any): Promise<void>;
  getWorkingMemory(resourceId: string): Promise<any>;
  updateWorkingMemory(resourceId: string, updates: any): Promise<void>;
  clearWorkingMemory(resourceId: string): Promise<void>;

  // Semantic recall
  searchSimilar(threadId: string, query: string, options?: SemanticSearchOptions): Promise<Message[]>;
  findRelevantContext(threadId: string, currentMessage: string): Promise<ContextResult>;

  // Memory optimization
  optimizeThread(threadId: string): Promise<void>;
  compressOldMessages(threadId: string, olderThan: Date): Promise<void>;
  archiveThread(threadId: string): Promise<void>;

  // Utility methods
  getStats(resourceId: string): Promise<MemoryStats>;
  healthCheck(): Promise<HealthStatus>;
}
```

#### MemoryConfig

```typescript
interface MemoryConfig {
  storage: Storage;
  options?: {
    maxMessagesPerThread?: number;
    messageRetentionDays?: number;
    semanticRecall?: SemanticRecallConfig;
    workingMemory?: WorkingMemoryConfig;
    compression?: CompressionConfig;
  };
}
```

### Logger

Handles application logging and monitoring.

```typescript
class Logger {
  constructor(config: LoggerConfig);

  // Logging methods
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;

  // Structured logging
  log(level: LogLevel, message: string, meta?: any): void;

  // Child loggers
  child(meta: any): Logger;

  // Query methods
  query(options: LogQuery): Promise<LogEntry[]>;

  // Configuration
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;

  // Transport management
  addTransport(transport: LogTransport): void;
  removeTransport(name: string): void;
  listTransports(): string[];
}
```

#### LoggerConfig

```typescript
interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'simple' | 'pretty';
  transports?: LogTransport[];
  options?: LoggerOptions;
}
```

## Utility Classes

### RuntimeContext

Provides dependency injection and contextual information.

```typescript
class RuntimeContext {
  constructor(initialData?: Record<string, any>);

  // Data management
  set(key: string, value: any): void;
  get<T = any>(key: string): T;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;

  // Bulk operations
  setMultiple(data: Record<string, any>): void;
  getMultiple(keys: string[]): Record<string, any>;
  deleteMultiple(keys: string[]): void;

  // Advanced features
  getWithDefault<T>(key: string, defaultValue: T): T;
  getOrCompute<T>(key: string, computeFn: () => T): T;
  clone(): RuntimeContext;
  merge(other: RuntimeContext): RuntimeContext;

  // Serialization
  toJSON(): Record<string, any>;
  fromJSON(data: Record<string, any>): void;

  // Event handling
  onChange(callback: (key: string, oldValue: any, newValue: any) => void): void;
  offChange(callback: Function): void;
}
```

### Error Classes

```typescript
// Base error class
class MastraError extends Error {
  constructor(message: string, code?: string, cause?: Error);
  readonly code: string;
  readonly cause: Error;
  readonly timestamp: Date;
  readonly context: any;
}

// Specific error types
class AgentError extends MastraError {
  constructor(message: string, agentName: string, cause?: Error);
  readonly agentName: string;
}

class WorkflowError extends MastraError {
  constructor(message: string, workflowId: string, stepId?: string, cause?: Error);
  readonly workflowId: string;
  readonly stepId: string;
}

class ToolError extends MastraError {
  constructor(message: string, toolId: string, cause?: Error);
  readonly toolId: string;
}

class StorageError extends MastraError {
  constructor(message: string, operation: string, cause?: Error);
  readonly operation: string;
}

class ValidationError extends MastraError {
  constructor(message: string, field: string, value: any, cause?: Error);
  readonly field: string;
  readonly value: any;
}

class NetworkError extends MastraError {
  constructor(message: string, url: string, statusCode?: number, cause?: Error);
  readonly url: string;
  readonly statusCode: number;
}

class AuthenticationError extends MastraError {
  constructor(message: string, provider: string, cause?: Error);
  readonly provider: string;
}

class RateLimitError extends MastraError {
  constructor(message: string, limit: number, resetTime: Date, cause?: Error);
  readonly limit: number;
  readonly resetTime: Date;
}
```

## Type Definitions

### Message Types

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  threadId?: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  type: 'file' | 'image' | 'audio' | 'video';
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  data?: Buffer;
}
```

### Tool Context

```typescript
interface ToolContext {
  agent?: Agent;
  workflow?: Workflow;
  runtimeContext?: RuntimeContext;
  abortSignal?: AbortSignal;
  logger?: Logger;
  metrics?: MetricsCollector;
}
```

### Workflow Execution Types

```typescript
interface ExecuteOptions {
  inputData: any;
  runtimeContext?: RuntimeContext;
  abortSignal?: AbortSignal;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

interface Run {
  start(options?: StartOptions): Promise<WorkflowResult>;
  resume(options?: ResumeOptions): Promise<WorkflowResult>;
  stream(options?: StreamOptions): Promise<StreamResult>;
  streamVNext(options?: StreamOptions): Promise<StreamResult>;
  watch(callback: WatchCallback, type?: WatchType): UnwatchFunction;
  cancel(): Promise<void>;
  getStatus(): WorkflowStatus;
  getResult(): Promise<WorkflowResult>;
}

interface WorkflowResult {
  status: 'success' | 'failed' | 'suspended';
  result?: any;
  error?: Error;
  steps: Record<string, StepResult>;
  suspended?: Array<[string]>;
  executionTime: number;
  startTime: Date;
  endTime?: Date;
}

interface StepResult {
  status: 'success' | 'failed' | 'suspended' | 'running';
  result?: any;
  error?: Error;
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  attempts: number;
}
```

### Storage Types

```typescript
interface MessageFilter {
  threadId?: string;
  resourceId?: string;
  role?: MessageRole;
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'id';
  orderDirection?: 'asc' | 'desc';
}

interface Thread {
  id: string;
  resourceId: string;
  title?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessageAt?: Date;
}

interface VectorIndex {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  options?: Record<string, any>;
}

interface Vector {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
  content?: string;
}

interface VectorQuery {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  includeVectors?: boolean;
}

interface VectorResult {
  id: string;
  score: number;
  vector?: number[];
  metadata?: Record<string, any>;
  content?: string;
}
```

### Configuration Types

```typescript
interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

interface RateLimit {
  requests: number;
  period: number; // milliseconds
  strategy?: 'fixed-window' | 'sliding-window' | 'token-bucket';
}

interface CacheConfig {
  ttl: number;
  maxSize?: number;
  strategy?: 'lru' | 'lfu' | 'fifo';
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  checks: Record<string, CheckResult>;
  message?: string;
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  timestamp: number;
  duration: number;
  message?: string;
  details?: any;
}
```

## Integration APIs

### MCP (Model Context Protocol)

```typescript
interface MCPServer {
  registerTool(tool: Tool): void;
  registerWorkflow(workflow: Workflow): void;
  registerAgent(agent: Agent): void;
  start(port?: number): Promise<void>;
  stop(): Promise<void>;
  getTools(): Promise<Tool[]>;
  getWorkflows(): Promise<Workflow[]>;
  getAgents(): Promise<Agent[]>;
}

interface MCPClient {
  connect(serverUrl: string): Promise<void>;
  disconnect(): Promise<void>;
  listTools(): Promise<ToolInfo[]>;
  listWorkflows(): Promise<WorkflowInfo[]>;
  listAgents(): Promise<AgentInfo[]>;
  callTool(toolName: string, input: any): Promise<any>;
  executeWorkflow(workflowName: string, input: any): Promise<any>;
  chatWithAgent(agentName: string, messages: Message[]): Promise<Message>;
}
```

### Webhook Integration

```typescript
interface WebhookHandler {
  registerHandler(eventType: string, handler: WebhookEventHandler): void;
  unregisterHandler(eventType: string): void;
  handleWebhook(request: WebhookRequest): Promise<WebhookResponse>;
  validateSignature(request: WebhookRequest): Promise<boolean>;
  listHandlers(): string[];
}

interface WebhookEventHandler {
  (payload: any, headers: Record<string, string>): Promise<any>;
}

interface WebhookRequest {
  body: string;
  headers: Record<string, string>;
  method: string;
  url: string;
  query: Record<string, string>;
}

interface WebhookResponse {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
}
```

### Streaming APIs

```typescript
interface StreamResult {
  textStream: AsyncGenerator<string>;
  fullStream: Promise<ReadableStream>;
  text: Promise<string>;
  usage: Promise<TokenUsage>;
  finishReason: Promise<string>;
  toolCalls: Promise<ToolCall[]>;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  error?: Error;
}
```

### Metrics and Monitoring

```typescript
interface MetricsCollector {
  increment(counter: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;

  getCounter(counter: string, tags?: Record<string, string>): number;
  getGauge(gauge: string, tags?: Record<string, string>): number;
  getHistogram(histogram: string, tags?: Record<string, string>): HistogramData;

  export(): Promise<MetricsData>;
  reset(): void;
}

interface HistogramData {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  stddev: number;
  percentiles: Record<number, number>;
}

interface MetricsData {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramData>;
  timestamp: number;
}
```

## Usage Examples

### Basic Agent Usage

```typescript
import { Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

const mastra = new Mastra({
  agents: {
    'research-agent': new Agent({
      name: 'research-agent',
      instructions: 'You are a research assistant...',
      model: openai('gpt-4o'),
      tools: {
        webSearch: webSearchTool
      }
    })
  }
});

const agent = mastra.getAgent('research-agent');
const result = await agent.generate([{
  role: 'user',
  content: 'Research quantum computing trends'
}]);
```

### Workflow Execution

```typescript
const workflow = mastra.getWorkflow('research-workflow');
const run = await workflow.createRunAsync();

const result = await run.start({
  inputData: {
    query: 'AI advancements 2024',
    depth: 'comprehensive'
  }
});

if (result.status === 'suspended') {
  // Handle user approval
  const finalResult = await run.resume({
    step: result.suspended[0],
    resumeData: { approved: true }
  });
}
```

### Tool Integration

```typescript
const searchTool = mastra.getTool('web-search');
const results = await searchTool.execute({
  input: {
    query: 'machine learning research',
    limit: 10
  }
});
```

### Memory Management

```typescript
const memory = mastra.getMemory();
await memory.addMessage('thread-123', {
  role: 'user',
  content: 'What are the latest AI developments?',
  threadId: 'thread-123'
});

const context = await memory.getMessages('thread-123', {
  limit: 10
});
```

---

*This API reference provides comprehensive documentation for all classes, methods, interfaces, and types in the Mastra Deep Research System. For the latest updates and additional examples, refer to the source code and official Mastra documentation.*