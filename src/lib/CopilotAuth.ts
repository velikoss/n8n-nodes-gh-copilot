/**
 * GitHub OAuth Device Code Flow Implementation (RFC 8628)
 *
 * This module implements the OAuth 2.0 Device Authorization Grant flow
 * for authenticating with GitHub and obtaining tokens for Copilot API access.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8628
 * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
 */

/**
 * VSCode Copilot OAuth client ID
 * This is the well-known client ID used by VSCode for Copilot authentication.
 */
export const CLIENT_ID = 'Iv1.b507a08c87ecfe98';

/**
 * Response from GitHub's device code endpoint
 */
export interface DeviceCodeResponse {
	/** The device verification code (40-char) */
	device_code: string;
	/** The user verification code to display (8-char, format: XXXX-XXXX) */
	user_code: string;
	/** The verification URL where user enters the code */
	verification_uri: string;
	/** Seconds until the device code expires (default: 900) */
	expires_in: number;
	/** Minimum seconds between polling attempts (default: 5) */
	interval: number;
}

/**
 * Successful token response from GitHub's OAuth token endpoint
 */
export interface TokenResponse {
	/** The OAuth access token (starts with gho_) */
	access_token: string;
	/** Token type (always "bearer") */
	token_type: string;
	/** Granted scopes */
	scope: string;
}

/**
 * Error response from GitHub's OAuth token endpoint during polling
 */
interface TokenErrorResponse {
	error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | string;
	error_description?: string;
}

/**
 * Helper function to sleep for a specified duration
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Request a device code from GitHub to begin the device authorization flow.
 *
 * The returned device_code is used for polling, while user_code and verification_uri
 * should be displayed to the user so they can authorize in their browser.
 *
 * @returns DeviceCodeResponse containing codes and timing information
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await requestDeviceCode();
 * console.log(`Go to ${response.verification_uri} and enter code: ${response.user_code}`);
 * ```
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
	const response = await fetch('https://github.com/login/device/code', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			client_id: CLIENT_ID,
			scope: 'read:user',
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Device code request failed (${response.status}): ${text}`);
	}

	return response.json() as Promise<DeviceCodeResponse>;
}

/**
 * Poll GitHub's token endpoint until the user authorizes or an error occurs.
 *
 * This function implements RFC 8628 compliant polling with proper error handling:
 * - authorization_pending: Continue polling (user hasn't authorized yet)
 * - slow_down: Increase interval by 5 seconds and continue
 * - expired_token: Stop polling, device code has expired
 * - access_denied: Stop polling, user denied authorization
 *
 * @param deviceCode - The device_code from requestDeviceCode()
 * @param interval - Initial polling interval in seconds (from DeviceCodeResponse)
 * @param expiresAt - Unix timestamp (ms) when the device code expires
 * @returns The OAuth access token on successful authorization
 * @throws Error if authorization fails, is denied, or times out
 *
 * @example
 * ```typescript
 * const expiresAt = Date.now() + (response.expires_in * 1000);
 * const token = await pollForToken(response.device_code, response.interval, expiresAt);
 * console.log(`Got token: ${token}`);
 * ```
 */
export async function pollForToken(
	deviceCode: string,
	interval: number,
	expiresAt: number,
): Promise<string> {
	let pollInterval = interval;

	while (Date.now() < expiresAt) {
		// Wait before polling (as per RFC 8628, poll after interval)
		await sleep(pollInterval * 1000);

		const response = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				device_code: deviceCode,
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			}),
		});

		const data = (await response.json()) as TokenResponse | TokenErrorResponse;

		// Check for successful token response
		if ('access_token' in data && data.access_token) {
			return data.access_token;
		}

		// Handle error responses per RFC 8628 Section 3.5
		if ('error' in data) {
			switch (data.error) {
				case 'authorization_pending':
					// User hasn't authorized yet, keep polling
					continue;

				case 'slow_down':
					// Polling too fast, add 5 seconds to interval per RFC 8628
					pollInterval += 5;
					continue;

				case 'expired_token':
					throw new Error('Device code expired. Please restart authorization.');

				case 'access_denied':
					throw new Error('User denied authorization.');

				default:
					throw new Error(
						`Authorization failed: ${data.error}${data.error_description ? ` - ${data.error_description}` : ''}`,
					);
			}
		}
	}

	throw new Error('Authorization timed out. Device code expired.');
}
