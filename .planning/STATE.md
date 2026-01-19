# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.
**Current focus:** Phase 2 - LangChain Model

## Current Position

Phase: 2 of 4 (LangChain Model)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-19 — Completed 02-01-PLAN.md

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 5 min
- Total execution time: 22 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Authentication | 3/3 | 14 min | 5 min |
| 2. LangChain Model | 1/2 | 8 min | 8 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (2 min), 01-03 (10 min), 02-01 (8 min)
- Trend: Consistent execution times

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Used VSCode Copilot client ID (Iv1.b507a08c87ecfe98) for device flow
- NodeNext module resolution for modern ESM/CJS interop
- Minimal scope (read:user) for OAuth token
- 5-minute buffer before token expiry triggers proactive refresh
- API endpoint stored in credentials for persistence across sessions
- Business subscription returns api.business.githubcopilot.com endpoint
- Export types alongside functions for TypeScript consumers
- Wrap ChatOpenAI rather than extend BaseChatModel directly (leverages retry logic)
- Cast options to Record<string, unknown> for LangChain type compatibility
- Default temperature 0.7, model gpt-4o (Phase 3 makes configurable)

### Pending Todos

None yet.

### Blockers/Concerns

From research:
- Community node AI Agent compatibility (n8n issue #16121) — may need workarounds
- Device flow in n8n credentials — standard OAuth2 doesn't support device flow natively (RESOLVED: user obtains token externally, pastes into credential)

### Phase 1 Completion Summary

All authentication requirements met:
- AUTH-01: Credential type initiates flow (user runs device flow, pastes token)
- AUTH-02: Verification URL and code displayed during device flow
- AUTH-03: RFC 8628 polling implemented with all error cases
- AUTH-04: OAuth token exchanged for Copilot API token
- AUTH-05: Dynamic endpoint from token exchange response

Key artifacts:
- `src/lib/CopilotAuth.ts` - Device code flow
- `src/lib/CopilotTokenManager.ts` - Token exchange and lifecycle
- `src/credentials/GitHubCopilotApi.credentials.ts` - n8n credential type
- `src/index.ts` - Package entry point
- `dist/` - Compiled output ready for n8n

### Phase 2 Progress

Plan 02-01 complete:
- `src/lib/CopilotChatModel.ts` - LangChain BaseChatModel wrapper
- Exports: CopilotChatModel, CopilotChatModelParams
- System message transformation (system -> assistant role)
- Token refresh on each _generate() call

## Session Continuity

Last session: 2026-01-19T21:23:00Z
Stopped at: Completed 02-01-PLAN.md
Resume file: None
