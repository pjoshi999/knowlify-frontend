"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Container } from "@/app/components/layouts/Container";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/loading";
import { useStripe } from "@stripe/react-stripe-js";
import { invalidationStrategies } from "@/app/lib/query/invalidation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const queryClient = useQueryClient();

  const courseId = searchParams.get("course_id");
  const paymentIntentParam = searchParams.get("payment_intent");
  const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret");

  const [countdown, setCountdown] = useState(10);
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"succeeded" | "processing" | "failed" | null>(
    null
  );
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(paymentIntentParam);

  useEffect(() => {
    // Verify payment status with Stripe
    const verifyPayment = async () => {
      if (!stripe || !paymentIntentClientSecret) {
        setIsVerifying(false);
        setPaymentStatus("succeeded"); // Assume success if no client secret (direct navigation)
        // Invalidate course queries to update enrollment status
        if (courseId) {
          invalidationStrategies.onEnrollmentCreate(queryClient, courseId);
        }
        return;
      }

      try {
        const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);

        if (paymentIntent) {
          setPaymentIntentId(paymentIntent.id);

          if (paymentIntent.status === "succeeded") {
            setPaymentStatus("succeeded");
            // Invalidate course queries to update enrollment status
            if (courseId) {
              invalidationStrategies.onEnrollmentCreate(queryClient, courseId);
            }
          } else if (paymentIntent.status === "processing") {
            setPaymentStatus("processing");
          } else {
            setPaymentStatus("failed");
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setPaymentStatus("failed");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [stripe, paymentIntentClientSecret]);

  useEffect(() => {
    // Only start countdown if payment succeeded
    if (paymentStatus !== "succeeded") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (courseId) {
            router.push(`/learn/${courseId}`);
          } else {
            router.push("/dashboard");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [courseId, router, paymentStatus]);

  const handleGoToCourse = () => {
    if (courseId) {
      router.push(`/learn/${courseId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-foreground-secondary">Verifying payment...</p>
        </div>
      </div>
    );
  }

  // Show error if payment failed
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12">
        <Container>
          <div className="mx-auto text-center">
            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Payment Failed</h1>
              <p className="text-lg text-foreground-secondary mb-6">
                Your payment could not be completed. Please try again.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/courses/${courseId}`)}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show processing state
  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8">
              <Spinner size="lg" className="mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-foreground mb-3">Processing Payment</h1>
              <p className="text-lg text-foreground-secondary mb-6">
                Your payment is being processed. This may take a few moments.
              </p>
              <p className="text-sm text-foreground-secondary">
                You will receive a confirmation email once the payment is complete.
              </p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show success
  return (
    <div className="min-h-screen relative flex items-center justify-center py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-3">Payment Successful!</h1>
              <p className="text-lg text-foreground-secondary mb-6">
                Your purchase has been completed successfully. You now have full access to the
                course.
              </p>

              {paymentIntentId && (
                <div className="mb-6 p-4 bg-card-hover rounded-xl border border-border">
                  <p className="text-sm text-foreground-secondary mb-1">Transaction ID</p>
                  <p className="text-xs font-mono text-foreground break-all">{paymentIntentId}</p>
                </div>
              )}

              {/* Countdown */}
              <p className="text-sm text-foreground-secondary mb-8">
                Redirecting in {countdown} seconds...
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {courseId && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGoToCourse}
                    className="w-full sm:w-auto"
                  >
                    Start Learning
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleGoToDashboard}
                  className="w-full sm:w-auto"
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-foreground-secondary">
              A confirmation email has been sent to your registered email address.
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
