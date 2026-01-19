# Roadmap: n8n GitHub Copilot Chat Model

## Overview

This roadmap delivers an n8n chat model sub-node that connects GitHub Copilot's API to n8n's AI Agent workflows. The journey starts with authentication infrastructure (the foundation everything else depends on), builds the LangChain-compatible model layer, wires it into n8n's sub-node system with model selection, and finishes with branding and polish. Each phase delivers a testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions if needed (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Authentication** - OAuth device flow and token management
- [x] **Phase 2: LangChain Model** - Chat model implementation with Copilot API
- [x] **Phase 3: n8n Node Integration** - Sub-node with model selection UI
- [ ] **Phase 4: Polish** - Branding, metadata, and help text

## Phase Details

### Phase 1: Authentication
**Goal**: Users can authenticate with GitHub Copilot and obtain valid API credentials
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can initiate device code flow and see verification URL with code
  2. Node correctly polls for authorization completion (per RFC 8628)
  3. Access token is exchanged for Copilot API key
  4. API endpoint is dynamically discovered (not hardcoded)
  5. Credential test function validates authentication works
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold and device code flow
- [x] 01-02-PLAN.md — Token manager and credential type
- [x] 01-03-PLAN.md — Build and verification checkpoint

### Phase 2: LangChain Model
**Goal**: A LangChain-compatible chat model that works with Copilot's API
**Depends on**: Phase 1 (requires valid credentials)
**Requirements**: LANG-01, LANG-02, LANG-03, LANG-04
**Success Criteria** (what must be TRUE):
  1. Model extends BaseChatModel and implements required LangChain interfaces
  2. System messages are transformed to assistant role (Copilot requirement)
  3. Chat completions return valid responses through LangChain
  4. Model instance can be used directly by AI Agent node
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — CopilotChatModel class wrapping ChatOpenAI
- [x] 02-02-PLAN.md — Integration test and verification

### Phase 3: n8n Node Integration
**Goal**: Users can add the node in n8n and select models from their subscription
**Depends on**: Phase 2 (requires working model)
**Requirements**: MODL-01, MODL-02, MODL-03, MODL-04, CHAT-01, LANG-01, LANG-02
**Success Criteria** (what must be TRUE):
  1. Node implements supplyData() returning LangChain BaseChatModel
  2. Model dropdown is populated from Copilot API after auth
  3. Premium models show [Premium] badge indicator
  4. Temperature parameter is exposed and functional (0-2 range)
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Model selection capability (CopilotChatModel modelName + CopilotModels.ts)
- [x] 03-02-PLAN.md — Node definition with supplyData() and searchModels
- [x] 03-03-PLAN.md — Integration test and verification checkpoint

### Phase 4: Polish
**Goal**: Node is production-ready with proper branding and documentation
**Depends on**: Phase 3 (requires working node)
**Requirements**: META-01, META-02, META-03, MODL-04
**Success Criteria** (what must be TRUE):
  1. Node has GitHub Copilot branded icon
  2. Node appears in AI > Language Models category with search aliases
  3. All parameters have descriptive help text
  4. Model multipliers displayed (e.g., [3x] for premium models)
  5. Node can be installed and used in a fresh n8n instance
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Icon creation (user generates via Gemini), codex aliases, metadata polish
- [ ] 04-02-PLAN.md — Model multipliers, help text refinement, final validation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication | 3/3 | Complete | 2026-01-19 |
| 2. LangChain Model | 2/2 | Complete | 2026-01-19 |
| 3. n8n Node Integration | 3/3 | Complete | 2026-01-19 |
| 4. Polish | 0/2 | Planned | - |

---
*Roadmap created: 2026-01-19*
*Phase 1 planned: 2026-01-19*
*Phase 2 planned: 2026-01-19*
*Phase 3 planned: 2026-01-19*
*Phase 4 planned: 2026-01-19*
*Coverage: 17/17 v1 requirements mapped*
