# CodeRabbit Configuration

This repository is configured for automated PR reviews using CodeRabbit AI.

## What is CodeRabbit?

CodeRabbit is an AI-powered code reviewer that provides context-aware feedback on pull requests. It helps catch bugs, security issues, and code quality problems before they reach production.

## Setup

### 1. GitHub App Installation

1. Go to [CodeRabbit's GitHub App](https://github.com/apps/coderabbitai)
2. Click "Install" and select this repository
3. Grant the necessary permissions

That's it! CodeRabbit will automatically review new PRs.

### 2. Configuration File

The `.coderabbit.yaml` file in the root of this repository configures CodeRabbit's behavior:

- **Review Profile**: Set to "chill" for balanced feedback
- **Path Filters**: Excludes generated files, node_modules, and build artifacts
- **Path Instructions**: Custom review guidelines for different parts of the codebase
- **Enabled Tools**: ESLint, Biome, Oxlint, markdownlint, and security scanners
- **Auto Review**: Enabled for all PRs on main/develop branches

## How It Works

### Automatic Reviews

When you open a PR, CodeRabbit will:

1. **Analyze changes** using AI and configured linters
2. **Post inline comments** on specific lines that need attention
3. **Generate a summary** with high-level feedback
4. **Suggest labels** based on the changes
5. **Create sequence diagrams** for complex logic flows
6. **Estimate review effort** to help prioritize reviews

### Interacting with CodeRabbit

You can interact with CodeRabbit using chat commands in PR comments:

#### Review Commands

```
@coderabbitai review
```
Re-trigger a full review of the PR.

```
@coderabbitai summary
```
Generate a high-level summary of all changes.

```
@coderabbitai configuration
```
Display the current CodeRabbit configuration.

#### Code Generation

```
@coderabbitai generate docstrings
```
Generate documentation for functions/components.

```
@coderabbitai generate unit tests for src/components/Header.tsx
```
Generate unit tests for a specific file.

#### Resolution Commands

```
@coderabbitai resolve
```
Mark a conversation as resolved.

```
@coderabbitai help
```
Show available commands.

### Ignoring PRs

To skip CodeRabbit review, include one of these keywords in your PR title:
- `WIP`
- `draft`
- `DO NOT REVIEW`

Or mark the PR as a draft on GitHub.

## Project-Specific Configuration

### TypeScript/React Code (`src/**/*.{ts,tsx}`)

CodeRabbit will check for:
- Proper TypeScript typing (avoiding `any`)
- React Hook usage and dependencies
- TanStack Router patterns
- React Aria Component accessibility
- Component exports and typing

### Convex Backend (`convex/**/*.ts`)

CodeRabbit will review:
- Query/mutation patterns
- Schema definitions with validators
- Table indexing
- Authentication/authorization
- Input validation

### TanStack Router Routes (`src/routes/**/*.tsx`)

CodeRabbit will verify:
- Route definitions
- Loader/component patterns
- Error boundaries
- Data fetching patterns

### Tests (`**/*.test.{ts,tsx}`)

CodeRabbit will assess:
- Test coverage and quality
- Test organization
- Proper mocking (MSW)
- Vitest best practices

## Excluded Files

The following are excluded from review to reduce noise:

- `node_modules/**`
- `dist/**`, `build/**`
- `coverage/**`
- `convex/_generated/**` (Convex generated files)
- `routeTree.gen.ts` (TanStack Router generated file)
- Lock files (`bun.lock`, `package-lock.json`)
- Minified files (`*.min.js`, `*.min.css`)

## Enabled Linters & Tools

CodeRabbit integrates with these tools:

- **ESLint** - JavaScript/TypeScript linting
- **Biome** - Fast formatter and linter
- **Oxlint** - Rust-based fast linter
- **markdownlint** - Markdown formatting
- **actionlint** - GitHub Actions validation
- **shellcheck** - Shell script analysis
- **yamllint** - YAML validation
- **gitleaks** - Secret detection
- **hadolint** - Dockerfile linting
- **htmlhint** - HTML validation
- **dotenvLint** - Environment file validation

## Customization

### Modify Review Instructions

Edit `.coderabbit.yaml` to customize:

```yaml
path_instructions:
  - path: "src/custom/**/*.ts"
    instructions: |
      - Your custom review guidelines here
```

### Enable/Disable Tools

Toggle specific tools:

```yaml
reviews:
  tools:
    eslint:
      enabled: true  # Change to false to disable
```

### Change Review Profile

Switch between review styles:

```yaml
reviews:
  profile: chill       # Options: chill, assertive
```

- **chill**: Balanced, constructive feedback
- **assertive**: Stricter, more detailed reviews

## Knowledge Base

CodeRabbit's knowledge base is enabled, which means it will:

- Learn from previous PRs and issues
- Reference existing code patterns
- Use web search for up-to-date best practices
- Read project documentation (`docs/**/*.md`, `*.md`)

## Best Practices

1. **Review CodeRabbit's feedback carefully** - It's AI-powered but not perfect
2. **Use `@coderabbitai` commands** to get additional insights
3. **Update `.coderabbit.yaml`** as your project evolves
4. **Combine with human reviews** - CodeRabbit complements, doesn't replace, human reviewers
5. **Address high-priority issues** flagged by security scanners immediately

## Troubleshooting

### CodeRabbit isn't reviewing PRs

- Check if the GitHub App is installed and has proper permissions
- Verify the PR title doesn't contain ignore keywords
- Make sure the PR isn't marked as a draft (unless drafts are enabled)

### Too many/too few comments

Adjust the review profile in `.coderabbit.yaml`:
- Use `chill` for fewer, high-priority comments
- Use `assertive` for more detailed feedback

### Disable for specific files

Add patterns to `path_filters`:

```yaml
reviews:
  path_filters:
    - "!path/to/exclude/**"
```

## Resources

- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [GitHub App](https://github.com/apps/coderabbitai)
- [Configuration Reference](https://docs.coderabbit.ai/reference/configuration)

## Support

For issues or questions:
- Create an issue in this repository
- Contact CodeRabbit support at [support@coderabbit.ai](mailto:support@coderabbit.ai)
- Check the [CodeRabbit Discord](https://discord.gg/coderabbit)

