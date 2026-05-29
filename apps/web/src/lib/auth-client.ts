/**
 * Auth Client
 *
 * Centralized authentication client that manages user sessions and tokens.
 * Integrates with TanStack Query hooks and Tauri backend commands.
 *
 * Token Storage Strategy:
 * - Access tokens: Stored in memory (React state/context)
 * - Refresh tokens: Stored securely (will use Tauri secure storage in production)
 * - For now: Using sessionStorage as temporary solution until Tauri secure storage is implemented
 *
 * @module auth-client
 */

import { useQuery } from "@tanstack/react-query";
import type {
  AuthResponse,
  UserResponse,
  LoginRequest,
  RegisterRequest,
} from "@/api/auth";
import { login, register, validateToken } from "@/api/auth";
import { authKeys } from "@/hooks/auth";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuthClient");

// ============================================================================
// Type Definitions
// ============================================================================

export type User = UserResponse;

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type AuthError = {
  message?: string;
  statusText?: string;
};

export type AuthCallbacks<T = Session> = {
  onSuccess?: (data: T) => void;
  onError?: (error: { error: AuthError }) => void;
};

export type VoidCallbacks = {
  onSuccess?: () => void;
  onError?: (error: { error: AuthError }) => void;
};

export type SignInCredentials = LoginRequest;
export type SignUpCredentials = RegisterRequest;

export type SessionHookResult = {
  data: Session | null;
  isPending: boolean;
  error: AuthError | null;
};

// ============================================================================
// Token Storage
// ============================================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER: "auth_user",
  EXPIRES_AT: "auth_expires_at",
} as const;

/**
 * Store authentication tokens and user data
 * TODO: Replace sessionStorage with Tauri secure storage
 */
function storeSession(authResponse: AuthResponse): Session {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const session: Session = {
    user: authResponse.user,
    accessToken: authResponse.access_token,
    refreshToken: authResponse.refresh_token,
    expiresAt,
  };

  try {
    sessionStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      authResponse.access_token,
    );
    sessionStorage.setItem(
      STORAGE_KEYS.REFRESH_TOKEN,
      authResponse.refresh_token,
    );
    sessionStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(authResponse.user),
    );
    sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt);
    logger.info("Session stored successfully", {
      userId: authResponse.user.id,
    });
  } catch (error) {
    logger.error("Failed to store session", error);
  }

  return session;
}

/**
 * Retrieve stored session
 */
function getStoredSession(): Session | null {
  try {
    const accessToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userJson = sessionStorage.getItem(STORAGE_KEYS.USER);
    const expiresAt = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

    if (!accessToken || !refreshToken || !userJson || !expiresAt) {
      return null;
    }

    // Check if session is expired
    if (new Date(expiresAt) < new Date()) {
      logger.info("Session expired, clearing storage");
      clearSession();
      return null;
    }

    const user = JSON.parse(userJson) as User;

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    };
  } catch (error) {
    logger.error("Failed to retrieve session", error);
    return null;
  }
}

/**
 * Clear stored session
 */
function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    logger.info("Session cleared");
  } catch (error) {
    logger.error("Failed to clear session", error);
  }
}

// ============================================================================
// Auth Client Implementation
// ============================================================================

export const authClient = {
  /**
   * Sign in with email and password
   */
  signIn: {
    email: async (
      data: SignInCredentials,
      callbacks?: AuthCallbacks,
    ): Promise<{ data: Session | null; error?: AuthError }> => {
      try {
        logger.info("Signing in user", { email: data.email });

        // Call login API
        const authResponse = await login(data);

        // Store session
        const session = storeSession(authResponse);

        // Call success callback
        callbacks?.onSuccess?.(session);

        return { data: session };
      } catch (error) {
        logger.error("Sign in failed", error);

        const authError: AuthError = {
          message: error instanceof Error ? error.message : "Sign in failed",
          statusText: "Unauthorized",
        };

        // Call error callback
        callbacks?.onError?.({ error: authError });

        return { data: null, error: authError };
      }
    },
  },

  /**
   * Sign up with email, password, and name
   */
  signUp: {
    email: async (
      data: SignUpCredentials,
      callbacks?: AuthCallbacks,
    ): Promise<{ data: Session | null; error?: AuthError }> => {
      try {
        logger.info("Signing up user", { email: data.email, name: data.name });

        // Call register API
        const authResponse = await register(data);

        // Store session
        const session = storeSession(authResponse);

        // Call success callback
        callbacks?.onSuccess?.(session);

        return { data: session };
      } catch (error) {
        logger.error("Sign up failed", error);

        const authError: AuthError = {
          message: error instanceof Error ? error.message : "Sign up failed",
          statusText: "Bad Request",
        };

        // Call error callback
        callbacks?.onError?.({ error: authError });

        return { data: null, error: authError };
      }
    },
  },

  /**
   * Sign out and clear session
   */
  signOut: async (
    callbacks?: VoidCallbacks,
  ): Promise<{ data: null; error?: AuthError }> => {
    try {
      logger.info("Signing out user");

      // Clear stored session
      clearSession();

      // Call success callback
      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }

      return { data: null };
    } catch (error) {
      logger.error("Sign out failed", error);

      const authError: AuthError = {
        message: error instanceof Error ? error.message : "Sign out failed",
        statusText: "Internal Server Error",
      };

      // Call error callback
      callbacks?.onError?.({ error: authError });

      return { data: null, error: authError };
    }
  },

  /**
   * Get current session (async for route guards)
   */
  getSession: async (): Promise<{
    data: Session | null;
    error?: AuthError;
  }> => {
    try {
      logger.info("Getting session");

      // Get stored session
      const session = getStoredSession();

      if (!session) {
        return {
          data: null,
          error: {
            message: "No active session",
            statusText: "Unauthorized",
          },
        };
      }

      // Validate token with backend
      try {
        const user = await validateToken({ access_token: session.accessToken });

        // Update user data in session if it changed
        session.user = user;

        return { data: session };
      } catch (error) {
        // Token is invalid, clear session
        logger.warn("Token validation failed, clearing session");
        clearSession();

        return {
          data: null,
          error: {
            message: "Session expired or invalid",
            statusText: "Unauthorized",
          },
        };
      }
    } catch (error) {
      logger.error("Get session failed", error);

      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to get session",
          statusText: "Internal Server Error",
        },
      };
    }
  },

  /**
   * React hook to get current session
   * Uses TanStack Query for caching and automatic refetching
   */
  useSession: (): SessionHookResult => {
    const session = getStoredSession();
    const accessToken = session?.accessToken || "";

    const {
      data: user,
      isPending,
      error,
    } = useQuery({
      queryKey: authKeys.validate(accessToken),
      queryFn: async () => {
        if (!accessToken) {
          throw new Error("No access token");
        }
        logger.info("Validating session token");
        return validateToken({ access_token: accessToken });
      },
      enabled: !!accessToken,
      retry: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });

    // If query failed, clear session
    if (error && session) {
      logger.warn("Session validation failed, clearing session");
      clearSession();
    }

    // Build session result
    // When query is disabled (no token), return isPending: false immediately
    if (!session || !user) {
      return {
        data: null,
        isPending: accessToken ? isPending : false, // Don't show pending if no token
        error: error
          ? {
              message:
                error instanceof Error ? error.message : "Session invalid",
            }
          : null,
      };
    }

    return {
      data: {
        ...session,
        user, // Use validated user data
      },
      isPending,
      error: null,
    };
  },
};

// ============================================================================
// Type Exports for Consumers
// ============================================================================

export type AuthClient = typeof authClient;
