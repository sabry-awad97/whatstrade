import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@workspace/api/context";
import { appRouter } from "@workspace/api/routers/index";
import { auth } from "@workspace/auth";
import { env } from "@workspace/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  startWhatsAppListener,
  stopWhatsAppListener,
} from "./services/whatsapp-listener";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

// Start WhatsApp listener service
// This runs concurrently with the HTTP server
startWhatsAppListener(true).catch((error) => {
  console.error("Failed to start WhatsApp listener:", error);
  // Don't crash the HTTP server if WhatsApp listener fails
  // The listener will attempt to reconnect automatically
});

// Graceful shutdown handler
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");

  try {
    await stopWhatsAppListener();
    console.log("WhatsApp listener stopped");
  } catch (error) {
    console.error("Error stopping WhatsApp listener:", error);
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");

  try {
    await stopWhatsAppListener();
    console.log("WhatsApp listener stopped");
  } catch (error) {
    console.error("Error stopping WhatsApp listener:", error);
  }

  process.exit(0);
});

export default app;
