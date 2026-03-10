/**
 * TanStack Query IndexedDB Persister
 *
 * Implements persistent cache storage using IndexedDB via Dexie.
 * This allows queries to be restored from cache even after page refresh.
 */

import { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { db } from "../db";

/**
 * Cache key for storing the entire query cache
 */
const CACHE_KEY = "tanstack-query-cache";

/**
 * Maximum age for cached data (7 days)
 */
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Create an IndexedDB persister for TanStack Query
 */
export function createIDBPersister(): Persister {
  return {
    /**
     * Persist the client state to IndexedDB
     */
    persistClient: async (client: PersistedClient) => {
      try {
        await db.cache.put({
          key: CACHE_KEY,
          data: client,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + MAX_CACHE_AGE),
        });
      } catch (error) {
        console.error("Failed to persist query cache:", error);
      }
    },

    /**
     * Restore the client state from IndexedDB
     */
    restoreClient: async () => {
      try {
        const cached = await db.cache.get(CACHE_KEY);

        if (!cached) {
          return undefined;
        }

        // Check if cache has expired
        if (cached.expiresAt < new Date()) {
          // Remove expired cache
          await db.cache.delete(CACHE_KEY);
          return undefined;
        }

        return cached.data as PersistedClient;
      } catch (error) {
        console.error("Failed to restore query cache:", error);
        return undefined;
      }
    },

    /**
     * Remove the persisted client state
     */
    removeClient: async () => {
      try {
        await db.cache.delete(CACHE_KEY);
      } catch (error) {
        console.error("Failed to remove query cache:", error);
      }
    },
  };
}
