/**
 * Library exports for internal use
 *
 * This barrel file re-exports all lib modules for convenient imports
 * within the package (e.g., from nodes).
 */

export { CopilotTokenManager, getCopilotToken } from "./CopilotTokenManager";
export type { CopilotTokenResponse } from "./CopilotTokenManager";

export { requestDeviceCode, pollForToken, CLIENT_ID } from "./CopilotAuth";
export type { DeviceCodeResponse, TokenResponse } from "./CopilotAuth";

export { CopilotChatModel } from "./CopilotChatModel";
export type { CopilotChatModelParams } from "./CopilotChatModel";

export {
  fetchCopilotModels,
  formatModelName,
  isPremiumModel,
  getDefaultModel,
} from "./CopilotModels";
export type { CopilotModel } from "./CopilotModels";
