# Deep Research Assistant + Graph RAG with Mastra

This project implements an advanced AI deep research assistant using Mastra's workflows and agent capabilities. It creates an interactive, human-in-the-loop research system that allows users to explore topics, evaluate results, and generate comprehensive reports.

## Implementation Approach

The research assistant is built on Mastra's workflows architecture for better orchestration and human interaction:

1. **Workflow-Based Architecture**:
   - `mainWorkflow`: Coordinates the entire research process
   - `researchWorkflow`: Handles the core research functionality with suspend/resume for user interaction
   - Human-in-the-loop experience with approval gates and iterative research

2. **Research Agent with Custom Tools**:
   - `webSearchTool`: Searches the web using the Exa API for relevant information
   - `evaluateResultTool`: Assesses result relevance to the research topic
   - `extractLearningsTool`: Identifies key learnings and generates follow-up questions

3. **Report Generation**:
   - `reportAgent`: Transforms research findings into comprehensive markdown reports
   - Returns report content directly after user approval of research quality

## Key Benefits of Mastra vNext Implementation

1. **True Human-in-the-Loop Research**: Users can guide the research process, approve findings, and iterate when needed

2. **Suspend/Resume Capabilities**: The workflow can pause at strategic points to collect user input and feedback

3. **Structured Workflow**: Clear separation between research, approval, and report generation phases

4. **Resilient Operation**: Robust error handling and fallback mechanisms when web searches fail

5. **Modular Design**: Each component (workflows, agents, tools) can be maintained and upgraded independently

## How to Use

```bash
# Install dependencies
npm install

# Run the research assistant
npm run dev
```

Follow the interactive prompts:

1. Enter your research topic
2. Review the research findings
3. Approve or reject the research results
4. If approved, a comprehensive report will be returned as output

## Required Environment Variables

Create a `.env` file with:

```bash
OPENAI_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
EXA_API_KEY="your-exa-api-key"
```

## Required Dependencies

- `@mastra/core`: Core Mastra functionality with vNext workflows
- `@ai-sdk/openai`: OpenAI models integration
- `exa-js`: Exa API client for web search
- `zod`: Schema definition and validation for workflows

```mermaid
graph TD

    31["User<br>External Actor"]
    32["Application Entry Point<br>TypeScript"]
    5["User<br>External Actor"]
    6["Application Entry Point<br>TypeScript"]
    subgraph 1["Configuration System<br>TypeScript"]
        24["Google Provider Config<br>TypeScript"]
        25["LibSQL Storage Config<br>TypeScript"]
        26["Logger Config<br>TypeScript"]
    end
    subgraph 2["Workflows System<br>TypeScript"]
        22["Generate Report Workflow<br>TypeScript"]
        23["Research Workflow<br>TypeScript"]
    end
    subgraph 27["Configuration System<br>TypeScript"]
        50["Google Provider Config<br>TypeScript"]
        51["LibSQL Storage Config<br>TypeScript"]
        52["Logger Config<br>TypeScript"]
    end
    subgraph 28["Workflows System<br>TypeScript"]
        48["Generate Report Workflow<br>TypeScript"]
        49["Research Workflow<br>TypeScript"]
    end
    subgraph 29["Tools System<br>TypeScript"]
        38["Chunker Tool<br>TypeScript"]
        39["Data File Manager<br>TypeScript"]
        40["Evaluate Result Tool<br>TypeScript"]
        41["Extract Learnings Tool<br>TypeScript"]
        42["Graph RAG Tool<br>TypeScript"]
        43["Rerank Tool<br>TypeScript"]
        44["Vector Query Tool<br>TypeScript"]
        45["Weather Tool<br>TypeScript"]
        46["Web Scraper Tool<br>TypeScript"]
        47["Web Search Tool<br>TypeScript"]
    end
    subgraph 3["Tools System<br>TypeScript"]
        12["Chunker Tool<br>TypeScript"]
        13["Data File Manager<br>TypeScript"]
        14["Evaluate Result Tool<br>TypeScript"]
        15["Extract Learnings Tool<br>TypeScript"]
        16["Graph RAG Tool<br>TypeScript"]
        17["Rerank Tool<br>TypeScript"]
        18["Vector Query Tool<br>TypeScript"]
        19["Weather Tool<br>TypeScript"]
        20["Web Scraper Tool<br>TypeScript"]
        21["Web Search Tool<br>TypeScript"]
    end
    subgraph 30["Agents System<br>TypeScript"]
        33["Evaluation Agent<br>TypeScript"]
        34["Learning Extraction Agent<br>TypeScript"]
        35["Report Agent<br>TypeScript"]
        36["Research Agent<br>TypeScript"]
        37["Web Summarization Agent<br>TypeScript"]
    end
    subgraph 4["Agents System<br>TypeScript"]
        10["Research Agent<br>TypeScript"]
        11["Web Summarization Agent<br>TypeScript"]
        7["Evaluation Agent<br>TypeScript"]
        8["Learning Extraction Agent<br>TypeScript"]
        9["Report Agent<br>TypeScript"]
    end
    %% Edges at this level (grouped by source)
    2["Workflows System<br>TypeScript"] -->|uses| 1["Configuration System<br>TypeScript"]
    2["Workflows System<br>TypeScript"] -->|uses| 3["Tools System<br>TypeScript"]
    2["Workflows System<br>TypeScript"] -->|orchestrates| 4["Agents System<br>TypeScript"]
    3["Tools System<br>TypeScript"] -->|uses| 1["Configuration System<br>TypeScript"]
    4["Agents System<br>TypeScript"] -->|uses| 1["Configuration System<br>TypeScript"]
    4["Agents System<br>TypeScript"] -->|uses| 3["Tools System<br>TypeScript"]
    6["Application Entry Point<br>TypeScript"] -->|uses| 1["Configuration System<br>TypeScript"]
    6["Application Entry Point<br>TypeScript"] -->|orchestrates| 2["Workflows System<br>TypeScript"]
    6["Application Entry Point<br>TypeScript"] -->|orchestrates| 3["Tools System<br>TypeScript"]
    6["Application Entry Point<br>TypeScript"] -->|orchestrates| 4["Agents System<br>TypeScript"]
    5["User<br>External Actor"] -->|initiates| 6["Application Entry Point<br>TypeScript"]
    28["Workflows System<br>TypeScript"] -->|uses| 27["Configuration System<br>TypeScript"]
    28["Workflows System<br>TypeScript"] -->|uses| 29["Tools System<br>TypeScript"]
    28["Workflows System<br>TypeScript"] -->|orchestrates| 30["Agents System<br>TypeScript"]
    29["Tools System<br>TypeScript"] -->|uses| 27["Configuration System<br>TypeScript"]
    30["Agents System<br>TypeScript"] -->|uses| 27["Configuration System<br>TypeScript"]
    30["Agents System<br>TypeScript"] -->|uses| 29["Tools System<br>TypeScript"]
    32["Application Entry Point<br>TypeScript"] -->|uses| 27["Configuration System<br>TypeScript"]
    32["Application Entry Point<br>TypeScript"] -->|orchestrates| 28["Workflows System<br>TypeScript"]
    32["Application Entry Point<br>TypeScript"] -->|orchestrates| 29["Tools System<br>TypeScript"]
    32["Application Entry Point<br>TypeScript"] -->|orchestrates| 30["Agents System<br>TypeScript"]
    31["User<br>External Actor"] -->|initiates| 32["Application Entry Point<br>TypeScript"]
```
