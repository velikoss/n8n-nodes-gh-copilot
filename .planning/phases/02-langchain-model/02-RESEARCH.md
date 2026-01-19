# Phase 2: LangChain Model - Research

**Researched:** 2026-01-19
**Domain:** LangChain BaseChatModel implementation for GitHub Copilot API
**Confidence:** MEDIUM

## Summary

This phase requires implementing a LangChain-compatible chat model that wraps the GitHub Copilot API. The implementation extends or wraps `BaseChatModel` from `@langchain/core` to provide the standard interface expected by n8n's AI Agent node.

Key findings:
1. **LangChain BaseChatModel** requires implementing `_generate()` method that returns `ChatResult` with `ChatGeneration` objects
2. **n8n AI Agent has a whitelist** - community nodes cannot connect to AI Agent without being in the hardcoded allowlist. However, the OpenAI Chat Model node with custom baseURL is the recommended workaround
3. **GitHub Copilot API** is OpenAI-compatible - it accepts standard chat completions format at `{endpoint}/chat/completions`
4. **System message transformation** must convert system role to assistant role (Copilot requirement)

**Primary recommendation:** Wrap `ChatOpenAI` from `@langchain/openai` with a custom class that handles system message transformation and Copilot token management, rather than extending `BaseChatModel` from scratch.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@langchain/core` | ^0.3.0 | Base chat model interfaces | Already a peer dependency, provides BaseChatModel, message types |
| `@langchain/openai` | ^0.3.0 | ChatOpenAI implementation | Copilot API is OpenAI-compatible, handles retries/streaming |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| n8n-workflow | ^1.119.0 | n8n node interfaces | Already a peer dependency, provides ISupplyDataFunctions, SupplyData |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wrap ChatOpenAI | Extend BaseChatModel directly | More work, must implement retry logic, async caller, streaming manually |
| Custom fetch | Use this.caller from BaseChatModel | Loses built-in concurrency and retry logic |

**Installation:**
```bash
npm install @langchain/openai@^0.3.0
```

Note: `@langchain/core` is already a peer dependency but may need to be installed as a dev dependency for TypeScript types.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── CopilotAuth.ts           # Existing - device code flow
│   ├── CopilotTokenManager.ts   # Existing - token exchange
│   └── CopilotChatModel.ts      # NEW - LangChain chat model wrapper
├── credentials/
│   └── GitHubCopilotApi.credentials.ts  # Existing
└── nodes/
    └── LmChatGitHubCopilot/
        └── LmChatGitHubCopilot.node.ts  # Phase 3 - n8n node
```

### Pattern 1: Message Transformation Layer
**What:** Transform LangChain messages before sending to Copilot API
**When to use:** Every request to Copilot API
**Example:**
```typescript
// Source: CONTEXT.md decisions - system messages to assistant role
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

function transformMessagesForCopilot(messages: BaseMessage[]): BaseMessage[] {
  return messages.map(msg => {
    if (msg._getType() === 'system') {
      // Transform system to assistant, keep content unchanged
      return new AIMessage({ content: msg.content });
    }
    return msg;
  });
}
```

### Pattern 2: Composition over Inheritance (ChatOpenAI Wrapper)
**What:** Create a class that wraps ChatOpenAI rather than extending BaseChatModel
**When to use:** When the underlying API is OpenAI-compatible
**Example:**
```typescript
// Recommended approach based on Copilot's OpenAI-compatible API
import { ChatOpenAI, ChatOpenAIFields } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';
import { ChatResult } from '@langchain/core/outputs';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';

export interface CopilotChatModelParams {
  tokenManager: CopilotTokenManager;
  temperature?: number;
  verbose?: boolean;
}

export class CopilotChatModel extends BaseChatModel {
  private tokenManager: CopilotTokenManager;
  private innerModel: ChatOpenAI | null = null;
  private temperature: number;

  constructor(params: CopilotChatModelParams) {
    super({ verbose: params.verbose });
    this.tokenManager = params.tokenManager;
    this.temperature = params.temperature ?? 0.7;
  }

  _llmType(): string {
    return 'github-copilot';
  }

  async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    // Get valid token and endpoint
    const { token, endpoint } = await this.tokenManager.getValidToken();

    // Lazily create/update inner model with current token
    this.innerModel = new ChatOpenAI({
      openAIApiKey: token,
      configuration: {
        baseURL: `${endpoint}/chat/completions`,
      },
      temperature: this.temperature,
      modelName: 'gpt-4o', // Default model
    });

    // Transform messages (system -> assistant)
    const transformedMessages = this.transformMessages(messages);

    // Delegate to ChatOpenAI
    return this.innerModel._generate(transformedMessages, options, runManager);
  }

  private transformMessages(messages: BaseMessage[]): BaseMessage[] {
    // Implementation here
  }
}
```

### Pattern 3: Direct BaseChatModel Extension (Alternative)
**What:** Extend BaseChatModel and implement _generate with manual API calls
**When to use:** When you need full control over the API interaction
**Example:**
```typescript
// Alternative approach - more control but more work
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export class CopilotChatModel extends BaseChatModel {
  async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const { token, endpoint } = await this.tokenManager.getValidToken();

    // Use this.caller for retry logic
    const response = await this.caller.call(async () => {
      return fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Copilot-specific headers
          'Copilot-Integration-Id': 'vscode-chat',
          'Editor-Version': 'vscode/1.104.1',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: this.formatMessages(messages),
          temperature: this.temperature,
        }),
      });
    });

    // Parse response into ChatResult
    const data = await response.json();
    return this.parseResponse(data);
  }
}
```

### Anti-Patterns to Avoid
- **Don't hardcode the API endpoint:** Endpoint is dynamic per subscription SKU (Individual/Business/Enterprise)
- **Don't store tokens long-term:** Copilot JWT tokens expire in ~30 minutes
- **Don't ignore system message transformation:** Copilot API rejects system role messages
- **Don't silently drop unsupported parameters:** Per CONTEXT.md, throw errors for unsupported params

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with exponential backoff | Custom retry logic | ChatOpenAI's built-in retry or `this.caller` | Handles 429, 5xx, connection errors correctly |
| OpenAI message formatting | Custom message serializer | ChatOpenAI's message handling | Handles tool calls, function messages, attachments |
| Streaming responses | Custom SSE parser | ChatOpenAI's streaming | Proper chunk handling, callback integration |
| Token refresh | Inline token checks | CopilotTokenManager (existing) | Already handles 5-minute buffer, endpoint discovery |

**Key insight:** GitHub Copilot's API is OpenAI-compatible. Leveraging `ChatOpenAI` provides battle-tested retry logic, streaming, and message formatting for free.

## Common Pitfalls

### Pitfall 1: n8n AI Agent Whitelist
**What goes wrong:** Custom chat model nodes cannot connect to AI Agent node
**Why it happens:** n8n's AI Agent has a hardcoded whitelist in `Agent.node.ts` that only allows specific `@n8n/n8n-nodes-langchain.lmChat*` nodes
**How to avoid:**
- Option A: Use the model with Basic LLM Chain (works with community nodes)
- Option B: Make the implementation work with OpenAI Chat Model node via custom baseURL
- Option C: Accept that AI Agent integration requires n8n core changes
**Warning signs:** Node appears in palette but cannot connect to AI Agent

**Source:** [n8n Community Discussion](https://community.n8n.io/t/how-to-use-custom-ai-model-with-ai-agent-node/97750)

### Pitfall 2: System Message Rejection
**What goes wrong:** Copilot API returns error for messages with "system" role
**Why it happens:** Copilot API only accepts "user" and "assistant" roles
**How to avoid:** Transform all SystemMessage instances to AIMessage before sending
**Warning signs:** 400 Bad Request errors mentioning invalid role

### Pitfall 3: Token Expiration During Long Conversations
**What goes wrong:** Request fails mid-conversation with 401
**Why it happens:** Copilot JWT expires in ~30 minutes, long chains may span this
**How to avoid:** Call `tokenManager.getValidToken()` before EACH request, not just once
**Warning signs:** Intermittent 401 errors, especially in agent loops

### Pitfall 4: Endpoint Hardcoding
**What goes wrong:** Requests fail for Business/Enterprise subscriptions
**Why it happens:** Different subscription SKUs use different API endpoints
**How to avoid:** Always use endpoint from token exchange response, never hardcode
**Warning signs:** Works for Individual subscription, fails for Business

### Pitfall 5: Unsupported Parameters Silent Failure
**What goes wrong:** User sets parameter, no effect, confusion
**Why it happens:** ChatOpenAI accepts many parameters Copilot doesn't support
**How to avoid:** Per CONTEXT.md decision, throw clear error for unsupported params
**Warning signs:** Temperature works, other params silently ignored

## Code Examples

Verified patterns from official sources:

### LangChain Message Types
```typescript
// Source: https://docs.langchain.com/oss/javascript/langchain/messages
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';

// Check message type
const messageType = msg._getType(); // 'human', 'ai', 'system', 'tool'

// Create messages
const human = new HumanMessage({ content: 'Hello' });
const ai = new AIMessage({ content: 'Hi there!' });
const system = new SystemMessage({ content: 'You are helpful' });
```

### ChatResult Structure
```typescript
// Source: https://v03.api.js.langchain.com/classes/_langchain_core.language_models_chat_models.BaseChatModel.html
import { ChatResult, ChatGeneration } from '@langchain/core/outputs';
import { AIMessage } from '@langchain/core/messages';

function createChatResult(content: string): ChatResult {
  const message = new AIMessage({ content });
  const generation: ChatGeneration = {
    text: content,
    message,
  };
  return {
    generations: [generation],
    llmOutput: {
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    },
  };
}
```

### ChatOpenAI Configuration with Custom Base URL
```typescript
// Source: https://docs.langchain.com/oss/javascript/integrations/chat/openai
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  openAIApiKey: 'your-token',
  configuration: {
    baseURL: 'https://api.githubcopilot.com', // Dynamic from token exchange
  },
  modelName: 'gpt-4o',
  temperature: 0.7,
  maxRetries: 2, // Default, handles 429 with exponential backoff
});
```

### n8n supplyData Pattern
```typescript
// Source: https://github.com/n8n-io/n8n/issues/16121
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
        name: 'gitHubCopilotApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Temperature',
        name: 'temperature',
        type: 'number',
        default: 0.7,
        typeOptions: { minValue: 0, maxValue: 2, numberStepSize: 0.1 },
        description: 'Controls randomness (0-2)',
      },
    ],
  };

  async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
    const credentials = await this.getCredentials('gitHubCopilotApi');
    const temperature = this.getNodeParameter('temperature', 0) as number;

    const tokenManager = new CopilotTokenManager(
      credentials.oauthToken as string,
      credentials.apiEndpoint as string | undefined
    );

    const model = new CopilotChatModel({
      tokenManager,
      temperature,
    });

    return { response: model };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SimpleChatModel | BaseChatModel | LangChain 0.2+ | SimpleChatModel is for backwards compat only |
| call() method | invoke() method | LangChain 0.2 | call() deprecated, use invoke() |
| Completion models | Chat models | LangChain 0.1 | AI Agent requires chat-completion models |

**Deprecated/outdated:**
- `SimpleChatModel`: Use `BaseChatModel` directly for new implementations
- `call()` method: Deprecated in favor of `invoke()`, will be removed in 0.2.0
- `predict()` method: Deprecated, use `invoke()` instead

## Open Questions

Things that couldn't be fully resolved:

1. **n8n AI Agent Whitelist Bypass**
   - What we know: AI Agent has hardcoded allowlist, community nodes blocked
   - What's unclear: Whether there's a way to register custom nodes in the whitelist without forking n8n
   - Recommendation: Accept limitation for v1, focus on Basic LLM Chain compatibility, or use OpenAI node with custom baseURL pointing to a local proxy

2. **Copilot API Headers**
   - What we know: Copilot may require specific headers like `Copilot-Integration-Id`, `Editor-Version`
   - What's unclear: Whether these are strictly required or just help with rate limits
   - Recommendation: Include headers in implementation, test without them

3. **Model Name Parameter**
   - What we know: CONTEXT.md says model name NOT configurable in Phase 2 (Phase 3 handles it)
   - What's unclear: Whether a default model name is needed for API calls
   - Recommendation: Use `gpt-4o` as sensible default, Phase 3 makes it configurable

4. **Rate Limit Specifics**
   - What we know: Copilot has rate limits, projects recommend `--rate-limit` flags
   - What's unclear: Exact rate limits, cooldown periods, retry-after headers
   - Recommendation: Use ChatOpenAI's built-in retry with maxRetries: 2, expose in errors

## Sources

### Primary (HIGH confidence)
- [LangChain.js BaseChatModel API Reference](https://v03.api.js.langchain.com/classes/_langchain_core.language_models_chat_models.BaseChatModel.html) - Class interface, _generate signature
- [LangChain.js Messages Documentation](https://docs.langchain.com/oss/javascript/langchain/messages) - Message types, conversions
- [n8n AI Agent Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/) - Agent node architecture

### Secondary (MEDIUM confidence)
- [n8n Community - Custom AI Model Issue](https://community.n8n.io/t/how-to-use-custom-ai-model-with-ai-agent-node/97750) - Whitelist limitation confirmed by n8n team
- [GitHub Issue #16121 - Custom Chat Model](https://github.com/n8n-io/n8n/issues/16121) - Node implementation example
- [ChatOpenAI npm Documentation](https://www.npmjs.com/package/@langchain/openai) - maxRetries, retry behavior
- [GitHub Copilot Supported Models](https://docs.github.com/en/copilot/reference/ai-models/supported-models) - Available models list

### Tertiary (LOW confidence)
- [copilot-api Project](https://github.com/ericc-ch/copilot-api) - Reverse-engineered API details, may change
- [DEV.to Copilot API Article](https://dev.to/ericc/i-turned-github-copilot-into-openai-api-compatible-provider-1fb8) - Implementation hints, no full specs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - LangChain and n8n packages are well-documented
- Architecture: MEDIUM - Wrapper pattern is recommended but implementation details vary
- Pitfalls: HIGH - n8n whitelist confirmed by team, Copilot API behavior documented

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - LangChain ecosystem evolving but stable)
