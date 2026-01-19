# Phase 4: Polish - Research

**Researched:** 2026-01-19
**Domain:** n8n node metadata, branding, help text patterns, model multipliers
**Confidence:** HIGH

## Summary

Phase 4 focuses on production-readiness polish: icon design, category placement, help text, and model multiplier display. Research covered n8n's node metadata conventions, codex category system, property description patterns from existing AI nodes, and GitHub Copilot's premium request multiplier system.

The standard approach for n8n AI chat model nodes is well-documented through examining the built-in OpenAI and Anthropic nodes. Key patterns include: codex categories for AI > Language Models, search aliases for discoverability, concise help text following existing node conventions, and square SVG icons at any resolution.

**Primary recommendation:** Follow established n8n AI node patterns exactly - copy the codex structure, alias format, and help text style from lmChatOpenAi and lmChatAnthropic nodes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | ^1.119.0 | Node type definitions | Already in project as peer dependency |
| SVG | N/A | Icon format | n8n recommended format for node icons |

### Supporting

No additional libraries needed for polish phase - this is metadata and static assets only.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG icon | PNG (60x60) | PNG works but SVG scales better, is standard for n8n |
| Inline codex | Separate .node.json file | Both work; inline is simpler for single-file nodes |

**Installation:**
No additional packages needed.

## Architecture Patterns

### Node Metadata Structure

The n8n node description object contains all polish-related fields:

```typescript
// Source: n8n built-in lmChatOpenAi node
description: INodeTypeDescription = {
  displayName: "GitHub Copilot Chat Model",  // User-facing name
  name: "lmChatGitHubCopilot",               // Internal camelCase ID
  icon: "file:copilot.svg",                  // Square SVG in same folder
  group: ["transform"],                       // Standard for sub-nodes
  version: 1,
  description: "Use GitHub Copilot models in AI workflows",  // One-line capability
  defaults: { name: "GitHub Copilot" },      // Default node name in canvas
  codex: {
    categories: ["AI"],
    subcategories: {
      AI: ["Language Models", "Root Nodes"],
      "Language Models": ["Chat Models (Recommended)"],
    },
    alias: ["copilot", "github", "github ai", "github copilot"],
  },
  // ... rest of node
};
```

### Icon Requirements

| Requirement | Value | Source |
|-------------|-------|--------|
| Format | SVG (recommended) or PNG | n8n docs |
| Aspect ratio | Square or near-square | n8n docs |
| PNG resolution | 60x60px if PNG | n8n docs |
| Location | Same folder as .node.ts file | n8n conventions |
| Reference syntax | `icon: "file:copilot.svg"` | n8n conventions |
| Build process | Must copy to dist/ folder | Project already has copy:icons script |

### Codex Categories

The exact category structure for AI language model nodes:

```typescript
codex: {
  categories: ["AI"],
  subcategories: {
    AI: ["Language Models", "Root Nodes"],
    "Language Models": ["Chat Models (Recommended)"],
  },
  alias: ["copilot", "github", "github ai", "github copilot"],
}
```

**Critical:** Category strings must match exactly including casing and punctuation.

### Help Text Patterns

From analyzing lmChatOpenAi and lmChatAnthropic nodes:

| Element | Pattern | Example |
|---------|---------|---------|
| Node description | One-line capability statement | "Use GitHub Copilot models in AI workflows" |
| Parameter description | Action-oriented, mentions defaults | "Controls randomness. Lower = deterministic, higher = creative. Default: 0.7" |
| No jargon | Avoid technical terms | "More random" not "Higher temperature increases sampling variance" |
| Premium badge | Inline in model name | "claude-opus-4.5 [Premium]" |

### Model Multiplier Display (MODL-04)

GitHub Copilot uses a multiplier system for premium requests:

| Model | Multiplier | Display Format |
|-------|------------|----------------|
| GPT-4.1, GPT-5 mini, GPT-4o | 0x (included) | No badge, no multiplier |
| Claude Haiku 4.5, Gemini 3 Flash | 0.33x | "[0.33x]" |
| Claude Sonnet 4/4.5, Gemini 2.5 Pro | 1x | "[1x]" |
| Claude Opus 4.5 | 3x | "[3x]" |
| Claude Opus 4.1 | 10x | "[10x]" |

**Implementation approach:**
1. Fetch multiplier data from Copilot API if available
2. Fall back to pattern-based lookup table for known models
3. Display format: `"model-name [Nx]"` where N is multiplier
4. Included models (0x): show no multiplier suffix

### Anti-Patterns to Avoid

- **Over-explaining in help text:** Keep it to one line, users know what temperature means
- **Using unofficial brand colors:** Copilot branding has changed; use Copilot-inspired rather than exact colors
- **Adding status codes to error messages:** User decided against technical details
- **Separate codex .json file:** Inline codex in TypeScript is simpler for single nodes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon design | Custom graphic design | Copilot-inspired SVG from template | Time-consuming, trademark concerns |
| Category placement | Custom category strings | Copy exact strings from lmChatOpenAi | Must match exactly for n8n to recognize |

**Key insight:** n8n's category system is string-matching - don't invent categories, copy established ones exactly.

## Common Pitfalls

### Pitfall 1: Category String Mismatch

**What goes wrong:** Node doesn't appear in AI > Language Models
**Why it happens:** Category strings must match exactly including casing
**How to avoid:** Copy exact strings from working n8n AI nodes
**Warning signs:** Node appears in root "Miscellaneous" or not at all

### Pitfall 2: Icon Not Displaying

**What goes wrong:** Node shows generic icon or broken image
**Why it happens:** SVG not copied to dist/ folder, or path reference wrong
**How to avoid:** Verify copy:icons script runs during build; check dist/ folder
**Warning signs:** 404 in browser console for icon URL

### Pitfall 3: Alias Search Not Working

**What goes wrong:** Searching "copilot" doesn't find the node
**Why it happens:** Aliases must be lowercase, in codex.alias array
**How to avoid:** Include common search terms: "copilot", "github", "github copilot"
**Warning signs:** Node only found by exact displayName

### Pitfall 4: Verbose Help Text

**What goes wrong:** UI feels cluttered, users don't read
**Why it happens:** Developer instinct to explain everything
**How to avoid:** One line max, mention default value, assume user knows basics
**Warning signs:** Help text wraps to multiple lines

### Pitfall 5: Model Multiplier Data Staleness

**What goes wrong:** Multiplier values outdated (GitHub changes them)
**Why it happens:** Hardcoded multiplier values
**How to avoid:** Prefer API data if available; pattern matching for fallback
**Warning signs:** User reports wrong multiplier displayed

## Code Examples

### Complete Node Description with Polish

```typescript
// Source: Pattern from n8n lmChatOpenAi + lmChatAnthropic
description: INodeTypeDescription = {
  displayName: "GitHub Copilot Chat Model",
  name: "lmChatGitHubCopilot",
  icon: "file:copilot.svg",
  group: ["transform"],
  version: 1,
  description: "Use GitHub Copilot models in AI workflows",
  defaults: { name: "GitHub Copilot" },
  codex: {
    categories: ["AI"],
    subcategories: {
      AI: ["Language Models", "Root Nodes"],
      "Language Models": ["Chat Models (Recommended)"],
    },
    alias: ["copilot", "github", "github ai", "github copilot"],
  },
  inputs: [],
  outputs: [NodeConnectionTypes.AiLanguageModel],
  outputNames: ["Model"],
  usableAsTool: true,
  credentials: [
    {
      name: "gitHubCopilotApi",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Model",
      name: "model",
      type: "resourceLocator",
      default: { mode: "list", value: "gpt-4o" },
      required: true,
      modes: [
        {
          displayName: "From List",
          name: "list",
          type: "list",
          typeOptions: {
            searchListMethod: "searchModels",
            searchable: true,
          },
        },
        {
          displayName: "ID",
          name: "id",
          type: "string",
          placeholder: "e.g., claude-sonnet-4",
        },
      ],
      description: "Model for chat completions",
    },
    {
      displayName: "Temperature",
      name: "temperature",
      type: "number",
      default: 0.7,
      typeOptions: {
        minValue: 0,
        maxValue: 2,
        numberStepSize: 0.1,
      },
      description: "Controls randomness. Lower = deterministic, higher = creative. Default: 0.7",
    },
  ],
};
```

### Copilot-Inspired SVG Icon

```svg
<!-- Copilot-inspired design: gradient with slight depth effect -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
  <defs>
    <linearGradient id="copilotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1"/>    <!-- Indigo -->
      <stop offset="100%" style="stop-color:#8B5CF6"/>  <!-- Purple -->
    </linearGradient>
  </defs>
  <rect width="60" height="60" rx="12" fill="url(#copilotGrad)"/>
  <!-- AI/chat symbol or abstract mark here -->
</svg>
```

**Note:** User decided on Copilot-inspired custom design to avoid trademark issues. The gradient captures the blue/purple Copilot aesthetic without copying the official logo.

### Model Multiplier Lookup Table

```typescript
// Known multipliers from GitHub docs (as of 2026-01-19)
// Source: https://docs.github.com/en/copilot/concepts/billing/copilot-requests
const MODEL_MULTIPLIERS: Record<string, number> = {
  // Included (0x) - no multiplier displayed
  "gpt-4.1": 0,
  "gpt-4o": 0,
  "gpt-4o-mini": 0,
  "gpt-5-mini": 0,
  "raptor-mini": 0,

  // Discounted
  "grok-code-fast-1": 0.25,
  "claude-haiku-4.5": 0.33,
  "gemini-3-flash": 0.33,
  "gpt-5.1-codex-mini": 0.33,

  // Standard (1x)
  "claude-sonnet-4": 1,
  "claude-sonnet-4.5": 1,
  "gemini-2.5-pro": 1,
  "gemini-3-pro": 1,
  "gpt-5": 1,
  "gpt-5.1": 1,
  "gpt-5.2": 1,

  // Premium
  "claude-opus-4.5": 3,
  "claude-opus-4.1": 10,
};

function getMultiplierBadge(modelId: string): string {
  const multiplier = MODEL_MULTIPLIERS[modelId];
  if (multiplier === undefined || multiplier === 0) return "";
  if (multiplier < 1) return ` [${multiplier}x]`;  // e.g., [0.33x]
  return ` [${multiplier}x]`;  // e.g., [3x]
}
```

### Updated formatModelName with Multipliers

```typescript
// Replace simple [Premium] badge with multiplier display
export function formatModelName(model: CopilotModel): string {
  const badge = getMultiplierBadge(model.id);
  return `${model.id}${badge}`;  // e.g., "claude-opus-4.5 [3x]"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate .node.json codex file | Inline codex in TypeScript | n8n supports both | Inline is simpler, one file to maintain |
| PNG icons | SVG icons | Always supported both | SVG scales better, recommended |
| [Premium] badge | Multiplier display [Nx] | MODL-04 requirement | More informative than binary premium/included |

**Deprecated/outdated:**
- Separate codex .node.json files: Still work but inline is cleaner for simple nodes
- GitHub Copilot standalone logo: 2025 rebrand removed standalone icon; use inspired design

## Open Questions

1. **Multiplier API Discovery**
   - What we know: GitHub docs list multipliers; API returns model metadata
   - What's unclear: Does Copilot API return multiplier values directly?
   - Recommendation: Implement lookup table first; enhance with API data if available later

2. **Exact Icon Design**
   - What we know: User wants Copilot-inspired, blue/purple gradient, slight 3D effect
   - What's unclear: Specific icon symbol (AI icon, chat bubble, abstract mark?)
   - Recommendation: Simple geometric design with gradient; avoid any trademarked elements

## Sources

### Primary (HIGH confidence)

- n8n documentation - Node standard parameters: https://docs.n8n.io/integrations/creating-nodes/build/reference/node-base-files/standard-parameters/
- n8n documentation - Codex files: https://docs.n8n.io/integrations/creating-nodes/build/reference/node-codex-files/
- n8n documentation - UI elements: https://docs.n8n.io/integrations/creating-nodes/build/reference/ui-elements/
- GitHub Copilot documentation - Supported models: https://docs.github.com/en/copilot/reference/ai-models/supported-models
- GitHub Copilot documentation - Premium requests: https://docs.github.com/en/copilot/concepts/billing/copilot-requests

### Secondary (MEDIUM confidence)

- n8n lmChatOpenAi node source (GitHub raw): Examined for codex pattern, property descriptions
- n8n lmChatAnthropic node source (GitHub raw): Examined for alias pattern ["claude", "sonnet", "opus"]
- GitHub brand toolkit: https://brand.github.com/foundations/logo

### Tertiary (LOW confidence)

- Community discussions about icon formats and issues
- Wikimedia Commons for older Copilot logo reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - n8n official documentation consulted
- Architecture (codex, categories): HIGH - copied from working n8n AI nodes
- Help text patterns: HIGH - analyzed multiple built-in nodes
- Model multipliers: MEDIUM - from GitHub docs but may change frequently
- Icon design guidance: MEDIUM - user decisions + brand research

**Research date:** 2026-01-19
**Valid until:** 30 days for most content; 7 days for multiplier values (GitHub updates these)

---

*Phase: 04-polish*
*Research completed: 2026-01-19*
