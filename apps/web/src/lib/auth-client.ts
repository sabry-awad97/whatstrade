/**
 * Auth Client - Mock Implementation
 *
 * This is a temporary mock implementation that allows login/signup for development.
 * Session is stored in-memory and will be lost on page refresh.
 *
 * TODO: Replace with Tauri command invocations:
 * - invokeCommand("login", loginResponseSchema, { params: { data } })
 * - invokeCommand("register", registerResponseSchema, { params: { data } })
 * - invokeCommand("validate_token", userResponseSchema, {})
 * - invokeCommand("logout", logoutResponseSchema, {})
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  user: User;
  token: string;
  expiresAt: string;
};

export type AuthError = {
  message?: string;
  statusText?: string;
};

export type AuthResponse<T = Session> = {
  data: T | null;
  error?: AuthError;
};

export type AuthCallbacks<T = Session> = {
  onSuccess?: (data: T) => void;
  onError?: (error: { error: AuthError }) => void;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
  name: string;
};

export type SessionHookResult = {
  data: Session | null;
  isPending: boolean;
  error: AuthError | null;
};

// ============================================================================
// Mock Session Storage
// ============================================================================

let currentSession: Session | null = null;

// Mock user database (in-memory)
const mockUsers = new Map<
  string,
  { email: string; password: string; name: string; id: string }
>();

// Helper to create a mock session
function createMockSession(email: string, name: string): Session {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    user: {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    token: `mock_token_${crypto.randomUUID()}`,
    expiresAt: expiresAt.toISOString(),
  };
}

// ============================================================================
// Auth Client Implementation
// ============================================================================

export const authClient = {
  // Sign-in method
  signIn: {
    email: async (
      data: SignInCredentials,
      callbacks?: AuthCallbacks,
    ): Promise<AuthResponse> => {
      console.log("� Mock Auth: signIn.email called", { email: data.email });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user exists
      const user = mockUsers.get(data.email);

      if (!user) {
        const response: AuthResponse = {
          data: null,
          error: {
            message: "Invalid email or password",
            statusText: "Unauthorized",
          },
        };
        callbacks?.onError?.({ error: response.error! });
        return response;
      }

      // Check password
      if (user.password !== data.password) {
        const response: AuthResponse = {
          data: null,
          error: {
            message: "Invalid email or password",
            statusText: "Unauthorized",
          },
        };
        callbacks?.onError?.({ error: response.error! });
        return response;
      }

      // Create session
      currentSession = createMockSession(user.email, user.name);

      const response: AuthResponse = {
        data: currentSession,
        error: undefined,
      };

      callbacks?.onSuccess?.(currentSession);
      return response;
    },
  },

  // Sign-up method
  signUp: {
    email: async (
      data: SignUpCredentials,
      callbacks?: AuthCallbacks,
    ): Promise<AuthResponse> => {
      console.log("� Mock Auth: signUp.email called", {
        email: data.email,
        name: data.name,
      });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user already exists
      if (mockUsers.has(data.email)) {
        const response: AuthResponse = {
          data: null,
          error: {
            message: "User with this email already exists",
            statusText: "Conflict",
          },
        };
        callbacks?.onError?.({ error: response.error! });
        return response;
      }

      // Create new user
      const userId = crypto.randomUUID();
      mockUsers.set(data.email, {
        id: userId,
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Create session
      currentSession = createMockSession(data.email, data.name);

      const response: AuthResponse = {
        data: currentSession,
        error: undefined,
      };

      callbacks?.onSuccess?.(currentSession);
      return response;
    },
  },

  // Sign-out method
  signOut: async (
    callbacks?: AuthCallbacks<void>,
  ): Promise<AuthResponse<void>> => {
    console.log("� Mock Auth: signOut called");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Clear session
    currentSession = null;

    const response: AuthResponse<void> = {
      data: null,
      error: undefined,
    };

    callbacks?.onSuccess?.(undefined as any);
    return response;
  },

  // Async session getter (for route guards and server-side checks)
  getSession: async (): Promise<AuthResponse<Session>> => {
    console.log("� Mock Auth: getSession called", {
      hasSession: !!currentSession,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!currentSession) {
      return {
        data: null,
        error: {
          message: "No active session",
          statusText: "Unauthorized",
        },
      };
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(currentSession.expiresAt);

    if (now > expiresAt) {
      currentSession = null;
      return {
        data: null,
        error: {
          message: "Session expired",
          statusText: "Unauthorized",
        },
      };
    }

    return {
      data: currentSession,
      error: undefined,
    };
  },

  // Session hook (for React components)
  useSession: (): SessionHookResult => {
    console.log("� Mock Auth: useSession called", {
      hasSession: !!currentSession,
    });

    // In a real implementation, this would use React Query or similar
    // For now, just return the current session synchronously
    return {
      data: currentSession,
      isPending: false,
      error: currentSession ? null : { message: "No active session" },
    };
  },
};

// ============================================================================
// Type Exports for Consumers
// ============================================================================

export type AuthClient = typeof authClient;
