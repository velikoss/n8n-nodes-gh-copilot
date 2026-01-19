/**
 * Package Entry Point for n8n-nodes-gh-copilot
 *
 * This file exports all public components of the package:
 * - Credential types for n8n registration
 * - Authentication utilities for token management
 */
export { GitHubCopilotApi } from "./credentials/GitHubCopilotApi.credentials";
export { CopilotTokenManager, getCopilotToken, } from "./lib/CopilotTokenManager";
export type { CopilotTokenResponse } from "./lib/CopilotTokenManager";
export { requestDeviceCode, pollForToken, CLIENT_ID } from "./lib/CopilotAuth";
export type { DeviceCodeResponse, TokenResponse } from "./lib/CopilotAuth";
export { CopilotChatModel } from "./lib/CopilotChatModel";
export type { CopilotChatModelParams } from "./lib/CopilotChatModel";
