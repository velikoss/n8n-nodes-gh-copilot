# n8n GitHub Copilot Chat Model

## What This Is

An n8n chat model sub-node that enables using GitHub Copilot's API as a language model provider for n8n's AI Agent. It leverages existing Copilot subscriptions (Individual, Business, Enterprise) to access models like GPT-4o and Claude without separate API fees.

## Core Value

Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.

## Requirements

### Validated

- ✓ Node appears in n8n's Language Models picker alongside other chat models — v1.0
- ✓ OAuth device code authentication flow (github.com/login/device) — v1.0
- ✓ Dynamic model discovery based on subscription tier — v1.0
- ✓ Premium model indicators with multiplier badges — v1.0
- ✓ Model selection dropdown populated after authentication — v1.0
- ✓ Compatible with n8n AI Agent (returns LangChain BaseChatModel via supplyData) — v1.0
- ✓ Temperature parameter exposed (0-2 range) — v1.0
- ✓ System messages transformed to assistant role (Copilot API requirement) — v1.0
- ✓ GitHub Copilot branded icon and metadata — v1.0
- ✓ Published to npm, installable via n8n Community Nodes — v1.0

### Active

- [ ] Token persistence and automatic refresh across n8n restarts
- [ ] Max tokens parameter
- [ ] Top P parameter
- [ ] Streaming support for real-time output

### Out of Scope

- Streaming responses — defer to v2, focus on basic completion first (RESOLVED: added to Active for v2)
- Non-chat completions — this is specifically a chat model node
- Multiple account support — single authenticated account per n8n instance
- Custom API endpoints — use standard Copilot API endpoints
- Built-in tool calling — AI Agent node handles tool orchestration
- Conversation memory — memory sub-nodes exist for this
- Response caching — n8n has workflow-level caching

## Context

**Current state (v1.0 shipped):**
- 9 TypeScript source files, ~1,300 LOC
- Tech stack: TypeScript, n8n node SDK, LangChain JS, ChatOpenAI wrapper
- Published: `n8n-nodes-gh-copilot-lm@1.0.1` on npm
- Repository: github.com/ssccio/n8n-nodes-gh-copilot

**Technical environment:**
- n8n chat model sub-nodes implement `supplyData()` returning a LangChain `BaseChatModel`
- Output connection type: `NodeConnectionTypes.AiLanguageModel`
- Built on `@n8n/n8n-nodes-langchain` patterns
- GitHub Copilot uses OAuth 2.0 device authorization flow for authentication
- After device auth, access token is used to obtain API key for Copilot API
- Dynamic endpoint discovery (Business SKU returns api.business.githubcopilot.com)

**Subscription tiers:**
- Different Copilot subscriptions (Individual, Business, Enterprise) have different model access
- Some models are "premium" with 300 queries/month limit
- Premium models have multipliers (Claude Opus = 3x, Sonnet = 1x, mini = 0.33x)

## Constraints

- **Tech stack**: TypeScript, n8n node SDK, LangChain JS — must match n8n's existing patterns
- **Auth flow**: Must implement device code OAuth in-node, not rely on external CLI tools
- **Compatibility**: Must work as drop-in replacement for other chat models in AI Agent workflows

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement OAuth directly vs use `gh` CLI | Node should be self-contained, no external dependencies | ✓ Good |
| Dynamic model discovery vs hardcoded list | Different subscriptions have different access, should reflect reality | ✓ Good |
| Wrap ChatOpenAI vs extend BaseChatModel | Leverage ChatOpenAI's retry logic, batching, and OpenAI-compatible API | ✓ Good |
| NodeConnectionTypes const vs enum | n8n-workflow uses const object, not enum | ✓ Good |
| Use VSCode Copilot client ID | Well-known ID, works with device flow | ✓ Good |
| PNG icon format 192x192 | n8n standard for node icons | ✓ Good |
| Package name n8n-nodes-gh-copilot-lm | Original name taken on npm | ✓ Good |

---
*Last updated: 2026-01-19 after v1.0 milestone*
