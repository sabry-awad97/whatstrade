import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuthApi");

// ============================================================================
// Schemas
// ============================================================================

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  email_verified: z.boolean(),
  image: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const authResponseSchema = z.object({
  user: userResponseSchema,
  access_token: z.string(),
  refresh_token: z.string(),
});

export const registerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

export const validateTokenRequestSchema = z.object({
  access_token: z.string().min(1),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type ValidateTokenRequest = z.infer<typeof validateTokenRequestSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  logger.info("Registering user");
  return invokeCommand("auth_register", authResponseSchema, {
    params: { data },
  });
}

/**
 * Login a user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  logger.info("Logging in user");
  return invokeCommand("auth_login", authResponseSchema, {
    params: { data },
  });
}

/**
 * Refresh access token
 */
export async function refreshToken(
  data: RefreshTokenRequest,
): Promise<AuthResponse> {
  logger.info("Refreshing token");
  return invokeCommand("auth_refresh", authResponseSchema, {
    params: { data },
  });
}

/**
 * Validate access token and get user
 */
export async function validateToken(
  data: ValidateTokenRequest,
): Promise<UserResponse> {
  logger.info("Validating token");
  return invokeCommand("auth_validate", userResponseSchema, {
    params: { data },
  });
}
