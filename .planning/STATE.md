# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.
**Current focus:** MILESTONE v1.0 COMPLETE

## Current Position

Phase: 5 of 5 (Distribution) - COMPLETE
Plan: 2 of 2 in current phase - COMPLETE
Status: All phases complete
Last activity: 2026-01-20 — Completed 05-02-PLAN.md (npm Publish and Verification)

Progress: [██████████] 100% (12/12 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 5 min
- Total execution time: ~68 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Authentication | 3/3 | 14 min | 5 min |
| 2. LangChain Model | 2/2 | 20 min | 10 min |
| 3. n8n Node Integration | 3/3 | 12 min | 4 min |
| 4. Polish | 2/2 | 12 min | 6 min |
| 5. Distribution | 2/2 | 10 min | 5 min |

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
- Premium models stored in Set for O(1) lookup performance
- Default model preference: gpt-4.1 > gpt-4o > gpt-4o-mini
- NodeConnectionTypes (const object) instead of NodeConnectionType enum for n8n-workflow
- resourceLocator with list and id modes for model selection
- copy:icons script for PNG files in build process
- Test imports from dist/index.js (compiled output) for realistic verification
- PNG icon format for n8n nodes (192x192 RGBA)
- Codex aliases include product name variants (copilot, github, github ai, github copilot)
- MODEL_MULTIPLIERS lookup table for known premium request costs
- Badge format [Nx] for multipliers, [Premium] fallback for unknown premium models
- Package renamed to n8n-nodes-gh-copilot-lm (original name taken on npm)
- Repository: github.com/ssccio/n8n-nodes-gh-copilot
- npm 2FA disabled for CI publishing

### Pending Todos

None - milestone complete.

### Blockers/Concerns

From research:
- Community node AI Agent compatibility (n8n issue #16121) — may need workarounds
- Device flow in n8n credentials — standard OAuth2 doesn't support device flow natively (RESOLVED: user obtains token externally, pastes into credential)

### Phase 1-4 Completion Summary

(See previous STATE.md versions for detailed summaries)

### Phase 5 Completion Summary

All distribution requirements met:
- DIST-01: GitHub repository with .gitignore (31 lines)
- DIST-02: README.md with GUI-first installation (92 lines)
- DIST-03: MIT LICENSE file
- DIST-04: package.json with author, repository, homepage, bugs
- DIST-05: CHANGELOG.md with v1.0.0 release notes
- DIST-06: Package published to npm (n8n-nodes-gh-copilot-lm@1.0.1)

Key artifacts:
- `package.json` - Complete npm metadata
- `README.md` - Installation and usage guide
- `LICENSE` - MIT license
- `CHANGELOG.md` - v1.0.0 release notes
- `.gitignore` - Proper exclusions
- `.github/ISSUE_TEMPLATE/*` - Bug report and feature request templates

npm package: https://www.npmjs.com/package/n8n-nodes-gh-copilot-lm
GitHub repo: https://github.com/ssccio/n8n-nodes-gh-copilot

## Session Continuity

Last session: 2026-01-20T01:30:00Z
Stopped at: MILESTONE v1.0 COMPLETE - All 12 plans executed
Resume file: None
