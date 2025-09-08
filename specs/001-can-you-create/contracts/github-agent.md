# GitHub Agent Contracts

## Tool Suite

### listRepositories

- **description**: Lists the repositories for the authenticated user.
- **input**: None
- **output**: An array of repository objects.

### createIssue

- **description**: Creates a new issue in a repository.
- **input**:
  - **repository**: The name of the repository.
  - **title**: The title of the issue.
  - **body**: The body of the issue.
- **output**: The created issue object.

### listBranches

- **description**: Lists the branches in a repository.
- **input**:
  - **repository**: The name of the repository.
- **output**: An array of branch objects.
