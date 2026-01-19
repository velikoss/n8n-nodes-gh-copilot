# Phase 3: n8n Node Integration - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create an n8n sub-node that lets users add GitHub Copilot as a chat model in AI Agent workflows. Users can select models from their subscription via dropdown, configure temperature, and test their connection. The node implements `supplyData()` returning the LangChain BaseChatModel from Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Model Selection UI
- Group models by provider (OpenAI, Anthropic, Google, etc.)
- Show premium badge `[Premium]` for models with 300/mo limit
- No multiplier numbers shown — badge only
- Filter dropdown to only show models accessible with user's subscription
- Default selection: most capable non-premium model available

### Rate Limit Display
- Premium badge shown inline in model dropdown during selection
- No separate warning notice when premium model selected
- No multiplier numbers displayed
- Show remaining premium requests during credential test (if API provides)

### Node Parameters
- Temperature only — keep parameters minimal
- Default temperature: 0.7 (balanced)
- Temperature always visible (not under Options/Advanced)
- Node name: "GitHub Copilot Chat Model"

### Connection Testing
- Test verifies: token validity + fetches available models
- Success message: "Connected! {n} models, {x}/{limit} premium requests remaining"
- Error messages: User-friendly message + technical details expandable
- On expired token: Guide user with "Token expired. Run device flow again to get new token."

### Claude's Discretion
- How to detect premium vs non-premium models from API response
- Model sorting within provider groups
- Exact wording of error messages
- How to handle missing usage data from API

</decisions>

<specifics>
## Specific Ideas

- Most capable non-premium default (like sonnet-4.5) rather than hardcoding gpt-4o
- Keep UI clean — badge is sufficient indicator, no warnings or multiplier numbers cluttering the dropdown

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-n8n-node-integration*
*Context gathered: 2026-01-19*
