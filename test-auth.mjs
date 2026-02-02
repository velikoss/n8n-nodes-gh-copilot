// Copied from https://github.com/ssccio/n8n-nodes-gh-copilot/blob/b0ced8164301bd0eed56a41e9a7338bcdca820a0/.planning/phases/01-authentication/01-03-PLAN.md?plain=1#L98
import { requestDeviceCode, pollForToken } from './dist/lib/CopilotAuth.js';

async function main() {
  console.log('Requesting device code...');
  const deviceCode = await requestDeviceCode();

  console.log('\n=== AUTHORIZATION REQUIRED ===');
  console.log(`1. Go to: ${deviceCode.verification_uri}`);
  console.log(`2. Enter code: ${deviceCode.user_code}`);
  console.log('3. Authorize the application');
  console.log('==============================\n');

  console.log('Waiting for authorization...');
  const expiresAt = Date.now() + (deviceCode.expires_in * 1000);
  const token = await pollForToken(deviceCode.device_code, deviceCode.interval, expiresAt);

  console.log('\n=== SUCCESS ===');
  console.log(`OAuth Token: ${token}`);
  console.log('===============\n');
  console.log('Copy this token to use in n8n credentials.');
}

main().catch(console.error);
