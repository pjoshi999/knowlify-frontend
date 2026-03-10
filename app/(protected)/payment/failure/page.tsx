"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/app/components/layouts/Container";
import { Button } from "@/app/components/ui/button";

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");
  const error = searchParams.get("error");
  const paymentIntentId = searchParams.get("payment_intent");

  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to course page
          if (courseId) {
            router.push(`/courses/${courseId}`);
          } else {
            router.push("/courses");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [courseId, router]);

  const handleRetry = () => {
    if (courseId) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push("/courses");
    }
  };

  const handleGoToCourses = () => {
    router.push("/courses");
  };

  const handleContactSupport = () => {
    // You can customize this to open a support modal or redirect to support page
    window.location.href = "mailto:support@knowlify.com?subject=Payment Issue";
  };

  // Decode error message
  const errorMessage = error
    ? decodeURIComponent(error)
    : "Your payment could not be processed. Please try again.";

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto"
        >
          <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8 text-center">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
            >
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
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-3">Payment Failed</h1>
              <p className="text-lg text-foreground-secondary mb-6">{errorMessage}</p>

              {/* Common Reasons */}
              <div className="mb-6 p-6 bg-card-hover rounded-xl border border-border text-left">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Common reasons for payment failure:
                </h3>
                <ul className="space-y-2 text-sm text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5">•</span>
                    <span>Insufficient funds in your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5">•</span>
                    <span>Incorrect card details or expired card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5">•</span>
                    <span>Card declined by your bank</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5">•</span>
                    <span>Network or connection issues</span>
                  </li>
                </ul>
              </div>

              {paymentIntentId && (
                <div className="mb-6 p-4 bg-card-hover rounded-xl border border-border">
                  <p className="text-sm text-foreground-secondary mb-1">Reference ID</p>
                  <p className="text-xs font-mono text-foreground break-all">{paymentIntentId}</p>
                </div>
              )}

              {/* Countdown */}
              <p className="text-sm text-foreground-secondary mb-8">
                Redirecting in {countdown} seconds...
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRetry}
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleGoToCourses}
                  className="w-full sm:w-auto"
                >
                  Browse Courses
                </Button>
              </div>

              {/* Support Link */}
              <div className="mt-6">
                <button
                  onClick={handleContactSupport}
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors underline"
                >
                  Need help? Contact Support
                </button>
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
              No charges were made to your account. You can try again or use a different payment
              method.
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
