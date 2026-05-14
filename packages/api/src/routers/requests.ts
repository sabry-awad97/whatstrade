/**
 * Requests Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
import { ListRequestsQueryParams, GetRequestParams } from "@workspace/schemas";

export const requestsRouter = o.router({
  listRequests: o.input(ListRequestsQueryParams).handler(async ({ input }) => {
    const { page = 1, limit = 20, search } = input;
    const offset = (page - 1) * limit;

    const requests = await prisma.request.findMany({
      where: search
        ? {
            medicationName: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return requests.map((r) => ({
      ...r,
      maxPrice: r.maxPrice !== null ? Number(r.maxPrice) : null,
    }));
  }),

  getRequest: o.input(GetRequestParams).handler(async ({ input }) => {
    const request = await prisma.request.findUnique({
      where: { id: input.id },
    });

    if (!request) {
      throw new ORPCError("NOT_FOUND");
    }

    return {
      ...request,
      maxPrice: request.maxPrice !== null ? Number(request.maxPrice) : null,
    };
  }),
});
