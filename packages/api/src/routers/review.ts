/**
 * Review Queue Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
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
    const all = await prisma.reviewItem.findMany();
    const total = all.length;
    const pending = all.filter((r) => r.status === "pending").length;
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected, avgProcessingTime: 3.4 };
  }),

  approveReviewItem: o
    .input(ApproveReviewItemParams.merge(ApproveReviewItemBody))
    .handler(async ({ input }) => {
      const item = await prisma.reviewItem.update({
        where: { id: input.id },
        data: { status: "approved" },
      });

      if (!item) {
        throw new ORPCError("NOT_FOUND");
      }

      return item;
    }),

  rejectReviewItem: o
    .input(RejectReviewItemParams.merge(RejectReviewItemBody))
    .handler(async ({ input }) => {
      const item = await prisma.reviewItem.update({
        where: { id: input.id },
        data: { status: "rejected" },
      });

      if (!item) {
        throw new ORPCError("NOT_FOUND");
      }

      return item;
    }),
});
