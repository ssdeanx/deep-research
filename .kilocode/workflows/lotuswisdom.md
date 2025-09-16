# Workflow for Using the Lotus Wisdom Tool

This document outlines a structured workflow for problem-solving and contemplative inquiry using the `lotuswisdom` MCP tool. The tool facilitates a reflective process by guiding you through various wisdom domains and techniques, but it does not generate the final output; rather, it helps you arrive at insights which you then express.

## Core Principles of the Lotus Wisdom Tool

The `lotuswisdom` tool is designed to break down complex problems and foster deeper understanding through a series of "tags" that represent different aspects of wisdom. The journey through these tags is flexible and iterative, allowing for exploration and refinement.

**Tool Name**: [`lotuswisdom`](tool:lotus-wisdom.lotuswisdom)
**Server Name**: `lotus-wisdom`

**Key Parameters**:

- `tag`: The current technique or stage (e.g., `open`, `examine`, `direct`, `reflect`, `transform`, `complete`, `meditate`).
- `content`: A description of the current step's focus or findings.
- `stepNumber`: The current step in your overall process.
- `totalSteps`: Your estimated total number of steps for this inquiry.
- `nextStepNeeded`: A boolean indicating if further steps are required (`true` or `false`).
- `isMeditation`: (Optional) Set to `true` for a meditative pause.
- `meditationDuration`: (Optional) Duration in seconds for a meditative pause (1-10).

## Step-by-Step Workflow Example

This example demonstrates a typical flow, but remember that the actual path can be dynamic and responsive to your needs.

### Step 1: Open - Define the Problem

Begin by clearly stating the problem or question you wish to explore. This sets the foundation for your contemplative journey.

**Tag**: `open` (Wisdom Domain: Process Flow)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "open",
    "content": "Define the core problem: How can I optimize my daily task management to improve productivity?",
    "stepNumber": 1,
    "totalSteps": 6,
    "nextStepNeeded": true
  }
</arguments>
</use_mcp_tool>
```

### Step 2: Examine - Analyze Deeper

Delve into the problem's various facets, considering its causes, effects, and any underlying assumptions.

**Tag**: `examine` (Wisdom Domain: Meta-Cognitive)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "examine",
    "content": "Analyze current task management habits, identifying bottlenecks and common distractions.",
    "stepNumber": 2,
    "totalSteps": 6,
    "nextStepNeeded": true
  }
</arguments>
</use_mcp_tool>
```

### Step 3: Direct - Propose a Solution

Formulate a direct approach or a potential solution based on your initial examination.

**Tag**: `direct` (Wisdom Domain: Skillful Means)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "direct",
    "content": "Propose implementing the 'Pomodoro Technique' for focused work intervals.",
    "stepNumber": 3,
    "totalSteps": 6,
    "nextStepNeeded": true
  }
</arguments>
</use_mcp_tool>
```

### Step 4: Reflect - Assess the Approach

Pause to reflect on the proposed solution. Consider its potential benefits, drawbacks, and how it aligns with your goals.

**Tag**: `reflect` (Wisdom Domain: Meta-Cognitive)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "reflect",
    "content": "Evaluate if Pomodoro is suitable for all task types and potential resistance to change.",
    "stepNumber": 4,
    "totalSteps": 6,
    "nextStepNeeded": true
  }
</arguments>
</use_mcp_tool>
```

### Step 5: Transform - Adapt and Refine

Based on your reflection, adapt or refine your understanding of the problem or your approach to the solution. This might involve integrating new insights or transcending previous limitations.

**Tag**: `transform` (Wisdom Domain: Non-Dual Recognition)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "transform",
    "content": "Adjust the Pomodoro approach to include flexible breaks and a 'deep work' block for complex tasks.",
    "stepNumber": 5,
    "totalSteps": 6,
    "nextStepNeeded": true
  }
</arguments>
</use_mcp_tool>
```

### Step 6: Complete - Finalize and Express

Conclude the contemplative process when you have reached a satisfactory understanding or solution. The tool will indicate `WISDOM_READY`, and you can then express the final wisdom in your own words.

**Tag**: `complete` (Wisdom Domain: Meta-Cognitive)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "complete",
    "content": "Finalized plan for daily task management, incorporating Pomodoro with flexible adjustments.",
    "stepNumber": 6,
    "totalSteps": 6,
    "nextStepNeeded": false
  }
</arguments>
</use_mcp_tool>
```

## Meditation (Optional)

At any point, you can introduce a meditative pause to allow insights to emerge from stillness.

**Tag**: `meditate` (Wisdom Domain: Meditation)

**Example Tool Call**:

```xml
<use_mcp_tool>
<server_name>lotus-wisdom</server_name>
<tool_name>lotuswisdom</tool_name>
<arguments>
  {
    "tag": "meditate",
    "content": "Taking a moment to clear the mind and allow new perspectives to surface.",
    "stepNumber": 3,
    "totalSteps": 7,
    "nextStepNeeded": true,
    "isMeditation": true,
    "meditationDuration": 5
  }
</arguments>
</use_mcp_tool>
```

When `isMeditation` is `true`, the tool will return `MEDITATION_COMPLETE`, prompting you to articulate what emerged during the pause.

By following this workflow, you can leverage the `lotuswisdom` tool to systematically approach problems, gain deeper insights, and arrive at well-considered solutions.
