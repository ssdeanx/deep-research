# Data Model: GitHub Agent and Tool Suite

## Entities

### GitHubRepository

- **name**: string
- **owner**: string
- **url**: string

### GitHubIssue

- **title**: string
- **body**: string
- **number**: integer
- **state**: string (open, closed)

### GitHubBranch

- **name**: string
