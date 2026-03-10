/**
 * Authentication State Management Store
 *
 * This Zustand store manages global authentication state including:
 * - User information and session data
 * - Loading states for auth operations
 * - Auth actions (signIn, signUp, signOut, refreshToken)
 * - Session persistence with localStorage
 * - Automatic token refresh logic
 *
 * Validates: Requirements 17.2, 1.7, 1.4
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@supabase/supabase-js";
import * as authService from "../auth/auth-service";
import * as sessionManager from "../auth/session-manager";
import { getBackendMe } from "../api/auth";
import type {
  AuthUser,
  UserRole,
  RegisterParams,
  LoginParams,
  OAuthParams,
  AuthSession,
} from "../auth/auth-service";

interface AuthState {
  // State
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  signIn: (params: LoginParams) => Promise<void>;
  signUp: (params: RegisterParams) => Promise<{ requiresEmailConfirmation: boolean }>;
  signInWithOAuth: (params: OAuthParams) => Promise<{ url: string }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;

  // Internal actions
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Initialize auth state from stored session
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          const session = await authService.getSession();
          const user = await authService.getCurrentUser();
          if (typeof window !== "undefined") {
            if (session?.access_token) {
              localStorage.setItem("auth_token", session.access_token);
            } else {
              localStorage.removeItem("auth_token");
            }
          }

          // Best-effort backend sync so backend user row stays aligned with Supabase user
          if (session?.access_token) {
            try {
              await getBackendMe();
            } catch (syncError) {
              console.warn("Backend auth sync failed during init:", syncError);
            }
          }

          set({
            user,
            session,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          set({
            user: null,
            session: null,
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to initialize authentication",
          });
        }
      },

      // Sign in with email and password
      signIn: async (params: LoginParams) => {
        try {
          set({ isLoading: true, error: null });

          const { user, session } = await authService.login(params);
          if (typeof window !== "undefined" && session?.access_token) {
            localStorage.setItem("auth_token", session.access_token);
          }

          try {
            await getBackendMe();
          } catch (syncError) {
            console.warn("Backend auth sync failed after sign in:", syncError);
          }

          set({
            user,
            session,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Sign up with email and password
      signUp: async (params: RegisterParams) => {
        try {
          set({ isLoading: true, error: null });

          const result: AuthSession = await authService.register(params);
          const { user, session, requiresEmailConfirmation = false } = result;
          if (typeof window !== "undefined") {
            if (session?.access_token) {
              localStorage.setItem("auth_token", session.access_token);
            } else {
              localStorage.removeItem("auth_token");
            }
          }

          if (session?.access_token) {
            try {
              await getBackendMe();
            } catch (syncError) {
              console.warn("Backend auth sync failed after sign up:", syncError);
            }
          }

          set({
            user,
            session,
            isLoading: false,
          });

          return { requiresEmailConfirmation };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Sign in with OAuth provider
      signInWithOAuth: async (params: OAuthParams) => {
        try {
          set({ isLoading: true, error: null });

          const result = await authService.signInWithOAuth(params);

          // OAuth will redirect, so we don't update state here
          // State will be updated after redirect in the callback handler
          set({ isLoading: false });

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "OAuth sign in failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          await authService.logout();
          await sessionManager.clearSession();
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
          }

          set({
            user: null,
            session: null,
            isLoading: false,
          });

          // Redirect to login page after successful sign out
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Sign out failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Refresh authentication token
      refreshToken: async () => {
        try {
          const currentSession = get().session;

          // Only refresh if we have a session and it needs refresh
          if (!currentSession || !sessionManager.shouldRefreshSession(currentSession)) {
            return;
          }

          const { user, session } = await authService.refreshSession();
          if (typeof window !== "undefined" && session?.access_token) {
            localStorage.setItem("auth_token", session.access_token);
          }

          set({
            user,
            session,
          });
        } catch (error) {
          console.error("Token refresh failed:", error);
          // If refresh fails, clear the session
          set({
            user: null,
            session: null,
            error: "Session expired. Please sign in again.",
          });
        }
      },

      // Request password reset
      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });

          await authService.resetPassword(email);

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Password reset failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Update password
      updatePassword: async (newPassword: string) => {
        try {
          set({ isLoading: true, error: null });

          await authService.updatePassword(newPassword);

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Password update failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Update current user's role metadata
      updateRole: async (role: UserRole) => {
        try {
          set({ isLoading: true, error: null });

          const user = await authService.updateRole(role);
          try {
            await getBackendMe();
          } catch (syncError) {
            console.warn("Backend auth sync failed after role update:", syncError);
          }
          set({
            user,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Role update failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Internal: Set user
      setUser: (user: AuthUser | null) => set({ user }),

      // Internal: Set session
      setSession: (session: Session | null) => set({ session }),

      // Internal: Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Internal: Set error
      setError: (error: string | null) => set({ error }),

      // Internal: Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      // Only persist user and session, not loading/error states
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

// Set up automatic token refresh
let refreshInterval: NodeJS.Timeout | null = null;

const setupAutoRefresh = () => {
  // Clear existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Check and refresh token every minute
  refreshInterval = setInterval(() => {
    const state = useAuthStore.getState();
    if (state.session && sessionManager.shouldRefreshSession(state.session)) {
      state.refreshToken();
    }
  }, 60 * 1000); // Check every minute
};

// Subscribe to auth state changes to set up auto-refresh
useAuthStore.subscribe((state) => {
  if (state.session) {
    setupAutoRefresh();
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

// Subscribe to Supabase auth state changes
if (typeof window !== "undefined") {
  authService.onAuthStateChange((event, session) => {
    const state = useAuthStore.getState();

    if (event === "SIGNED_IN" && session) {
      localStorage.setItem("auth_token", session.access_token);
      // Update store with new session
      authService.getCurrentUser().then((user) => {
        state.setUser(user);
        state.setSession(session);
      });
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem("auth_token");
      // Clear store
      state.setUser(null);
      state.setSession(null);
    } else if (event === "TOKEN_REFRESHED" && session) {
      localStorage.setItem("auth_token", session.access_token);
      // Update session
      state.setSession(session);
    }
  });
}

// Export types
export type { AuthState, AuthUser, UserRole, RegisterParams, LoginParams, OAuthParams };
