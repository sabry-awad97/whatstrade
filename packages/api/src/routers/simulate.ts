/**
 * Message Simulation Router
 * Migrated from Express to oRPC
 *
 * ⚠️ SPECIAL ATTENTION REQUIRED:
 * - This router uses OpenAI integration (@workspace/integrations-openai-ai-server)
 * - Complex business logic with AI parsing, scoring algorithms, and database insertions
 * - Ensure OpenAI package is available before using this router
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
import { SimulateMessageBody } from "@workspace/schemas";

// Note: OpenAI integration needs to be set up
// import { openai } from "@workspace/integrations-openai-ai-server";

export interface ParsedField {
  field: string;
  value: string;
  confidence: number;
}

export interface ScoreBreakdown {
  medication: number;
  quantity: number;
  dosage: number;
  price: number;
  recency: number;
}

export interface SimulateCandidate {
  id: string;
  medicationName: string;
  dosage: string | null;
  quantity: number;
  price: number | null;
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

// Scoring utility functions
function similarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();

  // Guard against empty strings
  if (na.length === 0 || nb.length === 0) return 0;

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  let common = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) common++;
    else break;
  }
  return Math.min(common / Math.max(na.length, nb.length), 0.8);
}

function dosageSim(a: string | null, b: string | null): number {
  if (!a || !b) return 0.5;
  return a.toLowerCase().trim() === b.toLowerCase().trim() ? 1 : 0;
}

function quantityScore(offered: number, requested: number): number {
  const max = Math.max(offered, requested);
  if (max === 0) return 1; // Both quantities are zero, treat as perfect match
  return Math.min(offered, requested) / max;
}

function priceScore(
  offerPrice: number | null,
  maxPrice: number | null,
): number {
  if (offerPrice == null || maxPrice == null) return 0.5;
  if (offerPrice <= maxPrice) return 1;
  const overshoot = (offerPrice - maxPrice) / maxPrice;
  return Math.max(0, 1 - overshoot * 2);
}

function recencyScore(createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return Math.max(0, 1 - ageHours / 72);
}

function bandFromScore(score: number): string {
  if (score >= 0.85) return "auto";
  if (score >= 0.65) return "suggest";
  if (score >= 0.45) return "review";
  return "none";
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

    // Step 1: AI Parse (placeholder - OpenAI integration pending)
    const parseStart = Date.now();
    const parsedType = messageType === "auto" ? "offer" : messageType;
    const parsedFields: ParsedField[] = [];
    let aiReasoning = "AI parsing not yet configured — using fallback.";

    // Fallback: Basic regex extraction until OpenAI is integrated
    if (!parsedFields.length) {
      // Extract medication name (look for common patterns)
      const medMatch = rawText.match(
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
        const words = rawText.split(/\s+/);
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

      aiReasoning = `Fallback regex extraction: found ${parsedFields.length} fields`;
    }

    pipelineSteps.push({
      step: "AI Parsing",
      status: parsedFields.length > 0 ? "fallback" : "skipped",
      detail: `${parsedFields.length} fields extracted via regex fallback`,
      durationMs: Date.now() - parseStart,
    });

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

    if (parsedType === "offer") {
      const requests = await prisma.request.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const req of requests) {
        const breakdown: ScoreBreakdown = {
          medication: similarity(medName, req.medicationName),
          quantity: quantityScore(quantity, req.quantity),
          dosage: dosageSim(dosage, req.dosage),
          price: priceScore(
            price,
            req.maxPrice !== null ? Number(req.maxPrice) : null,
          ),
          recency: recencyScore(req.createdAt),
        };
        const score =
          breakdown.medication * weights.medication +
          breakdown.quantity * weights.quantity +
          breakdown.dosage * weights.dosage +
          breakdown.price * weights.price +
          breakdown.recency * weights.recency;

        if (score > 0.2) {
          candidates.push({
            id: req.id,
            medicationName: req.medicationName,
            dosage: req.dosage,
            quantity: req.quantity,
            price: req.maxPrice !== null ? Number(req.maxPrice) : null,
            groupName: req.groupName,
            senderPhone: maskPhone(req.senderPhone),
            score: Math.round(score * 1000) / 1000,
            confidenceBand: bandFromScore(score),
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
          medication: similarity(medName, offer.medicationName),
          quantity: quantityScore(quantity, offer.quantity),
          dosage: dosageSim(dosage, offer.dosage),
          price: priceScore(
            offer.price !== null ? Number(offer.price) : null,
            price,
          ),
          recency: recencyScore(offer.createdAt),
        };
        const score =
          breakdown.medication * weights.medication +
          breakdown.quantity * weights.quantity +
          breakdown.dosage * weights.dosage +
          breakdown.price * weights.price +
          breakdown.recency * weights.recency;

        if (score > 0.2) {
          candidates.push({
            id: offer.id,
            medicationName: offer.medicationName,
            dosage: offer.dosage,
            quantity: offer.quantity,
            price: offer.price !== null ? Number(offer.price) : null,
            groupName: offer.groupName,
            senderPhone: maskPhone(offer.senderPhone),
            score: Math.round(score * 1000) / 1000,
            confidenceBand: bandFromScore(score),
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

      // Validate quantity and price before insertion
      if (quantity <= 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Quantity must be greater than 0",
        });
      }

      if (price !== null && price !== undefined && price < 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Price cannot be negative",
        });
      }

      try {
        if (parsedType === "offer") {
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
        // Log the full error for debugging
        console.error("DB insert failed:", err);

        // Extract sanitized error message
        const errorMessage = err instanceof Error ? err.message : String(err);

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
