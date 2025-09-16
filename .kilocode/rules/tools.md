# AI Tools - Rules and Guidelines

## 1. Tool Definition and Purpose

AI Tools within this project are specialized functionalities designed to extend the capabilities of AI agents and workflows. Each tool encapsulates a specific operation, often integrating with external APIs or performing complex data manipulations. They are the building blocks that enable agents to interact with the environment, gather information, process data, and execute actions.

## 2. Core Tool Architecture Principles

All tools must adhere to the following architectural principles to ensure consistency, maintainability, and scalability:

* **Standardized Interface**: All tools must be created using the `createTool()` function from [`@mastra/core/tools`](src/mastra/core/tools) and expose an `execute()` method. This ensures a consistent invocation pattern across the system.
* **Type Safety and Validation**: Tools must be fully type-safe using TypeScript, with input and output schemas rigorously defined using `zod`. This ensures data integrity and predictable behavior.
* **Clear Description**: Each tool must have a concise and accurate `description` property that clearly states its function and purpose.
* **Modular Design**: Tools should be designed as modular components, focusing on a single, well-defined responsibility. Related tools should be grouped logically (e.g., GitHub tools in a `github/` subdirectory).
* **Observability**: All tools must integrate with the tracing context (`tracingContext`) and utilize [`PinoLogger`](@mastra/loggers) for comprehensive logging and monitoring. This includes creating child spans for significant operations within the `execute` method.

## 3. Tool Development Lifecycle

### 3.1 Design and Implementation

* **Requirements Analysis**: Clearly define the tool's capabilities, scope, and expected inputs/outputs before implementation.
* **Tool Creation Pattern**: Follow the established pattern for tool creation:
    1. Import necessary dependencies (e.g., `createTool`, `zod`, `PinoLogger`, external API clients).
    2. Initialize dependencies (e.g., logger instances, API clients).
    3. Define `inputSchema` and `outputSchema` using `zod` for strict validation.
    4. Implement the `execute` method, ensuring it handles all defined inputs and produces the expected outputs.
* **Dependency Management**: Utilize project dependencies listed in [`package.json`](package.json) (e.g., `exa-js`, `cheerio`, `crawlee`, `jsdom`, `octokit`) appropriately.
* **Runtime Context Integration**: Leverage [`RuntimeContext`](@mastra/core/runtime-context) for dynamic configuration and personalized tool behavior where applicable (e.g., `chunker-tool.ts`, `rerank-tool.ts`, `vectorQueryTool.ts`).

### 3.2 Error Handling and Recovery

* **Robust Error Handling**: Implement comprehensive `try-catch` blocks within the `execute` method to gracefully handle errors, including API failures, invalid inputs, and unexpected conditions.
* **Informative Feedback**: Errors should be logged using `PinoLogger` and returned with descriptive error messages to facilitate debugging and agent recovery.
* **Security Validation**: For tools interacting with the file system or external resources (e.g., `data-file-manager.ts`, `web-scraper-tool.ts`), implement strict input validation and path sanitization (e.g., `validateDataPath`, `fs.realpath`) to prevent security vulnerabilities like directory traversal.

### 3.3 Integration Strategies

* **Agent Tool Usage**: Tools are integrated into agents by passing them in the `tools` object during agent instantiation. Agents should invoke tools systematically based on their instructions.
* **Workflow Tool Integration**: Tools can be directly used within workflow steps or indirectly through agents orchestrated by workflows.
* **MCP Tool Integration**: Tools can be exposed as MCP tools through an [`MCPServer`](src/mastra/mcp/server.ts), allowing external systems to utilize their functionalities.

## 4. Quality Assurance

* **Unit Tests**: Implement comprehensive unit tests for individual tool functionalities, verifying input validation, output correctness, and error handling.
* **Integration Tests**: Develop integration tests to verify interactions between tools, agents, and other components within workflows.
* **Evaluation Metrics**: Utilize defined evaluation metrics to quantitatively assess tool performance and output quality.
* **Security Audits**: Regularly review tool implementations for security vulnerabilities, including input validation, output filtering, and tool permission adherence.

## 5. Performance Optimization

* **Efficient Resource Usage**: Design tools to be efficient in terms of CPU, memory, and network usage.
* **Caching Strategies**: Implement caching for frequently accessed data or expensive operations (e.g., API calls) to reduce latency and resource consumption.
* **Asynchronous Operations**: Utilize asynchronous programming patterns to prevent blocking operations and improve responsiveness.
* **Rate Limiting**: Implement rate limiting for external API calls to comply with service provider policies and prevent abuse.

## 6. Security Considerations

* **Input Sanitization**: Strictly sanitize all user-provided inputs to prevent injection attacks (e.g., XSS, SQL injection).
* **Output Filtering**: Filter sensitive information from tool outputs before returning them to agents or users.
* **Access Control**: Ensure tools operate with the minimum necessary privileges.
* **Dependency Vulnerabilities**: Regularly monitor and update third-party dependencies to mitigate known security vulnerabilities.

## 7. Monitoring & Observability

* **Structured Logging**: Use `PinoLogger` for structured logging of tool execution, inputs, outputs, and errors.
* **Distributed Tracing**: Integrate with the distributed tracing system (`tracingContext`) to provide end-to-end visibility into tool execution within larger workflows.
* **Metrics Collection**: Collect and expose metrics such as execution time, success rate, and error rates for performance monitoring.

## 8. AI Assistant Guidelines for Tool Development

When developing or interacting with tools:

1. **Understand Tool Purpose**: Clearly grasp the specific responsibility and capabilities of each tool.
2. **Adhere to Interfaces**: Always use the standardized `createTool()` pattern and respect `inputSchema` and `outputSchema`.
3. **Prioritize Type Safety**: Ensure all data flowing into and out of tools is strictly typed and validated with Zod.
4. **Handle Errors Gracefully**: Implement robust error handling to prevent cascading failures.
5. **Optimize for Performance**: Write efficient code and consider caching and asynchronous patterns.
6. **Document Thoroughly**: Provide clear and comprehensive documentation for all tool functionalities.
7. **Test Extensively**: Ensure tools are thoroughly tested at both unit and integration levels.
8. **Be Security-Conscious**: Validate inputs, filter outputs, and adhere to security best practices.
