import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  register,
  login,
  refreshToken,
  validateToken,
  type RegisterRequest,
  type LoginRequest,
  type RefreshTokenRequest,
  type ValidateTokenRequest,
} from "@/api/auth";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuthHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
  all: ["auth"] as const,
  validate: (token: string) => [...authKeys.all, "validate", token] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to validate an access token
 */
export function useValidateToken(accessToken: string, enabled = true) {
  return useQuery({
    queryKey: authKeys.validate(accessToken),
    queryFn: () => {
      logger.info("Query: validating token");
      return validateToken({ access_token: accessToken });
    },
    enabled: enabled && !!accessToken,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to register a new user
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => {
      logger.info("Mutation: registering user", { email: data.email });
      return register(data);
    },
    onSuccess: (data) => {
      logger.info("User registered successfully", { userId: data.user.id });
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      logger.error("Registration failed", error);
    },
  });
}

/**
 * Hook to login a user
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => {
      logger.info("Mutation: logging in user", { email: data.email });
      return login(data);
    },
    onSuccess: (data) => {
      logger.info("User logged in successfully", { userId: data.user.id });
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      logger.error("Login failed", error);
    },
  });
}

/**
 * Hook to refresh access token
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => {
      logger.info("Mutation: refreshing token");
      return refreshToken(data);
    },
    onSuccess: (data) => {
      logger.info("Token refreshed successfully", { userId: data.user.id });
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      logger.error("Token refresh failed", error);
    },
  });
}
