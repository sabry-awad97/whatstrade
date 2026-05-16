/**
 * AI Extraction Service
 * Handles structured data extraction from text using AI models
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGoogleModel } from "../providers/google";

/**
 * Pharmaceutical message extraction schema
 */
export const PharmaceuticalExtractionSchema = z.object({
  messageType: z
    .enum(["offer", "request"])
    .describe(
      "Whether this is an offer (someone selling/providing) or request (someone buying/needing)",
    ),
  medicationName: z
    .string()
    .describe("The name of the medication or drug mentioned"),
  dosage: z
    .string()
    .nullable()
    .describe(
      "The dosage amount (e.g., '10mg', '500mg', '2.5mg'). Null if not mentioned.",
    ),
  quantity: z
    .number()
    .int()
    .positive()
    .describe("The quantity or number of units/boxes mentioned"),
  price: z
    .number()
    .nullable()
    .describe("The price in Egyptian Pounds (EGP). Null if not mentioned."),
  confidence: z
    .object({
      medicationName: z.number().min(0).max(1),
      dosage: z.number().min(0).max(1),
      quantity: z.number().min(0).max(1),
      price: z.number().min(0).max(1),
    })
    .describe("Confidence scores for each extracted field (0-1)"),
  reasoning: z
    .string()
    .describe("Brief explanation of how the message was interpreted"),
});

export type PharmaceuticalExtraction = z.infer<
  typeof PharmaceuticalExtractionSchema
>;

/**
 * Extract pharmaceutical information from Arabic WhatsApp message
 *
 * @param rawText - The raw message text to parse
 * @returns Structured pharmaceutical data with confidence scores
 *
 * @example
 * ```ts
 * const result = await extractPharmaceuticalMessage("عندي باندول 500mg كمية 10");
 * console.log(result.medicationName); // "باندول"
 * console.log(result.dosage); // "500mg"
 * console.log(result.quantity); // 10
 * ```
 */
/**
 * Sanitize and validate user input text
 */
function sanitizeUserInput(text: string, maxLength = 1000): string {
  // Trim whitespace
  let sanitized = text.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize newlines to prevent homograph attacks
  sanitized = sanitized.replace(/[\r\n\u2028\u2029]/g, "\n");

  return sanitized;
}

export async function extractPharmaceuticalMessage(
  rawText: string,
): Promise<PharmaceuticalExtraction> {
  // Sanitize and validate user input
  const sanitizedText = sanitizeUserInput(rawText, 1000);

  if (!sanitizedText) {
    throw new Error("Input text is empty after sanitization");
  }

  const systemPrompt = `You are an expert at parsing Arabic pharmaceutical WhatsApp messages from Egyptian pharmacies.

Analyze the provided message and extract structured information.

Context:
- Messages are typically in Arabic or mixed Arabic/English
- Common medications: Panadol, Augmentin, Brufen, Voltaren, etc.
- Dosages are usually in mg (milligrams)
- Quantities refer to boxes or units
- Prices are in Egyptian Pounds (EGP)
- "عندي" or "متوفر" indicates an OFFER (someone has medication to sell)
- "محتاج" or "عايز" indicates a REQUEST (someone needs to buy)

Extract all available information with confidence scores.`;

  return extractStructuredData(
    sanitizedText,
    PharmaceuticalExtractionSchema,
    systemPrompt,
  );
}

/**
 * Generic structured extraction from text
 *
 * @param text - The text to extract from
 * @param schema - Zod schema defining the structure to extract
 * @param systemPrompt - System prompt to guide extraction
 * @returns Extracted structured data
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const result = await extractStructuredData(
 *   "John is 25 years old",
 *   schema,
 *   "Extract person information"
 * );
 * ```
 */
export async function extractStructuredData<T extends z.ZodType>(
  text: string,
  schema: T,
  systemPrompt: string,
): Promise<z.infer<T>> {
  // Sanitize inputs by escaping delimiter markers to prevent prompt injection
  const DELIMITER = "<<<END_SECTION>>>";
  const sanitizedSystemPrompt = systemPrompt.replace(
    new RegExp(DELIMITER, "g"),
    "",
  );
  const sanitizedText = text.replace(new RegExp(DELIMITER, "g"), "");

  const result = await generateText({
    model: getGoogleModel(),
    output: Output.object({
      schema,
    }),
    prompt: `${sanitizedSystemPrompt}
${DELIMITER}

Text to analyze:
${sanitizedText}
${DELIMITER}`,
  });

  // Validate output with Zod schema instead of unsafe type assertion
  const parsed = schema.safeParse(result.output);
  if (!parsed.success) {
    throw new Error(`AI output validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
