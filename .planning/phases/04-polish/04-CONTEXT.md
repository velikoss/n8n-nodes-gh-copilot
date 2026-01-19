# Phase 4: Polish - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the node production-ready with proper branding and documentation. Icon, metadata, help text, and category placement. No functional changes — visual and textual polish only.

</domain>

<decisions>
## Implementation Decisions

### Icon & Branding
- Copilot-inspired custom design (avoid trademark issues with official logo)
- GitHub Copilot color scheme (blue/purple gradient)
- Slight depth/3D effect matching Copilot branding style
- Node name: "GitHub Copilot" (no "Chat" suffix)

### Help Text Style
- Minimal descriptions — one-line, assume user knows basics
- Include default values in help text (e.g., "Default: 0.7")
- Friendly tone — approachable, less jargon
- Model parameter: No explanation of premium vs included — [Premium] badge is sufficient

### Error Messages
- No troubleshooting hints — just describe what went wrong
- User-friendly messages only — no status codes or technical details
- Rate limit errors: Generic "Too many requests. Please wait" messaging

### Category Placement
- Location: AI > Language Models (standard for chat models)
- Search aliases: Yes — include "copilot", "github ai", etc.
- Description: Describe capability ("Use GitHub Copilot models in AI workflows")

### Claude's Discretion
- Premium model error messaging approach
- Version number in metadata (follow n8n conventions)
- Exact alias list for search
- Specific icon design within stated parameters

</decisions>

<specifics>
## Specific Ideas

- Icon should evoke Copilot without copying — the distinctive blue/purple gradient with slight depth
- Help text tone: think n8n's existing nodes, friendly but concise

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-polish*
*Context gathered: 2026-01-19*
