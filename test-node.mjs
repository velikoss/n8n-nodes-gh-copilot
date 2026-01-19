/**
 * Integration test for GitHub Copilot n8n node components
 *
 * Tests:
 * 1. Model fetching from Copilot API
 * 2. Premium model detection and formatting
 * 3. Chat completion with selected model
 *
 * Usage: node test-node.mjs <oauth-token>
 *
 * The oauth token should be obtained via device flow (test-auth.mjs)
 */

import { HumanMessage } from "@langchain/core/messages";

// Import from compiled output
const {
  CopilotTokenManager,
  CopilotChatModel,
  fetchCopilotModels,
  formatModelName,
  isPremiumModel,
  getDefaultModel,
} = await import("./dist/index.js");

const oauthToken = process.argv[2];
if (!oauthToken) {
  console.error("Usage: node test-node.mjs <oauth-token>");
  console.error("Get a token first with: node test-auth.mjs");
  process.exit(1);
}

const tokenManager = new CopilotTokenManager(oauthToken);

console.log("=== Test 1: Fetch Models from Copilot API ===\n");

try {
  const models = await fetchCopilotModels(tokenManager);
  console.log(`Found ${models.length} models:\n`);

  // Display models with premium status
  for (const model of models) {
    const formatted = formatModelName(model);
    console.log(`  - ${formatted}`);
  }

  console.log("\n--- Test 1 PASSED ---\n");

  // Test 2: Premium detection
  console.log("=== Test 2: Premium Detection ===\n");

  const premiumCount = models.filter((m) => isPremiumModel(m.id)).length;
  const includedCount = models.length - premiumCount;
  console.log(`Premium models: ${premiumCount}`);
  console.log(`Included models: ${includedCount}`);

  // Get default model
  const defaultModel = getDefaultModel(models);
  console.log(`Default model: ${defaultModel}`);

  console.log("\n--- Test 2 PASSED ---\n");

  // Test 3: Chat completion with non-default model
  console.log("=== Test 3: Chat with Selected Model ===\n");

  // Pick a specific model (prefer gpt-4o if available)
  const selectedModel =
    models.find((m) => m.id === "gpt-4o")?.id ?? defaultModel;
  console.log(`Using model: ${selectedModel}`);

  const chatModel = new CopilotChatModel({
    tokenManager,
    modelName: selectedModel,
    temperature: 0.3, // Lower temperature for deterministic test
  });

  const response = await chatModel.invoke([
    new HumanMessage("What is 15 + 27? Answer with just the number."),
  ]);

  console.log(`Response: ${response.content}`);

  // Verify response contains "42"
  if (response.content.toString().includes("42")) {
    console.log("\n--- Test 3 PASSED ---\n");
  } else {
    console.log("\n--- Test 3 UNEXPECTED (expected 42) ---\n");
  }

  console.log("=== All Tests Complete ===");
} catch (error) {
  console.error("Test failed:", error.message);
  process.exit(1);
}
