/**
 * Matching Weights Router
 * Migrated from Express to oRPC
 */
import { o } from "../index";
import { prisma } from "@workspace/db";
import { UpdateWeightsBody } from "@workspace/schemas";

function parseWeights(w: any) {
  return {
    ...w,
    medication: Number(w.medication),
    quantity: Number(w.quantity),
    dosage: Number(w.dosage),
    price: Number(w.price),
    recency: Number(w.recency),
  };
}

export const weightsRouter = o.router({
  getWeights: o.handler(async () => {
    let weights = await prisma.matchingWeights.findFirst();

    if (!weights) {
      weights = await prisma.matchingWeights.create({
        data: {},
      });
    }

    return parseWeights(weights);
  }),

  updateWeights: o.input(UpdateWeightsBody).handler(async ({ input }) => {
    const existing = await prisma.matchingWeights.findFirst();

    let weights;
    if (!existing) {
      weights = await prisma.matchingWeights.create({
        data: {
          medication: String(input.medication),
          quantity: String(input.quantity),
          dosage: String(input.dosage),
          price: String(input.price),
          recency: String(input.recency),
        },
      });
    } else {
      weights = await prisma.matchingWeights.update({
        where: { id: existing.id },
        data: {
          medication: String(input.medication),
          quantity: String(input.quantity),
          dosage: String(input.dosage),
          price: String(input.price),
          recency: String(input.recency),
        },
      });
    }

    return parseWeights(weights);
  }),
});
