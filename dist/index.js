"use strict";
/**
 * Package Entry Point for n8n-nodes-gh-copilot
 *
 * This file exports all public components of the package:
 * - Credential types for n8n registration
 * - Authentication utilities for token management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotChatModel = exports.CLIENT_ID = exports.pollForToken = exports.requestDeviceCode = exports.getCopilotToken = exports.CopilotTokenManager = exports.GitHubCopilotApi = void 0;
// Credential type for n8n
var GitHubCopilotApi_credentials_1 = require("./credentials/GitHubCopilotApi.credentials");
Object.defineProperty(exports, "GitHubCopilotApi", { enumerable: true, get: function () { return GitHubCopilotApi_credentials_1.GitHubCopilotApi; } });
// Token management
var CopilotTokenManager_1 = require("./lib/CopilotTokenManager");
Object.defineProperty(exports, "CopilotTokenManager", { enumerable: true, get: function () { return CopilotTokenManager_1.CopilotTokenManager; } });
Object.defineProperty(exports, "getCopilotToken", { enumerable: true, get: function () { return CopilotTokenManager_1.getCopilotToken; } });
// Device code flow utilities
var CopilotAuth_1 = require("./lib/CopilotAuth");
Object.defineProperty(exports, "requestDeviceCode", { enumerable: true, get: function () { return CopilotAuth_1.requestDeviceCode; } });
Object.defineProperty(exports, "pollForToken", { enumerable: true, get: function () { return CopilotAuth_1.pollForToken; } });
Object.defineProperty(exports, "CLIENT_ID", { enumerable: true, get: function () { return CopilotAuth_1.CLIENT_ID; } });
// LangChain chat model
var CopilotChatModel_1 = require("./lib/CopilotChatModel");
Object.defineProperty(exports, "CopilotChatModel", { enumerable: true, get: function () { return CopilotChatModel_1.CopilotChatModel; } });
