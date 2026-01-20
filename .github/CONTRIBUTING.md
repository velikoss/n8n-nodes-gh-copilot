# Contributing to n8n GitHub Copilot Chat Model

Thanks for your interest in contributing! This document outlines how to get started.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A GitHub Copilot subscription (for testing)
- n8n installed locally or via Docker

### Getting Started

```bash
# Clone the repo
git clone https://github.com/ssccio/n8n-nodes-gh-copilot.git
cd n8n-nodes-gh-copilot

# Install dependencies
npm install

# Build
npm run build

# Run n8n with the local node
npm run dev
```

## Project Structure

```
src/
├── credentials/          # n8n credential types
├── lib/                  # Core business logic
│   ├── CopilotAuth.ts       # OAuth device flow
│   ├── CopilotTokenManager.ts  # Token lifecycle
│   ├── CopilotChatModel.ts     # LangChain wrapper
│   └── CopilotModels.ts        # Model discovery
├── nodes/               # n8n node definitions
└── index.ts             # Package exports
```

## Making Changes

### Code Style

- TypeScript strict mode
- No `any` types without justification
- Export types alongside functions
- Use descriptive variable names

### Testing

Before submitting a PR, run the test scripts:

```bash
npm run build
node test-auth.mjs      # Requires browser interaction
node test-model.mjs     # Requires valid credentials
node test-node.mjs      # Full integration test
```

### Commit Messages

Follow conventional commits:

```
feat: add streaming support
fix: handle expired token refresh
docs: update installation instructions
chore: bump dependencies
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make your changes** with clear commits
4. **Test** your changes locally
5. **Push** to your fork
6. **Open a PR** against `main`

### PR Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Tests pass with real Copilot API
- [ ] README updated if adding features
- [ ] CHANGELOG.md updated

## Types of Contributions

### Bug Fixes

1. Check [existing issues](https://github.com/ssccio/n8n-nodes-gh-copilot/issues)
2. Create an issue if none exists
3. Reference the issue in your PR

### New Features

1. Open an issue first to discuss the feature
2. Wait for feedback before implementing
3. Keep scope focused

### Documentation

Documentation improvements are always welcome:
- Typo fixes
- Clarifications
- Additional examples
- Troubleshooting tips

## Questions?

- Open a [GitHub Discussion](https://github.com/ssccio/n8n-nodes-gh-copilot/discussions)
- Check existing [issues](https://github.com/ssccio/n8n-nodes-gh-copilot/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
