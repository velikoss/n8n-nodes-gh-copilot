# n8n GitHub Copilot Chat Model

[![npm version](https://img.shields.io/npm/v/n8n-nodes-gh-copilot-lm.svg)](https://www.npmjs.com/package/n8n-nodes-gh-copilot-lm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-ff6d5a)](https://docs.n8n.io/integrations/community-nodes/)

**Use your GitHub Copilot subscription as an LLM provider in n8n AI Agent workflows.**

Access GPT-4o, Claude, Gemini, and 30+ other models through the Copilot API — no additional API keys or per-token costs required.

---

## Why This Exists

If you're paying for GitHub Copilot (Individual, Business, or Enterprise), you already have access to multiple LLM models. This node lets you use that existing subscription with n8n's AI Agent, eliminating the need for separate OpenAI/Anthropic/Google API accounts.

**Cost comparison:**
- OpenAI API: ~$5-15 per 1M tokens
- GitHub Copilot: $10-39/month unlimited (included models) or 300 premium requests/month

---

## Features

- **Dynamic model discovery** — Fetches available models from your Copilot subscription
- **Premium model indicators** — Shows request multipliers ([3x], [1x], [0.33x]) for budget planning
- **LangChain compatible** — Works as a drop-in replacement for other chat models
- **Automatic token refresh** — Handles Copilot API token lifecycle
- **Multi-tier support** — Works with Individual, Business, and Enterprise subscriptions

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **GitHub Copilot subscription** | Individual ($10/mo), Business ($19/mo), or Enterprise ($39/mo) |
| **n8n instance** | Self-hosted or n8n Cloud |
| **Node.js 18+** | Only needed for initial authentication script |

---

## Installation

### Via n8n Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter: `n8n-nodes-gh-copilot-lm`
5. Accept the risk acknowledgment
6. Click **Install**
7. Restart n8n if prompted

### Manual Installation

```bash
# In your n8n custom nodes directory
npm install n8n-nodes-gh-copilot-lm
```

---

## Authentication Setup

GitHub Copilot uses OAuth device flow authentication. You'll run a script once to get a token, then enter it in n8n.

### Step 1: Clone and Build

```bash
git clone https://github.com/ssccio/n8n-nodes-gh-copilot.git
cd n8n-nodes-gh-copilot
npm install
npm run build
```

### Step 2: Run Authentication Script

```bash
node test-auth.mjs
```

You'll see output like:

```
Please visit: https://github.com/login/device
And enter code: XXXX-XXXX

Waiting for authorization...
```

### Step 3: Authorize in Browser

1. Open https://github.com/login/device in your browser
2. Enter the code displayed in your terminal
3. Click **Authorize** when prompted
4. Return to terminal — you'll see your OAuth token:

```
Authorization successful!
OAuth Token: gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Configure n8n Credential

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **GitHub Copilot API**
3. Paste your OAuth token (the `gho_...` value)
4. Leave **API Endpoint** empty (auto-discovered based on your subscription)
5. Click **Save**

The credential test runs automatically. Green checkmark = you're ready to go.

---

## Usage

### Basic Setup with AI Agent

1. Add an **AI Agent** node to your workflow
2. Add a **GitHub Copilot Chat Model** node
3. Connect it to the AI Agent's **Chat Model** input
4. Select your credential
5. Choose a model from the dropdown
6. Set temperature (0 = deterministic, 2 = creative)

### Node Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| **Model** | LLM to use for completions | gpt-4.1 (or best available) |
| **Temperature** | Randomness of output (0-2) | 0.7 |

---

## Available Models

Models vary by subscription tier. The node fetches your actual available models at runtime.

### Common Models

| Model | Type | Multiplier | Notes |
|-------|------|------------|-------|
| `gpt-4o` | Included | — | Fast, capable general purpose |
| `gpt-4o-mini` | Included | — | Faster, cheaper for simple tasks |
| `gpt-4.1` | Included | — | Latest GPT-4 variant |
| `o1` | Premium | [1x] | Reasoning model |
| `o3-mini` | Premium | [0.33x] | Efficient reasoning |
| `claude-sonnet-4` | Premium | [1x] | Anthropic's balanced model |
| `claude-3.5-sonnet` | Premium | [1x] | Previous generation Sonnet |
| `gemini-2.0-flash` | Included | — | Google's fast model |

### Premium Request Budget

Premium models consume from your 300 requests/month budget:
- **[0.33x]** = 3 requests per budget unit (efficient)
- **[1x]** = 1 request per budget unit (standard)
- **[3x]** = Uses 3 budget units per request (expensive)

Models without a badge are **included** — unlimited usage.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   n8n AI Agent  │────▶│  Copilot Chat    │────▶│  GitHub Copilot │
│                 │     │  Model Node      │     │  API            │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  LangChain       │
                        │  BaseChatModel   │
                        └──────────────────┘
```

The node wraps the Copilot API in a LangChain-compatible interface, making it work seamlessly with n8n's AI Agent node.

---

## Troubleshooting

### "401 Unauthorized" on credential test

**Cause:** OAuth token expired (GitHub tokens expire after inactivity)

**Fix:** Re-run `node test-auth.mjs` to get a fresh token

### "403 Forbidden" on credential test

**Cause:** No active Copilot subscription on the authenticated GitHub account

**Fix:** Verify subscription at https://github.com/settings/copilot

### Node not appearing in n8n

1. Restart n8n after installing
2. Check **Settings** → **Community Nodes** for installation status
3. Check n8n logs for loading errors:
   ```bash
   # Docker
   docker logs n8n

   # Direct
   tail -f ~/.n8n/logs/n8n.log
   ```

### "Model not found" error

**Cause:** Selected model not available on your subscription tier

**Fix:** Refresh the model dropdown — it fetches current available models

### Rate limiting

**Cause:** Exceeded premium request budget (300/month)

**Fix:** Switch to an included model (no badge) or wait for monthly reset

---

## Development

### Local Development

```bash
# Clone and install
git clone https://github.com/ssccio/n8n-nodes-gh-copilot.git
cd n8n-nodes-gh-copilot
npm install

# Build and run n8n with this node
npm run dev
```

This starts n8n with the local node loaded. Access at http://localhost:5678.

### Running Tests

```bash
# Build first
npm run build

# Test authentication flow
node test-auth.mjs

# Test token exchange
node test-exchange.mjs

# Test chat model
node test-model.mjs

# Test full node integration
node test-node.mjs
```

### Project Structure

```
src/
├── credentials/
│   └── GitHubCopilotApi.credentials.ts  # OAuth credential type
├── lib/
│   ├── CopilotAuth.ts                   # Device code flow
│   ├── CopilotTokenManager.ts           # Token lifecycle
│   ├── CopilotChatModel.ts              # LangChain wrapper
│   └── CopilotModels.ts                 # Model discovery
├── nodes/
│   └── LmChatGitHubCopilot/
│       ├── LmChatGitHubCopilot.node.ts  # n8n node definition
│       └── copilot.png                  # Node icon
└── index.ts                             # Package exports
```

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed guidelines.

---

## Related Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Copilot](https://github.com/features/copilot)
- [LangChain JS](https://js.langchain.com/)
- [n8n AI Agent Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [n8n](https://n8n.io/) node SDK
- LangChain integration via [@langchain/openai](https://www.npmjs.com/package/@langchain/openai)
- OAuth device flow based on [RFC 8628](https://datatracker.ietf.org/doc/html/rfc8628)

---

<p align="center">
  <sub>Built by <a href="https://sscc.io">SSCC</a> — Making AI automation accessible</sub>
</p>
