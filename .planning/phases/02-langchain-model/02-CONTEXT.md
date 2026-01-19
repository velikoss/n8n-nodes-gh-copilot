# Phase 2: LangChain Model - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

A LangChain-compatible chat model that wraps Copilot's API. The model implements the standard BaseChatModel interface so it works with n8n's AI Agent node. Model selection and n8n node integration are Phase 3 concerns.

</domain>

<decisions>
## Implementation Decisions

### Message Transformation
- System messages transformed to assistant role with content unchanged (no prefix)
- Multiple system messages: Claude's discretion on merge vs preserve sequence
- Log transformations when debug/verbose mode is enabled
- Edge cases (empty messages, tool messages): Claude's discretion

### Base Class Approach
- Claude's discretion on extend vs wrap vs implement from scratch
- Moderate coupling to LangChain internals is acceptable if it simplifies implementation
- Standard BaseChatModel interface only — no Copilot-specific extensions
- Credential/token handling: Claude's discretion on design

### Error Responses
- Rate limits (429): Auto-retry with exponential backoff
- Auth errors (401/403): Try token refresh once, then fail
- Error messages: User-friendly, hide technical details
- Include actionable suggestions ("Try again in X seconds", "Re-authenticate in credentials")

### Model Parameters
- Temperature only for v1 (range 0-2)
- Model name NOT configurable here — Phase 3 handles model selection
- Unsupported parameters throw errors (not silently ignored)
- Default temperature: 0.7

### Claude's Discretion
- Base class approach (extend/wrap/implement)
- Multiple system message handling strategy
- Edge case handling for message transformation
- Credential injection pattern

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that work well with n8n's AI Agent node.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-langchain-model*
*Context gathered: 2026-01-19*
