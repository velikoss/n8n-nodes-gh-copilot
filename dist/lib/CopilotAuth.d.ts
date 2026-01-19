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
export declare const CLIENT_ID = "Iv1.b507a08c87ecfe98";
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
export declare function requestDeviceCode(): Promise<DeviceCodeResponse>;
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
export declare function pollForToken(deviceCode: string, interval: number, expiresAt: number): Promise<string>;
