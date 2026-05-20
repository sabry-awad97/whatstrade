/**
 * Message Simulation Router
 * Migrated from Express to oRPC
 *
 * ⚠️ SPECIAL ATTENTION REQUIRED:
 * - This router uses @workspace/ai for AI-powered extraction
 * - Complex business logic with AI parsing, scoring algorithms, and database insertions
 * - Requires GOOGLE_GENERATIVE_AI_API_KEY environment variable
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
import {
  SimulateMessageBody,
  MessageType,
  MATCH_SCORE_THRESHOLD,
} from "@workspace/schemas";
import { extractPharmaceuticalMessage } from "@workspace/ai";
import {
  calculateMedicationSimilarity,
  calculateDosageSimilarity,
  calculateQuantityScore,
  calculatePriceScore,
  calculateRecencyScore,
  calculateConfidenceBand,
  type ScoreBreakdown,
} from "../utils/scoring";

export interface ParsedField {
  field: string;
  value: string;
  confidence: number;
}

export interface SimulateCandidate {
  id: string;
  medicationName: string;
  dosage: string | null;
  quantity: number;
  price: string | null;
  groupName: string;
  senderPhone: string;
  score: number;
  confidenceBand: string;
  scoreBreakdown: ScoreBreakdown;
}

export interface PipelineStep {
  step: string;
  status: string;
  detail: string;
  durationMs: number;
}

// Utility function to mask phone numbers (show only last 4 digits)
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}

export const simulateRouter = o.router({
  simulate: o.input(SimulateMessageBody).handler(async ({ input }) => {
    const {
      rawText,
      messageType = "auto",
      groupName = "Simulation",
      senderPhone = "+20000000000",
      insertIntoSystem = false,
    } = input;

    const pipelineSteps: PipelineStep[] = [];
    const t0 = Date.now();

    // Step 0: Input validation and sanitization
    const validationStart = Date.now();
    const MAX_TEXT_LENGTH = 1000;

    // Validate text length
    if (!rawText || rawText.trim().length === 0) {
      pipelineSteps.push({
        step: "Input Validation",
        status: "error",
        detail: "Empty input text",
        durationMs: Date.now() - validationStart,
      });

      return {
        parsedType: MessageType.OFFER,
        parsedFields: [],
        candidates: [],
        pipelineSteps,
        insertedId: null,
        aiReasoning: "Input validation failed: empty text",
      };
    }

    if (rawText.length > MAX_TEXT_LENGTH) {
      pipelineSteps.push({
        step: "Input Validation",
        status: "error",
        detail: `Input too long (${rawText.length} chars, max ${MAX_TEXT_LENGTH})`,
        durationMs: Date.now() - validationStart,
      });

      return {
        parsedType: MessageType.OFFER,
        parsedFields: [],
        candidates: [],
        pipelineSteps,
        insertedId: null,
        aiReasoning: `Input validation failed: text exceeds ${MAX_TEXT_LENGTH} characters`,
      };
    }

    // Sanitize: remove control characters except newlines and tabs
    const sanitizedText = rawText.replace(
      /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g,
      "",
    );

    pipelineSteps.push({
      step: "Input Validation",
      status: "success",
      detail: `Validated ${sanitizedText.length} characters`,
      durationMs: Date.now() - validationStart,
    });

    // Step 1: AI Parse using @workspace/ai
    const parseStart = Date.now();
    let parsedType =
      messageType === MessageType.AUTO ? MessageType.OFFER : messageType;
    let parsedFields: ParsedField[] = [];
    let aiReasoning = "AI parsing not yet configured — using fallback.";

    try {
      // Use centralized AI extraction service with sanitized text
      const extracted = await extractPharmaceuticalMessage(sanitizedText);

      parsedFields = [
        {
          field: "medicationName",
          value: extracted.medicationName,
          confidence: extracted.confidence.medicationName,
        },
      ];

      if (extracted.dosage) {
        parsedFields.push({
          field: "dosage",
          value: extracted.dosage,
          confidence: extracted.confidence.dosage,
        });
      }

      parsedFields.push({
        field: "quantity",
        value: extracted.quantity.toString(),
        confidence: extracted.confidence.quantity,
      });

      if (extracted.price !== null) {
        parsedFields.push({
          field: "price",
          value: extracted.price.toString(),
          confidence: extracted.confidence.price,
        });
      }

      aiReasoning = extracted.reasoning;

      // Override messageType if AUTO detection was requested
      if (messageType === MessageType.AUTO) {
        parsedType = extracted.messageType;
      }

      pipelineSteps.push({
        step: "AI Parsing",
        status: "success",
        detail: `AI extracted ${parsedFields.length} fields`,
        durationMs: Date.now() - parseStart,
      });
    } catch (error) {
      // Log sanitized error message only (no sensitive data)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("AI parsing failed, falling back to regex:", errorMessage);

      // Fallback: Basic regex extraction if AI fails
      if (!parsedFields.length) {
        // Extract medication name (look for common patterns)
        const medMatch = sanitizedText.match(
          /(?:medication|med|drug|medicine)[\s:]+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
        );
        if (medMatch?.[1]) {
          parsedFields.push({
            field: "medicationName",
            value: medMatch[1].trim(),
            confidence: 0.6,
          });
        } else {
          // Try to find capitalized words that might be medication names
          const words = sanitizedText.split(/\s+/);
          const capitalizedWord = words.find(
            (w) => w.length > 3 && /^[A-Z][a-z]+/.test(w),
          );
          if (capitalizedWord) {
            parsedFields.push({
              field: "medicationName",
              value: capitalizedWord,
              confidence: 0.4,
            });
          }
        }
        // Extract dosage (e.g., "10mg", "500 mg", "2.5mg")
        const dosageMatch = rawText.match(/(\d+(?:\.\d+)?\s*mg)/i);
        if (dosageMatch?.[1]) {
          parsedFields.push({
            field: "dosage",
            value: dosageMatch[1].toLowerCase().replace(/\s+/g, ""),
            confidence: 0.8,
          });
        }

        // Extract quantity (look for numbers with quantity keywords)
        const qtyMatch = rawText.match(
          /(?:quantity|qty|amount|count|boxes?|units?)[\s:]+(\d+)/i,
        );
        if (qtyMatch?.[1]) {
          parsedFields.push({
            field: "quantity",
            value: qtyMatch[1],
            confidence: 0.7,
          });
        } else {
          // Look for standalone numbers that might be quantities
          const numMatch = rawText.match(/\b(\d{1,4})\b/);
          if (
            numMatch?.[1] &&
            parseInt(numMatch[1]) > 0 &&
            parseInt(numMatch[1]) <= 10000
          ) {
            parsedFields.push({
              field: "quantity",
              value: numMatch[1],
              confidence: 0.5,
            });
          }
        }

        // Extract price (e.g., "$50", "50 EGP", "price: 100")
        const priceMatch = rawText.match(
          /(?:price|cost|egp|\$)[\s:]*(\d+(?:\.\d{1,2})?)/i,
        );
        if (priceMatch?.[1]) {
          parsedFields.push({
            field: "price",
            value: priceMatch[1],
            confidence: 0.7,
          });
        }

        aiReasoning = `Fallback regex extraction: found ${parsedFields.length} fields (AI parsing failed)`;
      }

      pipelineSteps.push({
        step: "AI Parsing",
        status: "fallback",
        detail: `${parsedFields.length} fields extracted via regex fallback`,
        durationMs: Date.now() - parseStart,
      });
    }

    // Extract values
    const medName =
      parsedFields.find((f) => f.field === "medicationName")?.value ?? "";
    const dosage =
      parsedFields.find((f) => f.field === "dosage")?.value ?? null;
    const quantityStr = parsedFields.find((f) => f.field === "quantity")?.value;
    const priceStr = parsedFields.find((f) => f.field === "price")?.value;
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 100;
    const price = priceStr ? parseFloat(priceStr) : null;

    // Step 2: Load weights
    const weightsStart = Date.now();
    const weightsRecord = await prisma.matchingWeights.findFirst();
    const weights = weightsRecord
      ? {
          medication: Number(weightsRecord.medication),
          quantity: Number(weightsRecord.quantity),
          dosage: Number(weightsRecord.dosage),
          price: Number(weightsRecord.price),
          recency: Number(weightsRecord.recency),
        }
      : {
          medication: 0.4,
          quantity: 0.2,
          dosage: 0.15,
          price: 0.15,
          recency: 0.1,
        };
    pipelineSteps.push({
      step: "Load Weights",
      status: "success",
      detail: "Fetched matching engine weights",
      durationMs: Date.now() - weightsStart,
    });

    // Step 3: Score candidates
    const scoreStart = Date.now();
    const candidates: SimulateCandidate[] = [];

    if (parsedType === MessageType.OFFER) {
      const requests = await prisma.request.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const req of requests) {
        const breakdown: ScoreBreakdown = {
          medication: calculateMedicationSimilarity(
            medName,
            req.medicationName,
          ),
          quantity: calculateQuantityScore(quantity, req.quantity),
          dosage: calculateDosageSimilarity(dosage, req.dosage),
          price: calculatePriceScore(
            price,
            req.maxPrice !== null ? Number(req.maxPrice) : null,
          ),
          recency: calculateRecencyScore(req.createdAt),
        };
        const score =
          breakdown.medication * weights.medication +
          breakdown.quantity * weights.quantity +
          breakdown.dosage * weights.dosage +
          breakdown.price * weights.price +
          breakdown.recency * weights.recency;

        if (score > MATCH_SCORE_THRESHOLD) {
          candidates.push({
            id: req.id,
            medicationName: req.medicationName,
            dosage: req.dosage,
            quantity: req.quantity,
            price: req.maxPrice !== null ? req.maxPrice.toString() : null,
            groupName: req.groupName,
            senderPhone: maskPhone(req.senderPhone),
            score: Math.round(score * 1000) / 1000,
            confidenceBand: calculateConfidenceBand(score),
            scoreBreakdown: breakdown,
          });
        }
      }
    } else {
      const offers = await prisma.offer.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const offer of offers) {
        const breakdown: ScoreBreakdown = {
          medication: calculateMedicationSimilarity(
            medName,
            offer.medicationName,
          ),
          quantity: calculateQuantityScore(quantity, offer.quantity),
          dosage: calculateDosageSimilarity(dosage, offer.dosage),
          price: calculatePriceScore(
            offer.price !== null ? Number(offer.price) : null,
            price,
          ),
          recency: calculateRecencyScore(offer.createdAt),
        };
        const score =
          breakdown.medication * weights.medication +
          breakdown.quantity * weights.quantity +
          breakdown.dosage * weights.dosage +
          breakdown.price * weights.price +
          breakdown.recency * weights.recency;

        if (score > MATCH_SCORE_THRESHOLD) {
          candidates.push({
            id: offer.id,
            medicationName: offer.medicationName,
            dosage: offer.dosage,
            quantity: offer.quantity,
            price: offer.price !== null ? offer.price.toString() : null,
            groupName: offer.groupName,
            senderPhone: maskPhone(offer.senderPhone),
            score: Math.round(score * 1000) / 1000,
            confidenceBand: calculateConfidenceBand(score),
            scoreBreakdown: breakdown,
          });
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    pipelineSteps.push({
      step: "Score Candidates",
      status: "success",
      detail: `${candidates.length} candidates scored`,
      durationMs: Date.now() - scoreStart,
    });

    // Step 4: Insert into system (if requested)
    let insertedId: string | null = null;
    if (insertIntoSystem && medName) {
      const insertStart = Date.now();

      try {
        // Validate quantity and price before insertion
        if (quantity <= 0) {
          pipelineSteps.push({
            step: "Insert Record",
            status: "error",
            detail: "Validation failed: Quantity must be greater than 0",
            durationMs: Date.now() - insertStart,
          });
          throw new ORPCError("BAD_REQUEST", {
            message: "Quantity must be greater than 0",
          });
        }

        if (price !== null && (Number.isNaN(price) || price < 0)) {
          pipelineSteps.push({
            step: "Insert Record",
            status: "error",
            detail:
              "Validation failed: Price must be a valid non-negative number",
            durationMs: Date.now() - insertStart,
          });
          throw new ORPCError("BAD_REQUEST", {
            message: "Price must be a valid non-negative number",
          });
        }
        if (parsedType === MessageType.OFFER) {
          const inserted = await prisma.offer.create({
            data: {
              medicationName: medName,
              dosage,
              quantity,
              price: price?.toString() ?? null,
              groupName,
              senderPhone,
              status: "active",
              rawText,
            },
          });
          insertedId = inserted.id;
        } else {
          const inserted = await prisma.request.create({
            data: {
              medicationName: medName,
              dosage,
              quantity,
              maxPrice: price?.toString() ?? null,
              groupName,
              senderPhone,
              status: "active",
              rawText,
            },
          });
          insertedId = inserted.id;
        }

        pipelineSteps.push({
          step: "Insert Record",
          status: "success",
          detail: `Inserted ${parsedType} #${insertedId}`,
          durationMs: Date.now() - insertStart,
        });
      } catch (err) {
        // If it's an ORPCError (validation failure), re-throw it
        if (err instanceof ORPCError) {
          throw err;
        }

        // Log sanitized error message only (no sensitive data)
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("DB insert failed:", errorMessage);

        pipelineSteps.push({
          step: "Insert Record",
          status: "error",
          detail: `DB insert failed: ${errorMessage}`,
          durationMs: Date.now() - insertStart,
        });
      }
    } else {
      pipelineSteps.push({
        step: "Insert Record",
        status: "skipped",
        detail: "Dry run — not inserted",
        durationMs: 0,
      });
    }

    pipelineSteps.push({
      step: "Complete",
      status: "success",
      detail: `Total pipeline: ${candidates.length} candidates`,
      durationMs: Date.now() - t0,
    });

    // Add warning if no meaningful data was extracted
    const warnings: string[] = [];
    if (!medName) {
      warnings.push(
        "No medication name extracted. Consider providing clearer text or wait for OpenAI integration.",
      );
    }
    if (parsedFields.length === 0) {
      warnings.push(
        "No fields extracted from input. Results may be inaccurate.",
      );
    }

    return {
      parsedType,
      parsedFields,
      aiReasoning,
      candidates: candidates.slice(0, 5),
      insertedId,
      pipelineSteps,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }),
});
