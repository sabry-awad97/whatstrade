/**
 * Offers Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma } from "@workspace/db";
import { ListOffersQueryParams, GetOfferParams } from "@workspace/schemas";

export const offersRouter = o.router({
  listOffers: o.input(ListOffersQueryParams).handler(async ({ input }) => {
    const { page = 1, limit = 20, search } = input;
    const offset = (page - 1) * limit;

    const offers = await prisma.offer.findMany({
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

    return offers.map((o) => ({
      ...o,
      price: o.price !== null ? Number(o.price) : null,
    }));
  }),

  getOffer: o.input(GetOfferParams).handler(async ({ input }) => {
    const offer = await prisma.offer.findUnique({
      where: { id: input.id },
    });

    if (!offer) {
      throw new ORPCError("NOT_FOUND");
    }

    return {
      ...offer,
      price: offer.price !== null ? Number(offer.price) : null,
    };
  }),
});
