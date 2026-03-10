/**
 * Authentication Context Provider
 *
 * This React context provider wraps the application and provides:
 * - Authentication state initialization
 * - Auth state access via context
 * - Loading states during initialization
 * - Error handling for auth operations
 *
 * Validates: Requirements 17.2, 1.7
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth";
import type { AuthUser, UserRole } from "./auth-service";
import type { Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    name?: string
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signInWithOAuth: (provider: "google" | "github", redirectTo?: string) => Promise<{ url: string }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state and actions
 * to all child components via React Context.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  // Get auth state and actions from Zustand store
  const {
    user,
    session,
    isLoading,
    isInitialized,
    error,
    signIn: storeSignIn,
    signUp: storeSignUp,
    signInWithOAuth: storeSignInWithOAuth,
    signOut: storeSignOut,
    refreshToken: storeRefreshToken,
    resetPassword: storeResetPassword,
    updatePassword: storeUpdatePassword,
    updateRole: storeUpdateRole,
    clearError: storeClearError,
    initialize,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [initialize]);

  // Wrapper functions to match context interface
  const signIn = async (email: string, password: string) => {
    await storeSignIn({ email, password });
  };

  const signUp = async (email: string, password: string, role: UserRole, name?: string) => {
    return await storeSignUp({ email, password, role, name });
  };

  const signInWithOAuth = async (provider: "google" | "github", redirectTo?: string) => {
    return await storeSignInWithOAuth({ provider, redirectTo });
  };

  const signOut = async () => {
    await storeSignOut();
  };

  const refreshToken = async () => {
    await storeRefreshToken();
  };

  const resetPassword = async (email: string) => {
    await storeResetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    await storeUpdatePassword(newPassword);
  };

  const updateRole = async (role: UserRole) => {
    await storeUpdateRole(role);
  };

  const clearError = () => {
    storeClearError();
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading: isLoading || isInitializing,
    isInitialized: isInitialized && !isInitializing,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    refreshToken,
    resetPassword,
    updatePassword,
    updateRole,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 *
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context value
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * Hook to check if user has a specific role
 *
 * @param role - Role to check for
 * @returns True if user has the specified role
 */
export function useHasRole(role: UserRole): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

/**
 * Hook to check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, session } = useAuth();
  return user !== null && session !== null;
}

/**
 * Hook to require authentication
 *
 * Throws an error if user is not authenticated.
 * Use this in components that require authentication.
 *
 * @throws Error if user is not authenticated
 * @returns Authenticated user
 */
export function useRequireAuth(): AuthUser {
  const { user, isInitialized } = useAuth();

  if (isInitialized && !user) {
    throw new Error("Authentication required");
  }

  return user!;
}

/**
 * Hook to require a specific role
 *
 * Throws an error if user doesn't have the required role.
 * Use this in components that require specific permissions.
 *
 * @param role - Required role
 * @throws Error if user doesn't have the required role
 * @returns Authenticated user with required role
 */
export function useRequireRole(role: UserRole): AuthUser {
  const user = useRequireAuth();

  if (user.role !== role) {
    throw new Error(`Role ${role} required`);
  }

  return user;
}
