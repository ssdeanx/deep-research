# AI Memory Management - Rules and Guidelines

## 1. Memory Definition and Purpose

AI Memory within this project serves as the persistent and contextual storage for agents and workflows. It enables agents to maintain conversation history, retrieve relevant information, and manage state across interactions. Effective memory management is crucial for coherent, informed, and efficient agent operation.

## 2. Core Memory Architecture Principles

All memory implementations must adhere to the following architectural principles:

* **LibSQL as Primary Store**: Memory data is primarily stored using `LibSQLStore` for structured data and `LibSQLVector` for vector embeddings, ensuring robust and scalable storage.
* **Type Safety and Validation**: All memory inputs, outputs, and internal structures must be fully type-safe using TypeScript, with appropriate schema validation (e.g., Zod for user profiles).
* **Modularity and Processors**: Memory functionality is extended and optimized through a chain of `MemoryProcessor` instances. Each processor should have a single, well-defined responsibility.
* **Observability**: Memory operations must integrate with tracing contexts and utilize `PinoLogger` for comprehensive logging, monitoring, and debugging. This includes creating child spans for significant operations like initialization, upserts, and queries.

## 3. Memory Development Lifecycle

### 3.1 Design and Implementation

* **Memory Configuration**: When creating memory instances (e.g., `createResearchMemory`, `createReportMemory`), ensure proper configuration of:
  * `storage`: An instance of `LibSQLStore`.
  * `vector`: An instance of `LibSQLVector`.
  * `embedder`: A text embedding model (e.g., `google.textEmbedding("gemini-embedding-001")`) for vectorization.
  * `options`: Define `lastMessages`, `workingMemory` templates, `semanticRecall` configurations (`topK`, `messageRange`, `scope`), and `threads` settings (`generateTitle`).
  * `processors`: A list of `MemoryProcessor` instances applied in sequence to optimize context.
* **Working Memory Templates**: Define clear and comprehensive templates for `workingMemory` that guide agents on what contextual information to retain and prioritize (e.g., User Task, Target Audience, Key Findings, Client Requirements).
* **Semantic Recall**: Configure `semanticRecall` parameters (`topK`, `messageRange`, `scope`) to ensure efficient and relevant retrieval of historical messages based on vector similarity.
* **Vector Indexing**: Initialize and manage vector indexes (`RESEARCH_DOCUMENTS`, `WEB_CONTENT`, `LEARNINGS`, `REPORTS`) using `initializeVectorIndexes` and `createVectorIndex`. Ensure appropriate dimensions and similarity metrics are set.
* **Resource Management**: Implement logic for managing user resources, including creation (`getOrCreateUserResource`) and updates (`updateUserWorkingMemory`), ensuring consistent data structures and metadata handling.

### 3.2 Key Memory Processors

The following memory processors are available and should be utilized as appropriate:

* **`TokenLimiterProcessor`**: Filters messages to ensure the total token count does not exceed a predefined limit, preventing context overflow and optimizing token usage.
* **`ErrorCorrectionProcessor`**: Deduplicates research results and messages using content checksums, ensuring memory integrity and preventing redundant information.
* **`HierarchicalMemoryProcessor`**: Distinguishes and filters between short-term episodic memory (recent, detailed interactions) and long-term semantic memory (generalized knowledge, research findings) based on content length and relevance.
* **`PersonalizationProcessor`**: Prioritizes messages relevant to user preferences, detected entities (names, titles, professions), and specified keywords, enhancing contextual relevance.
* **`CitationExtractorProcessor`**: Identifies and prioritizes messages containing citations, URLs, academic terms, or direct quotes, crucial for research and reporting.
* **`MultiPerspectiveProcessor`**: Scores and filters messages based on different viewpoints (e.g., technical, ethical, practical), facilitating comprehensive analysis.
* **`TemporalReasoningProcessor`**: Handles time-based relationships between findings and maintains chronological context, filtering messages outside a specified time window.
* **`UncertaintyQuantificationProcessor`**: Identifies and retains messages that discuss uncertainty, confidence, probability, or present questions, supporting nuanced analysis.
* **`KnowledgeGraphProcessor`**: Focuses on messages containing terms indicative of relationships, networks, and entities, aiding in the construction of dynamic knowledge graphs.
* **`BayesianBeliefProcessor`**: Prioritizes messages that discuss beliefs, hypotheses, evidence, and probability updates, supporting Bayesian reasoning.
* **`CircuitBreakerProcessor`**: Provides fault tolerance for memory operations, preventing cascading failures and implementing retry mechanisms with exponential backoff.

### 3.3 Error Handling and Recovery

* **Robust Error Handling**: Implement comprehensive `try-catch` blocks around memory operations (storage, vector store interactions) to gracefully handle failures.
* **Informative Logging**: Use `PinoLogger` to log errors with descriptive messages and relevant context (e.g., `VectorStoreError` for vector store specific issues).
* **Health Checks**: Utilize `performStorageHealthCheck` to verify the connectivity and functionality of both the `LibSQLStore` and `LibSQLVector` indexes, especially during system initialization.

### 3.4 Performance and Efficiency

* **Token Optimization**: Leverage `TokenLimiterProcessor` and concise message content to optimize token usage.
* **Caching**: Implement caching strategies for frequently accessed content and expensive operations (e.g., `contentCache`, `lowercaseCache`, `similarityCache`, `patternCache` in memory processors).
* **Batch Processing**: Optimize vector operations (e.g., `embedMany`, `upsertVectors`) for efficiency where applicable.

### 3.5 Security and Data Protection

* **Input/Output Validation**: Validate all inputs to memory functions and filter outputs to prevent data corruption or leakage.
* **Sensitive Data Masking**: Mask sensitive information (e.g., auth tokens) in logs and tracing spans.
* **Access Control**: Ensure memory operations adhere to appropriate access controls for different agent types or users.

## 4. Memory Usage Guidelines

* **Agent-Specific Memory**: Each agent should be configured with a memory instance tailored to its specific needs, using the appropriate `create...Memory` function (e.g., `createResearchMemory`, `createReportMemory`) and a curated set of processors.
* **Contextual Relevance**: Always strive to keep memory contextually relevant to the agent's current task. Overloading memory with irrelevant information degrades performance and can lead to suboptimal agent responses.
* **Thread Management**: Utilize thread management features (e.g., `generateTitle` for threads) to organize and retrieve conversational contexts effectively.
* **Proactive Management**: Actively manage memory by updating user profiles, clearing outdated information, and refining processor configurations as agent capabilities evolve.
