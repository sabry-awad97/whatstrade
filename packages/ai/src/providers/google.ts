/**
 * Google AI Provider
 * Configures and exports Google Generative AI client
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@workspace/env/server";
import type { LanguageModel } from "ai";

/**
 * Google AI client instance
 * Configured with API key from environment
 */
export const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * Get the configured Google AI model
 * Uses model from environment (required via env validation)
 */
export function getGoogleModel(): LanguageModel {
  return google(env.GOOGLE_GENERATIVE_AI_MODEL);
}
