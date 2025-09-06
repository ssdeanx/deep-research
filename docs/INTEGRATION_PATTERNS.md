# Integration Patterns for External APIs and Services

This guide provides comprehensive patterns and best practices for integrating external APIs and services into your Mastra deep research system.

## Integration Architecture Overview

### Layered Integration Approach

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  - Business Logic & Orchestration   │
├─────────────────────────────────────┤
│        Integration Layer            │
│  - API Clients & Service Adapters   │
│  - Rate Limiting & Circuit Breakers │
│  - Error Handling & Retry Logic     │
├─────────────────────────────────────┤
│          Protocol Layer             │
│  - HTTP/HTTPS, WebSocket, GraphQL   │
│  - Authentication & Authorization   │
│  - Request/Response Transformation  │
├─────────────────────────────────────┤
│        External Services             │
│  - Third-party APIs & Services      │
└─────────────────────────────────────┘
```

### Mastra vNext Agent Networks

The Mastra vNext Agent Network (`NewAgentNetwork`) provides a powerful integration pattern by orchestrating multiple specialized agents and workflows. This enables dynamic routing of tasks to the most appropriate component, effectively acting as an intelligent integration layer.

```typescript
import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { Agent } from '@mastra/core/agent';
import { createWorkflow } from '@mastra/core/workflows';
import { Memory } from '@mastra/memory';
// ... other imports

const myResearchAgent = new Agent({ /* ... */ });
const myReportingWorkflow = createWorkflow({ /* ... */ }).commit();
const myMemory = new Memory({ /* ... */ });

const myNetwork = new NewAgentNetwork({
  id: 'my-intelligent-network',
  name: 'My Intelligent Network',
  instructions: 'You are an intelligent orchestrator of research and reporting tasks.',
  agents: { myResearchAgent },
  workflows: { myReportingWorkflow },
  memory: myMemory,
});
```

## Core Integration Patterns

### 1. Adapter Pattern for API Integration

```typescript
// Base adapter interface
interface ApiAdapter<TConfig = any> {
  name: string;
  version: string;
  configure(config: TConfig): void;
  healthCheck(): Promise<HealthStatus>;
  dispose(): Promise<void>;
}

// Generic API client with adapter pattern
class ApiClient<TConfig, TRequest, TResponse> implements ApiAdapter<TConfig> {
  private client: AxiosInstance;
  private config: TConfig;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor(baseURL: string, config: TConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mastra-Deep-Research/1.0'
      }
    });

    this.rateLimiter = new RateLimiter({
      requests: 100,
      period: 60000 // 1 minute
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      return this.authenticateRequest(config);
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }

  async request(request: TRequest): Promise<TResponse> {
    await this.rateLimiter.waitForSlot();

    return this.circuitBreaker.execute(async () => {
      const response = await this.client.request(this.transformRequest(request));
      return this.transformResponse(response.data);
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.client.get('/health');
      return { status: 'healthy', timestamp: Date.now() };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async dispose(): Promise<void> {
    // Cleanup resources
    this.client = null;
    this.rateLimiter = null;
    this.circuitBreaker = null;
  }

  protected authenticateRequest(config: any): any {
    // Override in subclasses for specific auth methods
    return config;
  }

  protected transformRequest(request: TRequest): any {
    // Override in subclasses for request transformation
    return request;
  }

  protected transformResponse(data: any): TResponse {
    // Override in subclasses for response transformation
    return data;
  }

  protected handleApiError(error: any): never {
    // Enhanced error handling
    if (error.response) {
      throw new ApiError(
        `API Error: ${error.response.status}`,
        error.response.status,
        error.response.data
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout');
    }

    throw new NetworkError(`Network error: ${error.message}`);
  }
}
```

### 2. Service Registry Pattern

```typescript
// Service registry for managing multiple integrations
class ServiceRegistry {
  private services = new Map<string, ApiAdapter>();
  private healthMonitor: HealthMonitor;

  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.startHealthMonitoring();
  }

  register<T extends ApiAdapter>(name: string, service: T): void {
    this.services.set(name, service);
    this.healthMonitor.addService(name, service);
  }

  get<T extends ApiAdapter>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(`Service '${name}' not found`);
    }
    return service as T;
  }

  async getHealthy<T extends ApiAdapter>(name: string): Promise<T> {
    const service = this.get<T>(name);
    const health = await service.healthCheck();

    if (health.status !== 'healthy') {
      throw new ServiceUnavailableError(`Service '${name}' is unhealthy`);
    }

    return service;
  }

  listServices(): string[] {
    return Array.from(this.services.keys());
  }

  async getHealthStatus(): Promise<Record<string, HealthStatus>> {
    const healthChecks = Array.from(this.services.entries()).map(
      async ([name, service]) => [name, await service.healthCheck()]
    );

    const results = await Promise.all(healthChecks);
    return Object.fromEntries(results);
  }

  private startHealthMonitoring() {
    setInterval(async () => {
      const healthStatus = await this.getHealthStatus();

      for (const [serviceName, health] of Object.entries(healthStatus)) {
        if (health.status === 'unhealthy') {
          console.warn(`Service ${serviceName} is unhealthy:`, health.error);
          // Send alert or take corrective action
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async dispose(): Promise<void> {
    for (const service of this.services.values()) {
      await service.dispose();
    }
    this.services.clear();
  }
}

// Usage
const registry = new ServiceRegistry();

// Register services
registry.register('openai', new OpenAIClient(config));
registry.register('anthropic', new AnthropicClient(config));
registry.register('google', new GoogleAIClient(config));

// Use services
const openai = await registry.getHealthy<OpenAIClient>('openai');
const result = await openai.generateCompletion(prompt);
```

## Specific Integration Examples

### 1. Search Engine Integration

```typescript
// Exa API integration for web search
class ExaSearchClient extends ApiClient<ExaConfig, SearchRequest, SearchResponse> {
  constructor(config: ExaConfig) {
    super('https://api.exa.ai', config);
  }

  protected authenticateRequest(config: any): any {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    };
  }

  protected transformRequest(request: SearchRequest): any {
    return {
      query: request.query,
      numResults: request.limit || 10,
      includeDomains: request.domains,
      excludeDomains: request.excludeDomains,
      startDate: request.startDate,
      endDate: request.endDate,
      contents: {
        text: true,
        highlights: true,
        summary: true
      }
    };
  }

  protected transformResponse(data: any): SearchResponse {
    return {
      results: data.results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.contents?.text,
        highlights: result.contents?.highlights,
        summary: result.contents?.summary,
        publishedDate: result.publishedDate,
        author: result.author,
        score: result.score
      })),
      total: data.total,
      query: data.query
    };
  }
}

// Integration with research workflow
const exaSearch = new ExaSearchClient({
  apiKey: process.env.EXA_API_KEY,
  rateLimit: { requests: 10, period: 60000 }
});

const searchTool = createTool({
  id: 'web-search',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().optional(),
    domains: z.array(z.string()).optional()
  }),
  execute: async ({ inputData }) => {
    const results = await exaSearch.request({
      query: inputData.query,
      limit: inputData.limit || 10,
      domains: inputData.domains
    });

    return {
      output: results.results,
      total: results.total
    };
  }
});
```

### 2. Academic Database Integration

```typescript
// Semantic Scholar API integration
class SemanticScholarClient extends ApiClient<SemanticScholarConfig, PaperRequest, PaperResponse> {
  constructor(config: SemanticScholarConfig) {
    super('https://api.semanticscholar.org', config);
  }

  async searchPapers(query: string, options: SearchOptions = {}): Promise<PaperResponse> {
    return this.request({
      query,
      limit: options.limit || 10,
      fields: [
        'title',
        'abstract',
        'authors',
        'year',
        'venue',
        'citationCount',
        'influentialCitationCount',
        'url',
        'openAccessPdf'
      ].join(',')
    });
  }

  async getPaperDetails(paperId: string): Promise<PaperDetails> {
    const response = await this.client.get(`/graph/v1/paper/${paperId}`, {
      params: {
        fields: 'title,abstract,authors,year,venue,citations,references'
      }
    });

    return this.transformPaperDetails(response.data);
  }

  private transformPaperDetails(data: any): PaperDetails {
    return {
      id: data.paperId,
      title: data.title,
      abstract: data.abstract,
      authors: data.authors?.map((author: any) => ({
        name: author.name,
        affiliations: author.affiliations
      })),
      year: data.year,
      venue: data.venue,
      citationCount: data.citationCount,
      url: data.url,
      openAccessPdf: data.openAccessPdf,
      citations: data.citations?.slice(0, 10), // Limit to top 10
      references: data.references?.slice(0, 10)
    };
  }
}

// Academic research tool
const academicSearchTool = createTool({
  id: 'academic-search',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().optional(),
    yearStart: z.number().optional(),
    yearEnd: z.number().optional()
  }),
  execute: async ({ inputData }) => {
    const semanticScholar = new SemanticScholarClient({
      apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY
    });

    const results = await semanticScholar.searchPapers(inputData.query, {
      limit: inputData.limit || 5,
      yearStart: inputData.yearStart,
      yearEnd: inputData.yearEnd
    });

    return {
      output: results.data.map(paper => ({
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        year: paper.year,
        venue: paper.venue,
        citationCount: paper.citationCount,
        url: paper.url
      })),
      total: results.total
    };
  }
});
```

### 3. Social Media and News Integration

```typescript
// Twitter/X API integration
class TwitterClient extends ApiClient<TwitterConfig, TweetRequest, TweetResponse> {
  constructor(config: TwitterConfig) {
    super('https://api.twitter.com/2', config);
  }

  protected authenticateRequest(config: any): any {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${this.config.bearerToken}`
      }
    };
  }

  async searchTweets(query: string, options: TweetSearchOptions = {}): Promise<TweetResponse> {
    return this.request({
      endpoint: '/tweets/search/recent',
      params: {
        query,
        max_results: options.limit || 10,
        'tweet.fields': 'created_at,author_id,text,public_metrics,entities',
        'user.fields': 'username,name,verified',
        'expansions': 'author_id'
      }
    });
  }

  async getUserTweets(userId: string, options: UserTweetsOptions = {}): Promise<TweetResponse> {
    return this.request({
      endpoint: `/users/${userId}/tweets`,
      params: {
        max_results: options.limit || 10,
        'tweet.fields': 'created_at,text,public_metrics',
        exclude: 'replies'
      }
    });
  }
}

// News API integration
class NewsAPIClient extends ApiClient<NewsAPIConfig, NewsRequest, NewsResponse> {
  constructor(config: NewsAPIConfig) {
    super('https://newsapi.org/v2', config);
  }

  protected authenticateRequest(config: any): any {
    return {
      ...config,
      params: {
        ...config.params,
        apiKey: this.config.apiKey
      }
    };
  }

  async getTopHeadlines(options: HeadlineOptions = {}): Promise<NewsResponse> {
    return this.request({
      endpoint: '/top-headlines',
      params: {
        country: options.country || 'us',
        category: options.category,
        q: options.query,
        pageSize: options.limit || 20
      }
    });
  }

  async searchNews(query: string, options: NewsSearchOptions = {}): Promise<NewsResponse> {
    return this.request({
      endpoint: '/everything',
      params: {
        q: query,
        from: options.from,
        to: options.to,
        sortBy: options.sortBy || 'relevancy',
        pageSize: options.limit || 20,
        language: options.language || 'en'
      }
    });
  }
}

// Social media research tool
const socialMediaTool = createTool({
  id: 'social-media-research',
  inputSchema: z.object({
    query: z.string(),
    platforms: z.array(z.enum(['twitter', 'news'])).default(['twitter', 'news']),
    limit: z.number().optional()
  }),
  execute: async ({ inputData }) => {
    const results = { twitter: [], news: [] };

    if (inputData.platforms.includes('twitter')) {
      const twitter = new TwitterClient({
        bearerToken: process.env.TWITTER_BEARER_TOKEN
      });

      try {
        const tweets = await twitter.searchTweets(inputData.query, {
          limit: inputData.limit || 10
        });
        results.twitter = tweets.data;
      } catch (error) {
        console.warn('Twitter search failed:', error.message);
      }
    }

    if (inputData.platforms.includes('news')) {
      const news = new NewsAPIClient({
        apiKey: process.env.NEWS_API_KEY
      });

      try {
        const articles = await news.searchNews(inputData.query, {
          limit: inputData.limit || 10
        });
        results.news = articles.articles;
      } catch (error) {
        console.warn('News search failed:', error.message);
      }
    }

    return { output: results };
  }
});
```

## Advanced Integration Patterns

### 1. Webhook Integration

```typescript
// Webhook handler for real-time updates
class WebhookHandler {
  private handlers = new Map<string, WebhookHandlerFunction>();
  private security: WebhookSecurity;

  constructor() {
    this.security = new WebhookSecurity();
  }

  registerHandler(eventType: string, handler: WebhookHandlerFunction): void {
    this.handlers.set(eventType, handler);
  }

  async handleWebhook(request: WebhookRequest): Promise<WebhookResponse> {
    try {
      // Verify webhook signature
      await this.security.verifySignature(request);

      // Parse webhook payload
      const payload = this.parsePayload(request);

      // Route to appropriate handler
      const handler = this.handlers.get(payload.eventType);
      if (!handler) {
        throw new Error(`No handler registered for event: ${payload.eventType}`);
      }

      // Process webhook
      const result = await handler(payload);

      return {
        status: 'success',
        result
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private parsePayload(request: WebhookRequest): WebhookPayload {
    // Parse and validate webhook payload
    return JSON.parse(request.body);
  }
}

// GitHub webhook integration
const githubWebhookHandler = new WebhookHandler();

// Register handlers for different GitHub events
githubWebhookHandler.registerHandler('push', async (payload) => {
  // Process repository updates
  await processGitHubPush(payload);
});

githubWebhookHandler.registerHandler('pull_request', async (payload) => {
  // Process pull request events
  await processPullRequest(payload);
});

// Express route for webhook
app.post('/webhooks/github', async (req, res) => {
  const result = await githubWebhookHandler.handleWebhook({
    body: req.body,
    headers: req.headers,
    signature: req.headers['x-hub-signature-256']
  });

  res.status(result.status === 'success' ? 200 : 400).json(result);
});
```

### 2. Streaming Data Integration

```typescript
// Real-time data streaming integration
class StreamingDataClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string, private config: StreamingConfig) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Streaming connection established');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('Streaming connection closed');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Streaming connection error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any): void {
    // Process streaming data
    switch (data.type) {
      case 'research-update':
        this.handleResearchUpdate(data.payload);
        break;
      case 'market-data':
        this.handleMarketData(data.payload);
        break;
      case 'social-media':
        this.handleSocialMediaData(data.payload);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Real-time research updates
const streamingClient = new StreamingDataClient('wss://api.research-stream.com', {
  authToken: process.env.STREAM_API_TOKEN
});

// Connect and handle real-time updates
await streamingClient.connect();

// Subscribe to research topics
streamingClient.send({
  type: 'subscribe',
  topics: ['ai-research', 'quantum-computing', 'machine-learning']
});
```

### 3. GraphQL Integration

```typescript
// GraphQL client for complex data fetching
class GraphQLClient extends ApiClient<GraphQLConfig, GraphQLRequest, GraphQLResponse> {
  constructor(config: GraphQLConfig) {
    super(config.endpoint, config);
  }

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request({
      query,
      variables
    });

    if (response.errors) {
      throw new GraphQLError('GraphQL query failed', response.errors);
    }

    return response.data;
  }

  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request({
      query: mutation,
      variables
    });

    if (response.errors) {
      throw new GraphQLError('GraphQL mutation failed', response.errors);
    }

    return response.data;
  }

  protected transformRequest(request: GraphQLRequest): any {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      },
      body: JSON.stringify(request)
    };
  }

  protected transformResponse(data: any): GraphQLResponse {
    return data;
  }
}

// GitHub GraphQL integration
const githubGraphQL = new GraphQLClient({
  endpoint: 'https://api.github.com/graphql',
  headers: {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
  }
});

// Complex research repository analysis
const researchReposQuery = `
  query GetResearchRepos($query: String!, $first: Int!) {
    search(query: $query, type: REPOSITORY, first: $first) {
      edges {
        node {
          ... on Repository {
            name
            description
            stargazers {
              totalCount
            }
            forks {
              totalCount
            }
            updatedAt
            languages(first: 5) {
              edges {
                node {
                  name
                }
              }
            }
            issues(states: OPEN) {
              totalCount
            }
          }
        }
      }
    }
  }
`;

const githubResearchTool = createTool({
  id: 'github-research',
  inputSchema: z.object({
    topic: z.string(),
    limit: z.number().optional()
  }),
  execute: async ({ inputData }) => {
    const result = await githubGraphQL.query(researchReposQuery, {
      query: `topic:${inputData.topic} stars:>10`,
      first: inputData.limit || 10
    });

    return {
      output: result.search.edges.map(edge => ({
        name: edge.node.name,
        description: edge.node.description,
        stars: edge.node.stargazers.totalCount,
        forks: edge.node.forks.totalCount,
        languages: edge.node.languages.edges.map(lang => lang.node.name),
        openIssues: edge.node.issues.totalCount,
        updatedAt: edge.node.updatedAt
      }))
    };
  }
});
```

## Integration Testing and Monitoring

### Comprehensive Integration Testing

```typescript
// Integration test suite
class IntegrationTestSuite {
  private registry: ServiceRegistry;
  private mockServer: MockServer;

  constructor() {
    this.registry = new ServiceRegistry();
    this.mockServer = new MockServer();
  }

  async runIntegrationTests() {
    console.log('Running integration tests...');

    const tests = [
      this.testApiConnectivity(),
      this.testRateLimiting(),
      this.testCircuitBreaker(),
      this.testErrorHandling(),
      this.testDataTransformation()
    ];

    const results = await Promise.allSettled(tests);

    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Integration tests: ${passed} passed, ${failed} failed`);

    return { passed, failed, results };
  }

  // Agent Evals for Integration Testing
  // Agent evaluation metrics can be integrated into these tests to automatically assess
  // the quality of responses from agents that interact with external APIs, ensuring
  // data consistency, completeness, and adherence to expected formats.
  // This enhances the overall reliability of integrated components.

  private async testApiConnectivity() {
    // Test basic API connectivity
    const services = this.registry.listServices();

    for (const serviceName of services) {
      const service = await this.registry.getHealthy(serviceName);
      const health = await service.healthCheck();

      if (health.status !== 'healthy') {
        throw new Error(`Service ${serviceName} is unhealthy: ${health.error}`);
      }
    }
  }

  private async testRateLimiting() {
    // Test rate limiting behavior
    const service = await this.registry.getHealthy('test-service');

    const requests = Array(150).fill(null).map(() =>
      service.request({ type: 'test' })
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(requests);
    const duration = Date.now() - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const rateLimited = results.filter(r =>
      r.status === 'rejected' && r.reason?.code === 'RATE_LIMIT'
    ).length;

    console.log(`Rate limiting test: ${successful} successful, ${rateLimited} rate limited in ${duration}ms`);
  }

  private async testCircuitBreaker() {
    // Test circuit breaker functionality
    const service = await this.registry.getHealthy('test-service');

    // Simulate failures
    this.mockServer.simulateFailures('test-service', 5);

    // Try requests that should trigger circuit breaker
    for (let i = 0; i < 10; i++) {
      try {
        await service.request({ type: 'test' });
      } catch (error) {
        if (error.message.includes('Circuit breaker is open')) {
          console.log('Circuit breaker activated correctly');
          break;
        }
      }
    }
  }

  private async testErrorHandling() {
    // Test error handling and recovery
    const service = await this.registry.getHealthy('test-service');

    // Test various error scenarios
    const errorScenarios = [
      { type: 'network-error', expectRetry: true },
      { type: 'timeout', expectRetry: true },
      { type: 'auth-error', expectRetry: false },
      { type: 'server-error', expectRetry: true }
    ];

    for (const scenario of errorScenarios) {
      this.mockServer.simulateError('test-service', scenario.type);

      try {
        await service.request({ type: 'test' });
      } catch (error) {
        console.log(`Error scenario ${scenario.type}: ${error.message}`);
      }
    }
  }

  private async testDataTransformation() {
    // Test request/response transformation
    const service = await this.registry.getHealthy('test-service');

    const testData = {
      input: 'test input',
      expectedOutput: 'transformed output'
    };

    const result = await service.request(testData);

    if (result !== testData.expectedOutput) {
      throw new Error(`Data transformation failed: expected ${testData.expectedOutput}, got ${result}`);
    }
  }
}

// Run integration tests
const testSuite = new IntegrationTestSuite();
await testSuite.runIntegrationTests();
```

## Best Practices and Guidelines

### 1. Error Handling and Resilience

```typescript
// Comprehensive error handling strategy
class IntegrationErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = () => true
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }

        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status codes
    if (error.response?.status >= 500) {
      return true;
    }

    // Rate limiting
    if (error.response?.status === 429) {
      return true;
    }

    return false;
  }
}
```

### 2. Security Best Practices

```typescript
// Secure API integration
class SecureApiClient extends ApiClient {
  private encryption: EncryptionService;
  private auditLogger: AuditLogger;

  constructor(config: SecureApiConfig) {
    super(config.baseURL, config);
    this.encryption = new EncryptionService(config.encryptionKey);
    this.auditLogger = new AuditLogger();
  }

  protected authenticateRequest(config: any): any {
    // Add secure authentication
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');

    const signature = this.generateSignature(
      config.method,
      config.url,
      config.data,
      timestamp,
      nonce
    );

    return {
      ...config,
      headers: {
        ...config.headers,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'X-API-Key': this.config.apiKey
      }
    };
  }

  private generateSignature(method: string, url: string, data: any, timestamp: number, nonce: string): string {
    const payload = `${method}${url}${JSON.stringify(data)}${timestamp}${nonce}`;
    return crypto.createHmac('sha256', this.config.secretKey)
      .update(payload)
      .digest('hex');
  }

  async request(request: any): Promise<any> {
    // Log audit trail
    await this.auditLogger.log({
      action: 'api_request',
      endpoint: request.url,
      timestamp: Date.now(),
      userId: this.config.userId
    });

    // Encrypt sensitive data
    if (request.sensitiveData) {
      request.sensitiveData = await this.encryption.encrypt(request.sensitiveData);
    }

    const response = await super.request(request);

    // Decrypt sensitive response data
    if (response.encryptedData) {
      response.encryptedData = await this.encryption.decrypt(response.encryptedData);
    }

    return response;
  }
}
```

### 3. Performance Optimization

```typescript
// Performance-optimized integration client
class OptimizedApiClient extends ApiClient {
  private connectionPool: ConnectionPool;
  private responseCache: ResponseCache;
  private metricsCollector: MetricsCollector;

  constructor(config: OptimizedApiConfig) {
    super(config.baseURL, config);
    this.connectionPool = new ConnectionPool(config.poolSize || 10);
    this.responseCache = new ResponseCache(config.cacheConfig);
    this.metricsCollector = new MetricsCollector();
  }

  async request(request: any): Promise<any> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResponse = await this.responseCache.get(cacheKey);
    if (cachedResponse) {
      this.metricsCollector.record('cache_hit');
      return cachedResponse;
    }

    // Get connection from pool
    const connection = await this.connectionPool.getConnection();

    try {
      const response = await super.request(request);

      // Cache successful responses
      if (this.isCacheable(request, response)) {
        await this.responseCache.set(cacheKey, response, this.getCacheTTL(request));
      }

      const duration = performance.now() - startTime;
      this.metricsCollector.record('request_duration', duration);

      return response;
    } finally {
      this.connectionPool.releaseConnection(connection);
    }
  }

  private generateCacheKey(request: any): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify({
        url: request.url,
        method: request.method,
        params: request.params,
        data: request.data
      }))
      .digest('hex');
  }

  private isCacheable(request: any, response: any): boolean {
    // Don't cache mutations or errors
    if (request.method !== 'GET' || response.status >= 400) {
      return false;
    }

    // Check cache control headers
    const cacheControl = response.headers['cache-control'];
    if (cacheControl?.includes('no-cache')) {
      return false;
    }

    return true;
  }

  private getCacheTTL(request: any): number {
    // Default 5 minutes, customizable per endpoint
    const endpointTTLs = {
      '/api/search': 10 * 60 * 1000, // 10 minutes
      '/api/user': 60 * 60 * 1000,   // 1 hour
    };

    return endpointTTLs[request.url] || 5 * 60 * 1000;
  }
}
```

---

*This integration patterns guide provides comprehensive strategies for integrating external APIs and services into your Mastra deep research system. The patterns emphasize reliability, security, performance, and maintainability.*