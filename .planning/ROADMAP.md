# Roadmap: n8n GitHub Copilot Chat Model

## Overview

This roadmap delivers an n8n chat model sub-node that connects GitHub Copilot's API to n8n's AI Agent workflows. The journey starts with authentication infrastructure (the foundation everything else depends on), builds the LangChain-compatible model layer, wires it into n8n's sub-node system with model selection, and finishes with branding and polish. Each phase delivers a testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions if needed (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Authentication** - OAuth device flow and token management
- [ ] **Phase 2: LangChain Model** - Chat model implementation with Copilot API
- [ ] **Phase 3: n8n Node Integration** - Sub-node with model selection UI
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
**Plans**: TBD

Plans:
- [ ] 01-01: OAuth device code flow implementation
- [ ] 01-02: Token exchange and API key acquisition
- [ ] 01-03: Credential type with test function

### Phase 2: LangChain Model
**Goal**: A LangChain-compatible chat model that works with Copilot's API
**Depends on**: Phase 1 (requires valid credentials)
**Requirements**: LANG-01, LANG-02, LANG-03, LANG-04
**Success Criteria** (what must be TRUE):
  1. Model extends ChatOpenAI and implements required LangChain interfaces
  2. System messages are transformed to assistant role (Copilot requirement)
  3. Chat completions return valid responses through LangChain
  4. Model instance can be used directly by AI Agent node
**Plans**: TBD

Plans:
- [ ] 02-01: CopilotChatModel class extending ChatOpenAI
- [ ] 02-02: Message transformation and API client

### Phase 3: n8n Node Integration
**Goal**: Users can add the node in n8n and select models from their subscription
**Depends on**: Phase 2 (requires working model)
**Requirements**: MODL-01, MODL-02, MODL-03, MODL-04, CHAT-01
**Success Criteria** (what must be TRUE):
  1. Node implements supplyData() returning LangChain BaseChatModel
  2. Model dropdown is populated from Copilot API after auth
  3. Premium models show indicator (300 requests/month)
  4. Model multipliers are displayed (e.g., Claude Opus = 10x)
  5. Temperature parameter is exposed and functional
**Plans**: TBD

Plans:
- [ ] 03-01: Node definition with supplyData()
- [ ] 03-02: Dynamic model discovery and selection
- [ ] 03-03: Parameters (temperature, model indicators)

### Phase 4: Polish
**Goal**: Node is production-ready with proper branding and documentation
**Depends on**: Phase 3 (requires working node)
**Requirements**: META-01, META-02, META-03
**Success Criteria** (what must be TRUE):
  1. Node has GitHub Copilot branded icon
  2. Node appears in AI > Language Models category
  3. All parameters have descriptive help text
  4. Node can be installed and used in a fresh n8n instance
**Plans**: TBD

Plans:
- [ ] 04-01: Icon, category, and metadata
- [ ] 04-02: Help text and final validation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication | 0/3 | Not started | - |
| 2. LangChain Model | 0/2 | Not started | - |
| 3. n8n Node Integration | 0/3 | Not started | - |
| 4. Polish | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-19*
*Coverage: 17/17 v1 requirements mapped*
