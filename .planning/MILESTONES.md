# Project Milestones: n8n GitHub Copilot Chat Model

## v1.0 MVP (Shipped: 2026-01-19)

**Delivered:** An n8n chat model sub-node that connects GitHub Copilot's API to n8n AI Agent workflows, leveraging existing Copilot subscriptions for LLM access.

**Phases completed:** 1-5 (12 plans total)

**Key accomplishments:**

- OAuth device code authentication flow with dynamic API endpoint discovery (supports Individual, Business, Enterprise SKUs)
- LangChain-compatible CopilotChatModel wrapping ChatOpenAI with automatic system message transformation
- n8n sub-node with model dropdown dynamically populated from Copilot API (36 models discovered)
- Premium model detection with multiplier badges ([3x] for Opus, [1x] for Sonnet, [0.33x] for mini)
- Professional branding with GitHub Copilot icon, codex aliases, and polished help text
- Published to npm and installable via n8n Community Nodes

**Stats:**

- 9 TypeScript source files
- ~1,300 lines of TypeScript
- 5 phases, 12 plans, 67 commits
- 1 day from start to ship (2026-01-19)

**Git range:** `fcd8d64` (init) → `46cd12d` (complete distribution)

**What's next:** v2 features including token persistence, streaming support, and additional chat parameters

---
*Milestones created: 2026-01-19*
