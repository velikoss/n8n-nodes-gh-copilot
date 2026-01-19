# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.
**Current focus:** Phase 3 - n8n Node Integration

## Current Position

Phase: 2 of 4 (LangChain Model) - COMPLETE
Plan: 2 of 2 in current phase - COMPLETE
Status: Phase 2 complete, ready for Phase 3
Last activity: 2026-01-19 — Completed 02-02-PLAN.md

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 7 min
- Total execution time: 34 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Authentication | 3/3 | 14 min | 5 min |
| 2. LangChain Model | 2/2 | 20 min | 10 min |

**Recent Trend:**
- Last 5 plans: 01-02 (2 min), 01-03 (10 min), 02-01 (8 min), 02-02 (12 min)
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
- Required IDE headers: Editor-Version, Editor-Plugin-Version, Copilot-Integration-Id

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

### Phase 2 Completion Summary

All LangChain model requirements met:
- LANG-03: System messages transformed to assistant role (verified by test)
- LANG-04: Model compatible with n8n AI Agent workflows (uses standard .invoke() API)

Key artifacts:
- `src/lib/CopilotChatModel.ts` - LangChain BaseChatModel wrapper (276 lines)
- `test-model.mjs` - Integration test with 3 test cases

Implementation details:
- Wraps ChatOpenAI internally for retry logic and message formatting
- Refreshes token on each _generate() call via tokenManager
- Transforms system messages to assistant role (Copilot API requirement)
- Requires IDE headers (Editor-Version, Editor-Plugin-Version, Copilot-Integration-Id)
- Dynamic endpoint discovery works for both individual and business subscriptions

## Session Continuity

Last session: 2026-01-19T22:00:00Z
Stopped at: Completed Phase 2 (LangChain Model)
Resume file: None
