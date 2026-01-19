# Project Research Summary

**Project:** n8n-nodes-gh-copilot
**Domain:** n8n AI Chat Model Sub-Node with OAuth Authentication
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH

## Executive Summary

Building an n8n chat model sub-node for GitHub Copilot requires implementing three distinct integration points: (1) n8n's sub-node pattern using `supplyData()` to return a LangChain model, (2) GitHub's OAuth device code flow with short-lived API token management, and (3) a LangChain wrapper that handles Copilot's OpenAI-compatible API with its specific quirks. The recommended approach is extending `ChatOpenAI` from `@langchain/openai` rather than implementing `BaseChatModel` from scratch, which provides streaming, tool calling, and structured output for free.

The core value proposition is clear: users with existing GitHub Copilot subscriptions gain access to GPT-4, Claude, and Gemini models without separate API costs. This is a unique differentiator among n8n chat model nodes. However, success depends on correctly handling Copilot's API peculiarities, particularly the dynamic endpoint discovery (varies by subscription tier) and the requirement to transform system messages (which cause 500 errors if sent as-is).

The primary risks are authentication complexity and API compatibility. Token management requires proactive refresh before the 30-minute expiration, and the endpoint returned from authentication must be used (not hardcoded). Community nodes face an additional challenge: n8n's AI Agent maintains a hardcoded allowlist of compatible nodes, which may require workarounds or community pressure to resolve.

## Key Findings

### Recommended Stack

The project uses TypeScript with n8n's community node SDK and LangChain.js for AI model integration. GitHub Copilot's API is OpenAI-compatible, meaning we can leverage existing LangChain infrastructure.

**Core technologies:**
- `@langchain/openai` (ChatOpenAI): Extend for Copilot API — provides streaming, tool calling without custom implementation
- `n8n-workflow`: Node SDK interfaces (`INodeType`, `ISupplyDataFunctions`, `SupplyData`) — required for sub-node pattern
- `@langchain/core` (^0.3.0): Base types (BaseMessage, ChatResult) — match n8n's LangChain versions for compatibility
- TypeScript (^5.3.0): Build target ES2022, NodeNext module resolution — standard n8n node setup

### Expected Features

**Must have (table stakes):**
- LangChain chat model implementation via `supplyData()` returning ChatOpenAI-compatible instance
- GitHub Copilot OAuth credential type with device flow authentication
- Model selection dropdown (GPT-4o, Claude Sonnet 4, Gemini 2.5 Pro, etc.)
- Core parameters: temperature, max tokens, top P
- Proper token refresh handling (30-minute Copilot API tokens)

**Should have (v1.0):**
- Streaming support via LangChain's native streaming
- Timeout and max retries configuration
- Dynamic model loading from `/v1/models` endpoint

**Defer (v2+):**
- Tier-aware model filtering (show only models user can access)
- Premium request budget tracking/warnings
- Frequency/presence penalties (unconfirmed API support)
- Built-in tool calling (let AI Agent handle this)
- Conversation memory (handled by Memory sub-nodes)

### Architecture Approach

The architecture follows n8n's cluster node pattern where a root node (AI Agent) consumes sub-nodes (Chat Models). The node implements `supplyData()` which instantiates a LangChain model, passes it to the AI Agent, and the Agent invokes it during execution. Token management happens lazily at first API call.

**Major components:**
1. **GitHubCopilotLmChat.node.ts** — n8n node definition, UI properties, credential binding, `supplyData()` entry point
2. **GitHubCopilotApi.credentials.ts** — OAuth token storage, credential test function
3. **CopilotChatModel.ts** — Extends ChatOpenAI with custom auth, message transformation (system to assistant)
4. **CopilotTokenManager.ts** — Token lifecycle: caches Copilot API token, proactive refresh at 20% remaining lifetime
5. **CopilotApiClient.ts** — HTTP requests with token injection, error handling, rate limit backoff

### Critical Pitfalls

1. **Hardcoded API endpoint** — Copilot endpoint varies by subscription SKU (Individual/Business/Enterprise). Must parse endpoint from auth response, not hardcode. Causes 403/404 for wrong subscription types.

2. **System messages cause 500 errors** — Copilot API does not support `system` role. Transform all system messages to `assistant` role before sending. Without this, n8n AI Agent workflows fail completely.

3. **Token expiration without refresh** — API tokens expire in 25-30 minutes. Implement proactive refresh when 20% lifetime remains (5-6 minutes before expiry), not on expiration. 401/403 mid-workflow otherwise.

4. **Credential test function not recognized** — Must place test function inside `methods.credentialTest` object, not just reference by name. Causes "No testing function found" errors.

5. **Missing Editor-Version header** — API requires `Editor-Version: n8n/[version]` and `Editor-Plugin-Version` headers. 400 errors without them.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Authentication
**Rationale:** Authentication is foundational; nothing works without it. Token management complexity requires early attention.
**Delivers:** Working credential type, token manager, basic API client
**Addresses:** OAuth device flow, token refresh, endpoint discovery
**Avoids:** Hardcoded endpoint pitfall, token expiration failures, credential test issues

### Phase 2: LangChain Model Integration
**Rationale:** Depends on working authentication. Core value delivery.
**Delivers:** LangChain-compatible chat model, message transformation, basic chat completions
**Uses:** @langchain/openai (ChatOpenAI extension), CopilotTokenManager, CopilotApiClient
**Implements:** CopilotChatModel component
**Avoids:** System message 500 errors, missing headers

### Phase 3: n8n Node Integration
**Rationale:** Depends on working LangChain model. Wires everything into n8n's sub-node system.
**Delivers:** Working n8n node that appears in UI and connects to AI Agent
**Addresses:** Node metadata, model selection UI, parameter definitions
**Avoids:** Package.json export issues, expression resolution surprises

### Phase 4: Polish and Streaming
**Rationale:** Core functionality must work first. These are enhancements.
**Delivers:** Streaming support, rate limit handling, dynamic model list
**Addresses:** Should-have features from FEATURES.md
**Avoids:** Streaming timeouts, rate limit failures

### Phase Ordering Rationale

- **Authentication first:** Every other component depends on valid tokens. Token management is complex enough to warrant dedicated phase.
- **LangChain before n8n node:** The node is just a thin wrapper around the model. Get the model working standalone first.
- **Streaming last:** It's an enhancement to working functionality, not core requirement.
- **Message transformation in Phase 2:** Critical pitfall (system messages) is in API layer, must be addressed when building model.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** OAuth device flow details — n8n's standard OAuth2 doesn't support device flow natively, may need custom implementation
- **Phase 3:** AI Agent compatibility — community node allowlist issue may require workarounds or testing with different n8n node types

Phases with standard patterns (skip research-phase):
- **Phase 2:** LangChain model wrapping — well-documented, ChatOpenAI extension pattern is clear
- **Phase 4:** Streaming — LangChain handles SSE parsing, just need to implement `_stream()`

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Versions verified from n8n-nodes-langchain, patterns from official nodes |
| Features | HIGH | Verified against n8n OpenAI/Anthropic nodes and GitHub Copilot docs |
| Architecture | MEDIUM | Pattern verified, but device flow in n8n credentials is less documented |
| Pitfalls | MEDIUM-HIGH | Most pitfalls from LiteLLM issues with same Copilot API integration |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Community node AI Agent compatibility:** n8n issue #16121 indicates community nodes may not connect to Agent. Test early with Basic LLM Chain as fallback. May need to contribute to n8n core.
- **VSCode client ID legitimacy:** OAuth device flow uses VSCode's client ID. May violate ToS. Investigate registering dedicated OAuth app with GitHub.
- **Dynamic model availability:** No confirmed API for determining user's subscription tier. May need static model list with documentation about tier requirements.
- **Device flow in n8n credentials:** Standard n8n OAuth2 credential doesn't support device flow. Evaluate: manual token entry (simpler) vs custom credential modal (better UX).

## Sources

### Primary (HIGH confidence)
- n8n LangChain concepts — sub-node pattern, supplyData() interface
- n8n OpenAI/Azure/Anthropic Chat Model nodes — reference implementation patterns
- GitHub Copilot supported models docs — available models by subscription tier
- LangChain.js ChatOpenAI API — extension patterns, streaming implementation
- RFC 8628 — Device Authorization Grant specification

### Secondary (MEDIUM confidence)
- LiteLLM GitHub Issues (#12726, #12724, #17065, #18475) — Copilot API pitfalls, same integration challenges
- copilot-api project (ericc-ch) — demonstrates OpenAI compatibility, auth flow
- n8n Community forums — credential test function issues, custom node patterns
- n8n GitHub Issue #16121 — community node AI compatibility limitations

### Tertiary (LOW confidence)
- Copilot internal API endpoint structure — reverse-engineered, may change
- Premium request budget API — no confirmed endpoint for querying usage
- GitHub ToS implications — unclear stance on third-party API usage

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
