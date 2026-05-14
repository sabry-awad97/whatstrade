/**
 * Review Queue Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma, Prisma } from "@workspace/db";
import {
  ApproveReviewItemParams,
  ApproveReviewItemBody,
  RejectReviewItemParams,
  RejectReviewItemBody,
} from "@workspace/schemas";

export const reviewRouter = o.router({
  getReviewQueue: o.handler(async () => {
    const results = await prisma.reviewItem.findMany({
      where: { status: "pending" },
    });
    return results;
  }),

  getReviewStats: o.handler(async () => {
    // Run queries in parallel for better performance
    const [total, statusCounts, avgProcessingTimeResult] = await Promise.all([
      prisma.reviewItem.count(),
      prisma.reviewItem.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // Calculate average processing time from createdAt to updatedAt
      prisma.$queryRaw<
        Array<{ avg: number | null }>
      >`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg FROM review_items WHERE status != 'pending'`,
    ]);

    // Convert groupBy results to status counts
    const statusMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<string, number>,
    );

    const avgTime = avgProcessingTimeResult[0]?.avg;

    return {
      total,
      pending: statusMap.pending,
      approved: statusMap.approved,
      rejected: statusMap.rejected,
      avgProcessingTime:
        avgTime !== null && avgTime !== undefined ? Number(avgTime) : 0,
    };
  }),

  approveReviewItem: o
    .input(ApproveReviewItemParams.extend(ApproveReviewItemBody.shape))
    .handler(async ({ input }) => {
      try {
        const item = await prisma.reviewItem.update({
          where: { id: input.id },
          data: { status: "approved" },
        });

        return item;
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

  rejectReviewItem: o
    .input(RejectReviewItemParams.extend(RejectReviewItemBody.shape))
    .handler(async ({ input }) => {
      try {
        const item = await prisma.reviewItem.update({
          where: { id: input.id },
          data: { status: "rejected" },
        });

        return item;
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
