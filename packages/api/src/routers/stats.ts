/**
 * Dashboard Statistics Router
 * Migrated from Express to oRPC
 */
import { o } from "../index";
import { prisma } from "@workspace/db";

export const statsRouter = o.router({
  getDashboardStats: o.handler(async () => {
    const [offers, requests, matches, groups] = await Promise.all([
      prisma.offer.findMany(),
      prisma.request.findMany(),
      prisma.match.findMany(),
      prisma.group.findMany(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pendingMatches = matches.filter((m) => m.status === "pending").length;
    const autoConfirmed = matches.filter(
      (m) => m.status === "auto_confirmed",
    ).length;
    const avgMatchScore =
      matches.length > 0
        ? matches.reduce((sum, m) => sum + Number(m.score), 0) / matches.length
        : 0;
    const activeGroups = groups.filter((g) => g.isMonitored).length;
    const todayMessages =
      offers.filter((o) => o.createdAt >= todayStart).length +
      requests.filter((r) => r.createdAt >= todayStart).length;
    const matchRate =
      offers.length > 0 ? (matches.length / offers.length) * 100 : 0;

    return {
      totalOffers: offers.length,
      totalRequests: requests.length,
      totalMatches: matches.length,
      pendingMatches,
      autoConfirmed,
      avgMatchScore,
      activeGroups,
      todayMessages,
      matchRate,
    };
  }),
});
