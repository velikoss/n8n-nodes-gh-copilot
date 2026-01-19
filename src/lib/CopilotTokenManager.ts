/**
 * Copilot Token Exchange and Management
 *
 * This module handles exchanging GitHub OAuth tokens for short-lived Copilot API tokens
 * and manages token lifecycle with proactive refresh.
 *
 * The Copilot API token (JWT) expires in ~30 minutes, so we refresh proactively
 * with a 5-minute buffer to prevent request failures.
 *
 * IMPORTANT: The API endpoint is dynamically discovered from the token exchange response.
 * Never hardcode endpoints - different SKUs (Individual/Business/Enterprise) may use
 * different endpoints.
 *
 * @see https://deepwiki.com/dcai/github-copilot-proxy/2.1-oauth-token-setup
 */

/**
 * Response from the Copilot token exchange endpoint
 */
export interface CopilotTokenResponse {
	/** JWT token for Copilot API authentication */
	token: string;
	/** Unix timestamp in seconds when the token expires */
	expires_at: number;
	/** Dynamic endpoints that may vary by subscription SKU */
	endpoints?: {
		/** Copilot API endpoint (e.g., "https://api.githubcopilot.com") */
		api?: string;
	};
}

/**
 * Exchange a GitHub OAuth token for a Copilot API token.
 *
 * The OAuth token (long-lived, starts with gho_) is exchanged for a short-lived
 * JWT that can be used to authenticate with the Copilot API.
 *
 * @param oauthToken - GitHub OAuth token from device code flow (starts with gho_)
 * @returns CopilotTokenResponse containing the API token and expiration
 * @throws Error with descriptive message for authentication failures
 *
 * @example
 * ```typescript
 * const response = await getCopilotToken('gho_xxxxxxxxxxxxxxxxxxxx');
 * console.log(`API Token expires at: ${new Date(response.expires_at * 1000)}`);
 * ```
 */
export async function getCopilotToken(oauthToken: string): Promise<CopilotTokenResponse> {
	const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${oauthToken}`,
			Accept: 'application/json',
		},
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Invalid OAuth token. Please re-authenticate.');
		}
		if (response.status === 403) {
			throw new Error('No active Copilot subscription found.');
		}
		throw new Error(`Token exchange failed: ${response.status}`);
	}

	return response.json() as Promise<CopilotTokenResponse>;
}

/**
 * Manages Copilot API token lifecycle with proactive refresh.
 *
 * This class handles:
 * - Token exchange from OAuth token to Copilot API token
 * - Proactive token refresh before expiration (5-minute buffer)
 * - Dynamic endpoint discovery and storage
 *
 * @example
 * ```typescript
 * const manager = new CopilotTokenManager('gho_xxxxxxxxxxxxxxxxxxxx');
 * const { token, endpoint } = await manager.getValidToken();
 * // Use token for API requests to endpoint
 * ```
 */
export class CopilotTokenManager {
	private oauthToken: string;
	private apiToken: string | null = null;
	private expiresAt: number = 0;
	private apiEndpoint: string;

	/** Buffer time before expiry to trigger refresh (5 minutes in milliseconds) */
	private static readonly REFRESH_BUFFER_MS = 5 * 60 * 1000;

	/**
	 * Create a new token manager instance.
	 *
	 * @param oauthToken - GitHub OAuth token (starts with gho_)
	 * @param savedEndpoint - Previously discovered API endpoint (optional)
	 */
	constructor(oauthToken: string, savedEndpoint?: string) {
		this.oauthToken = oauthToken;
		this.apiEndpoint = savedEndpoint ?? '';
	}

	/**
	 * Get a valid Copilot API token, refreshing if necessary.
	 *
	 * Token is refreshed proactively when within 5 minutes of expiration
	 * to prevent request failures due to token expiry.
	 *
	 * @returns Object containing valid token and API endpoint
	 * @throws Error if token exchange fails
	 */
	async getValidToken(): Promise<{ token: string; endpoint: string }> {
		// Check if token exists and has more than 5 minutes remaining
		const needsRefresh =
			!this.apiToken || Date.now() >= this.expiresAt - CopilotTokenManager.REFRESH_BUFFER_MS;

		if (needsRefresh) {
			await this.refreshToken();
		}

		return {
			token: this.apiToken!,
			endpoint: this.apiEndpoint,
		};
	}

	/**
	 * Refresh the Copilot API token by exchanging the OAuth token.
	 *
	 * Updates internal state with new token, expiration, and endpoint.
	 */
	private async refreshToken(): Promise<void> {
		const response = await getCopilotToken(this.oauthToken);

		this.apiToken = response.token;
		// Convert expires_at from seconds to milliseconds
		this.expiresAt = response.expires_at * 1000;

		// Update endpoint if provided in response (important for SKU differences)
		if (response.endpoints?.api) {
			this.apiEndpoint = response.endpoints.api;
		}
	}

	/**
	 * Get the current API endpoint.
	 *
	 * Returns the endpoint discovered during token exchange.
	 * May be empty if no token exchange has occurred yet.
	 *
	 * @returns The Copilot API endpoint URL
	 */
	getEndpoint(): string {
		return this.apiEndpoint;
	}
}
