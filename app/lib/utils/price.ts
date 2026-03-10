/**
 * Price Utility Functions
 *
 * Handles conversion between USD (user-facing) and cents (backend storage)
 * All prices are stored in cents in the database but displayed in USD to users
 */

/**
 * Convert cents to USD dollars
 * @param cents - Price in cents (e.g., 4999 for $49.99)
 * @returns Price in USD dollars (e.g., 49.99)
 */
export function centsToUSD(cents: number): number {
  return cents / 100;
}

/**
 * Convert USD dollars to cents
 * @param usd - Price in USD dollars (e.g., 49.99)
 * @returns Price in cents (e.g., 4999)
 */
export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

/**
 * Format price as USD currency string (no conversion)
 * @param price - Price in USD (e.g., 49.99)
 * @returns Formatted price string (e.g., "$49.99")
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format USD value as currency string
 * @param usd - Price in USD dollars (e.g., 49.99)
 * @returns Formatted price string (e.g., "$49.99")
 */
export function formatUSD(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
