/**
 * Authentication Module
 *
 * This module provides a complete authentication solution for the platform:
 * - Supabase client initialization
 * - Authentication service (login, register, OAuth)
 * - Session management utilities
 * - Authentication state management (Zustand store)
 * - Authentication context provider (React Context)
 *
 * Usage:
 * ```typescript
 * // Using the auth service directly
 * import { login, register, signInWithOAuth, logout } from '@/lib/auth';
 *
 * // Email/password login
 * const { user, session } = await login({ email, password });
 *
 * // OAuth login
 * const { url } = await signInWithOAuth({ provider: 'google' });
 * window.location.href = url;
 *
 * // Register new user
 * const { user, session } = await register({ email, password, role: 'student' });
 *
 * // Logout
 * await logout();
 *
 * // Using the auth context in React components
 * import { useAuth, AuthProvider } from '@/lib/auth';
 *
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *   // ...
 * }
 *
 * // Using the auth store directly
 * import { useAuthStore } from '@/lib/auth';
 *
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuthStore();
 *   // ...
 * }
 * ```
 */

// Export Supabase clients
export { supabase, createServerClient, OAUTH_PROVIDERS } from "./supabase-client";
export type { OAuthProvider } from "./supabase-client";

// Export authentication service
export {
  register,
  login,
  signInWithOAuth,
  logout,
  getCurrentUser,
  getSession,
  refreshSession,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from "./auth-service";
export type {
  UserRole,
  AuthUser,
  AuthSession,
  RegisterParams,
  LoginParams,
  OAuthParams,
} from "./auth-service";

// Export session management utilities
export {
  isSessionValid,
  shouldRefreshSession,
  getSessionTimeRemaining,
  autoRefreshSession,
  clearSession,
  isSessionPersistent,
  setSessionPersistence,
  getSessionExpiryDate,
  formatSessionTimeRemaining,
  setupAutoRefresh,
} from "./session-manager";

// Export authentication state management
export { useAuthStore } from "../stores/auth";
export type { AuthState } from "../stores/auth";

// Export authentication context provider
export {
  AuthProvider,
  useAuth,
  useHasRole,
  useIsAuthenticated,
  useRequireAuth,
  useRequireRole,
} from "./auth-provider";
export type { AuthProviderProps } from "./auth-provider";
