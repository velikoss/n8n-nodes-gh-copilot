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
  owned_by?: string;
  /** Human-readable name (e.g., "GPT-4o", "Claude Opus 4.5") */
  name?: string;
  /** Model vendor (e.g., "OpenAI", "Anthropic", "Azure OpenAI") */
  vendor?: string;
  /** Category for model picker: "powerful", "versatile", "lightweight" */
  model_picker_category?: "powerful" | "versatile" | "lightweight";
  /** Whether model appears in picker UI */
  model_picker_enabled?: boolean;
  /** Whether model is in preview */
  preview?: boolean;
}

/**
 * Known model multipliers from GitHub Copilot premium request system.
 * 0 = included (no badge), other values show as [Nx] badge.
 * @see https://docs.github.com/en/copilot/concepts/billing/copilot-requests
 */
const MODEL_MULTIPLIERS: Record<string, number> = {
  // Included models (0x) - no multiplier badge
  "gpt-4.1": 0,
  "gpt-4.1-mini": 0,
  "gpt-4o": 0,
  "gpt-4o-mini": 0,
  "gpt-4": 0,
  "gpt-3.5-turbo": 0,

  // Discounted models
  "claude-3.5-haiku": 0.33,
  "gemini-2.0-flash-exp": 0.33,

  // Standard premium (1x)
  "claude-sonnet-4": 1,
  "claude-3.5-sonnet": 1,
  "gemini-2.0-flash-thinking-exp": 1,

  // Premium models (>1x)
  "claude-opus-4.5": 3,
  o1: 1,
  "o1-mini": 0.33,
  "o3-mini": 1,
};

/**
 * Premium model patterns that consume additional monthly quota.
 *
 * Uses pattern matching to catch current and future premium models.
 * Premium models show a multiplier on usage (e.g., 2x, 5x the base cost).
 */
const PREMIUM_PATTERNS: RegExp[] = [
  // OpenAI reasoning models (o1, o3, etc.)
  /^o\d/,
  // GPT-5 family (premium tier)
  /^gpt-5/,
  // GPT-4.5 preview
  /^gpt-4\.5/,
  // Anthropic Opus tier (always premium)
  /^claude-opus/,
  // Anthropic Sonnet (premium versions)
  /^claude-sonnet-4/,
  /^claude-3\.[57]-sonnet/,
  // Google thinking/reasoning models
  /thinking/i,
];

/**
 * Explicitly included models (never premium regardless of patterns).
 *
 * These models are confirmed included in base quota.
 */
const INCLUDED_MODELS = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4",
  "gpt-3.5-turbo",
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
 * Uses API metadata when available (model_picker_category: "powerful"),
 * falls back to pattern matching for model IDs.
 *
 * @param model - The model object or ID to check
 * @returns true if the model is premium, false otherwise
 *
 * @example
 * ```typescript
 * isPremiumModel({ id: 'gpt-4o', model_picker_category: 'versatile' }); // false
 * isPremiumModel({ id: 'claude-opus-4.5', model_picker_category: 'powerful' }); // true
 * isPremiumModel('gpt-5'); // true (pattern match)
 * ```
 */
export function isPremiumModel(model: CopilotModel | string): boolean {
  const modelId = typeof model === "string" ? model : model.id;

  // Explicitly included models are never premium
  if (INCLUDED_MODELS.has(modelId)) {
    return false;
  }

  // Check API metadata first - "powerful" category is always premium
  if (typeof model === "object" && model.model_picker_category === "powerful") {
    return true;
  }

  // Also check pattern matching for known premium families
  // (some premium models like GPT-5 are marked "versatile" not "powerful")
  return PREMIUM_PATTERNS.some((pattern) => pattern.test(modelId));
}

/**
 * Get the multiplier badge string for a model.
 * Returns empty string for included models (0x).
 * Internal helper - not exported.
 */
function getMultiplierBadge(modelId: string): string {
  const multiplier = MODEL_MULTIPLIERS[modelId];
  if (multiplier === undefined) {
    // Unknown model - use isPremiumModel to determine badge
    return isPremiumModel(modelId) ? " [Premium]" : "";
  }
  if (multiplier === 0) return "";
  return ` [${multiplier}x]`;
}

/**
 * Format a model name for display, appending a multiplier badge if applicable.
 *
 * @param model - The model object to format
 * @returns Display name with multiplier suffix (e.g., " [3x]") for premium models
 *
 * @example
 * ```typescript
 * formatModelName({ id: 'gpt-4o', ... });          // "gpt-4o"
 * formatModelName({ id: 'claude-opus-4.5', ... }); // "claude-opus-4.5 [3x]"
 * formatModelName({ id: 'claude-sonnet-4', ... }); // "claude-sonnet-4 [1x]"
 * ```
 */
export function formatModelName(model: CopilotModel): string {
  return `${model.id}${getMultiplierBadge(model.id)}`;
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
  const nonPremium = models.find((m) => !isPremiumModel(m));
  return nonPremium?.id ?? models[0]?.id ?? "gpt-4o";
}
