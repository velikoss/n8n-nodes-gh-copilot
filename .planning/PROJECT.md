# n8n GitHub Copilot Chat Model

## What This Is

An n8n chat model sub-node that enables using GitHub Copilot's API as a language model provider for n8n's AI Agent. It leverages existing Copilot subscriptions (Individual, Business, Enterprise) to access models like GPT-4o and Claude without separate API fees.

## Core Value

Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Node appears in n8n's Language Models picker alongside other chat models
- [ ] OAuth device code authentication flow (github.com/login/device)
- [ ] Token persistence and automatic refresh
- [ ] Dynamic model discovery based on subscription tier
- [ ] Premium model indicators (300 req/month limit)
- [ ] Model selection dropdown populated after authentication
- [ ] Compatible with n8n AI Agent (returns LangChain BaseChatModel via supplyData)
- [ ] Standard chat completion parameters (temperature, max tokens, etc.)

### Out of Scope

- Streaming responses — defer to v2, focus on basic completion first
- Non-chat completions — this is specifically a chat model node
- Multiple account support — single authenticated account per n8n instance
- Custom API endpoints — use standard Copilot API endpoints

## Context

**Technical environment:**
- n8n chat model sub-nodes implement `supplyData()` returning a LangChain `BaseChatModel`
- Output connection type: `NodeConnectionTypes.AiLanguageModel`
- Built on `@n8n/n8n-nodes-langchain` patterns
- GitHub Copilot uses OAuth 2.0 device authorization flow for authentication
- After device auth, access token is used to obtain API key for Copilot API
- API key requires periodic refresh using the access token

**Prior art:**
- LiteLLM has a working Copilot integration with device code auth
- Known issue: Copilot endpoint varies by subscription SKU, should use returned endpoint not hardcoded

**Subscription tiers:**
- Different Copilot subscriptions (Individual, Business, Enterprise) have different model access
- Some models are "premium" with 300 queries/month limit
- Node should reflect what authenticated user actually has access to

## Constraints

- **Tech stack**: TypeScript, n8n node SDK, LangChain JS — must match n8n's existing patterns
- **Auth flow**: Must implement device code OAuth in-node, not rely on external CLI tools
- **Compatibility**: Must work as drop-in replacement for other chat models in AI Agent workflows

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement OAuth directly vs use `gh` CLI | Node should be self-contained, no external dependencies | — Pending |
| Dynamic model discovery vs hardcoded list | Different subscriptions have different access, should reflect reality | — Pending |

---
*Last updated: 2026-01-19 after initialization*
