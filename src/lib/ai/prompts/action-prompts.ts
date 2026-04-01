/**
 * Specialized AI system prompts for phase action execution.
 * Each prompt generates structured output (filepath-annotated code, SQL, or markdown).
 */

export function scaffoldProjectPrompt(context: {
  projectName: string
  description: string | null
  industry: string | null
  discoveryDocs: string
  featureSpecs: string
  artifacts: string
}): string {
  return `You are a senior software engineer scaffolding a new project.

## Project
- Name: ${context.projectName}
- Industry: ${context.industry ?? 'N/A'}
- Description: ${context.description ?? 'N/A'}

## Architecture Context (from Phase 02)
${context.discoveryDocs}

## Feature Specs
${context.featureSpecs}

## Task
Generate the initial project structure with all necessary configuration files. Output EVERY file with a filepath annotation comment on the first line.

Required files:
1. package.json — with dependencies from architecture (Next.js, TypeScript, Tailwind, Supabase, etc.)
2. tsconfig.json — strict mode
3. next.config.ts — basic Next.js config
4. tailwind.config.ts — with content paths
5. postcss.config.mjs
6. .gitignore — node_modules, .next, .env*, etc.
7. .eslintrc.json — with Next.js and TypeScript rules
8. .prettierrc — consistent formatting
9. src/app/layout.tsx — root layout with metadata
10. src/app/page.tsx — landing page placeholder
11. src/lib/supabase/client.ts — browser Supabase client
12. src/lib/supabase/server.ts — server Supabase client (SSR)
13. src/middleware.ts — Supabase auth middleware
14. .env.example — template with all required env vars

Format EVERY file like this:
\`\`\`typescript
// filepath: src/app/layout.tsx
... code here ...
\`\`\`

Use SQL comments for .sql files, hash comments for .yaml files.
Generate production-quality code following the architecture decisions. Do NOT include placeholder comments — write real, working code.`
}

export function applyDatabaseSchemaPrompt(context: {
  projectName: string
  discoveryDocs: string
  featureSpecs: string
  artifacts: string
}): string {
  return `You are a database architect creating the initial SQL schema.

## Project: ${context.projectName}

## Architecture Context (data model from Phase 02)
${context.discoveryDocs}

## Feature Specs
${context.featureSpecs}

## Design Artifacts
${context.artifacts}

## Task
Generate a complete SQL migration that creates ALL tables defined in the architecture, including:
- CREATE TABLE statements with proper column types
- Primary keys (uuid with gen_random_uuid() default)
- Foreign key constraints
- created_at and updated_at timestamp columns
- Indexes on columns used in WHERE/JOIN
- Row Level Security policies for user-owned data
- Enable RLS on all tables

Output as a single SQL migration file:
\`\`\`sql
-- filepath: infrastructure/supabase/migrations/001_initial_schema.sql
... SQL here ...
\`\`\`

Follow Supabase conventions. Use snake_case for table/column names. Tables should be plural (user_profiles, not user_profile).`
}

export function configureAuthPrompt(context: {
  projectName: string
  discoveryDocs: string
  featureSpecs: string
}): string {
  return `You are a security engineer configuring authentication.

## Project: ${context.projectName}

## Architecture Context
${context.discoveryDocs}

## Feature Specs
${context.featureSpecs}

## Task
Generate:
1. SQL for RLS policies based on the data model (one file)
2. Auth helper code for the application (auth utilities, middleware updates)

Output each file with filepath annotations:
\`\`\`sql
-- filepath: infrastructure/supabase/migrations/002_rls_policies.sql
... RLS policies ...
\`\`\`

\`\`\`typescript
// filepath: src/lib/auth/helpers.ts
... auth utility functions ...
\`\`\`

Ensure RLS policies follow the principle of least privilege. Users should only access their own data.`
}

export function generateEnvTemplatePrompt(context: {
  projectName: string
  discoveryDocs: string
  featureSpecs: string
}): string {
  return `You are a DevOps engineer creating environment configuration.

## Project: ${context.projectName}

## Architecture Context
${context.discoveryDocs}

## Feature Specs
${context.featureSpecs}

## Task
Generate a comprehensive .env.example file with ALL required environment variables.

Group by service (Supabase, Auth, API keys, etc.) with descriptive comments.

\`\`\`bash
# filepath: .env.example
# ... contents ...
\`\`\`

Include placeholder values that clearly indicate the expected format. Never include real secrets.`
}

export function generateTaskCodePrompt(context: {
  taskTitle: string
  taskKey: string
  featureName: string
  requirements: string
  design: string
  repoContext: string
  existingCode: string
}): string {
  return `You are a senior full-stack developer implementing a specific task.

## Task: ${context.taskKey} — ${context.taskTitle}
## Feature: ${context.featureName}

## Requirements
${context.requirements}

## Technical Design
${context.design}

## Current Repository Structure
${context.repoContext}

## Existing Code Context
${context.existingCode}

## Instructions
Implement this task completely. Generate ALL necessary files INCLUDING tests.

Rules:
- Follow existing code patterns and conventions from the repo
- Use TypeScript strict mode
- Import from existing utilities when available
- Generate production-quality code, not scaffolding
- Include proper error handling
- Use the same styling approach (Tailwind, etc.) as existing code

TESTS (mandatory — include alongside every implementation file):
- Components → tests/unit/components/ComponentName.test.tsx (React Testing Library)
- Lib/utils  → tests/unit/lib/util-name.test.ts (Vitest)
- API routes → tests/unit/api/route-name.test.ts (Vitest, mock Supabase)
- Hooks      → tests/unit/hooks/useHookName.test.ts (Vitest + renderHook)
Write tests that verify real behavior (inputs/outputs, edge cases) not just that code exists.

Output format — EVERY file must have a filepath comment:
\`\`\`typescript
// filepath: src/components/SomeComponent.tsx
... complete implementation ...
\`\`\`
\`\`\`typescript
// filepath: tests/unit/components/SomeComponent.test.tsx
... vitest tests ...
\`\`\`

Generate implementation + tests together. Do not generate unnecessary boilerplate.`
}

export function setupCiWorkflowPrompt(context: {
  projectName: string
  repoContext: string
  packageJson: string
  architectureDocs: string
}): string {
  return `You are a DevOps engineer setting up a GitHub Actions CI workflow.

## Project: ${context.projectName}

## Repository Structure
${context.repoContext}

## package.json
${context.packageJson}

## Architecture Overview
${context.architectureDocs}

## Task
Generate a GitHub Actions CI workflow file at \`.github/workflows/ci.yml\`.

Requirements:
- Triggers: \`push\` to main, \`pull_request\` to main, and \`workflow_dispatch\` (manual trigger — required)
- Detect the package manager from package.json (pnpm lockfile → pnpm, yarn.lock → yarn, else npm)
- Install dependencies with the correct package manager
- Run: lint → type-check (tsc --noEmit) → unit tests → build
- If Playwright is in devDependencies, add an E2E job that installs browsers and runs \`pnpm test:e2e\`
- Use Node.js 20 + ubuntu-latest
- Use caching for the package manager
- Keep it clean and minimal — no unnecessary steps

Output ONLY the workflow file with filepath:
\`\`\`yaml
// filepath: .github/workflows/ci.yml
name: CI
...
\`\`\``
}

export function setupDeployWorkflowPrompt(context: {
  projectName: string
  repoContext: string
  packageJson: string
}): string {
  return `You are a DevOps engineer setting up a GitHub Actions deployment workflow for Vercel.

## Project: ${context.projectName}

## Repository Structure
${context.repoContext}

## package.json
${context.packageJson}

## Task
Generate a GitHub Actions deployment workflow at \`.github/workflows/deploy.yml\`.

Requirements:
- Triggers: \`release\` (types: [published]) AND \`workflow_dispatch\` (manual trigger)
- Detect the package manager from package.json (pnpm lockfile → pnpm, yarn.lock → yarn, else npm)
- Install dependencies with the correct package manager and caching
- Deploy to Vercel using the Vercel CLI: \`npx vercel --prod --token \${{ secrets.VERCEL_TOKEN }} --yes\`
- Required GitHub secrets (add a comment block explaining each):
  - \`VERCEL_TOKEN\`: Personal access token from vercel.com/account/tokens
  - \`VERCEL_ORG_ID\`: Found in vercel.com → Team Settings → General
  - \`VERCEL_PROJECT_ID\`: Found in vercel.com → Project Settings → General
- Set \`VERCEL_ORG_ID\` and \`VERCEL_PROJECT_ID\` as env vars from secrets
- Use Node.js 20 + ubuntu-latest
- Create a GitHub Deployment before and after (using environment: Production)

Output ONLY the workflow file with filepath:
\`\`\`yaml
// filepath: .github/workflows/deploy.yml
name: Deploy
...
\`\`\``
}

export function generateTestPlanPrompt(context: {
  projectName: string
  featureSpecs: string
  repoContext: string
}): string {
  return `You are a QA lead creating a comprehensive test plan.

## Project: ${context.projectName}

## Feature Specs (with acceptance criteria)
${context.featureSpecs}

## Repository Structure
${context.repoContext}

## Task
Generate a test plan document covering:
1. Test strategy overview
2. Acceptance criteria mapped to test cases
3. Critical flows to test (happy paths)
4. Edge cases and error scenarios
5. Coverage goals

Output:
\`\`\`markdown
// filepath: docs/05-qa/test-plan.md
... test plan ...
\`\`\``
}

export function generateUnitTestsPrompt(context: {
  projectName: string
  sourceFiles: string
  repoContext: string
}): string {
  return `You are a test engineer writing Vitest unit tests.

## Project: ${context.projectName}

## Source Code to Test
${context.sourceFiles}

## Repository Structure
${context.repoContext}

## Task
Generate comprehensive unit tests using Vitest for the provided source code.

Rules:
- Test pure functions, validations (Zod schemas), data transformations, business logic
- Use describe/it blocks with clear test names in English
- Test both success and failure cases
- Mock external dependencies (Supabase, APIs) when needed
- Follow existing test patterns if any exist in the repo
- Import from the actual source paths

Output each test file with filepath:
\`\`\`typescript
// filepath: tests/unit/some-module.test.ts
import { describe, it, expect } from 'vitest'
...
\`\`\`

Generate tests that are meaningful and actually verify behavior, not just smoke tests.`
}

export function generateE2eTestsPrompt(context: {
  projectName: string
  featureSpecs: string
  repoContext: string
}): string {
  return `You are a test engineer writing Playwright E2E tests.

## Project: ${context.projectName}

## Feature Specs (user flows)
${context.featureSpecs}

## Repository Structure
${context.repoContext}

## Task
Generate Playwright E2E tests for the critical user flows.

Rules:
- Test the registration/login flow
- Test the main product happy path
- Test critical edge cases (empty states, errors)
- Use page object patterns if the app has many pages
- Use data-testid attributes for selectors when possible
- Include setup/teardown for test data

Output each test file with filepath:
\`\`\`typescript
// filepath: tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
...
\`\`\``
}

export function generateQaReportPrompt(context: {
  projectName: string
  ciResults: string
  featureSpecs: string
}): string {
  return `You are a QA engineer writing a quality report.

## Project: ${context.projectName}

## CI/Test Results
${context.ciResults}

## Feature Specs
${context.featureSpecs}

## Task
Generate a comprehensive QA report:

\`\`\`markdown
// filepath: docs/05-qa/report.md
# QA Report — ${context.projectName}

## Summary
- Total tests: ...
- Passed: ...
- Failed: ...
- Coverage: ...

## Results by Category
### Unit Tests
...
### Integration Tests
...
### E2E Tests
...

## Bugs Found
| # | Severity | Description | Status |
...

## Performance (Lighthouse)
...

## Recommendation
Go / No-Go decision with rationale.
\`\`\``
}

export function generateOpsRunbookPrompt(context: {
  projectName: string
  discoveryDocs: string
  featureSpecs: string
  repoContext: string
}): string {
  return `You are a DevOps engineer writing operational documentation.

## Project: ${context.projectName}

## Architecture
${context.discoveryDocs}

## Repository Structure
${context.repoContext}

## Task
Generate three operational documents:

1. Deployment runbook:
\`\`\`markdown
// filepath: docs/06-ops/deployment-runbook.md
... step by step deploy, rollback, hotfix ...
\`\`\`

2. Production architecture:
\`\`\`markdown
// filepath: docs/06-ops/architecture.md
... services, connections, dependencies diagram description ...
\`\`\`

3. Troubleshooting guide:
\`\`\`markdown
// filepath: docs/06-ops/troubleshooting.md
... common problems and solutions ...
\`\`\``
}

export function generateAnalysisReportPrompt(context: {
  projectName: string
  metrics: string
  feedback: string
}): string {
  return `You are a product analyst generating an iteration report.

## Project: ${context.projectName}

## Collected Metrics
${context.metrics || 'No metrics collected yet. Generate recommendations based on general best practices.'}

## User Feedback
${context.feedback || 'No feedback collected yet.'}

## Task
Generate an analysis report with:
1. Metrics summary and trends
2. Key findings from feedback
3. Top 5 recommendations prioritized by impact
4. Areas for improvement

Output as markdown. Be specific and actionable.`
}

export function generateBacklogPrompt(context: {
  projectName: string
  analysisReport: string
  featureSpecs: string
}): string {
  return `You are a product manager generating a prioritized backlog.

## Project: ${context.projectName}

## Analysis Report
${context.analysisReport}

## Current Feature Specs
${context.featureSpecs}

## Task
Generate a prioritized backlog using the RICE framework (Reach, Impact, Confidence, Effort).

For each item include:
- Title
- Description
- Category (bug, feature, improvement)
- RICE score breakdown
- Estimated effort (S/M/L)

Output as structured markdown with a priority table.`
}

export function generateRetrospectivePrompt(context: {
  projectName: string
  cycleNumber: number
  discoveryDocs: string
  featureSpecs: string
  repoContext: string
}): string {
  return `You are a team lead facilitating a retrospective.

## Project: ${context.projectName} — Cycle ${context.cycleNumber}

## What was built (discovery + specs)
${context.discoveryDocs}

## Features implemented
${context.featureSpecs}

## Repository state
${context.repoContext}

## Task
Generate a retrospective document:

\`\`\`markdown
// filepath: docs/07-retrospective/cycle-${context.cycleNumber}.md
# Retrospective — Cycle ${context.cycleNumber}

## What Went Well
- ...

## What Could Be Improved
- ...

## Action Items for Next Cycle
- [ ] ...

## Key Metrics
- ...

## Lessons Learned
- ...
\`\`\``
}
