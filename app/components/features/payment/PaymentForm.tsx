/**
 * Payment Form Component
 *
 * Stripe Elements payment form for course purchases
 * Handles card input, validation, and payment processing
 */

"use client";

import { useState, FormEvent } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/app/components/ui/button";

interface PaymentFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  paymentIntentId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * PaymentForm component
 *
 * Renders Stripe Payment Element and handles payment submission
 *
 * @param courseId - ID of the course being purchased
 * @param courseName - Name of course being purchased
 * @param amount - Payment amount in dollars
 * @param paymentIntentId - Stripe payment intent ID
 * @param onSuccess - Callback when payment succeeds
 * @param onError - Callback when payment fails
 */
export function PaymentForm({
  courseId,
  courseName,
  amount,
  paymentIntentId: _paymentIntentId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  // TODO: Implement payment processing
  console.log("PaymentForm initialized", { courseId, courseName, amount, onSuccess, onError });

  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment with Stripe - this will redirect to Stripe's page if needed
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?course_id=${courseId}`,
        },
        // Always redirect to handle 3D Secure and other authentication methods
        redirect: "always",
      });

      // This code only runs if there's an immediate error (before redirect)
      if (error) {
        const message = error.message || "An unexpected error occurred";
        setErrorMessage(message);
        onError?.(message);
        setIsProcessing(false);
      }
      // If no error, user will be redirected to Stripe's page
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment processing failed";
      setErrorMessage(message);
      onError?.(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course purchase summary */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Purchase Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-foreground-secondary">{courseName}</span>
          <span className="text-xl font-bold text-foreground">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="p-4 border border-border rounded-xl bg-card">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-error border border-error rounded-xl">
          <p className="text-error-foreground text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" size="lg">
        {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>

      {/* Security notice */}
      <p className="text-xs text-center text-foreground-secondary">
        Your payment information is secure and encrypted. We use Stripe for payment processing.
      </p>
    </form>
  );
}
