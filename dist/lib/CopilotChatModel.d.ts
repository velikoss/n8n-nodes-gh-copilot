/**
 * LangChain-compatible Chat Model for GitHub Copilot API
 *
 * This module provides a BaseChatModel implementation that wraps ChatOpenAI
 * with Copilot-specific handling:
 * - Automatic token refresh on each generate call
 * - System message transformation (system -> assistant role)
 * - Dynamic endpoint discovery from token exchange
 *
 * The class delegates to ChatOpenAI for retry logic, streaming, and OpenAI-compatible
 * message formatting while handling Copilot's unique requirements.
 *
 * @example
 * ```typescript
 * const tokenManager = new CopilotTokenManager('gho_xxxx');
 * const model = new CopilotChatModel({ tokenManager, temperature: 0.7 });
 * const result = await model.invoke([new HumanMessage('Hello!')]);
 * ```
 */
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { CopilotTokenManager } from "./CopilotTokenManager.js";
/**
 * Configuration parameters for CopilotChatModel.
 */
export interface CopilotChatModelParams {
    /** Token manager instance for handling Copilot API authentication */
    tokenManager: CopilotTokenManager;
    /** Temperature for response generation (0-2, default 0.7) */
    temperature?: number;
    /** Enable verbose logging for debugging */
    verbose?: boolean;
}
/**
 * LangChain BaseChatModel implementation for GitHub Copilot API.
 *
 * This class wraps ChatOpenAI to leverage its retry logic and message formatting
 * while adding Copilot-specific behavior:
 * - Token is refreshed on each generate call to prevent mid-conversation expiry
 * - System messages are transformed to assistant role (Copilot API requirement)
 * - Dynamic endpoint from token exchange response
 *
 * @example
 * ```typescript
 * const tokenManager = new CopilotTokenManager('gho_xxxx', 'https://api.githubcopilot.com');
 * const model = new CopilotChatModel({
 *   tokenManager,
 *   temperature: 0.7,
 *   verbose: true
 * });
 *
 * // Use with LangChain
 * const response = await model.invoke([
 *   new HumanMessage('What is TypeScript?')
 * ]);
 * ```
 */
export declare class CopilotChatModel extends BaseChatModel {
    private tokenManager;
    private temperature;
    /** Flag to track if we're already retrying after token refresh */
    private isRetrying;
    /**
     * Create a new CopilotChatModel instance.
     *
     * @param params - Configuration parameters
     * @throws Error if temperature is outside valid range (0-2)
     */
    constructor(params: CopilotChatModelParams);
    /**
     * Returns the type identifier for this LLM.
     * Used by LangChain for logging and tracking.
     */
    _llmType(): string;
    /**
     * Generate a chat completion from the given messages.
     *
     * This method:
     * 1. Refreshes the Copilot API token if needed
     * 2. Creates a fresh ChatOpenAI instance with current token
     * 3. Transforms system messages to assistant role
     * 4. Delegates to ChatOpenAI for the actual API call
     *
     * @param messages - Input messages for the conversation
     * @param options - Call options (stop sequences, etc.)
     * @param runManager - Callback manager for run events
     * @returns ChatResult containing the model's response
     * @throws Error with user-friendly message for API failures
     */
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    /**
     * Create a ChatOpenAI instance configured for Copilot API.
     *
     * Creates a new instance on each call because the token may have changed.
     * ChatOpenAI handles the path appending (/chat/completions) internally.
     *
     * @param token - Copilot API JWT token
     * @param endpoint - API endpoint (e.g., "https://api.githubcopilot.com")
     * @returns Configured ChatOpenAI instance
     */
    private createInnerModel;
    /**
     * Transform messages for Copilot API compatibility.
     *
     * Copilot API does not accept "system" role messages. This method
     * converts all system messages to assistant messages with the same content.
     *
     * @param messages - Original LangChain messages
     * @returns Transformed messages with system -> assistant conversion
     */
    private transformMessages;
    /**
     * Check if an error is an authentication error (401/403).
     */
    private isAuthError;
    /**
     * Transform technical errors to user-friendly messages.
     *
     * @param error - Original error from API
     * @returns Error with user-friendly message
     */
    private transformError;
}
