# Quickstart: GitHub Agent and Tool Suite

## Prerequisites

- Node.js 20.9+
- A GitHub personal access token

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/ssdeanx/deep-research.git
   ```
2. Install the dependencies:
   ```
   npm install
   ```
3. Set the `GITHUB_API_KEY` environment variable to your GitHub personal access token.

## Usage

1. Run the agent in development mode:
   ```
   npm run dev
   ```
2. Ask the agent to list your repositories:
   ```
   list repositories
   ```
3. Ask the agent to create an issue:
   ```
   create issue in <repository> with title <title> and body <body>
   ```
