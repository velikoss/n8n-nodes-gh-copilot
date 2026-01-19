# Phase 1: Authentication - Research

**Researched:** 2026-01-19
**Domain:** OAuth 2.0 Device Authorization Grant (RFC 8628), GitHub Copilot Token Exchange, n8n Credentials
**Confidence:** HIGH

## Summary

Phase 1 implements OAuth device flow authentication for GitHub Copilot. The flow has three distinct stages: (1) device code flow to get a GitHub OAuth token, (2) token exchange to get a short-lived Copilot API token with dynamic endpoint, and (3) credential storage in n8n with test validation.

The critical insight is that **Copilot API endpoints are dynamic** - they vary by subscription SKU (Individual vs Business vs Enterprise) and must be extracted from the token exchange response, never hardcoded.

n8n does not natively support OAuth device flow, so authentication must be implemented as custom logic within the credential definition or as a separate authorization helper.

**Primary recommendation:** Implement device code flow as a manual process where users run the flow externally and paste the resulting OAuth token into n8n credentials. This matches the UX decisions in CONTEXT.md while keeping implementation complexity manageable for v1.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | ^1.119.0 | ICredentialType interface | Required for n8n credential integration |
| Native fetch | Built-in | HTTP requests for OAuth | No external deps needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^20.0.0 | TypeScript definitions | Development only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch | axios | More features but adds dependency; unnecessary |
| Custom OAuth | n8n OAuth2 | n8n OAuth2 doesn't support device flow |

**Installation:**
```bash
npm install --save-dev @types/node typescript
# n8n-workflow is a peer dependency
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── credentials/
│   └── GitHubCopilotApi.credentials.ts   # Credential definition
├── lib/
│   ├── CopilotAuth.ts                     # Device code flow implementation
│   └── CopilotTokenManager.ts             # Token refresh logic
└── nodes/
    └── LmChatGitHubCopilot/
        └── LmChatGitHubCopilot.node.ts    # Uses credentials
```

### Pattern 1: Three-Stage Authentication Flow

**What:** Separate device code flow, token exchange, and token refresh into distinct concerns.

**When to use:** Always - this is the required flow for Copilot authentication.

**Flow:**

```
Stage 1: Device Code Flow (One-time, User-driven)
┌─────────────┐      POST /login/device/code      ┌─────────────┐
│   Client    │ ──────────────────────────────────►│   GitHub    │
│             │◄────────────────────────────────── │             │
│             │   {device_code, user_code, uri}    │             │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ Display user_code + verification_uri             │
       │ User visits github.com/login/device              │
       │                                                  │
       │      POST /login/oauth/access_token              │
       │ ────────────────────────────────────────────────►│
       │◄──────────────────────────────────────────────── │
       │      {access_token: "gho_xxx"}                   │

Stage 2: Token Exchange (Automatic, On-demand)
┌─────────────┐   GET /copilot_internal/v2/token  ┌─────────────┐
│   Client    │ ──────────────────────────────────►│ GitHub API  │
│   (with     │◄────────────────────────────────── │             │
│  gho_xxx)   │   {token, expires_at, endpoints}   │             │
└─────────────┘                                    └─────────────┘

Stage 3: API Calls (Runtime)
┌─────────────┐   POST {endpoints.api}/v1/chat    ┌─────────────┐
│   Client    │ ──────────────────────────────────►│ Copilot API │
│   (with     │◄────────────────────────────────── │  (dynamic)  │
│ api token)  │   {response}                       │             │
└─────────────┘                                    └─────────────┘
```

### Pattern 2: Dynamic Endpoint Discovery

**What:** Extract and store the API endpoint from token exchange response.

**When to use:** Always - never hardcode Copilot endpoints.

**Example:**
```typescript
// Source: https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup
interface TokenResponse {
  token: string;           // JWT for Copilot API
  expires_at: number;      // Unix timestamp (seconds)
  endpoints?: {
    api?: string;          // e.g., "https://api.githubcopilot.com"
  };
}

async function exchangeToken(oauthToken: string): Promise<TokenResponse> {
  const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
    headers: {
      'Authorization': `Bearer ${oauthToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}
```

### Pattern 3: RFC 8628 Compliant Polling

**What:** Poll for authorization completion with proper error handling.

**When to use:** During device code flow authorization.

**Example:**
```typescript
// Source: https://datatracker.ietf.org/doc/html/rfc8628
interface DeviceCodeResponse {
  device_code: string;       // 40-char verification code
  user_code: string;         // 8-char code with hyphen (XXXX-XXXX)
  verification_uri: string;  // https://github.com/login/device
  expires_in: number;        // Seconds until expiry (default 900)
  interval: number;          // Minimum seconds between polls
}

async function pollForToken(
  clientId: string,
  deviceCode: string,
  interval: number,
  expiresAt: number
): Promise<string> {
  let pollInterval = interval;

  while (Date.now() < expiresAt) {
    await sleep(pollInterval * 1000);

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    }

    switch (data.error) {
      case 'authorization_pending':
        // User hasn't authorized yet, keep polling
        continue;
      case 'slow_down':
        // Polling too fast, add 5 seconds
        pollInterval += 5;
        continue;
      case 'expired_token':
        throw new Error('Device code expired. Please restart authorization.');
      case 'access_denied':
        throw new Error('User denied authorization.');
      default:
        throw new Error(`Authorization failed: ${data.error}`);
    }
  }

  throw new Error('Authorization timed out.');
}
```

### Pattern 4: n8n Credential with Test Function

**What:** Credential definition with validation that tests the token works.

**When to use:** For the GitHubCopilotApi credential type.

**Example:**
```typescript
// Source: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/credentials/AsanaApi.credentials.ts
import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class GitHubCopilotApi implements ICredentialType {
  name = 'gitHubCopilotApi';
  displayName = 'GitHub Copilot API';
  documentationUrl = 'https://github.com/user/n8n-nodes-gh-copilot';

  properties: INodeProperties[] = [
    {
      displayName: 'OAuth Token',
      name: 'oauthToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'GitHub OAuth token (starts with gho_)',
    },
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'string',
      default: '',
      description: 'Copilot API endpoint (auto-discovered during token exchange)',
    },
  ];

  // Note: authenticate is handled differently for Copilot due to
  // short-lived tokens that need refresh before each call

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiEndpoint || "https://api.github.com"}}',
      url: '/copilot_internal/v2/token',
      headers: {
        Authorization: '=Bearer {{$credentials.oauthToken}}',
      },
    },
  };
}
```

### Anti-Patterns to Avoid

- **Hardcoded endpoints:** Never use `https://api.githubcopilot.com` directly. Use the endpoint from token exchange.
- **Token-only storage:** Store OAuth token (long-lived), not just API token (30-min expiry).
- **Sync token refresh:** Always refresh tokens asynchronously with buffer time.
- **Missing error differentiation:** Distinguish between network errors, auth errors, and subscription errors.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth device flow | Custom OAuth library | Native fetch + RFC 8628 pattern | Simple enough, no deps needed |
| Token storage | Custom encryption | n8n credentials system | Encrypted by default |
| HTTP client | Custom wrapper | Native fetch | Built-in, sufficient for auth |
| Polling logic | setTimeout chains | async/await with loop | Cleaner, handles errors better |

**Key insight:** The authentication flow is straightforward HTTP. No special libraries are needed beyond what Node.js provides natively.

## Common Pitfalls

### Pitfall 1: Hardcoded Copilot API Endpoint

**What goes wrong:** Using a fixed endpoint like `https://api.githubcopilot.com` causes failures for Business/Enterprise users who have different endpoints.

**Why it happens:** Developers test with Individual subscriptions and assume the endpoint is universal.

**How to avoid:**
1. Always extract `endpoints.api` from token exchange response
2. Store the endpoint alongside credentials
3. Fall back to a default only if not provided

**Warning signs:** Users with Business/Enterprise subscriptions report 403/404 errors.

**Source:** [LiteLLM Issue #12726](https://github.com/BerriAI/litellm/issues/12726)

### Pitfall 2: Credential Test Function Not Recognized

**What goes wrong:** n8n shows "No testing function found" even when testedBy is configured.

**Why it happens:** The test function must be in `methods.credentialTest` object in the NODE file, or use the `test` property in credentials.

**How to avoid:**
1. For simple tests, use `test: ICredentialTestRequest` in credential file
2. For complex tests, define in node's `methods.credentialTest`
3. Ensure function name matches `testedBy` exactly

**Warning signs:** Credential modal shows no test button or "No testing function found."

**Source:** [n8n Community](https://community.n8n.io/t/how-to-test-custom-node-credentials-with-custom-test-function/21845)

### Pitfall 3: Token Expiration Without Proactive Refresh

**What goes wrong:** API calls fail with 401/403 after 25-30 minutes.

**Why it happens:** Copilot API tokens expire in ~30 minutes. Waiting until expiry causes request failures.

**How to avoid:**
1. Store `expires_at` from token exchange
2. Check expiration before each API call
3. Refresh when 20% lifetime remains (~5-6 minutes before expiry)
4. Implement retry with re-auth as fallback

**Warning signs:** Workflows fail after running for extended periods.

**Source:** [Copilot CLI Authentication](https://deepwiki.com/github/copilot-cli/4.1-authentication-methods)

### Pitfall 4: RFC 8628 Polling Errors

**What goes wrong:** Device code polling fails or times out incorrectly.

**Why it happens:** Not handling all error codes properly, especially `slow_down`.

**How to avoid:**
1. Handle `authorization_pending` - continue polling
2. Handle `slow_down` - add 5 seconds to interval
3. Handle `expired_token` - show retry message
4. Handle `access_denied` - show user cancelled message
5. Set timeout based on `expires_in` from response

**Warning signs:** Authentication works sometimes, fails others. Users report timeout errors.

**Source:** [RFC 8628 Section 3.5](https://datatracker.ietf.org/doc/html/rfc8628)

### Pitfall 5: Client ID Dependency

**What goes wrong:** No valid client_id for the device flow.

**Why it happens:** GitHub requires a registered OAuth app with device flow enabled.

**How to avoid:**
1. Use well-known client IDs from existing implementations (VSCode, Copilot CLI)
2. Or register a dedicated OAuth app with device flow enabled
3. Document the client_id source and any ToS considerations

**Warning signs:** 400 errors with `device_flow_disabled` message.

**Source:** [GitHub OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)

## Code Examples

Verified patterns from official sources:

### Device Code Request

```typescript
// Source: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
const CLIENT_ID = 'Iv1.b507a08c87ecfe98'; // VSCode Copilot client ID

async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: 'read:user',
    }),
  });

  if (!response.ok) {
    throw new Error(`Device code request failed: ${response.status}`);
  }

  return response.json();
}
```

### Token Exchange for Copilot API

```typescript
// Source: https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup
interface CopilotTokenResponse {
  token: string;
  expires_at: number;
  endpoints?: {
    api?: string;
  };
}

async function getCopilotToken(oauthToken: string): Promise<CopilotTokenResponse> {
  const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
    headers: {
      'Authorization': `Bearer ${oauthToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid OAuth token. Please re-authenticate.');
    }
    if (response.status === 403) {
      throw new Error('No active Copilot subscription found.');
    }
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}
```

### Token Manager Class

```typescript
// Source: Synthesized from ARCHITECTURE.md and PITFALLS.md research
export class CopilotTokenManager {
  private oauthToken: string;
  private apiToken: string | null = null;
  private expiresAt: number = 0;
  private apiEndpoint: string = '';

  constructor(oauthToken: string, savedEndpoint?: string) {
    this.oauthToken = oauthToken;
    if (savedEndpoint) {
      this.apiEndpoint = savedEndpoint;
    }
  }

  async getValidToken(): Promise<{ token: string; endpoint: string }> {
    // Refresh if no token or within 5 minutes of expiry
    const bufferMs = 5 * 60 * 1000;
    if (!this.apiToken || Date.now() >= (this.expiresAt - bufferMs)) {
      await this.refreshToken();
    }
    return { token: this.apiToken!, endpoint: this.apiEndpoint };
  }

  private async refreshToken(): Promise<void> {
    const response = await getCopilotToken(this.oauthToken);
    this.apiToken = response.token;
    this.expiresAt = response.expires_at * 1000; // Convert to milliseconds

    // Update endpoint if provided (important for SKU differences)
    if (response.endpoints?.api) {
      this.apiEndpoint = response.endpoints.api;
    }
  }

  getEndpoint(): string {
    return this.apiEndpoint;
  }
}
```

### Credential Test Implementation

```typescript
// Source: https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/
import type {
  ICredentialType,
  ICredentialTestRequest,
  INodeProperties,
} from 'n8n-workflow';

export class GitHubCopilotApi implements ICredentialType {
  name = 'gitHubCopilotApi';
  displayName = 'GitHub Copilot API';
  documentationUrl = 'https://docs.github.com/en/copilot';

  properties: INodeProperties[] = [
    {
      displayName: 'OAuth Token',
      name: 'oauthToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'GitHub OAuth token from device code flow (starts with gho_)',
    },
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'string',
      default: '',
      description: 'Copilot API endpoint (discovered automatically during first use)',
    },
  ];

  // Simple test: verify OAuth token can exchange for Copilot token
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.github.com',
      url: '/copilot_internal/v2/token',
      method: 'GET',
      headers: {
        Authorization: '=Bearer {{$credentials.oauthToken}}',
        Accept: 'application/json',
      },
    },
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded endpoints | Dynamic endpoint discovery | 2024 | Required for Enterprise support |
| Single token storage | OAuth + API token separation | Always | Prevents 30-min expiry issues |
| Manual token paste | Device code flow UX | 2022 | GitHub enabled device flow for OAuth apps |

**Deprecated/outdated:**
- Using `api.github.com/copilot_internal/*` directly without token exchange
- Storing only the short-lived API token
- Assuming single endpoint works for all subscription types

## Open Questions

Things that couldn't be fully resolved:

1. **Client ID source**
   - What we know: VSCode uses `Iv1.b507a08c87ecfe98`
   - What's unclear: ToS implications of using VSCode's client ID for third-party integration
   - Recommendation: Use existing client ID for v1, consider registering dedicated app later

2. **Token refresh in credentials**
   - What we know: n8n credentials don't have built-in token refresh
   - What's unclear: Best pattern for refreshing tokens in credential context
   - Recommendation: Refresh at API call time in node/model layer, not credential layer

3. **API endpoint persistence**
   - What we know: Endpoint varies by SKU and should be saved
   - What's unclear: Whether endpoint can change for same user over time
   - Recommendation: Store endpoint but re-validate on token refresh

## Sources

### Primary (HIGH confidence)

- [RFC 8628 - OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628) - Complete device flow specification
- [GitHub OAuth Apps - Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) - GitHub-specific endpoints and parameters
- [n8n Credentials Files](https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/) - ICredentialType interface and test property
- [AsanaApi.credentials.ts](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/credentials/AsanaApi.credentials.ts) - Reference Bearer auth pattern

### Secondary (MEDIUM confidence)

- [LiteLLM GitHub Copilot Provider](https://docs.litellm.ai/docs/providers/github_copilot) - Token flow verification
- [GitHub Copilot Proxy OAuth Setup](https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup) - Token exchange details
- [n8n Community - Credential Testing](https://community.n8n.io/t/how-to-test-custom-node-credentials-with-custom-test-function/21845) - Test function patterns
- [LiteLLM Issue #12726](https://github.com/BerriAI/litellm/issues/12726) - Dynamic endpoint discovery requirement

### Tertiary (LOW confidence)

- VSCode Copilot client ID from reverse engineering - needs verification
- Token expiration timing (25-30 minutes) from community reports

## Metadata

**Confidence breakdown:**
- Device code flow: HIGH - RFC 8628 and GitHub docs are authoritative
- Token exchange: MEDIUM-HIGH - Verified from multiple proxy implementations
- n8n credential patterns: HIGH - Official docs and source code
- Token expiration timing: MEDIUM - Community reports, not officially documented

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, but verify client ID status)

---

## Phase-Specific Recommendations

Based on CONTEXT.md decisions:

### Device Code UX (from CONTEXT.md)
- Clickable link to verification URL: Requires UI component (defer to manual instructions for v1)
- Copy button for device code: Same, requires UI
- Spinner + status text while polling: Same, requires UI
- Code expiration message + retry: Can implement in error handling

**v1 Recommendation:** For initial implementation, provide clear instructions for manual device flow with token paste. Full UI can come in v1.1.

### Claude's Discretion (from CONTEXT.md)
- **Token storage:** Use n8n credentials with oauthToken (long-lived) + apiEndpoint fields
- **Error handling:** Differentiate network errors, invalid token, no subscription, rate limit
- **Credential test:** Use simple token exchange test via `test: ICredentialTestRequest`
- **Polling interval:** Use 5 seconds as RFC 8628 specifies, increase on `slow_down`

### Implementation Order
1. Create credential type with oauthToken and apiEndpoint fields
2. Implement token exchange function (getCopilotToken)
3. Implement CopilotTokenManager class
4. Add credential test that verifies token exchange works
5. Document manual device flow process for users
