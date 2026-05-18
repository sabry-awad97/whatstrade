/**
 * Matches Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma, MatchStatus, Prisma } from "@workspace/db";
import {
  ListMatchesQueryParams,
  GetMatchParams,
  ConfirmMatchParams,
  ConfirmMatchBody,
  RejectMatchParams,
  RejectMatchBody,
} from "@workspace/schemas";
import { calculateScoreBreakdown } from "../utils/scoring";

type MatchWithDecimal = Prisma.MatchGetPayload<{
  include: { offer: true; request: true };
}>;

async function parseMatchWithBreakdown(m: MatchWithDecimal) {
  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown({
    medicationName: m.medicationName,
    offerDosage: m.offer.dosage,
    requestDosage: m.request.dosage,
    offerQuantity: m.offerQuantity,
    requestQuantity: m.requestQuantity,
    offerPrice: m.offerPrice !== null ? Number(m.offerPrice) : null,
    maxPrice: m.maxPrice !== null ? Number(m.maxPrice) : null,
    createdAt: m.createdAt,
  });

  return {
    id: m.id,
    offerId: m.offerId,
    requestId: m.requestId,
    score: Number(m.score),
    confidenceBand: m.confidenceBand,
    status: m.status,
    operatorNote: m.operatorNote,
    medicationName: m.medicationName,
    offerQuantity: m.offerQuantity,
    requestQuantity: m.requestQuantity,
    offerPrice: m.offerPrice !== null ? Number(m.offerPrice) : null,
    maxPrice: m.maxPrice !== null ? Number(m.maxPrice) : null,
    createdAt: m.createdAt,
    scoreBreakdown,
  };
}

export const matchesRouter = o.router({
  getMatchStats: o.handler(async () => {
    // Run all queries in parallel for better performance
    const [
      total,
      pending,
      confirmed,
      rejected,
      autoConfirmed,
      avgScoreResult,
      bandBreakdown,
    ] = await Promise.all([
      prisma.match.count(),
      prisma.match.count({ where: { status: "pending" } }),
      prisma.match.count({ where: { status: "confirmed" } }),
      prisma.match.count({ where: { status: "rejected" } }),
      prisma.match.count({ where: { status: "auto_confirmed" } }),
      prisma.match.aggregate({ _avg: { score: true } }),
      Promise.all([
        prisma.match.count({ where: { confidenceBand: "auto" } }),
        prisma.match.count({ where: { confidenceBand: "suggest" } }),
        prisma.match.count({ where: { confidenceBand: "review" } }),
        prisma.match.count({ where: { confidenceBand: "none" } }),
      ]),
    ]);

    return {
      total,
      pending,
      confirmed,
      rejected,
      autoConfirmed,
      avgScore: avgScoreResult._avg.score
        ? Number(avgScoreResult._avg.score)
        : 0,
      bandBreakdown: {
        auto: bandBreakdown[0],
        suggest: bandBreakdown[1],
        review: bandBreakdown[2],
        none: bandBreakdown[3],
      },
    };
  }),

  listMatches: o.input(ListMatchesQueryParams).handler(async ({ input }) => {
    const { status, page = 1, limit = 20 } = input;
    const offset = (page - 1) * limit;

    const matches = await prisma.match.findMany({
      where: status ? { status: status as MatchStatus } : undefined,
      include: {
        offer: true,
        request: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return Promise.all(matches.map(parseMatchWithBreakdown));
  }),

  getMatch: o.input(GetMatchParams).handler(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.id },
      include: {
        offer: true,
        request: true,
      },
    });

    if (!match) {
      throw new ORPCError("NOT_FOUND");
    }

    return parseMatchWithBreakdown(match);
  }),

  confirmMatch: o
    .input(ConfirmMatchParams.extend(ConfirmMatchBody.shape))
    .handler(async ({ input }) => {
      try {
        const match = await prisma.match.update({
          where: { id: input.id },
          data: {
            status: "confirmed",
            operatorNote: input.note ?? null,
          },
          include: {
            offer: true,
            request: true,
          },
        });

        return parseMatchWithBreakdown(match);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new ORPCError("NOT_FOUND");
        }
        throw error;
      }
    }),

  rejectMatch: o
    .input(RejectMatchParams.extend(RejectMatchBody.shape))
    .handler(async ({ input }) => {
      try {
        const match = await prisma.match.update({
          where: { id: input.id },
          data: {
            status: "rejected",
            operatorNote: input.note ?? null,
          },
          include: {
            offer: true,
            request: true,
          },
        });

        return parseMatchWithBreakdown(match);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new ORPCError("NOT_FOUND");
        }
        throw error;
      }
    }),
});
