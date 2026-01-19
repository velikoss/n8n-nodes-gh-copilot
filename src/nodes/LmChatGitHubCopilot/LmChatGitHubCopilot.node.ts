/**
 * GitHub Copilot Chat Model Sub-Node for n8n
 *
 * This node provides a LangChain-compatible chat model that uses
 * GitHub Copilot's API. It can be connected to AI Agent, Basic LLM Chain,
 * and other AI nodes in n8n.
 *
 * Features:
 * - Dynamic model selection from Copilot API
 * - Premium model indicators
 * - Temperature control
 * - Automatic token management
 */

import {
  NodeConnectionTypes,
  type INodeType,
  type INodeTypeDescription,
  type ISupplyDataFunctions,
  type SupplyData,
} from "n8n-workflow";

import { CopilotChatModel, CopilotTokenManager } from "../../lib";
import { searchModels } from "./methods/listSearch";

export class LmChatGitHubCopilot implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot Chat Model",
    name: "lmChatGitHubCopilot",
    icon: "file:copilot.png",
    group: ["transform"],
    version: 1,
    description: "Use GitHub Copilot models in AI workflows",
    defaults: { name: "GitHub Copilot" },
    codex: {
      categories: ["AI"],
      subcategories: {
        AI: ["Language Models", "Root Nodes"],
        "Language Models": ["Chat Models (Recommended)"],
      },
      alias: ["copilot", "github", "github ai", "github copilot"],
    },
    // Sub-node: no inputs, outputs ai_languageModel
    inputs: [],
    outputs: [NodeConnectionTypes.AiLanguageModel],
    outputNames: ["Model"],
    usableAsTool: true,
    credentials: [
      {
        name: "gitHubCopilotApi",
        required: true,
      },
    ],
    properties: [
      // Model selector using resourceLocator
      {
        displayName: "Model",
        name: "model",
        type: "resourceLocator",
        default: { mode: "list", value: "gpt-4o" },
        required: true,
        modes: [
          {
            displayName: "From List",
            name: "list",
            type: "list",
            typeOptions: {
              searchListMethod: "searchModels",
              searchable: true,
            },
          },
          {
            displayName: "ID",
            name: "id",
            type: "string",
            placeholder: "e.g., claude-sonnet-4",
          },
        ],
        description:
          "Model for chat completions. Multiplier shows premium request cost (e.g., [3x] = 3 premium requests).",
      },
      // Temperature slider
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        default: 0.7,
        typeOptions: {
          minValue: 0,
          maxValue: 2,
          numberStepSize: 0.1,
        },
        description:
          "Controls randomness. Lower = deterministic, higher = creative. Default: 0.7",
      },
    ],
  };

  // Expose searchModels for n8n to call
  methods = {
    listSearch: {
      searchModels,
    },
  };

  /**
   * Supply the LangChain chat model to connected AI nodes.
   *
   * Creates a CopilotChatModel instance configured with:
   * - Token manager for automatic token refresh
   * - User-selected model
   * - User-configured temperature
   */
  async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
    const credentials = await this.getCredentials("gitHubCopilotApi");

    // Get node parameters
    const modelValue = this.getNodeParameter("model", 0) as
      | { value: string }
      | string;
    const temperature = this.getNodeParameter("temperature", 0) as number;

    // Handle both resourceLocator object and direct string value
    const modelName =
      typeof modelValue === "string" ? modelValue : modelValue.value;

    // Create token manager with stored endpoint (if available)
    const tokenManager = new CopilotTokenManager(
      credentials.oauthToken as string,
      credentials.apiEndpoint as string | undefined,
    );

    // Create and return the chat model
    const model = new CopilotChatModel({
      tokenManager,
      temperature,
      modelName,
    });

    return { response: model };
  }
}
