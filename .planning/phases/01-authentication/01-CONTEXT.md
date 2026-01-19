# Phase 1: Authentication - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

OAuth device flow to authenticate with GitHub Copilot and obtain valid API credentials. This includes initiating device code flow, polling for authorization, exchanging tokens, and discovering the dynamic API endpoint. Token persistence and refresh are deferred to v2.

</domain>

<decisions>
## Implementation Decisions

### Device code UX
- Clickable link to verification URL (opens browser) + device code displayed separately
- Copy button for device code (one-click copy to clipboard)
- Spinner + status text while polling ("Waiting for authorization...")
- On code expiration: show error message + retry button ("Code expired. Click to get a new code.")

### Claude's Discretion
- Token lifecycle management (where/how stored in n8n credentials)
- Error handling for network timeouts, invalid subscriptions, user denial
- Credential test validation approach
- Exact polling interval (RFC 8628 recommends 5 seconds minimum)

</decisions>

<specifics>
## Specific Ideas

No specific references — standard OAuth device flow patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-authentication*
*Context gathered: 2026-01-19*
