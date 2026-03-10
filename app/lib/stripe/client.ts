/**
 * Stripe Client Configuration
 *
 * This module provides Stripe.js initialization with publishable key
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Get Stripe publishable key from environment variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

if (!stripePublishableKey) {
  console.warn("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set in environment variables");
}

/**
 * Stripe promise instance
 * Lazy-loaded to avoid loading Stripe.js until needed
 */
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create Stripe instance
 *
 * @returns Promise that resolves to Stripe instance or null if key is missing
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise || Promise.resolve(null);
};

/**
 * Check if Stripe is properly configured
 *
 * @returns true if Stripe publishable key is available
 */
export const isStripeConfigured = (): boolean => {
  return !!stripePublishableKey;
};
