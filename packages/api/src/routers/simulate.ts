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

// Scoring utility functions
function similarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
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
  const ratio = Math.min(offered, requested) / Math.max(offered, requested);
  return ratio;
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
    const aiReasoning = "AI parsing not yet configured — using fallback.";
    pipelineSteps.push({
      step: "AI Parsing",
      status: "skipped",
      detail: "OpenAI integration pending",
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
            senderPhone: req.senderPhone,
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
            senderPhone: offer.senderPhone,
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
        pipelineSteps.push({
          step: "Insert Record",
          status: "error",
          detail: "DB insert failed",
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

    return {
      parsedType,
      parsedFields,
      aiReasoning,
      candidates: candidates.slice(0, 5),
      insertedId,
      pipelineSteps,
    };
  }),
});
