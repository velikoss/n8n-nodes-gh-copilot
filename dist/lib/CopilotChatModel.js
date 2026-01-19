"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotChatModel = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const openai_1 = require("@langchain/openai");
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
class CopilotChatModel extends chat_models_1.BaseChatModel {
    /**
     * Create a new CopilotChatModel instance.
     *
     * @param params - Configuration parameters
     * @throws Error if temperature is outside valid range (0-2)
     */
    constructor(params) {
        super({ verbose: params.verbose });
        /** Flag to track if we're already retrying after token refresh */
        this.isRetrying = false;
        // Validate temperature range
        const temperature = params.temperature ?? 0.7;
        if (temperature < 0 || temperature > 2) {
            throw new Error(`Invalid temperature: ${temperature}. Must be between 0 and 2.`);
        }
        this.tokenManager = params.tokenManager;
        this.temperature = temperature;
    }
    /**
     * Returns the type identifier for this LLM.
     * Used by LangChain for logging and tracking.
     */
    _llmType() {
        return "github-copilot";
    }
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
    async _generate(messages, options, runManager) {
        try {
            // Get fresh token and endpoint (token manager handles refresh)
            const { token, endpoint } = await this.tokenManager.getValidToken();
            // Create ChatOpenAI instance with current token
            const innerModel = this.createInnerModel(token, endpoint);
            // Transform messages (system -> assistant)
            const transformedMessages = this.transformMessages(messages);
            // Delegate to ChatOpenAI
            // Cast options to any to avoid type incompatibility between BaseChatModel
            // and ChatOpenAI call options (tool_choice types differ)
            return await innerModel._generate(transformedMessages, options, runManager);
        }
        catch (error) {
            // Handle auth errors with retry
            if (this.isAuthError(error) && !this.isRetrying) {
                this.isRetrying = true;
                try {
                    // Force token refresh by getting new token
                    const { token, endpoint } = await this.tokenManager.getValidToken();
                    const innerModel = this.createInnerModel(token, endpoint);
                    const transformedMessages = this.transformMessages(messages);
                    return await innerModel._generate(transformedMessages, options, runManager);
                }
                finally {
                    this.isRetrying = false;
                }
            }
            // Transform to user-friendly error
            throw this.transformError(error);
        }
    }
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
    createInnerModel(token, endpoint) {
        return new openai_1.ChatOpenAI({
            openAIApiKey: token,
            configuration: {
                baseURL: endpoint,
            },
            temperature: this.temperature,
            modelName: "gpt-4o", // Default model, Phase 3 makes configurable
        });
    }
    /**
     * Transform messages for Copilot API compatibility.
     *
     * Copilot API does not accept "system" role messages. This method
     * converts all system messages to assistant messages with the same content.
     *
     * @param messages - Original LangChain messages
     * @returns Transformed messages with system -> assistant conversion
     */
    transformMessages(messages) {
        return messages.map((msg) => {
            if (msg._getType() === "system") {
                // Transform system to assistant, preserve content
                if (this.verbose) {
                    console.log(`[CopilotChatModel] Transforming system message to assistant role`);
                }
                return new messages_1.AIMessage({ content: msg.content });
            }
            return msg;
        });
    }
    /**
     * Check if an error is an authentication error (401/403).
     */
    isAuthError(error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (message.includes("401") ||
                message.includes("403") ||
                message.includes("unauthorized") ||
                message.includes("forbidden"));
        }
        return false;
    }
    /**
     * Transform technical errors to user-friendly messages.
     *
     * @param error - Original error from API
     * @returns Error with user-friendly message
     */
    transformError(error) {
        if (!(error instanceof Error)) {
            return new Error("An unexpected error occurred with the Copilot API.");
        }
        const message = error.message.toLowerCase();
        // Auth errors
        if (message.includes("401") || message.includes("unauthorized")) {
            return new Error("Authentication failed. Please re-authenticate in the GitHub Copilot credentials.");
        }
        if (message.includes("403") || message.includes("forbidden")) {
            return new Error("Access denied. Please verify your GitHub Copilot subscription is active.");
        }
        // Rate limits (let ChatOpenAI handle retries, but provide friendly message if exhausted)
        if (message.includes("429") || message.includes("rate limit")) {
            return new Error("Rate limit exceeded. Please try again in a few moments.");
        }
        // Server errors
        if (message.includes("500") ||
            message.includes("502") ||
            message.includes("503")) {
            return new Error("GitHub Copilot service is temporarily unavailable. Please try again later.");
        }
        // Pass through other errors with original message
        return error;
    }
}
exports.CopilotChatModel = CopilotChatModel;
