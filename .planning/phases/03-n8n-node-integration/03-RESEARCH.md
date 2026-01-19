# Phase 3: n8n Node Integration - Research

**Researched:** 2026-01-19
**Domain:** n8n AI chat model sub-node implementation with dynamic model dropdown
**Confidence:** MEDIUM

## Summary

This phase creates an n8n sub-node that allows users to add GitHub Copilot as a chat model in AI workflows. The node implements `supplyData()` returning the LangChain `BaseChatModel` from Phase 2, with a dynamic model dropdown populated from the Copilot API after authentication.

Key findings:
1. **n8n sub-node pattern** uses `supplyData()` method returning `{ response: model }` with output type `NodeConnectionType.AiLanguageModel`
2. **Community node AI Agent compatibility** is blocked by n8n's hardcoded whitelist (issue #16121, closed as "not planned") - workaround is to use Basic LLM Chain or accept the limitation
3. **Model dropdown** should use `resourceLocator` type with `searchListMethod` for dynamic population
4. **Copilot models endpoint** is at `{endpoint}/models` and returns OpenAI-compatible format
5. **Premium detection** requires maintaining a local mapping since the API doesn't return premium status directly

**Primary recommendation:** Implement the node with `supplyData()` pattern, use a `searchListMethod` to fetch models, and maintain a hardcoded premium model list based on GitHub's published multipliers.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `n8n-workflow` | ^1.119.0 | Node interfaces, types | Already a peer dependency, provides ISupplyDataFunctions |
| `@langchain/core` | ^0.3.0 | BaseChatModel base class | Phase 2 dependency, provides message types |
| `@langchain/openai` | ^0.3.0 | ChatOpenAI wrapper | Phase 2 dependency, Copilot is OpenAI-compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (existing) `CopilotChatModel` | - | LangChain wrapper | Phase 2 implementation, consumed here |
| (existing) `CopilotTokenManager` | - | Token lifecycle | Phase 1 implementation, consumed here |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| resourceLocator + searchListMethod | options type + loadOptionsMethod | resourceLocator is newer pattern, supports search |
| Hardcoded premium list | API detection | API doesn't return premium status; hardcoded is reliable |
| Static model list | Dynamic from API | Dynamic ensures compatibility with subscription level |

**Installation:**
No new packages required - all dependencies already in place from Phases 1-2.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── CopilotAuth.ts           # Existing - device code flow
│   ├── CopilotTokenManager.ts   # Existing - token exchange
│   ├── CopilotChatModel.ts      # Existing - LangChain wrapper
│   └── CopilotModels.ts         # NEW - Model fetching and premium detection
├── credentials/
│   └── GitHubCopilotApi.credentials.ts  # Existing - credential type
└── nodes/
    └── LmChatGitHubCopilot/
        ├── LmChatGitHubCopilot.node.ts  # NEW - n8n node definition
        └── methods/
            └── listSearch.ts            # NEW - searchModels implementation
```

### Pattern 1: n8n Sub-Node with supplyData
**What:** Chat model sub-node that supplies a LangChain model to parent nodes
**When to use:** All AI chat model nodes in n8n
**Example:**
```typescript
// Source: n8n lmChatOpenAi.node.ts pattern
import {
  NodeConnectionType,
  type INodeType,
  type INodeTypeDescription,
  type ISupplyDataFunctions,
  type SupplyData,
} from 'n8n-workflow';
import { CopilotChatModel } from '../../lib/CopilotChatModel';
import { CopilotTokenManager } from '../../lib/CopilotTokenManager';

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
      // Model and temperature defined here
    ],
  };

  async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
    const credentials = await this.getCredentials('gitHubCopilotApi');
    const temperature = this.getNodeParameter('temperature', 0) as number;
    const modelValue = this.getNodeParameter('model', 0) as { value: string };

    const tokenManager = new CopilotTokenManager(
      credentials.oauthToken as string,
      credentials.apiEndpoint as string | undefined
    );

    const model = new CopilotChatModel({
      tokenManager,
      temperature,
      modelName: modelValue.value,
    });

    return { response: model };
  }
}
```

### Pattern 2: resourceLocator for Model Dropdown
**What:** Use resourceLocator type with searchListMethod for dynamic model selection
**When to use:** When options need to be fetched from an API
**Example:**
```typescript
// Source: n8n lmChatAnthropic.node.ts pattern
{
  displayName: 'Model',
  name: 'model',
  type: 'resourceLocator',
  default: { mode: 'list', value: 'gpt-4.1' },
  required: true,
  modes: [
    {
      displayName: 'From List',
      name: 'list',
      type: 'list',
      typeOptions: {
        searchListMethod: 'searchModels',
        searchable: true,
      },
    },
    {
      displayName: 'ID',
      name: 'id',
      type: 'string',
      placeholder: 'e.g., claude-sonnet-4.5',
    },
  ],
  description: 'The model to use for chat completions',
}
```

### Pattern 3: searchListMethod Implementation
**What:** Method to populate resourceLocator dropdown from API
**When to use:** In methods.listSearch object
**Example:**
```typescript
// Source: n8n pattern from OpenAI/Anthropic nodes
import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

export async function searchModels(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = await this.getCredentials('gitHubCopilotApi');

  // Fetch models from Copilot API
  const models = await fetchCopilotModels(
    credentials.oauthToken as string,
    credentials.apiEndpoint as string | undefined
  );

  // Format for n8n dropdown
  const results = models
    .filter((m) => !filter || m.name.toLowerCase().includes(filter.toLowerCase()))
    .map((model) => ({
      name: formatModelName(model), // e.g., "Claude Sonnet 4.5 [Premium]"
      value: model.id,
    }));

  return { results };
}
```

### Pattern 4: Premium Model Detection
**What:** Identify premium models that consume premium requests
**When to use:** When formatting model display names
**Example:**
```typescript
// Source: GitHub Copilot documentation on premium request multipliers
const PREMIUM_MODELS: Record<string, number> = {
  // OpenAI - Premium (multiplier > 0)
  'gpt-5': 1,
  'gpt-5-codex': 1,
  'gpt-5.1': 1,
  'gpt-5.1-codex': 1,
  'gpt-5.1-codex-max': 1,
  'gpt-5.2': 1,
  'gpt-5.2-codex': 1,
  // Anthropic - Premium
  'claude-opus-4.1': 10,
  'claude-opus-4.5': 3,
  'claude-sonnet-4': 1,
  'claude-sonnet-4.5': 1,
  'claude-haiku-4.5': 0.33,
  // Google - Premium
  'gemini-2.5-pro': 1,
  'gemini-3-pro': 1,
  'gemini-3-flash': 0.33,
};

// Included models (no premium request consumption on paid plans)
const INCLUDED_MODELS = ['gpt-4.1', 'gpt-4o', 'gpt-5-mini', 'gpt-5.1-codex-mini'];

function isPremiumModel(modelId: string): boolean {
  return modelId in PREMIUM_MODELS && !INCLUDED_MODELS.includes(modelId);
}

function formatModelName(model: { id: string; name?: string }): string {
  const displayName = model.name || model.id;
  return isPremiumModel(model.id) ? `${displayName} [Premium]` : displayName;
}
```

### Anti-Patterns to Avoid
- **Don't hardcode the full model list:** Models change; fetch dynamically from API
- **Don't show multiplier numbers:** Per CONTEXT.md decision, badge only
- **Don't use loadOptionsMethod:** Deprecated pattern; use resourceLocator with searchListMethod
- **Don't attempt AI Agent connection:** Community nodes are blocked by whitelist

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Model fetching | Custom HTTP calls | Copilot API /models endpoint | Standard OpenAI-compatible format |
| Dropdown population | Manual options array | resourceLocator + searchListMethod | n8n handles caching, search, pagination |
| Token refresh | Manual token checks | CopilotTokenManager.getValidToken() | Already handles 5-minute buffer, endpoint discovery |
| LangChain model | Custom BaseChatModel | CopilotChatModel from Phase 2 | Already implements system message transformation |

**Key insight:** The n8n framework provides robust patterns for dynamic dropdowns. Use `resourceLocator` with `searchListMethod` rather than implementing custom option loading.

## Common Pitfalls

### Pitfall 1: AI Agent Node Whitelist
**What goes wrong:** Custom chat model node cannot connect to AI Agent node
**Why it happens:** n8n's AI Agent has a hardcoded whitelist in `Agent.node.ts` that only allows specific `@n8n/n8n-nodes-langchain.lmChat*` nodes
**How to avoid:**
- Document that the node works with Basic LLM Chain, Summarization Chain, etc.
- Accept AI Agent limitation until n8n changes their architecture
- Alternative: Users can use OpenAI Chat Model node with custom baseURL pointing to a Copilot proxy
**Warning signs:** Node appears in palette but connection is rejected
**Source:** [n8n Issue #16121](https://github.com/n8n-io/n8n/issues/16121) - closed as "not planned"

### Pitfall 2: loadOptionsMethod Only Triggers Once
**What goes wrong:** Dropdown doesn't refresh when credentials change
**Why it happens:** loadOptionsMethod is cached by n8n and only triggered on initial load
**How to avoid:** Use resourceLocator with searchListMethod which handles re-triggering better
**Warning signs:** Old model list shown after credential update
**Source:** [n8n Community Discussion](https://community.n8n.io/t/how-to-re-trigger-loadoptions/190792)

### Pitfall 3: Premium Status Not in API Response
**What goes wrong:** Attempting to detect premium models from API response fields
**Why it happens:** The Copilot /models endpoint doesn't return premium/multiplier info
**How to avoid:** Maintain hardcoded premium model list from GitHub documentation
**Warning signs:** Missing premium badges, incorrect model categorization

### Pitfall 4: Endpoint Discovery Timing
**What goes wrong:** API calls fail because endpoint isn't discovered yet
**Why it happens:** Endpoint is discovered during token exchange, not during initial load
**How to avoid:** Always call `getValidToken()` before any API operation
**Warning signs:** Empty endpoint string, failed model fetch

### Pitfall 5: Model ID vs Display Name Confusion
**What goes wrong:** Using display name in API calls instead of model ID
**Why it happens:** User sees "Claude Sonnet 4.5 [Premium]" but API needs "claude-sonnet-4.5"
**How to avoid:** Store ID in value, use formatted name for display only
**Warning signs:** "Model not found" errors, 400 Bad Request

## Code Examples

Verified patterns from official sources:

### n8n Node Description Structure
```typescript
// Source: n8n lmChatOpenAi.node.ts
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
    // Model selector
    {
      displayName: 'Model',
      name: 'model',
      type: 'resourceLocator',
      default: { mode: 'list', value: 'gpt-4.1' },
      required: true,
      modes: [
        {
          displayName: 'From List',
          name: 'list',
          type: 'list',
          typeOptions: {
            searchListMethod: 'searchModels',
            searchable: true,
          },
        },
        {
          displayName: 'ID',
          name: 'id',
          type: 'string',
          placeholder: 'e.g., claude-sonnet-4.5',
        },
      ],
    },
    // Temperature
    {
      displayName: 'Temperature',
      name: 'temperature',
      type: 'number',
      default: 0.7,
      typeOptions: {
        minValue: 0,
        maxValue: 2,
        numberStepSize: 0.1,
      },
      description: 'Controls randomness (0=deterministic, 2=very random)',
    },
  ],
};
```

### Fetching Models from Copilot API
```typescript
// Source: OpenAI-compatible /models endpoint pattern
interface CopilotModel {
  id: string;
  object: 'model';
  owned_by: string;
}

interface ModelsResponse {
  data: CopilotModel[];
}

async function fetchCopilotModels(
  oauthToken: string,
  savedEndpoint?: string
): Promise<CopilotModel[]> {
  const tokenManager = new CopilotTokenManager(oauthToken, savedEndpoint);
  const { token, endpoint } = await tokenManager.getValidToken();

  const response = await fetch(`${endpoint}/models`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Editor-Version': 'vscode/1.96.0',
      'Editor-Plugin-Version': 'copilot-chat/0.24.0',
      'Copilot-Integration-Id': 'vscode-chat',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json() as ModelsResponse;
  return data.data;
}
```

### INodeListSearchResult Return Format
```typescript
// Source: n8n-workflow Interfaces.d.ts
interface INodeListSearchResult {
  results: INodeListSearchItems[];
  paginationToken?: unknown;
}

interface INodeListSearchItems {
  name: string;        // Display name (e.g., "Claude Sonnet 4.5 [Premium]")
  value: string;       // Model ID (e.g., "claude-sonnet-4.5")
  icon?: string;       // Optional icon
  url?: string;        // Optional documentation URL
}
```

### Credential Test with Model Count
```typescript
// Source: CONTEXT.md decision - test shows "Connected! {n} models, {x}/{limit} premium requests remaining"
// Note: Premium request tracking may require additional API endpoint
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

// Custom test function alternative (if ICredentialTestRequest insufficient)
async testCredentials(credentials: ICredentialsDecrypted): Promise<void> {
  const tokenManager = new CopilotTokenManager(
    credentials.data.oauthToken as string,
    credentials.data.apiEndpoint as string | undefined
  );

  const { token, endpoint } = await tokenManager.getValidToken();
  const models = await fetchCopilotModels(token, endpoint);

  // Success message could be: `Connected! ${models.length} models available`
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `loadOptionsMethod` | `resourceLocator` + `searchListMethod` | n8n 1.x | Better caching, search, re-triggering |
| Static options array | Dynamic API fetch | - | Adapts to subscription level |
| AI Agent direct connection | Basic LLM Chain only | - | Community nodes blocked by whitelist |
| Multiplier numbers | Premium badge only | CONTEXT.md decision | Simpler UI |

**Deprecated/outdated:**
- `loadOptionsMethod`: Use resourceLocator for new nodes
- Direct AI Agent connection: Not possible for community nodes (issue #16121)

## Open Questions

Things that couldn't be fully resolved:

1. **Premium Request Tracking Endpoint**
   - What we know: GitHub tracks premium requests in billing dashboard
   - What's unclear: Whether there's an API endpoint to query remaining premium requests
   - Recommendation: Show model count in test, omit premium remaining if API doesn't provide it. Message: "Connected! {n} models available"

2. **Model Grouping by Provider**
   - What we know: CONTEXT.md requires grouping by provider (OpenAI, Anthropic, Google)
   - What's unclear: Whether n8n resourceLocator supports option groups
   - Recommendation: If groups not supported, prefix model names with provider

3. **Default Model Selection**
   - What we know: CONTEXT.md says "most capable non-premium model available"
   - What's unclear: How to determine "most capable" - may vary by task
   - Recommendation: Default to `gpt-4.1` (included, capable) with fallback logic

4. **Exact Model IDs from Copilot API**
   - What we know: GitHub docs list model names, API returns IDs
   - What's unclear: Exact mapping between display names and API IDs
   - Recommendation: Test against real API, document actual response format

## Sources

### Primary (HIGH confidence)
- [n8n Issue #16121 - Custom AI chat model cannot connect](https://github.com/n8n-io/n8n/issues/16121) - Whitelist confirmation, closed as "not planned"
- [GitHub Copilot Supported Models](https://docs.github.com/en/copilot/reference/ai-models/supported-models) - Model list, multipliers
- [GitHub Copilot Premium Requests](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) - Premium system, multipliers

### Secondary (MEDIUM confidence)
- [n8n OpenAI Chat Model Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/) - Node pattern
- [n8n Anthropic Chat Model Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/) - resourceLocator pattern
- [n8n Node UI Elements](https://docs.n8n.io/integrations/creating-nodes/build/reference/ui-elements/) - resourceLocator docs
- [GitHub Models Catalog API](https://docs.github.com/en/rest/models/catalog) - API endpoint format

### Tertiary (LOW confidence)
- [ericc-ch/copilot-api](https://github.com/ericc-ch/copilot-api) - Reverse-engineered /models endpoint
- [n8n Community - loadOptions re-trigger](https://community.n8n.io/t/how-to-re-trigger-loadoptions/190792) - loadOptionsMethod limitations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - n8n patterns well-documented, Phase 1-2 complete
- Architecture: MEDIUM - resourceLocator pattern verified, some grouping uncertainty
- Pitfalls: HIGH - AI Agent whitelist confirmed by n8n team, loadOptions issues documented
- Model detection: MEDIUM - Premium list from official docs, but API response format needs verification

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - n8n patterns stable, Copilot models may change)
