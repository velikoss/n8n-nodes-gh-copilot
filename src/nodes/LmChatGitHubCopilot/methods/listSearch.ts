/**
 * Search methods for n8n resourceLocator dropdown
 */

import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { CopilotTokenManager, fetchCopilotModels, formatModelName } from '../../../lib';

/**
 * Fetch and format models for the resourceLocator dropdown.
 * Called by n8n when user opens the model selector.
 *
 * @param filter - Optional search filter from user typing
 * @returns Formatted model list for dropdown
 */
export async function searchModels(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = await this.getCredentials('gitHubCopilotApi');

  const tokenManager = new CopilotTokenManager(
    credentials.oauthToken as string,
    credentials.apiEndpoint as string | undefined,
  );

  const models = await fetchCopilotModels(tokenManager);

  // Filter models if search term provided
  const filtered = filter
    ? models.filter((m) =>
        m.id.toLowerCase().includes(filter.toLowerCase())
      )
    : models;

  // Format for n8n dropdown
  const results = filtered.map((model) => ({
    name: formatModelName(model),  // e.g., "gpt-4o" or "claude-sonnet-4 [Premium]"
    value: model.id,
  }));

  return { results };
}
