/**
 * Dashboard Statistics Router
 * Migrated from Express to oRPC
 */
import { o } from "../index";
import { prisma } from "@workspace/db";

export const statsRouter = o.router({
  getDashboardStats: o.handler(async () => {
    // Use UTC to ensure consistent "today" boundary across deployments
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // Use efficient count and aggregate queries instead of loading all records
    const [
      totalOffers,
      totalRequests,
      totalMatches,
      pendingMatches,
      autoConfirmed,
      avgMatchScoreResult,
      activeGroups,
      todayOffers,
      todayRequests,
    ] = await Promise.all([
      prisma.offer.count(),
      prisma.request.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: "pending" } }),
      prisma.match.count({ where: { status: "auto_confirmed" } }),
      prisma.match.aggregate({ _avg: { score: true } }),
      prisma.group.count({ where: { isMonitored: true } }),
      prisma.offer.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.request.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    const avgMatchScore = avgMatchScoreResult._avg.score
      ? Number(avgMatchScoreResult._avg.score)
      : 0;
    const todayMessages = todayOffers + todayRequests;
    const matchRate = totalOffers > 0 ? (totalMatches / totalOffers) * 100 : 0;

    return {
      totalOffers,
      totalRequests,
      totalMatches,
      pendingMatches,
      autoConfirmed,
      avgMatchScore,
      activeGroups,
      todayMessages,
      matchRate,
    };
  }),
});
