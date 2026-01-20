# n8n-nodes-gh-copilot-lm

n8n chat model node for GitHub Copilot API.

Use your existing GitHub Copilot subscription with n8n AI Agent workflows. Access GPT-4, Claude, Gemini, and other models through the Copilot API without additional per-token costs.

## Prerequisites

- **GitHub Copilot subscription** (Individual, Business, or Enterprise)
- **n8n instance** (self-hosted or cloud)
- **Node.js 18+** for running the authentication script

## Installation

Install via n8n Community Nodes:

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-gh-copilot-lm`
4. Accept the risk warning
5. Click **Install**

## Credential Setup

The GitHub Copilot API uses OAuth device code flow for authentication. You'll need to run a script to obtain the OAuth token, then enter it in n8n.

### Step 1: Get OAuth Token

Clone this repository and run the authentication script:

```bash
git clone https://github.com/ssccio/n8n-nodes-gh-copilot.git
cd n8n-nodes-gh-copilot
npm install
npm run build
node test-auth.mjs
```

The script will display:
- A verification URL (https://github.com/login/device)
- A user code (e.g., XXXX-XXXX)

Open the URL in your browser, enter the code, and authorize the application. The script will output your OAuth token (starts with `gho_`).

### Step 2: Configure n8n Credential

1. In n8n, go to **Credentials** > **Add Credential**
2. Search for "GitHub Copilot API"
3. Enter your OAuth token in the **OAuth Token** field
4. Leave **API Endpoint** empty (auto-discovered)
5. Click **Save**

The credential will test automatically. A successful test confirms your Copilot subscription is active.

## Usage

### With AI Agent

1. Add an **AI Agent** node to your workflow
2. Connect a **GitHub Copilot Chat Model** node to the AI Agent's language model input
3. Select your credentials and preferred model
4. Configure temperature (0-2, default 0.7)

### Available Models

The node dynamically fetches available models from your Copilot subscription. Common models include:

- **GPT-4 family**: gpt-4o, gpt-4o-mini, gpt-4.1, o1, o3-mini
- **Claude family**: claude-sonnet-4, claude-3.5-sonnet
- **Gemini family**: gemini-2.0-flash, gemini-2.5-pro

Models with premium request costs show multiplier badges (e.g., [3x], [0.33x]).

## Troubleshooting

### "401 Unauthorized" on credential test

Your OAuth token may have expired. GitHub tokens expire after a period of inactivity. Re-run `test-auth.mjs` to obtain a fresh token.

### "403 Forbidden" on credential test

Your GitHub account may not have an active Copilot subscription. Verify your subscription at https://github.com/settings/copilot.

### Node not appearing in n8n

1. Restart n8n after installing the community node
2. Check n8n logs for any loading errors
3. Verify the package installed correctly in Settings > Community Nodes

## License

MIT
