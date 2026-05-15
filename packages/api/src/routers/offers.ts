/**
 * Offers Router
 * Migrated from Express to oRPC
 */
import { ORPCError } from "@orpc/server";
import { o } from "../index";
import { prisma, Prisma } from "@workspace/db";
import { ListOffersQueryParams, GetOfferParams } from "@workspace/schemas";

type OfferWithDecimal = Prisma.OfferGetPayload<object>;

function parseOffer(offer: OfferWithDecimal) {
  return {
    ...offer,
    price: offer.price !== null ? offer.price.toString() : null,
  };
}

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

    return offers.map(parseOffer);
  }),

  getOffer: o.input(GetOfferParams).handler(async ({ input }) => {
    const offer = await prisma.offer.findUnique({
      where: { id: input.id },
    });

    if (!offer) {
      throw new ORPCError("NOT_FOUND");
    }

    return parseOffer(offer);
  }),
});
