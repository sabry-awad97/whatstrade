/**
 * Matching Weights Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
import { UpdateWeightsBody } from "@workspace/schemas";

function validateWeight(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `${fieldName} must be a valid number`,
    });
  }
  if (value < 0 || value > 1) {
    throw new ORPCError("BAD_REQUEST", {
      message: `${fieldName} must be between 0 and 1 (got ${value})`,
    });
  }
}

function parseWeights(w: any) {
  if (!w) {
    throw new Error("Weights object is null or undefined");
  }

  const toNumber = (value: any, fieldName: string): number => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      console.warn(`Invalid ${fieldName} value: ${value}, defaulting to 0`);
      return 0;
    }
    return num;
  };

  return {
    ...w,
    medication: toNumber(w.medication, "medication"),
    quantity: toNumber(w.quantity, "quantity"),
    dosage: toNumber(w.dosage, "dosage"),
    price: toNumber(w.price, "price"),
    recency: toNumber(w.recency, "recency"),
  };
}

export const weightsRouter = o.router({
  getWeights: o.handler(async () => {
    let weights = await prisma.matchingWeights.findFirst();

    if (!weights) {
      // Create with explicit defaults matching schema defaults
      weights = await prisma.matchingWeights.create({
        data: {
          medication: "0.40",
          quantity: "0.20",
          dosage: "0.15",
          price: "0.15",
          recency: "0.10",
        },
      });
    }

    return parseWeights(weights);
  }),

  updateWeights: o.input(UpdateWeightsBody).handler(async ({ input }) => {
    // Validate all weights are in [0, 1] range
    validateWeight(input.medication, "medication");
    validateWeight(input.quantity, "quantity");
    validateWeight(input.dosage, "dosage");
    validateWeight(input.price, "price");
    validateWeight(input.recency, "recency");

    // Validate weights sum to approximately 1.0 (allow small floating point variance)
    const sum =
      input.medication +
      input.quantity +
      input.dosage +
      input.price +
      input.recency;
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Weights must sum to 1.0 (got ${sum.toFixed(4)})`,
      });
    }

    const data = {
      medication: String(input.medication),
      quantity: String(input.quantity),
      dosage: String(input.dosage),
      price: String(input.price),
      recency: String(input.recency),
    };

    // Use transaction to prevent race conditions
    const weights = await prisma.$transaction(async (tx) => {
      const existing = await tx.matchingWeights.findFirst();

      if (existing) {
        // Update existing record
        return await tx.matchingWeights.update({
          where: { id: existing.id },
          data,
        });
      } else {
        // Create new record
        return await tx.matchingWeights.create({
          data,
        });
      }
    });

    return parseWeights(weights);
  }),
});
