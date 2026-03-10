/**
 * Refund Request Form Component
 *
 * Allows students to request refunds for course purchases within 30 days
 * Displays eligibility status and handles refund submission
 */

"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/app/components/ui/button";
import { requestRefund } from "@/app/lib/api/payments";
import type { Enrollment } from "@/app/lib/api/service-types";

interface RefundRequestFormProps {
  enrollment: Enrollment & {
    course?: {
      name: string;
      price: number;
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Calculate days since purchase
 */
function calculateDaysSincePurchase(enrolledAt: Date): number {
  const now = new Date();
  const enrolled = new Date(enrolledAt);
  return Math.floor((now.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if refund is eligible (within 30 days)
 */
function isRefundEligible(enrolledAt: Date): boolean {
  return calculateDaysSincePurchase(enrolledAt) <= 30;
}

/**
 * RefundRequestForm component
 *
 * Displays refund eligibility and allows users to submit refund requests
 *
 * @param enrollment - Enrollment to refund
 * @param onSuccess - Callback when refund succeeds
 * @param onCancel - Callback when user cancels
 */
export function RefundRequestForm({ enrollment, onSuccess, onCancel }: RefundRequestFormProps) {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const daysSincePurchase = calculateDaysSincePurchase(enrollment.enrolledAt);
  const isEligible = isRefundEligible(enrollment.enrolledAt);
  const daysRemaining = 30 - daysSincePurchase;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEligible) {
      setError("This purchase is no longer eligible for refund");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await requestRefund({
        enrollmentId: enrollment.id,
        reason: reason.trim() || undefined,
      });

      setSuccess(true);

      // Call success callback after a brief delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process refund request";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="p-6 bg-gray-800 border border-white rounded-lg">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-white mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Refund Request Submitted</h3>
        </div>
        <p className="text-white mb-4">
          Your refund has been processed successfully. The amount will be returned to your original
          payment method within 5-10 business days.
        </p>
        <Button onClick={onSuccess} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course information */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">Refund Request</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Course:</span>
            <span className="font-medium">{enrollment.course?.name || "Unknown Course"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="font-medium">${enrollment.course?.price?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Purchased:</span>
            <span className="font-medium">
              {new Date(enrollment.enrolledAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Eligibility status */}
      <div
        className={`p-4 rounded-lg border ${
          isEligible ? "bg-gray-800 border-white" : "bg-gray-800 border-white"
        }`}
      >
        <div className="flex items-start">
          <svg
            className={`w-5 h-5 mt-0.5 mr-2 ${isEligible ? "text-white" : "text-white"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isEligible
                  ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
          <div>
            <p className={`font-medium ${isEligible ? "text-white" : "text-white"}`}>
              {isEligible
                ? `Eligible for refund (${daysRemaining} days remaining)`
                : "Refund window expired"}
            </p>
            <p className={`text-sm mt-1 ${isEligible ? "text-white" : "text-white"}`}>
              {isEligible
                ? "Refunds are available within 30 days of purchase."
                : `This purchase was ${daysSincePurchase} days ago. Refunds are only available within 30 days of purchase.`}
            </p>
          </div>
        </div>
      </div>

      {/* Refund form */}
      {isEligible && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason textarea */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Reason for refund (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Please let us know why you're requesting a refund..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-gray-800 border border-white rounded-lg">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isProcessing} className="flex-1" variant="danger">
              {isProcessing ? "Processing..." : "Request Refund"}
            </Button>
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline" disabled={isProcessing}>
                Cancel
              </Button>
            )}
          </div>

          {/* Warning notice */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Once processed, you will lose access to this course and all progress will be removed.
            Refunds typically take 5-10 business days to appear on your statement.
          </p>
        </form>
      )}

      {/* Not eligible - show cancel button */}
      {!isEligible && onCancel && (
        <div className="flex justify-center">
          <Button onClick={onCancel} variant="outline">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
