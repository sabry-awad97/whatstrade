import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@workspace/env/server";

import { PrismaClient } from "../prisma/generated/client";

// Singleton pattern to prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Re-export all Prisma types and utilities
export * from "../prisma/generated/client";

// Re-export trigger management
export { checkAndApplyTriggers } from "../check-trigger";
