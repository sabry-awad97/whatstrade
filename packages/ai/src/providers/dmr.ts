/**
 * Docker Model Runner (DMR) Provider
 * Configures and exports OpenAI-compatible client for local AI models
 * Requires: Docker Compose v2.38+ with Docker Model Runner enabled
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * DMR configuration from environment variables
 * These are automatically injected by Docker Compose when using the models: syntax
 */
interface DMRConfig {
  /** Model endpoint URL (e.g., LLM_URL from docker-compose) */
  baseUrl: string;
  /** Model identifier (e.g., LLM_MODEL from docker-compose) */
  model: string;
  /** Optional API key (usually not needed for local models) */
  apiKey?: string;
}

/**
 * Get DMR configuration from environment
 * Supports both short syntax (LLM_URL, LLM_MODEL) and custom variable names
 */
function getDMRConfig(): DMRConfig {
  const baseUrl = process.env.LLM_URL || process.env.AI_MODEL_URL;
  const model = process.env.LLM_MODEL || process.env.AI_MODEL_NAME;
  const apiKey = process.env.AI_API_KEY || "not-needed";

  if (!baseUrl) {
    throw new Error(
      "DMR base URL not found. Ensure Docker Model Runner is enabled and service has models binding.",
    );
  }

  if (!model) {
    throw new Error(
      "DMR model identifier not found. Ensure Docker Model Runner is enabled and service has models binding.",
    );
  }

  return { baseUrl, model, apiKey };
}

/**
 * Create DMR client with custom configuration
 * Useful for testing or when using non-standard environment variables
 */
export function createDMRClient(config: DMRConfig) {
  return createOpenAICompatible({
    name: "docker-model-runner",
    apiKey: config.apiKey || "not-needed",
    baseURL: config.baseUrl,
  });
}

/**
 * Default DMR client instance
 * Configured automatically from environment variables
 */
let dmrClient: ReturnType<typeof createOpenAICompatible> | null = null;

export function getDMRClient() {
  if (!dmrClient) {
    const config = getDMRConfig();
    dmrClient = createDMRClient(config);
  }
  return dmrClient;
}

/**
 * Get the configured DMR model
 * Uses model identifier from environment
 */
export function getDMRModel(): LanguageModel {
  const config = getDMRConfig();
  const client = getDMRClient();
  return client(config.model);
}

/**
 * Check if DMR is available
 * Returns true if environment variables are set
 */
export function isDMRAvailable(): boolean {
  return !!(process.env.LLM_URL || process.env.AI_MODEL_URL);
}
