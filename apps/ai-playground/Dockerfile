# Build stage
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb ./
COPY packages ./packages
COPY apps/ai-playground ./apps/ai-playground

# Install dependencies
RUN bun install --frozen-lockfile

# Production stage
FROM oven/bun:1.3.5-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/ai-playground ./apps/ai-playground

WORKDIR /app/apps/ai-playground

CMD ["bun", "run", "src/index.ts"]
