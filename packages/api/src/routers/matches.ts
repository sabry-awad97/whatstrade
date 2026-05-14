/**
 * Matches Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma, MatchStatus } from "@workspace/db";
import {
  ListMatchesQueryParams,
  GetMatchParams,
  ConfirmMatchParams,
  ConfirmMatchBody,
  RejectMatchParams,
  RejectMatchBody,
} from "@workspace/schemas";

function parseMatch(m: any) {
  return {
    ...m,
    score: Number(m.score),
    offerPrice: m.offerPrice !== null ? Number(m.offerPrice) : null,
    maxPrice: m.maxPrice !== null ? Number(m.maxPrice) : null,
  };
}

export const matchesRouter = o.router({
  getMatchStats: o.handler(async () => {
    const all = await prisma.match.findMany();
    const total = all.length;
    const pending = all.filter((m) => m.status === "pending").length;
    const confirmed = all.filter((m) => m.status === "confirmed").length;
    const rejected = all.filter((m) => m.status === "rejected").length;
    const autoConfirmed = all.filter(
      (m) => m.status === "auto_confirmed",
    ).length;
    const avgScore =
      total > 0 ? all.reduce((sum, m) => sum + Number(m.score), 0) / total : 0;
    const bandBreakdown = {
      auto: all.filter((m) => m.confidenceBand === "auto").length,
      suggest: all.filter((m) => m.confidenceBand === "suggest").length,
      review: all.filter((m) => m.confidenceBand === "review").length,
      none: all.filter((m) => m.confidenceBand === "none").length,
    };
    return {
      total,
      pending,
      confirmed,
      rejected,
      autoConfirmed,
      avgScore,
      bandBreakdown,
    };
  }),

  listMatches: o.input(ListMatchesQueryParams).handler(async ({ input }) => {
    const { status, page = 1, limit = 20 } = input;
    const offset = (page - 1) * limit;

    const matches = await prisma.match.findMany({
      where: status ? { status: status as MatchStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return matches.map(parseMatch);
  }),

  getMatch: o.input(GetMatchParams).handler(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.id },
    });

    if (!match) {
      throw new ORPCError("NOT_FOUND");
    }

    return parseMatch(match);
  }),

  confirmMatch: o
    .input(ConfirmMatchParams.merge(ConfirmMatchBody))
    .handler(async ({ input }) => {
      const match = await prisma.match.update({
        where: { id: input.id },
        data: {
          status: "confirmed",
          operatorNote: input.note ?? null,
        },
      });

      if (!match) {
        throw new ORPCError("NOT_FOUND");
      }

      return parseMatch(match);
    }),

  rejectMatch: o
    .input(RejectMatchParams.merge(RejectMatchBody))
    .handler(async ({ input }) => {
      const match = await prisma.match.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          operatorNote: input.note ?? null,
        },
      });

      if (!match) {
        throw new ORPCError("NOT_FOUND");
      }

      return parseMatch(match);
    }),
});
