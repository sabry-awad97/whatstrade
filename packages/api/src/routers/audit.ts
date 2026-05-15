/**
 * Audit Log Router
 * Migrated from Express to oRPC
 */
import { o } from "../index";
import { prisma } from "@workspace/db";
import {
  ListAuditLogQueryParams,
  ListAuditLogResponse,
} from "@workspace/schemas";

export const auditRouter = o.router({
  listAuditLog: o
    .input(ListAuditLogQueryParams)
    .output(ListAuditLogResponse)
    .handler(async ({ input }) => {
      const { page = 1, limit = 50 } = input;
      const offset = (page - 1) * limit;

      const entries = await prisma.auditLog.findMany({
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return entries;
    }),
});
