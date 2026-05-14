/**
 * Health Check Router
 * Migrated from Express to oRPC
 */
import { o } from "../index";

export const healthRouter = o.router({
  healthz: o.handler(() => {
    return { status: "ok" as const };
  }),
});
