# Phase 5: Distribution - Research

**Researched:** 2026-01-19
**Domain:** npm package publishing, n8n community nodes, GitHub repository setup
**Confidence:** HIGH

## Summary

Phase 5 focuses on publishing the n8n-nodes-github-copilot package to npm and ensuring it's installable via n8n's community nodes system. Research confirms n8n has specific requirements for community node packages including naming conventions (`n8n-nodes-*`), required keywords (`n8n-community-node-package`), and package.json structure with an `n8n` attribute.

The publishing workflow is straightforward: update package.json metadata, create LICENSE and README, set up GitHub repository with issue templates, create CHANGELOG, then `npm publish --access public`. Users install via n8n Settings > Community Nodes GUI by searching for the package name.

**Primary recommendation:** Follow n8n's official community node conventions exactly. Use the `files` property in package.json for explicit control over published content. Keep documentation concise and GUI-installation focused.

## Standard Stack

The established tools and conventions for n8n community node distribution:

### Core Requirements
| Item | Specification | Purpose | Why Standard |
|------|---------------|---------|--------------|
| Package name | `n8n-nodes-github-copilot` | npm identity | Must start with `n8n-nodes-` per n8n requirements |
| Keyword | `n8n-community-node-package` | Discovery | Required tag for n8n to find package |
| License | MIT | Legal | Required for n8n Cloud verification |
| n8n attribute | `n8n.nodes`, `n8n.credentials` | Node registration | How n8n discovers nodes in package |

### package.json Required Fields
| Field | Value | Notes |
|-------|-------|-------|
| `name` | `n8n-nodes-github-copilot` | User decision from CONTEXT.md |
| `version` | `1.0.0` | Semantic versioning for first release |
| `description` | Brief node purpose | Currently: "n8n chat model sub-node for GitHub Copilot API" |
| `keywords` | Array with `n8n-community-node-package` | Required for discovery |
| `author` | `Ken Trenkelbach <ken@sscc.io>` | User decision from CONTEXT.md |
| `license` | `MIT` | User decision from CONTEXT.md |
| `main` | `dist/index.js` | Entry point |
| `types` | `dist/index.d.ts` | TypeScript declarations |
| `repository` | GitHub URL object | For npm page linking |
| `homepage` | GitHub repo URL | For npm page |
| `bugs` | GitHub issues URL | For npm page |
| `files` | `["dist"]` | Explicit publish whitelist |
| `n8n` | Node/credential registration | Already configured |

### Supporting Files
| File | Purpose | Location |
|------|---------|----------|
| `README.md` | Installation and usage docs | Root |
| `LICENSE` | MIT license text | Root |
| `CHANGELOG.md` | Version history | Root |
| `.gitignore` | Exclude node_modules, etc | Root |
| `.github/ISSUE_TEMPLATE/` | Bug/feature templates | .github folder |

## Architecture Patterns

### Recommended Repository Structure
```
n8n-nodes-github-copilot/
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── dist/                    # Compiled output (gitignored, npm published)
├── src/                     # Source code
│   ├── credentials/
│   └── nodes/
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Pattern 1: Explicit files Whitelist
**What:** Use `"files": ["dist"]` in package.json instead of .npmignore
**When to use:** Always for n8n community nodes
**Why:** Strictest control over published package contents. Prevents accidental inclusion of test files, .env, etc.

```json
{
  "files": ["dist"]
}
```

### Pattern 2: Keep a Changelog Format
**What:** Structured CHANGELOG.md following keepachangelog.com
**When to use:** All releases
**Format:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-19

### Added
- Initial release
- GitHub Copilot Chat Model node for n8n AI Agent workflows
- OAuth device flow authentication
- Dynamic model discovery from Copilot API
- Premium model indicators with request multipliers
```

### Pattern 3: GUI Installation Instructions
**What:** Document Settings > Community Nodes path
**When to use:** README installation section
**Format:**
```markdown
1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-github-copilot`
4. Accept the risk warning
5. Click **Install**
```

### Anti-Patterns to Avoid
- **Using .npmignore:** Prefer `files` array for explicit whitelist control
- **Including node_modules in package:** Always in .gitignore, never published
- **Committing dist to git:** Build output should be generated fresh for each publish
- **Hardcoding version in README:** Users should just search by package name

## Don't Hand-Roll

Problems with existing solutions to use:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIT License text | Custom license | Standard MIT template | Legal correctness |
| Issue templates | Plain text | GitHub YAML templates | Structured input, labels |
| Changelog format | Ad-hoc notes | Keep a Changelog | Standard, tooling-friendly |
| Package publishing | Manual file selection | `files` array | Prevents mistakes |

**Key insight:** npm and GitHub have established conventions. Following them exactly makes the package more discoverable and maintainable.

## Common Pitfalls

### Pitfall 1: Wrong Package Name Format
**What goes wrong:** Package not discoverable in n8n
**Why it happens:** Name doesn't start with `n8n-nodes-`
**How to avoid:** Use exactly `n8n-nodes-github-copilot` (decided in CONTEXT.md)
**Warning signs:** Package installs but node doesn't appear in n8n

### Pitfall 2: Missing n8n-community-node-package Keyword
**What goes wrong:** Package not found when browsing n8n community nodes
**Why it happens:** Missing required keyword in package.json
**How to avoid:** Ensure `keywords` array includes `"n8n-community-node-package"`
**Warning signs:** Manual npm search works but n8n browse doesn't show it

### Pitfall 3: Scoped Package Without --access public
**What goes wrong:** npm publish fails or package is private
**Why it happens:** Scoped packages default to private
**How to avoid:** This package is unscoped (`n8n-nodes-github-copilot` not `@scope/n8n-nodes-github-copilot`), so not an issue. For unscoped packages, `--access public` is optional but harmless.
**Warning signs:** E402 payment required error

### Pitfall 4: dist Not Included in Package
**What goes wrong:** Installed package has no code
**Why it happens:** `files` array doesn't include `dist`, or prepublishOnly didn't build
**How to avoid:** Use `"files": ["dist"]` and `"prepublishOnly": "npm run build"`
**Warning signs:** Installation succeeds but node doesn't load

### Pitfall 5: Forgetting npm login
**What goes wrong:** npm publish fails with E401 unauthorized
**Why it happens:** Not logged into npm registry
**How to avoid:** Run `npm login` before first publish, verify with `npm whoami`
**Warning signs:** E401 or E403 errors on publish

### Pitfall 6: Version Already Published
**What goes wrong:** npm publish fails
**Why it happens:** Trying to publish same version twice
**How to avoid:** Increment version in package.json before each publish
**Warning signs:** "cannot publish over previously published version" error

## Code Examples

### package.json Complete Metadata
```json
{
  "name": "n8n-nodes-github-copilot",
  "version": "1.0.0",
  "description": "n8n chat model sub-node for GitHub Copilot API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc && npm run copy:icons",
    "copy:icons": "cp src/nodes/LmChatGitHubCopilot/copilot.png dist/nodes/LmChatGitHubCopilot/",
    "dev": "npm run build && N8N_CUSTOM_EXTENSIONS=$(pwd) N8N_SECURE_COOKIE=false npx n8n start",
    "prepublishOnly": "npm run build"
  },
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/GitHubCopilotApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/LmChatGitHubCopilot/LmChatGitHubCopilot.node.js"
    ]
  },
  "keywords": [
    "n8n-community-node-package",
    "n8n",
    "github-copilot",
    "ai",
    "langchain"
  ],
  "author": "Ken Trenkelbach <ken@sscc.io>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/kentrenkelbach/n8n-nodes-github-copilot.git"
  },
  "homepage": "https://github.com/kentrenkelbach/n8n-nodes-github-copilot#readme",
  "bugs": {
    "url": "https://github.com/kentrenkelbach/n8n-nodes-github-copilot/issues"
  },
  "peerDependencies": {
    "n8n-workflow": "^1.119.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "files": [
    "dist"
  ]
}
```

### MIT License Template
```text
MIT License

Copyright (c) 2026 Ken Trenkelbach

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### .gitignore for Node.js Package
```gitignore
# Dependencies
node_modules/

# Build output
dist/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# Test files
test-*.mjs
coverage/

# n8n local data
.n8n/
```

### GitHub Issue Template: Bug Report
```markdown
---
name: Bug Report
about: Report a problem with the GitHub Copilot node
title: '[Bug]: '
labels: bug
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1.
2.
3.

**Expected behavior**
What you expected to happen.

**n8n Version**
e.g., 1.30.0

**Node Version**
e.g., n8n-nodes-github-copilot@1.0.0

**Additional context**
Any other information that might help.
```

### GitHub Issue Template: Feature Request
```markdown
---
name: Feature Request
about: Suggest an enhancement for the GitHub Copilot node
title: '[Feature]: '
labels: enhancement
---

**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Alternatives considered**
Any alternative solutions you've thought about.

**Additional context**
Any other information.
```

### npm Publish Workflow
```bash
# Verify logged in
npm whoami

# Test package contents before publish
npm pack --dry-run

# Publish to npm
npm publish --access public

# Verify publication
npm info n8n-nodes-github-copilot
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| .npmignore files | `files` array in package.json | Long-standing best practice | Explicit whitelist safer |
| Markdown issue templates | YAML issue forms | GitHub 2021+ | Better structure, but MD still works |
| Manual CHANGELOG | Keep a Changelog format | Standard since 2017 | Tooling support |

**Deprecated/outdated:**
- Custom license text: Use standard MIT template verbatim
- Scoped packages for n8n: Unscoped `n8n-nodes-*` is preferred for discoverability

## Open Questions

Things that couldn't be fully resolved:

1. **GitHub repository URL**
   - What we know: Need repository, homepage, bugs URLs
   - What's unclear: Exact GitHub username/organization for repository
   - Recommendation: Planner should use placeholder like `kentrenkelbach` or confirm with user

2. **n8n Cloud Verification**
   - What we know: Verified nodes get listed in n8n Cloud
   - What's unclear: Whether to submit for verification in v1
   - Recommendation: Per CONTEXT.md, v1 is unverified (self-hosted). Defer verification to future phase.

## Sources

### Primary (HIGH confidence)
- [n8n Building Community Nodes](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/) - Package requirements, naming, structure
- [n8n GUI Installation](https://docs.n8n.io/integrations/community-nodes/installation/gui-install/) - Installation steps
- [n8n-nodes-starter README Template](https://github.com/n8n-io/n8n-nodes-starter/blob/master/README_TEMPLATE.md) - Documentation structure
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) - CHANGELOG format
- [GitHub Issue Templates Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) - Template structure

### Secondary (MEDIUM confidence)
- [npm publish docs](https://docs.npmjs.com/cli/v11/commands/npm-publish/) - Publishing commands
- [npm scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) - Access flags

### Tertiary (LOW confidence)
- WebSearch results for n8n community node examples - Community patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official n8n docs specify exact requirements
- Architecture: HIGH - Well-established npm/GitHub patterns
- Pitfalls: HIGH - Documented in official sources and community forums

**Research date:** 2026-01-19
**Valid until:** 90 days (stable publishing conventions, rarely change)

---
*Phase: 05-distribution*
*Researched: 2026-01-19*
