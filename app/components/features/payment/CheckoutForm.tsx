/**
 * Checkout Form Component
 *
 * Renders Stripe payment form with provided client secret
 * Handles the payment submission flow for course purchases
 */

"use client";

import { PaymentForm } from "./PaymentForm";

interface CheckoutFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  paymentIntentId?: string;
}

/**
 * CheckoutForm component
 *
 * Renders Stripe Elements payment form with provided client secret
 *
 * @param courseId - ID of the course being purchased
 * @param courseName - Name of the course
 * @param amount - Amount in dollars
 * @param paymentIntentId - Stripe payment intent ID
 */
export function CheckoutForm({ courseId, courseName, amount, paymentIntentId }: CheckoutFormProps) {
  return (
    <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Payment Details</h2>

      <PaymentForm
        courseId={courseId}
        courseName={courseName}
        amount={amount} // Amount in dollars
        paymentIntentId={paymentIntentId}
      />
    </div>
  );
}
