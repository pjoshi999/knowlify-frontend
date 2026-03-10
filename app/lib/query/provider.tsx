"use client";

/**
 * TanStack Query Provider
 *
 * Wraps the application with QueryClientProvider and enables
 * persistent caching with IndexedDB.
 */

import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createQueryClient } from "./client";
import { createIDBPersister } from "./persister";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query Provider with persistence enabled
 *
 * Uses PersistQueryClientProvider to automatically persist
 * query cache to IndexedDB and restore on mount.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());
  const [persister] = useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        buster: "", // Change this to invalidate all cached data
      }}
    >
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  );
}

/**
 * Simple Query Provider without persistence
 *
 * Use this for server-side rendering or when persistence is not needed.
 */
export function SimpleQueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

/**
 * Hook to check if we're in a browser environment
 */
function useIsBrowser() {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // This is intentional for SSR/CSR detection
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsBrowser(true);
  }, []);

  return isBrowser;
}

/**
 * Adaptive Query Provider
 *
 * Uses persistence on client-side and simple provider on server-side.
 */
export function AdaptiveQueryProvider({ children }: QueryProviderProps) {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return <SimpleQueryProvider>{children}</SimpleQueryProvider>;
  }

  return <QueryProvider>{children}</QueryProvider>;
}
