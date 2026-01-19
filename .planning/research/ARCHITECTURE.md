# Architecture Research: n8n GitHub Copilot Chat Model Node

**Domain:** n8n AI sub-node with OAuth + LangChain + Chat Completion
**Researched:** 2026-01-19
**Confidence:** MEDIUM (verified against n8n source patterns and community examples)

## n8n Node Structure

### Cluster Node Architecture

n8n implements AI functionality through **cluster nodes** - interconnected node groups where a root node (AI Agent) consumes sub-nodes (Chat Models, Memory, Tools). Chat model sub-nodes implement the `supplyData()` pattern instead of `execute()`.

**Key Interfaces (from n8n-workflow):**
```typescript
import {
  NodeConnectionType,
  type INodeType,
  type INodeTypeDescription,
  type ISupplyDataFunctions,
  type SupplyData,
} from 'n8n-workflow';
```

**Sub-Node Contract:**
- Must implement `INodeType` interface
- Must declare `outputs: [NodeConnectionType.AiLanguageModel]`
- Must implement `supplyData()` returning `Promise<SupplyData>`
- The `SupplyData` return type wraps a LangChain `BaseChatModel` as `{ response: model }`

### Reference Implementation Pattern

From the official OpenAI Chat Model node:

```typescript
export class LmChatOpenAi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'OpenAI Chat Model',
    name: 'lmChatOpenAi',
    icon: 'file:openai.svg',
    group: ['transform'],
    version: [1, 1.1, 1.2, 1.3],
    description: 'Chat completion using OpenAI',
    defaults: { name: 'OpenAI Chat Model' },
    codex: {
      categories: ['AI'],
      subcategories: {
        AI: ['Language Models', 'Root Nodes'],
        'Language Models': ['Chat Models (Recommended)'],
      },
    },
    inputs: [],
    outputs: [NodeConnectionType.AiLanguageModel],
    outputNames: ['Model'],
    credentials: [{ name: 'openAiApi', required: true }],
    properties: [/* model, temperature, etc. */],
  };

  async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
    // 1. Get credentials
    const credentials = await this.getCredentials('openAiApi');

    // 2. Get node parameters
    const modelName = this.getNodeParameter('model', 0) as string;
    const temperature = this.getNodeParameter('temperature', 0) as number;

    // 3. Create LangChain model instance
    const model = new ChatOpenAI({
      modelName,
      temperature,
      apiKey: credentials.apiKey as string,
      // ... other options
    });

    // 4. Return wrapped model
    return { response: model };
  }
}
```

**Source:** [n8n GitHub - LmChatOpenAi.node.ts](https://github.com/n8n-io/n8n/blob/master/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)

## Component Diagram

```
+------------------------------------------------------------------+
|                        n8n Workflow                               |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+     consumes      +---------------------+   |
|  |    AI Agent      |<------------------|  GitHub Copilot     |   |
|  |   (Root Node)    |    LangChain      |  Chat Model Node    |   |
|  |                  |    BaseChatModel  |    (Sub-Node)       |   |
|  +------------------+                   +---------------------+   |
|                                                   |               |
|                                                   | creates       |
|                                                   v               |
|                                         +---------------------+   |
|                                         | CopilotChatModel    |   |
|                                         | (LangChain Model)   |   |
|                                         +---------------------+   |
|                                                   |               |
|                                                   | uses          |
|                                                   v               |
|                                         +---------------------+   |
|                                         | CopilotApiClient    |   |
|                                         | (HTTP Client)       |   |
|                                         +---------------------+   |
|                                                   |               |
+---------------------------------------------------|---------------+
                                                    |
                      +-----------------------------+
                      |
                      v
+------------------------------------------------------------------+
|                    GitHub Copilot API                             |
+------------------------------------------------------------------+
|                                                                   |
|  1. Device Auth Flow                                              |
|     POST github.com/login/device/code                             |
|     POST github.com/login/oauth/access_token (polling)            |
|                                                                   |
|  2. Token Exchange                                                |
|     GET api.github.com/copilot_internal/v2/token                  |
|     (exchanges OAuth token for short-lived Copilot API key)       |
|                                                                   |
|  3. Chat Completions                                              |
|     POST api.github.com/chat/completions                          |
|     (OpenAI-compatible format)                                    |
|                                                                   |
+------------------------------------------------------------------+
```

## Component Boundaries

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| **GitHubCopilotLmChat** (n8n Node) | Node definition, UI properties, credential binding | n8n-workflow, CopilotChatModel |
| **GitHubCopilotApi.credentials.ts** | Store OAuth tokens, expose to node | n8n-workflow |
| **CopilotChatModel** (LangChain) | LangChain-compatible chat model, message formatting | @langchain/core, CopilotApiClient |
| **CopilotApiClient** | HTTP requests, token refresh, error handling | Node fetch/axios |
| **CopilotTokenManager** | Token lifecycle, refresh before expiry, caching | CopilotApiClient |

### Detailed Component Specifications

#### 1. GitHubCopilotLmChat (n8n Node)

**File:** `nodes/GitHubCopilotLmChat/GitHubCopilotLmChat.node.ts`

**Responsibilities:**
- Define node metadata (name, icon, category)
- Define UI properties (model selector, temperature, etc.)
- Bind to credentials type
- Instantiate and return LangChain model in `supplyData()`

**Key Properties:**
```typescript
{
  displayName: 'GitHub Copilot Chat Model',
  name: 'lmChatGitHubCopilot',
  outputs: [NodeConnectionType.AiLanguageModel],
  credentials: [{ name: 'gitHubCopilotApi', required: true }],
  properties: [
    // Model selection (gpt-4o, claude-3.5-sonnet, etc.)
    // Temperature
    // Max tokens
    // Account type (Individual/Business/Enterprise)
  ]
}
```

#### 2. GitHubCopilotApi.credentials.ts

**File:** `credentials/GitHubCopilotApi.credentials.ts`

**Responsibilities:**
- Define credential fields (OAuth token storage)
- Handle OAuth device flow UI (redirect to GitHub)
- Store access token securely

**Challenge:** n8n's standard OAuth2 doesn't support device flow natively. Options:
1. **Manual token entry:** User runs external script, pastes token
2. **Custom auth flow:** Implement device flow within credential modal
3. **Header auth:** Store pre-obtained token as simple API key

**Recommended approach:** Start with manual token entry (simpler), evolve to device flow.

#### 3. CopilotChatModel (LangChain)

**File:** `utils/CopilotChatModel.ts`

**Responsibilities:**
- Extend `SimpleChatModel` from `@langchain/core`
- Implement `_call()` to invoke Copilot API
- Format messages to OpenAI chat format
- Handle streaming (optional, via `_stream()`)

**Implementation Pattern:**
```typescript
import { SimpleChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';

export class CopilotChatModel extends SimpleChatModel {
  private client: CopilotApiClient;
  private model: string;
  private temperature: number;

  constructor(fields: CopilotChatModelParams) {
    super(fields);
    this.client = fields.client;
    this.model = fields.model;
    this.temperature = fields.temperature ?? 0.7;
  }

  _llmType(): string {
    return 'github-copilot';
  }

  async _call(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    const formattedMessages = messages.map(m => ({
      role: m._getType() === 'human' ? 'user' : m._getType() === 'ai' ? 'assistant' : 'system',
      content: m.content as string,
    }));

    const response = await this.client.chatCompletion({
      model: this.model,
      messages: formattedMessages,
      temperature: this.temperature,
      // ... other options
    });

    return response.choices[0].message.content;
  }
}
```

**Source:** [LangChain SimpleChatModel](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.SimpleChatModel.html)

#### 4. CopilotApiClient

**File:** `utils/CopilotApiClient.ts`

**Responsibilities:**
- Make HTTP requests to Copilot API
- Handle request/response transformation
- Manage rate limiting
- Error handling and retries

**Key Methods:**
```typescript
class CopilotApiClient {
  constructor(tokenManager: CopilotTokenManager);

  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  async listModels(): Promise<Model[]>;
}
```

#### 5. CopilotTokenManager

**File:** `utils/CopilotTokenManager.ts`

**Responsibilities:**
- Cache Copilot API token
- Check token expiry (30-minute lifetime)
- Refresh token using OAuth access token
- Thread-safe token access

**Token Flow:**
```typescript
class CopilotTokenManager {
  private oauthToken: string;       // Long-lived, from n8n credentials
  private copilotToken: string;      // Short-lived, 30 minutes
  private copilotTokenExpiry: Date;

  async getValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.copilotToken;
  }

  private async refreshToken(): Promise<void> {
    // POST to api.github.com/copilot_internal/v2/token
    // with Authorization: Bearer {oauthToken}
  }

  private isTokenExpired(): boolean {
    return !this.copilotToken || Date.now() >= this.copilotTokenExpiry.getTime() - 60000;
  }
}
```

## Data/Auth Flow

### Initial Authentication (One-Time Setup)

```
User                     n8n                      GitHub
  |                       |                          |
  |-- Configure creds --->|                          |
  |                       |                          |
  |  (Option A: Manual)   |                          |
  |<-- Instructions ------|                          |
  |                       |                          |
  |-- Run external tool --+------------------------->|
  |                       |   Device flow            |
  |<-- Paste token ------>|                          |
  |                       |                          |
  |  (Option B: Device)   |                          |
  |                       |-- POST /login/device --->|
  |<-- Show code ---------|<-- device_code ----------|
  |                       |                          |
  |-- Enter code in browser ----------------------->|
  |                       |                          |
  |                       |-- Poll /oauth/access --->|
  |                       |<-- access_token ---------|
  |                       |                          |
  |<-- Credentials saved -|                          |
```

### Runtime Request Flow

```
AI Agent       Copilot Node      TokenManager     CopilotClient    GitHub API
    |               |                  |                |               |
    |-- supplyData->|                  |                |               |
    |               |-- create model ->|                |               |
    |               |                  |                |               |
    |<-- model -----|                  |                |               |
    |               |                  |                |               |
    |== invoke =====|==================|================|===============|
    |               |                  |                |               |
    |-- _call() --->|                  |                |               |
    |               |-- getToken() --->|                |               |
    |               |                  |-- expired? ----|               |
    |               |                  |                |               |
    |               |                  |   (if expired) |               |
    |               |                  |-- refresh ---->|-- POST token->|
    |               |                  |<-- copilot_key-|<-- key -------|
    |               |                  |                |               |
    |               |<-- valid token --|                |               |
    |               |                  |                |               |
    |               |-- chatCompletion --------------->|-- POST chat ->|
    |               |                  |                |<-- response --|
    |               |<-- response -----|----------------|               |
    |<-- content ---|                  |                |               |
```

### Token Lifecycle

| Token Type | Source | Lifetime | Storage | Refresh |
|------------|--------|----------|---------|---------|
| OAuth Access Token | Device flow | Long (weeks/months) | n8n credentials DB | Manual re-auth |
| Copilot API Key | Token exchange | 30 minutes | In-memory | Automatic via TokenManager |

## Build Order

Based on component dependencies, build in this order:

### Phase 1: Foundation (No External Dependencies)

1. **CopilotApiClient** - HTTP client for Copilot API
   - Implement chat completion endpoint
   - Handle error responses
   - No auth at first (assume valid token passed in)

2. **CopilotTokenManager** - Token lifecycle management
   - Token refresh logic
   - Expiry checking
   - Integrates with CopilotApiClient

### Phase 2: LangChain Integration

3. **CopilotChatModel** - LangChain BaseChatModel wrapper
   - Depends on: CopilotApiClient, CopilotTokenManager
   - Implement `_call()` method
   - Message format conversion
   - Test with hardcoded token first

### Phase 3: n8n Integration

4. **GitHubCopilotApi.credentials.ts** - Credential definition
   - Start simple: manual token entry
   - Test credential retrieval works

5. **GitHubCopilotLmChat.node.ts** - Main node
   - Depends on: All above components
   - Wire credentials to TokenManager
   - Wire model to supplyData return

### Phase 4: Polish

6. **Model Selection** - Dynamic model list
   - Add models endpoint support
   - UI dropdown population

7. **Streaming** - Optional streaming support
   - Implement `_stream()` in CopilotChatModel
   - Connect to n8n streaming infrastructure

8. **Device Flow Auth** - Improved UX (optional)
   - Custom credential flow for device auth
   - Automatic token refresh in credentials

## Architecture Patterns

### Pattern: Token Refresh Middleware

Wrap API client with automatic token refresh:

```typescript
class CopilotApiClient {
  constructor(private tokenManager: CopilotTokenManager) {}

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const token = await this.tokenManager.getValidToken(); // Auto-refreshes

    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new CopilotApiError(response.status, await response.text());
    }

    return response.json();
  }
}
```

### Pattern: Credential Passthrough

Pass n8n credentials through component chain:

```typescript
// In supplyData()
const credentials = await this.getCredentials('gitHubCopilotApi');
const tokenManager = new CopilotTokenManager(credentials.accessToken as string);
const client = new CopilotApiClient(tokenManager);
const model = new CopilotChatModel({ client, model: modelName, temperature });
return { response: model };
```

### Pattern: Lazy Token Acquisition

Don't fetch Copilot token until first API call:

```typescript
class CopilotTokenManager {
  private copilotToken: string | null = null;

  async getValidToken(): Promise<string> {
    if (!this.copilotToken || this.isExpired()) {
      this.copilotToken = await this.fetchNewToken();
    }
    return this.copilotToken;
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern: Token in Node Properties

**Bad:** Store tokens in node parameters (visible in workflow JSON)
**Good:** Use n8n credentials system

### Anti-Pattern: Blocking Token Refresh

**Bad:** Synchronous token check on every request
**Good:** Async refresh with expiry buffer (refresh 1 min before expiry)

### Anti-Pattern: Hardcoded Endpoints

**Bad:** `fetch('https://api.github.com/copilot_internal/v2/token')`
**Good:** Configurable base URLs for testing/enterprise

### Anti-Pattern: Swallowing Errors

**Bad:** Return empty string on API error
**Good:** Throw typed errors, let n8n handle display

## Critical Considerations

### 1. Terms of Service Awareness

GitHub Copilot's internal API (`api.github.com/copilot_internal/*`) is intended only for official clients. Third-party usage may violate ToS. The node should:
- Document this clearly to users
- Consider using user's own valid subscription only
- Not redistribute or proxy access

**Source:** [GitHub Community Discussion #178117](https://github.com/orgs/community/discussions/178117)

### 2. Model Availability

Available models depend on subscription tier:
- **Individual:** gpt-4o, gpt-4o-mini
- **Business:** gpt-4o, gpt-4o-mini, claude-3.5-sonnet
- **Enterprise:** All models + o1, o1-mini

Node should handle model availability gracefully.

### 3. Rate Limiting

Copilot API has rate limits. Implement:
- Retry with exponential backoff
- Respect rate limit headers
- Surface limits to users

### 4. n8n Sub-Node Limitations

Important limitation from n8n docs: "In sub-nodes, expressions always resolve to the first item." This affects batch processing but is acceptable for chat model use case.

## Sources

**HIGH Confidence (Official Documentation):**
- [n8n LangChain Concepts](https://docs.n8n.io/advanced-ai/langchain/langchain-n8n/)
- [n8n OpenAI Chat Model Node Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/)
- [LangChain.js SimpleChatModel API](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.SimpleChatModel.html)

**MEDIUM Confidence (Verified Community/Third-Party):**
- [GitHub Issue #16121 - Custom Chat Model Example](https://github.com/n8n-io/n8n/issues/16121)
- [DeepWiki - n8n AI and LangChain Nodes](https://deepwiki.com/n8n-io/n8n/4.4-ai-and-langchain-nodes)
- [LiteLLM GitHub Copilot Provider](https://docs.litellm.ai/docs/providers/github_copilot)
- [copilot-api Project](https://github.com/ericc-ch/copilot-api)

**LOW Confidence (Community/Reverse-Engineered):**
- [DeepWiki - GitHub Copilot Proxy OAuth Setup](https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup)
- [GitHub Discussion on Copilot Internal API](https://github.com/orgs/community/discussions/178117)
