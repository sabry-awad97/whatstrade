/**
 * @workspace/ai
 *
 * Centralized AI functionality for the WhatsTrade application
 * Supports multiple AI providers and models
 *
 * @version 0.1.0
 */

// Providers
export { google, getGoogleModel } from "./providers/google";

// Services
export {
  extractPharmaceuticalMessage,
  extractStructuredData,
  PharmaceuticalExtractionSchema,
} from "./services/extraction";
export type { PharmaceuticalExtraction } from "./services/extraction";

// Re-export AI SDK types for convenience
export { generateText, streamText, Output } from "ai";
export type { LanguageModel } from "ai";
