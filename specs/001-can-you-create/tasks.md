# Tasks: GitHub Agent and Tool Suite

**Input**: Design documents from `/specs/001-can-you-create/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 [P] Install dependencies: `npm install @octokit/rest`
- [ ] T002 [P] Configure ESLint and Prettier.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Create contract test for `listRepositories` in `tests/contract/test_github_agent.ts`
- [ ] T004 [P] Create contract test for `createIssue` in `tests/contract/test_github_agent.ts`
- [ ] T005 [P] Create contract test for `listBranches` in `tests/contract/test_github_agent.ts`
- [ ] T006 [P] Create integration test for the GitHub agent in `tests/integration/test_github_agent.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T007 [P] Create `src/mastra/models/github.ts` with interfaces for `GitHubRepository`, `GitHubIssue`, and `GitHubBranch`.
- [ ] T008 [P] Create `src/mastra/tools/github-tool.ts` with a tool that uses Octokit to interact with the GitHub API.
- [ ] T009 [P] Implement `listRepositories` in `src/mastra/tools/github-tool.ts`.
- [ ] T010 [P] Implement `createIssue` in `src/mastra/tools/github-tool.ts`.
- [ ] T011 [P] Implement `listBranches` in `src/mastra/tools/github-tool.ts`.
- [ ] T012 Create the GitHub agent in `src/mastra/agents/githubAgent.ts`.
- [ ] T013 Implement error handling and logging in the GitHub agent and tool.

## Phase 3.4: Integration
- [ ] T014 Integrate the GitHub tool with the GitHub agent.
- [ ] T015 Add the GitHub agent to the Mastra instance in `src/mastra/index.ts`.

## Phase 3.5: Polish
- [ ] T016 [P] Create unit tests for the GitHub tool in `tests/unit/test_github_tool.ts`.
- [ ] T017 [P] Update `docs/api.md` with documentation for the GitHub agent and tool.
- [ ] T018 [P] Update `GEMINI.md` with information about the new agent and tool.

## Dependencies
- Tests (T003-T006) before implementation (T007-T013)
- T007 blocks T008
- T008 blocks T009, T010, T011
- T012 blocks T014
- T014 blocks T015
- Implementation before polish (T016-T018)

## Parallel Example
```
# Launch T003-T006 together:
Task: "Create contract test for `listRepositories` in `tests/contract/test_github_agent.ts`"
Task: "Create contract test for `createIssue` in `tests/contract/test_github_agent.ts`"
Task: "Create contract test for `listBranches` in `tests/contract/test_github_agent.ts`"
Task: "Create integration test for the GitHub agent in `tests/integration/test_github_agent.ts`"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
