/**
 * Session Management Utilities
 *
 * This module provides utilities for managing user sessions:
 * - Session validation and expiration checking
 * - Token refresh management
 * - Session persistence across browser sessions
 * - Session storage helpers
 *
 * Validates: Requirements 1.4, 1.6, 1.7
 */

import { supabase } from "./supabase-client";
import type { Session } from "@supabase/supabase-js";

const SESSION_STORAGE_KEY = "supabase.auth.token";
const SESSION_EXPIRY_BUFFER = 60 * 1000; // 1 minute buffer before expiry

/**
 * Check if a session is valid and not expired
 *
 * @param session - Session to validate
 * @returns True if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  const expiresAt = session.expires_at;
  if (!expiresAt) {
    return false;
  }

  // Check if session expires within the buffer time
  const expiryTime = expiresAt * 1000; // Convert to milliseconds
  const now = Date.now();

  return expiryTime > now + SESSION_EXPIRY_BUFFER;
}

/**
 * Check if a session is about to expire and needs refresh
 *
 * @param session - Session to check
 * @returns True if session should be refreshed
 */
export function shouldRefreshSession(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  const expiresAt = session.expires_at;
  if (!expiresAt) {
    return false;
  }

  const expiryTime = expiresAt * 1000;
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  // Refresh if less than 5 minutes until expiry
  const REFRESH_THRESHOLD = 5 * 60 * 1000;

  return timeUntilExpiry < REFRESH_THRESHOLD && timeUntilExpiry > 0;
}

/**
 * Get the time remaining until session expires
 *
 * @param session - Session to check
 * @returns Time remaining in milliseconds, or 0 if expired/invalid
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session || !session.expires_at) {
    return 0;
  }

  const expiryTime = session.expires_at * 1000;
  const now = Date.now();
  const remaining = expiryTime - now;

  return Math.max(0, remaining);
}

/**
 * Automatically refresh session if needed
 *
 * @returns Promise with refreshed session or null if refresh not needed
 */
export async function autoRefreshSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const currentSession = data.session;

  if (!currentSession) {
    return null;
  }

  if (shouldRefreshSession(currentSession)) {
    const { data: refreshData, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Session refresh failed:", error);
      return null;
    }

    return refreshData.session;
  }

  return currentSession;
}

/**
 * Clear all session data
 * This is called during logout to ensure clean state
 */
export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();

  // Clear any additional session-related data from storage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing session storage:", error);
    }
  }
}

/**
 * Check if session persistence is enabled
 *
 * @returns True if sessions persist across browser sessions
 */
export function isSessionPersistent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored !== null;
  } catch {
    return false;
  }
}

/**
 * Enable or disable session persistence
 *
 * @param persist - Whether to persist sessions across browser sessions
 */
export async function setSessionPersistence(persist: boolean): Promise<void> {
  // Supabase handles persistence automatically based on storage type
  // This function is for future customization if needed
  if (!persist) {
    await clearSession();
  }
}

/**
 * Get session expiry date
 *
 * @param session - Session to check
 * @returns Date when session expires, or null if no expiry
 */
export function getSessionExpiryDate(session: Session | null): Date | null {
  if (!session || !session.expires_at) {
    return null;
  }

  return new Date(session.expires_at * 1000);
}

/**
 * Format session expiry time for display
 *
 * @param session - Session to check
 * @returns Formatted string like "5 minutes" or "2 hours"
 */
export function formatSessionTimeRemaining(session: Session | null): string {
  const remaining = getSessionTimeRemaining(session);

  if (remaining === 0) {
    return "Expired";
  }

  const minutes = Math.floor(remaining / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return "Less than a minute";
}

/**
 * Set up automatic session refresh
 * Returns a cleanup function to stop the refresh interval
 *
 * @param onRefresh - Optional callback when session is refreshed
 * @returns Cleanup function to stop auto-refresh
 */
export function setupAutoRefresh(onRefresh?: (session: Session) => void): () => void {
  // Check every minute
  const REFRESH_CHECK_INTERVAL = 60 * 1000;

  const intervalId = setInterval(async () => {
    const session = await autoRefreshSession();
    if (session && onRefresh) {
      onRefresh(session);
    }
  }, REFRESH_CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
