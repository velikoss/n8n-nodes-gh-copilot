/**
 * Package Entry Point for n8n-nodes-gh-copilot
 *
 * This file exports all public components of the package:
 * - Credential types for n8n registration
 * - Authentication utilities for token management
 */

// Credential type for n8n
export { GitHubCopilotApi } from "./credentials/GitHubCopilotApi.credentials";

// Token management
export {
  CopilotTokenManager,
  getCopilotToken,
} from "./lib/CopilotTokenManager";
export type { CopilotTokenResponse } from "./lib/CopilotTokenManager";

// Device code flow utilities
export { requestDeviceCode, pollForToken, CLIENT_ID } from "./lib/CopilotAuth";
export type { DeviceCodeResponse, TokenResponse } from "./lib/CopilotAuth";

// LangChain chat model
export { CopilotChatModel } from "./lib/CopilotChatModel";
export type { CopilotChatModelParams } from "./lib/CopilotChatModel";

// Model discovery
export {
  fetchCopilotModels,
  formatModelName,
  isPremiumModel,
  getDefaultModel,
} from "./lib/CopilotModels";
export type { CopilotModel } from "./lib/CopilotModels";
