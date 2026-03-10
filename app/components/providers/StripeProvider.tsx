/**
 * Stripe Provider Component
 *
 * Wraps the application with Stripe Elements provider
 * Provides Stripe context to all child components
 */

"use client";

import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/app/lib/stripe/client";

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * StripeProvider component
 *
 * Wraps children with Stripe Elements provider
 * Automatically loads Stripe.js and provides context
 *
 * @param children - Child components that need access to Stripe
 */
export function StripeProvider({ children }: StripeProviderProps) {
  const stripePromise = getStripe();

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
