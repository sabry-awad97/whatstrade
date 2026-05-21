import type { RouterClient } from "@orpc/server";

import { o } from "../index";
import { healthRouter } from "./health";
import { statsRouter } from "./stats";
import { offersRouter } from "./offers";
import { requestsRouter } from "./requests";
import { matchesRouter } from "./matches";
import { groupsRouter } from "./groups";
import { weightsRouter } from "./weights";
import { reviewRouter } from "./review";
import { auditRouter } from "./audit";
import { simulateRouter } from "./simulate";
import { whatsappRouter } from "./whatsapp";

export const appRouter = o.router({
  // Nested routers
  health: healthRouter,
  stats: statsRouter,
  offers: offersRouter,
  requests: requestsRouter,
  matches: matchesRouter,
  groups: groupsRouter,
  weights: weightsRouter,
  review: reviewRouter,
  audit: auditRouter,
  simulate: simulateRouter,
  whatsapp: whatsappRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
