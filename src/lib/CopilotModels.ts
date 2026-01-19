/**
 * Copilot Model Discovery and Premium Detection
 *
 * This module provides functions to:
 * - Fetch available models from the Copilot API
 * - Identify premium models that consume additional quota
 * - Format model names with premium badges for display
 *
 * Premium models use a multiplier on the monthly quota. This module
 * identifies them so the n8n node can display appropriate indicators.
 *
 * @see https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-copilot-policies-as-an-individual-subscriber
 */

import { CopilotTokenManager } from "./CopilotTokenManager.js";

/**
 * Model object returned by the Copilot API /models endpoint.
 */
export interface CopilotModel {
  /** Model identifier (e.g., "gpt-4o", "claude-3.5-sonnet") */
  id: string;
  /** Object type, always "model" */
  object: "model";
  /** Organization that owns the model (e.g., "openai", "anthropic") */
  owned_by: string;
}

/**
 * Premium models that consume additional monthly quota.
 *
 * Based on GitHub Copilot documentation. These models show a multiplier
 * on usage (e.g., 2x, 5x the base cost per request).
 *
 * Note: Model IDs may vary - adjust based on actual API response patterns.
 */
const PREMIUM_MODELS = new Set([
  // OpenAI premium
  "gpt-4.5-preview",
  "o1",
  "o1-mini",
  "o3-mini",
  // Anthropic premium
  "claude-3.5-sonnet",
  "claude-3.7-sonnet",
  "claude-sonnet-4",
  // Google premium
  "gemini-2.0-flash-thinking-exp",
]);

/**
 * Non-premium models included in base quota.
 *
 * These models are available without additional quota consumption.
 */
const INCLUDED_MODELS = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
]);

/**
 * Fetch available models from the Copilot API.
 *
 * Calls the /models endpoint to get a list of all models available
 * to the authenticated user's subscription.
 *
 * @param tokenManager - Token manager for authentication
 * @returns Array of available Copilot models
 * @throws Error if the API request fails
 *
 * @example
 * ```typescript
 * const tokenManager = new CopilotTokenManager('gho_xxxx');
 * const models = await fetchCopilotModels(tokenManager);
 * console.log(models.map(m => m.id)); // ['gpt-4o', 'claude-3.5-sonnet', ...]
 * ```
 */
export async function fetchCopilotModels(
  tokenManager: CopilotTokenManager,
): Promise<CopilotModel[]> {
  const { token, endpoint } = await tokenManager.getValidToken();

  const response = await fetch(`${endpoint}/models`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Editor-Version": "vscode/1.96.0",
      "Editor-Plugin-Version": "copilot-chat/0.24.0",
      "Copilot-Integration-Id": "vscode-chat",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = (await response.json()) as { data: CopilotModel[] };
  return data.data;
}

/**
 * Check if a model is a premium model that consumes additional quota.
 *
 * @param modelId - The model identifier to check
 * @returns true if the model is premium, false otherwise
 *
 * @example
 * ```typescript
 * isPremiumModel('gpt-4o');          // false - included
 * isPremiumModel('claude-3.5-sonnet'); // true - premium
 * ```
 */
export function isPremiumModel(modelId: string): boolean {
  return PREMIUM_MODELS.has(modelId);
}

/**
 * Format a model name for display, appending a premium badge if applicable.
 *
 * @param model - The model object to format
 * @returns Display name with " [Premium]" suffix for premium models
 *
 * @example
 * ```typescript
 * formatModelName({ id: 'gpt-4o', ... });          // "gpt-4o"
 * formatModelName({ id: 'claude-3.5-sonnet', ... }); // "claude-3.5-sonnet [Premium]"
 * ```
 */
export function formatModelName(model: CopilotModel): string {
  const displayName = model.id;
  return isPremiumModel(model.id) ? `${displayName} [Premium]` : displayName;
}

/**
 * Get the default model from a list of available models.
 *
 * Selects the most capable non-premium model, preferring newer versions.
 * Falls back to gpt-4o if no preferred models are available.
 *
 * @param models - Array of available models
 * @returns The recommended default model ID
 *
 * @example
 * ```typescript
 * const models = await fetchCopilotModels(tokenManager);
 * const defaultModel = getDefaultModel(models);
 * console.log(defaultModel); // "gpt-4.1" or "gpt-4o"
 * ```
 */
export function getDefaultModel(models: CopilotModel[]): string {
  // Prefer capable included models, newest first
  const preferred = ["gpt-4.1", "gpt-4o", "gpt-4o-mini"];
  for (const id of preferred) {
    if (models.some((m) => m.id === id)) {
      return id;
    }
  }
  // Fallback to first non-premium model
  const nonPremium = models.find((m) => !isPremiumModel(m.id));
  return nonPremium?.id ?? models[0]?.id ?? "gpt-4o";
}
