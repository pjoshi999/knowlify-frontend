/**
 * Authentication Service
 *
 * This module provides authentication methods for the platform:
 * - Email/password authentication (login, register)
 * - OAuth authentication (Google, GitHub)
 * - Session management (logout, refresh, get current user)
 * - Password reset functionality
 *
 * Validates: Requirements 1.1, 1.2, 1.9, 1.10
 */

import { supabase, OAuthProvider, OAUTH_PROVIDERS } from "./supabase-client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export type UserRole = "instructor" | "student";

export interface AuthUser extends User {
  role?: UserRole;
}

export interface AuthSession {
  user: AuthUser;
  session: Session | null;
  requiresEmailConfirmation?: boolean;
}

export interface RegisterParams {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface OAuthParams {
  provider: OAuthProvider;
  redirectTo?: string;
}

/**
 * Register a new user with email and password
 *
 * @param params - Registration parameters including email, password, role, and optional name
 * @returns Promise with user and session data
 * @throws AuthError if registration fails
 */
export async function register(params: RegisterParams): Promise<AuthSession> {
  const { email, password, role, name } = params;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Registration failed: No user returned");
  }

  return {
    user: { ...data.user, role } as AuthUser,
    session: data.session,
    requiresEmailConfirmation: !data.session,
  };
}

/**
 * Sign in with email and password
 *
 * @param params - Login parameters including email and password
 * @returns Promise with user and session data
 * @throws AuthError if login fails
 */
export async function login(params: LoginParams): Promise<AuthSession> {
  const { email, password } = params;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const authError = error as AuthError;
    if (authError.code === "email_not_confirmed") {
      throw new Error("Please verify your email before logging in.");
    }
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error("Login failed: No user or session returned");
  }

  // Get user role from metadata
  const role = (data.user.user_metadata?.role as UserRole) || "student";

  return {
    user: { ...data.user, role } as AuthUser,
    session: data.session,
  };
}

/**
 * Sign in with OAuth provider (Google or GitHub)
 *
 * @param params - OAuth parameters including provider and optional redirect URL
 * @returns Promise with OAuth URL for redirect
 * @throws AuthError if OAuth initialization fails
 */
export async function signInWithOAuth(params: OAuthParams): Promise<{ url: string }> {
  const { provider, redirectTo } = params;
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  if (redirectTo) {
    callbackUrl.searchParams.set("next", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: OAUTH_PROVIDERS[provider].scopes,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("OAuth initialization failed: No URL returned");
  }

  return { url: data.url };
}

/**
 * Sign out the current user
 *
 * @returns Promise that resolves when sign out is complete
 * @throws AuthError if sign out fails
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Get the current authenticated user
 *
 * @returns Promise with current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const role = (data.user.user_metadata?.role as UserRole) || "student";

  return { ...data.user, role } as AuthUser;
}

/**
 * Get the current session
 *
 * @returns Promise with current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session;
}

/**
 * Refresh the current session
 *
 * @returns Promise with refreshed session
 * @throws AuthError if refresh fails
 */
export async function refreshSession(): Promise<AuthSession> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error("Session refresh failed: No user or session returned");
  }

  const role = (data.user.user_metadata?.role as UserRole) || "student";

  return {
    user: { ...data.user, role } as AuthUser,
    session: data.session,
  };
}

/**
 * Request a password reset email
 *
 * @param email - Email address to send reset link to
 * @returns Promise that resolves when reset email is sent
 * @throws AuthError if request fails
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update user password
 *
 * @param newPassword - New password to set
 * @returns Promise that resolves when password is updated
 * @throws AuthError if update fails
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update current user's role metadata.
 *
 * @param role - User role to set
 */
export async function updateRole(role: UserRole): Promise<AuthUser> {
  const { data, error } = await supabase.auth.updateUser({
    data: { role },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Failed to update user role");
  }

  return { ...data.user, role } as AuthUser;
}

/**
 * Subscribe to authentication state changes
 *
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription.unsubscribe;
}
