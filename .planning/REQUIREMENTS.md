# Requirements: n8n GitHub Copilot Chat Model

**Defined:** 2026-01-19
**Core Value:** Use what you're already paying for — your company's GitHub Copilot subscription provides access to multiple LLM models at no additional per-token cost.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: Node initiates OAuth device code flow when credentials not present
- [x] **AUTH-02**: User sees device code and verification URL during auth
- [x] **AUTH-03**: Node polls for authorization completion per RFC 8628
- [x] **AUTH-04**: Access token exchanged for Copilot API key
- [x] **AUTH-05**: Node uses dynamic endpoint returned from auth (not hardcoded)

### Model Selection

- [ ] **MODL-01**: Node fetches available models from Copilot API after authentication
- [ ] **MODL-02**: Model dropdown populated with discovered models
- [ ] **MODL-03**: Premium models indicated in UI (300 requests/month budget)
- [ ] **MODL-04**: Model multipliers displayed (e.g., Claude Opus = 10x)

### Chat Parameters

- [ ] **CHAT-01**: Temperature parameter exposed (0-2 range)

### LangChain Integration

- [ ] **LANG-01**: Node implements supplyData() returning LangChain BaseChatModel
- [ ] **LANG-02**: Output connection type is ai_languageModel
- [x] **LANG-03**: System messages transformed to assistant role (Copilot API requirement)
- [x] **LANG-04**: Node compatible with n8n AI Agent workflows

### Node Metadata

- [ ] **META-01**: Node has GitHub Copilot branded icon
- [ ] **META-02**: Node appears in AI > Language Models category
- [ ] **META-03**: All parameters have help text descriptions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Token Management

- **TOKN-01**: Token persistence across n8n restarts
- **TOKN-02**: Automatic token refresh before expiration (~5 min before)
- **TOKN-03**: Graceful handling of expired/revoked tokens

### Additional Parameters

- **CHAT-02**: Max tokens parameter
- **CHAT-03**: Top P parameter
- **CHAT-04**: Streaming support for real-time output

### Enhanced Features

- **ENHN-01**: Tier-aware model filtering (show only accessible models)
- **ENHN-02**: Premium request budget tracking and warnings
- **ENHN-03**: Request timeout configuration
- **ENHN-04**: Max retries configuration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Built-in tool calling | AI Agent node handles tool orchestration |
| Conversation memory | Memory sub-nodes exist for this |
| Code completion / IDE features | Different API, different use case |
| Custom base URL | Security risk, ToS concerns |
| Response caching | n8n has workflow-level caching |
| Frequency/presence penalties | API support uncertain, low priority |
| GitHub Copilot Extensions protocol | Different system, out of scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| MODL-01 | Phase 3 | Pending |
| MODL-02 | Phase 3 | Pending |
| MODL-03 | Phase 3 | Pending |
| MODL-04 | Phase 3 | Pending |
| CHAT-01 | Phase 3 | Pending |
| LANG-01 | Phase 3 | Pending |
| LANG-02 | Phase 3 | Pending |
| LANG-03 | Phase 2 | Complete |
| LANG-04 | Phase 2 | Complete |
| META-01 | Phase 4 | Pending |
| META-02 | Phase 4 | Pending |
| META-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 — Phase 2 requirements complete (LANG-03, LANG-04)*
