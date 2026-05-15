/**
 * Groups Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma, Prisma } from "@workspace/db";
import {
  EnableGroupMonitoringParams,
  DisableGroupMonitoringParams,
} from "@workspace/schemas";

export const groupsRouter = o.router({
  listGroups: o.handler(async () => {
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
    return groups;
  }),

  listMonitoredGroups: o.handler(async () => {
    const groups = await prisma.group.findMany({
      where: { isMonitored: true },
    });
    return groups;
  }),

  enableGroupMonitoring: o
    .input(EnableGroupMonitoringParams)
    .handler(async ({ input }) => {
      try {
        const group = await prisma.group.update({
          where: { jid: input.jid },
          data: { isMonitored: true },
        });

        return group;
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

  disableGroupMonitoring: o
    .input(DisableGroupMonitoringParams)
    .handler(async ({ input }) => {
      try {
        const group = await prisma.group.update({
          where: { jid: input.jid },
          data: { isMonitored: false },
        });

        return group;
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
