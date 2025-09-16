# Mastra Framework - Core Principles and Tool Usage Guidelines

## 1. Introduction to Mastra

Mastra is an open-source TypeScript agent framework. It's designed to give you the primitives you need to build AI applications and features.

You can use Mastra to build AI agents that have memory and can execute functions, or chain LLM calls in deterministic workflows. You can chat with your agents in Mastra's local dev playground, feed them application-specific knowledge with RAG, and score their outputs with Mastra's evals.

The main features include:

- **Model routing**: Mastra uses the Vercel AI SDK for model routing, providing a unified interface to interact with any LLM provider including OpenAI, Anthropic, and Google Gemini.
- **Agent memory and tool calling**: With Mastra, you can give your agent tools (functions) that it can call. You can persist agent memory and retrieve it based on recency, semantic similarity, or conversation thread.
- **Workflow graphs**: When you want to execute LLM calls in a deterministic way, Mastra gives you a graph-based workflow engine. You can define discrete steps, log inputs and outputs at each step of each run, and pipe them into an observability tool. Mastra workflows have a simple syntax for control flow (.then(), .branch(), .parallel()) that allows branching and chaining.
- **Agent development playground**: When you're developing an agent locally, you can chat with it and see its state and memory in Mastra's agent development environment.
- **Retrieval-augmented generation (RAG)**: Mastra gives you APIs to process documents (text, HTML, Markdown, JSON) into chunks, create embeddings, and store them in a vector database. At query time, it retrieves relevant chunks to ground LLM responses in your data, with a unified API on top of multiple vector stores (Pinecone, pgvector, etc) and embedding providers (OpenAI, Cohere, etc).
- **Deployment**: Mastra supports bundling your agents and workflows within an existing React, Next.js, or Node.js application, or into standalone endpoints. The Mastra deploy helper lets you easily bundle agents and workflows into a Node.js server using Hono, or deploy it onto a serverless platform like Vercel, Cloudflare Workers, or Netlify.
- **Evals**: Mastra provides automated evaluation metrics that use model-graded, rule-based, and statistical methods to assess LLM outputs, with built-in metrics for toxicity, bias, relevance, and factual accuracy. You can also define your own evals.

## 2. Core Principles for Working with Mastra

To effectively utilize the Mastra framework, adhere to the following principles:

- **Modular Design**: Build components (agents, tools, workflows) with clear, single responsibilities.
- **Type Safety**: Leverage TypeScript and Zod for strict input/output validation and data integrity across all components.
- **Observability**: Integrate logging and tracing to monitor performance, debug issues, and understand system behavior.
- **Context Management**: Proactively manage agent memory and context to ensure relevant and efficient interactions.
- **Tool-First Approach**: Design agents to effectively utilize specialized tools to extend their capabilities and interact with external systems.

## 3. Leveraging Mastra Documentation and Examples via MCP Tools

As an AI assistant, you can efficiently access Mastra's comprehensive documentation and code examples directly through the Model Context Protocol (MCP) using the `mastraDocs` and `mastraExamples` tools provided by the `mastra` MCP server. This allows you to quickly retrieve relevant information and code snippets to inform your tasks.

### 3.1 Using the `mastraDocs` Tool

The `mastraDocs` tool provides access to Mastra's official documentation. You can query it for specific documentation paths or general information using keywords.

**Tool Name**: [`mastraDocs`](tool:mastra.mastraDocs)
**Server Name**: `mastra`
**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "paths": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "description": "One or more documentation paths to fetch."
    },
    "queryKeywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Keywords from user query to use for matching documentation."
    }
  },
  "required": ["paths"]
}
```

**How to Use `mastraDocs`**:

- **To get a general overview or specific topic**: Provide relevant documentation paths. The `index.mdx` path gives an introduction. You can also explore subdirectories like `agents/`, `workflows/`, `rag/`, `reference/`, etc.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraDocs</tool_name>
    <arguments>
      {
        "paths": ["index.mdx", "agents/overview.mdx"]
      }
    </arguments>
    </use_mcp_tool>
    ```

- **To find documentation by keywords**: Provide keywords relevant to your query.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraDocs</tool_name>
    <arguments>
      {
        "queryKeywords": ["agent memory", "tool calling"]
      }
    </arguments>
    </use_mcp_tool>
    ```

- **To get information on MCP tools**: The MCP documentation is found under `reference/tools/`.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraDocs</tool_name>
    <arguments>
      {
        "paths": ["reference/tools/mcp-client.mdx", "reference/tools/mcp-server.mdx"]
      }
    </arguments>
    </use_mcp_tool>
    ```

### 3.2 Using the `mastraExamples` Tool

The `mastraExamples` tool allows you to fetch code examples from the Mastra.ai examples directory. This is useful for understanding implementation patterns and seeing how various features are used in practice.

**Tool Name**: [`mastraExamples`](tool:mastra.mastraExamples)
**Server Name**: `mastra`
**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "example": {
      "type": "string",
      "description": "Name of the specific example to fetch. If not provided, lists all available examples."
    },
    "queryKeywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Keywords from user query to use for matching examples."
    }
  }
}
```

**How to Use `mastraExamples`**:

- **To list all available examples**: Leave the `example` field empty.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraExamples</tool_name>
    <arguments>
      {
        "example": ""
      }
    </arguments>
    </use_mcp_tool>
    ```

- **To fetch a specific example's code**: Provide the name of the example.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraExamples</tool_name>
    <arguments>
      {
        "example": "quick-start"
      }
    </arguments>
    </use_mcp_tool>
    ```

- **To find examples by keywords**: Provide keywords relevant to your query.

    ```xml
    <use_mcp_tool>
    <server_name>mastra</server_name>
    <tool_name>mastraExamples</tool_name>
    <arguments>
      {
        "queryKeywords": ["agent network", "rag"]
      }
    </arguments>
    </use_mcp_tool>
    ```

## 4. Guidelines for Kilo Code (Your Interaction with Mastra)

To maximize your effectiveness when working with Mastra-related tasks:

- **Prioritize `mastraDocs` for conceptual understanding**: Before attempting any implementation, consult the `mastraDocs` tool for architectural principles, feature overviews, and API references.
- **Leverage `mastraExamples` for implementation patterns**: Once you understand the concepts, use the `mastraExamples` tool to retrieve concrete code examples. Adapt these examples to your current task.
- **Combine documentation and examples**: Use `mastraDocs` to understand *why* something is done, and `mastraExamples` to understand *how* it's implemented.
- **Be specific with queries**: When using `queryKeywords` for both tools, be as precise as possible to get the most relevant results.
- **Iterate and refine**: If initial searches don't yield the desired information, try different keywords or explore related documentation paths.
- **Report missing information**: If you consistently cannot find necessary documentation or examples for a Mastra feature, report it to the user so they can update the resources.

By following these guidelines, you will be able to efficiently self-serve information regarding the Mastra framework, leading to more accurate and effective task completion.
