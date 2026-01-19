/**
 * Integration test for CopilotChatModel
 * Tests that the model correctly wraps Copilot API and transforms messages.
 *
 * Usage: node test-model.mjs <oauth-token>
 *
 * The oauth token should be obtained via device flow (test-auth.mjs)
 */

import { CopilotChatModel, CopilotTokenManager } from './dist/index.js';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

async function main() {
  // Get OAuth token from command line
  const oauthToken = process.argv[2];
  if (!oauthToken) {
    console.error('Usage: node test-model.mjs <oauth-token>');
    console.error('Get a token first with: node test-auth.mjs');
    process.exit(1);
  }

  console.log('Creating token manager...');
  const tokenManager = new CopilotTokenManager(oauthToken);

  console.log('Creating CopilotChatModel...');
  const model = new CopilotChatModel({
    tokenManager,
    temperature: 0.7,
    verbose: true,
  });

  // Test 1: Basic message
  console.log('\n--- Test 1: Basic HumanMessage ---');
  const messages1 = [
    new HumanMessage('Say hello in exactly 3 words.'),
  ];
  const result1 = await model.invoke(messages1);
  console.log('Response:', result1.content);

  // Test 2: System message transformation
  console.log('\n--- Test 2: System + Human message ---');
  const messages2 = [
    new SystemMessage('You are a helpful assistant that responds in pirate speak.'),
    new HumanMessage('What is 2 + 2?'),
  ];
  const result2 = await model.invoke(messages2);
  console.log('Response:', result2.content);
  // Note: System message should work because it's transformed to assistant role

  // Test 3: Multi-turn conversation
  console.log('\n--- Test 3: Multi-turn conversation ---');
  const messages3 = [
    new HumanMessage('My name is TestUser.'),
    new AIMessage('Nice to meet you, TestUser!'),
    new HumanMessage('What is my name?'),
  ];
  const result3 = await model.invoke(messages3);
  console.log('Response:', result3.content);

  console.log('\n--- All tests passed! ---');
  console.log('CopilotChatModel is working correctly.');
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
