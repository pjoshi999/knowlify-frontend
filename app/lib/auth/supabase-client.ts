/**
 * Supabase Client Configuration
 *
 * This module initializes and exports Supabase clients for both browser and server environments.
 * It supports:
 * - Browser client for client-side authentication
 * - Server client for server-side operations
 * - OAuth provider configuration (Google, GitHub)
 * - Session management with automatic token refresh
 */

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Browser client for client-side authentication
 * Uses @supabase/ssr for automatic cookie management
 */
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

/**
 * Server client for server-side operations
 * Use this in API routes and server components
 *
 * @deprecated Use createServerClient from '@/app/lib/auth/supabase-server' instead
 */
export const createServerClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * OAuth provider configuration
 */
export const OAUTH_PROVIDERS = {
  google: {
    name: "Google",
    scopes: "email profile",
  },
  github: {
    name: "GitHub",
    scopes: "user:email",
  },
} as const;

export type OAuthProvider = keyof typeof OAUTH_PROVIDERS;
