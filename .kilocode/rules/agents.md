# AI Agents - Rules and Guidelines

## 1. Agent Definition and Purpose

AI Agents within this project are specialized, autonomous entities designed to perform specific tasks within the research and content generation pipeline. Each agent embodies a distinct capability, leveraging AI models and a curated set of tools to achieve its objectives.

## 2. Core Agent Architecture Principles

All agents must adhere to the following architectural principles to ensure consistency, maintainability, and scalability:

* **Specialized Instructions**: Each agent must be equipped with a clear, concise, and domain-specific system prompt or instructions. These instructions define the agent's role, objectives, behavioral guidelines, and constraints.
* **Tool Integration**: Agents must integrate with a defined set of tools relevant to their specialized tasks. Tool usage should be systematic and aligned with the agent's instructions.
* **Memory Management**: Agents must utilize context optimization techniques, typically through specialized memory processors, to manage conversation history, retrieve relevant information, and maintain state.
* **Error Handling**: Robust error detection, logging, and recovery mechanisms are mandatory. Agents should gracefully handle tool failures, API limits, content issues, and memory constraints, providing informative feedback and implementing retry strategies where appropriate.
* **Type Safety and Validation**: All agent inputs, outputs, and internal data structures must be fully type-safe using TypeScript, with schema validation (e.g., Zod) for structured data.

## 3. Agent Development Lifecycle

### 3.1 Design and Implementation

* **Requirements Analysis**: Clearly define the agent's capabilities, scope, and interaction patterns before implementation.
* **Agent Creation Pattern**: Follow the established pattern for agent creation, including:
  * Import necessary dependencies (`Agent`, AI model providers, memory, evals, tools).
  * Initialize a logger (`PinoLogger`) for observability.
  * Create a dedicated memory instance (`createResearchMemory` or similar).
  * Instantiate the `Agent` class with:
    * `name`: Unique and descriptive identifier.
    * `description`: A brief overview of the agent's function.
    * `instructions`: Detailed system prompt.
    * `model`: The specific AI model to be used.
    * `tools`: An object mapping tool names to their implementations.
    * `memory`: The configured memory instance.
    * `evals`: Defined evaluation metrics for quality assurance.
* **Modularity**: Design agents as modular components, focusing on a single, well-defined responsibility.
* **Tool Usage**: Tools should be explicitly passed to the agent and used according to their defined functionalities. Avoid implicit tool invocation.

### 3.2 Testing and Quality Assurance

* **Unit Tests**: Implement comprehensive unit tests for individual agent capabilities, ensuring each function and instruction behaves as expected.
* **Integration Tests**: Develop integration tests to verify interactions between agents, tools, and memory components within workflows.
* **Evaluation Metrics**: Utilize defined evaluation metrics (e.g., `ContentSimilarityMetric`, `CompletenessMetric`, `AccuracyRate`) to quantitatively assess agent performance and output quality.
* **Continuous Improvement**: Establish feedback loops, monitor agent performance, and regularly refine prompts, models, and tool integrations.

### 3.3 Deployment and Maintenance

* **Documentation**: Maintain thorough documentation for each agent, including its purpose, instructions, integrated tools, expected inputs/outputs, and any specific behavioral nuances.
* **Performance Monitoring**: Continuously monitor agent efficiency, token usage, response times, and resource consumption.
* **Security Audits**: Regularly review agent implementations for security vulnerabilities, including input validation, output filtering, and tool permission adherence.

## 4. Key Agent Considerations

### 4.1 Agent Specialization

* **Domain Expertise**: Agents must maintain a clear domain of expertise. For example:
  * **Research Agent**: Web research methodologies, source evaluation.
  * **Evaluation Agent**: Content analysis, quality assessment frameworks.
  * **RAG Agent**: Vector search, semantic similarity, context retrieval.
  * **GitHub Agent**: GitHub API interactions, issue/PR management, Copilot orchestration.
* **Task Optimization**: Leverage prompt engineering, precise tool selection, and tailored memory configurations to optimize each agent for its specific tasks.

### 4.2 Agent Communication and Orchestration

* **Standard Protocol**: Agents should communicate using a consistent protocol, typically through structured inputs (e.g., arrays of `role: 'user'`, `content: string` messages) and expecting structured outputs (e.g., Zod-validated JSON).
* **Multi-Agent Collaboration**: When agents collaborate (e.g., a `PublisherAgent` orchestrating `CopywriterAgent` and `EditorAgent`), define clear handoff points, expected data formats, and error recovery strategies.
* **Agent Networks**: Design complex workflows as agent networks, facilitating dynamic task distribution and inter-agent communication for consensus building.

### 4.3 Memory Management

* **Agent-Specific Memory**: Each agent should utilize a memory instance configured with relevant processors (e.g., `PersonalizationProcessor`, `TokenLimiterProcessor`, `ErrorCorrectionProcessor`) to manage its context efficiently.
* **Contextual Relevance**: Memory processors should optimize for contextual relevance, ensuring agents receive and retain only the necessary information for their current task.

### 4.4 Error Handling and Recovery

* **Graceful Degradation**: Agents should be designed to degrade gracefully when external tools or services fail, attempting fallbacks or returning partial results where possible.
* **Retry Mechanisms**: Implement intelligent retry logic with exponential backoff for transient failures.
* **User Feedback**: Errors should be communicated clearly and concisely to the user, with actionable suggestions for resolution.

### 4.5 Performance and Efficiency

* **Token Optimization**: Strive for efficient use of AI model tokens through concise instructions, effective summarization (`WebSummarizationAgent`), and intelligent memory management.
* **Caching**: Implement caching strategies for frequently accessed data or tool results to reduce latency and API costs.
* **Parallel Execution**: Explore opportunities for parallelizing tool usage or sub-tasks where dependencies allow.

### 4.6 Security and Data Protection

* **Input/Output Validation**: Strictly validate all agent inputs and filter outputs to prevent injection attacks, sensitive information leakage, or generation of harmful content.
* **Tool Permissions**: Implement granular access control for tools, ensuring agents only have permissions necessary for their designated tasks.
* **Privacy Compliance**: Adhere to data privacy regulations (e.g., GDPR) and project-specific privacy policies when handling user data or external content.

By adhering to these rules and guidelines, we ensure the development of robust, intelligent, and maintainable AI agents within the project.
