"use strict";
/**
 * GitHub Copilot API Credentials for n8n
 *
 * This credential type stores the OAuth token obtained from GitHub's device code flow
 * and an optional API endpoint that is discovered during token exchange.
 *
 * The credential test validates that the OAuth token can successfully exchange
 * for a Copilot API token, confirming both token validity and active subscription.
 *
 * @see https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCopilotApi = void 0;
/**
 * Credential type for GitHub Copilot API authentication.
 *
 * Users obtain an OAuth token via the device code flow (externally) and paste it here.
 * The API endpoint is auto-discovered during first use and stored for subsequent calls.
 */
class GitHubCopilotApi {
    constructor() {
        this.name = 'gitHubCopilotApi';
        this.displayName = 'GitHub Copilot API';
        this.documentationUrl = 'https://docs.github.com/en/copilot';
        this.properties = [
            {
                displayName: 'OAuth Token',
                name: 'oauthToken',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'GitHub OAuth token from device code flow (starts with gho_). Run the device code flow externally and paste the token here.',
            },
            {
                displayName: 'API Endpoint',
                name: 'apiEndpoint',
                type: 'string',
                default: '',
                required: false,
                description: 'Copilot API endpoint (discovered automatically during first use). Leave empty for auto-discovery.',
            },
        ];
        /**
         * Test that the OAuth token can successfully exchange for a Copilot token.
         *
         * A 200 response means:
         * - The OAuth token is valid
         * - The user has an active Copilot subscription
         *
         * Common error codes:
         * - 401: Invalid or expired OAuth token
         * - 403: No active Copilot subscription
         */
        this.test = {
            request: {
                baseURL: 'https://api.github.com',
                url: '/copilot_internal/v2/token',
                method: 'GET',
                headers: {
                    Authorization: '=Bearer {{$credentials.oauthToken}}',
                    Accept: 'application/json',
                },
            },
        };
    }
}
exports.GitHubCopilotApi = GitHubCopilotApi;
