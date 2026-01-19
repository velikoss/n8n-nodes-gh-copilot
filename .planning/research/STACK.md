# Stack Research: n8n GitHub Copilot Chat Model Node

**Project:** n8n-nodes-gh-copilot
**Researched:** 2026-01-19
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

Building an n8n chat model sub-node for GitHub Copilot requires:
1. Following n8n's sub-node patterns (`INodeType` with `supplyData()` returning a LangChain model)
2. Implementing OAuth device code flow for GitHub Copilot authentication
3. Wrapping the Copilot API with LangChain's `ChatOpenAI` (since Copilot exposes an OpenAI-compatible API)
4. Managing token refresh and dynamic model discovery

The recommended approach is to extend `ChatOpenAI` from `@langchain/openai` with custom authentication and endpoint handling, rather than implementing `BaseChatModel` from scratch.

---

## n8n Node SDK

### Required Interfaces

| Interface | Import | Purpose |
|-----------|--------|---------|
| `INodeType` | `n8n-workflow` | Base node type class |
| `INodeTypeDescription` | `n8n-workflow` | Node metadata and UI config |
| `ISupplyDataFunctions` | `n8n-workflow` | Context for `supplyData()` method |
| `SupplyData` | `n8n-workflow` | Return type from `supplyData()` |
| `NodeConnectionType` | `n8n-workflow` | Connection type constants |

**Confidence:** HIGH - Verified from n8n source code on GitHub

### Sub-Node Pattern

Chat model sub-nodes implement `supplyData()` instead of `execute()`:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import {
  NodeConnectionType,
  type INodeType,
  type INodeTypeDescription,
  type ISupplyDataFunctions,
  type SupplyData,
} from 'n8n-workflow';

export class LmChatGitHubCopilot implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GitHub Copilot Chat Model',
    name: 'lmChatGitHubCopilot',
    icon: 'file:copilot.svg',
    group: ['transform'],
    version: 1,
    description: 'Chat model using GitHub Copilot API',
    defaults: { name: 'GitHub Copilot Chat Model' },
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
    credentials: [
      {
        name: 'githubCopilotApi',
        required: true,
      },
    ],
    properties: [/* model selection, temperature, etc. */],
  };

  async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
    // Create and return LangChain model instance
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      apiKey: copilotApiKey,
      configuration: {
        baseURL: copilotEndpoint,
      },
    });
    return { response: model };
  }
}
```

**Confidence:** HIGH - Pattern verified from n8n OpenAI Chat Model source code

### Connection Types

The node must output `NodeConnectionType.AiLanguageModel` (string value: `"ai_languageModel"`) to connect to AI Agent nodes.

**Critical Note:** Community nodes with `AiLanguageModel` outputs currently cannot connect to built-in Agent nodes. This is a known n8n limitation. Options:
1. Fork n8n and add the node directly (not recommended for distribution)
2. Users can use the OpenAI Chat Model node with custom base URL (workaround)
3. Monitor n8n releases for community AI node support

**Confidence:** HIGH - Verified from GitHub issue #16121

### Package Configuration

```json
{
  "name": "n8n-nodes-gh-copilot",
  "version": "0.1.0",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/GitHubCopilotApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/LmChatGitHubCopilot/LmChatGitHubCopilot.node.js"
    ]
  }
}
```

---

## LangChain JS Integration

### Package Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `@langchain/core` | `^0.3.0` or `^1.0.0` | Core abstractions (BaseChatModel, BaseMessage, etc.) |
| `@langchain/openai` | `catalog` | ChatOpenAI class (OpenAI-compatible API wrapper) |
| `langchain` | `1.2.3` | Main LangChain orchestration |

**Confidence:** MEDIUM-HIGH - Versions from n8n-nodes-langchain package.json (n8n v2.4.0)

**Version Strategy:** Match versions used by `@n8n/n8n-nodes-langchain` to ensure compatibility. Use `catalog` versions where n8n does, or pin to specific versions.

### Chat Model Architecture

n8n's chat model nodes return LangChain `BaseChatModel` instances via `supplyData()`. The AI Agent node then uses these models for inference.

**Recommended Approach: Extend ChatOpenAI**

Since GitHub Copilot exposes an OpenAI-compatible API, extend `ChatOpenAI` rather than implementing `BaseChatModel` from scratch:

```typescript
import { ChatOpenAI, type ChatOpenAICallOptions } from '@langchain/openai';

class ChatGitHubCopilot extends ChatOpenAI {
  private tokenManager: CopilotTokenManager;

  constructor(fields: ChatGitHubCopilotFields) {
    super({
      ...fields,
      configuration: {
        baseURL: fields.copilotEndpoint,
        defaultHeaders: {
          'editor-version': 'n8n/1.0.0',
          'editor-plugin-version': 'n8n-nodes-gh-copilot/0.1.0',
        },
      },
    });
    this.tokenManager = new CopilotTokenManager(fields.oauthToken);
  }

  // Override to refresh token before each call
  async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    // Refresh API key if needed
    this.apiKey = await this.tokenManager.getValidToken();
    return super._generate(messages, options, runManager);
  }
}
```

**Confidence:** MEDIUM - Pattern inferred from LangChain docs and copilot-api implementations

### BaseChatModel Interface (Alternative)

If deeper customization is needed, implement `BaseChatModel` directly:

```typescript
import { BaseChatModel, type BaseChatModelParams } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { ChatResult, ChatGeneration } from '@langchain/core/outputs';

class ChatGitHubCopilot extends BaseChatModel {
  // Required: Implement _generate
  async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const response = await this.callCopilotAPI(messages);
    return {
      generations: [{
        message: new AIMessage(response.content),
        text: response.content,
      }],
    };
  }

  // Required: Return model type identifier
  _llmType(): string {
    return 'github-copilot';
  }
}
```

**Confidence:** MEDIUM - Based on LangChain API docs

---

## GitHub Copilot API

### Authentication Flow

GitHub Copilot uses a multi-step OAuth device code flow:

**Step 1: Device Code Request**
```
POST https://github.com/login/device/code
Content-Type: application/json
Accept: application/json

{
  "client_id": "<VSCode client ID>",
  "scope": "read:user"
}
```

Response:
```json
{
  "device_code": "...",
  "user_code": "XXXX-XXXX",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 899,
  "interval": 5
}
```

**Step 2: User Authorization**
- Display `user_code` to user
- User visits `verification_uri` and enters code
- Poll for completion every `interval` seconds

**Step 3: Token Exchange**
```
POST https://github.com/login/oauth/access_token
Content-Type: application/json
Accept: application/json

{
  "client_id": "<client_id>",
  "device_code": "<device_code>",
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
}
```

Response:
```json
{
  "access_token": "gho_xxxx",
  "token_type": "bearer",
  "scope": "read:user"
}
```

**Step 4: Get Copilot API Token**
```
GET https://api.github.com/copilot_internal/v2/token
Authorization: Bearer gho_xxxx
```

Response:
```json
{
  "token": "tid=...",
  "expires_at": 1234567890,
  "endpoints": {
    "api": "https://api.githubcopilot.com"
  }
}
```

**Confidence:** MEDIUM-HIGH - Verified from LiteLLM, copilot-api, and github-copilot-proxy implementations

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/chat/completions` | POST | Chat completion (OpenAI-compatible) |
| `/v1/models` | GET | List available models |
| `/v1/embeddings` | POST | Text embeddings |

**Base URL:** Returned in token response as `endpoints.api` (typically `https://api.githubcopilot.com`)

**Confidence:** HIGH - Verified from multiple proxy implementations

### Required Headers

```
Authorization: Bearer <copilot_api_token>
Content-Type: application/json
editor-version: n8n/1.0.0
editor-plugin-version: n8n-nodes-gh-copilot/0.1.0
user-agent: GithubCopilot/1.155.0
```

**Confidence:** MEDIUM - Headers from github-copilot-proxy, may vary

### Token Management

- OAuth token (`gho_xxx`): Long-lived, user-managed
- API token: Short-lived (30 minutes), must refresh using OAuth token
- Store OAuth token persistently, refresh API token before expiration

**Confidence:** HIGH - Verified from multiple sources

### Available Models (as of 2026-01)

| Model | Subscription | Rate Multiplier |
|-------|--------------|-----------------|
| GPT-4.1, GPT-5 mini, Raptor mini | Free, Pro, Business, Enterprise | 0x (unlimited) |
| Claude Sonnet 4, GPT-4o | Pro, Business, Enterprise | 1x |
| Claude Opus 4.5 | Pro+, Business, Enterprise | 3x |
| Claude Opus 4.1 | Pro+, Business, Enterprise | 10x |
| Gemini 2.5 Pro | Pro, Business, Enterprise | 1x |

**Note:** Model availability varies by subscription tier. Use `/v1/models` endpoint to discover available models for authenticated user.

**Confidence:** MEDIUM - From GitHub docs, may change frequently

---

## Recommended Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.4.0"
  },
  "peerDependencies": {
    "n8n-workflow": ">=1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "n8n-workflow": "^1.119.0"
  }
}
```

**Rationale:**
- `@langchain/core`: Required for base types (BaseMessage, ChatResult, etc.)
- `@langchain/openai`: ChatOpenAI class for OpenAI-compatible API wrapper
- Match LangChain versions to n8n's `@n8n/n8n-nodes-langchain` for compatibility

**Confidence:** MEDIUM-HIGH

### Build Configuration

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build"
  }
}
```

**TypeScript Config (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Confidence:** MEDIUM - Based on n8n starter template patterns

### Project Structure

```
n8n-nodes-gh-copilot/
├── package.json
├── tsconfig.json
├── src/
│   ├── nodes/
│   │   └── LmChatGitHubCopilot/
│   │       ├── LmChatGitHubCopilot.node.ts
│   │       ├── LmChatGitHubCopilot.node.json
│   │       └── copilot.svg
│   ├── credentials/
│   │   └── GitHubCopilotApi.credentials.ts
│   └── lib/
│       ├── ChatGitHubCopilot.ts      # LangChain model wrapper
│       ├── CopilotTokenManager.ts    # Token refresh logic
│       └── CopilotAuth.ts            # Device code OAuth flow
├── dist/                              # Compiled output
└── README.md
```

**Confidence:** HIGH - Standard n8n community node structure

---

## Anti-Patterns

### DO NOT: Implement BaseChatModel from Scratch

**Why:** Copilot API is OpenAI-compatible. Using `ChatOpenAI` with custom base URL gets streaming, tool calling, and structured output for free.

**Instead:** Extend `ChatOpenAI` and override authentication handling.

### DO NOT: Hardcode Copilot Endpoints

**Why:** Endpoint URL is returned in token response and varies by subscription SKU.

**Instead:** Parse `endpoints.api` from `/copilot_internal/v2/token` response.

### DO NOT: Depend on External CLI Tools

**Why:** Node should be self-contained. Users shouldn't need `gh` CLI installed.

**Instead:** Implement device code OAuth flow directly in the node.

### DO NOT: Store API Tokens Only

**Why:** Copilot API tokens expire in 30 minutes.

**Instead:** Store OAuth token persistently, refresh API token as needed.

### DO NOT: Hardcode Model List

**Why:** Available models vary by subscription tier and change over time.

**Instead:** Fetch available models from `/v1/models` endpoint after authentication.

### DO NOT: Skip Rate Limiting Awareness

**Why:** Aggressive API usage can trigger GitHub abuse detection.

**Instead:** Consider rate limiting options, respect request intervals.

---

## Open Questions

### Community Node Limitation

**Issue:** n8n currently does not support community nodes with `AiLanguageModel` output connecting to built-in Agent nodes (GitHub issue #16121).

**Options to Investigate:**
1. Is this limitation still present in latest n8n?
2. Are there workarounds (e.g., LangChain Code node)?
3. Should we contribute this node to n8n core instead?

**Confidence:** MEDIUM - Need to verify against current n8n version

### VSCode Client ID

**Issue:** OAuth device flow requires a client ID. Current implementations use VSCode's client ID.

**Options:**
1. Use VSCode client ID (works but may violate ToS)
2. Register dedicated OAuth app with GitHub
3. Use existing implementation patterns from copilot-api

**Confidence:** LOW - Needs further investigation on GitHub's stance

### Token Storage

**Issue:** Where to persist OAuth tokens in n8n?

**Options:**
1. n8n credentials system (standard approach)
2. Separate storage mechanism
3. Store in node configuration

**Confidence:** MEDIUM - n8n credentials system is likely correct approach

---

## Sources

### n8n Documentation & Source
- [LangChain concepts in n8n](https://docs.n8n.io/advanced-ai/langchain/langchain-n8n/)
- [Build a programmatic-style node](https://docs.n8n.io/integrations/creating-nodes/build/programmatic-style-node/)
- [Custom AI chat model issue #16121](https://github.com/n8n-io/n8n/issues/16121)
- [n8n-nodes-langchain package.json](https://github.com/n8n-io/n8n/blob/master/packages/@n8n/nodes-langchain/package.json)

### LangChain Documentation
- [BaseChatModel API (v0.3)](https://v03.api.js.langchain.com/classes/_langchain_core.language_models_chat_models.BaseChatModel.html)
- [ChatOpenAI API](https://v03.api.js.langchain.com/classes/_langchain_openai.ChatOpenAI.html)
- [@langchain/core npm](https://www.npmjs.com/package/@langchain/core)

### GitHub Copilot API
- [LiteLLM GitHub Copilot Provider](https://docs.litellm.ai/docs/providers/github_copilot)
- [copilot-api (ericc-ch)](https://github.com/ericc-ch/copilot-api)
- [github-copilot-proxy OAuth Setup](https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup)
- [GitHub Copilot Supported Models](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Copilot API as OpenAI Provider (DEV article)](https://dev.to/ericc/i-turned-github-copilot-into-openai-api-compatible-provider-1fb8)

### n8n Community
- [Creating a custom llm chat model node](https://community.n8n.io/t/creating-a-custom-llm-chat-model-node/74926)
