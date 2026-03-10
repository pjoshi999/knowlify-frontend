"use client";

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email
 *
 * Validates: Requirements 1.5
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FormField } from "@/app/components/ui/form";
import { useToast } from "@/app/lib/utils/toast";
import { useAuth } from "@/app/lib/auth/auth-provider";
import { validateEmail } from "@/app/lib/validators/auth-validators";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { addToast } = useToast();
  const { resetPassword, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      addToast({
        type: "success",
        title: "Reset email sent - Check your email for instructions",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      setError(errorMessage);
      addToast({
        type: "error",
        title: `Reset failed: ${errorMessage}`,
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <motion.div
          className="w-full lg:max-w-[40%] max-w-[90%] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-success-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-foreground-secondary mb-6">
              We&apos;ve sent password reset instructions to <strong>{email}</strong>
            </p>
            <Button asChild fullWidth>
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        className="w-full max-w-[30%]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-foreground mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Forgot your password?
          </motion.h1>
          <motion.p
            className="text-foreground-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Enter your email and we&apos;ll send you reset instructions
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-lg p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <form onSubmit={handleSubmit}>
            <FormField>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(undefined);
                }}
                error={error}
                fullWidth
                required
                aria-label="Email address"
              />
            </FormField>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="mb-4"
            >
              Send reset instructions
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-foreground hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
