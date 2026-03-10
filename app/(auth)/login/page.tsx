"use client";

/**
 * Enhanced Login/Signup Page
 *
 * Modern authentication page with:
 * - Smooth form animations and transitions
 * - Social login (Google, GitHub)
 * - Real-time form validation
 * - Password strength indicator
 * - Password visibility toggle
 * - Remember me functionality
 * - Loading, error, and success states
 *
 * Validates: Requirements 1.18-1.39
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FormField } from "@/app/components/ui/form";
import { useToast } from "@/app/lib/utils/toast";
import { useAuth } from "@/app/lib/auth/auth-provider";
import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
} from "@/app/lib/validators/auth-validators";
import Link from "next/link";

type FormMode = "login" | "signup";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: "student" | "instructor";
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { signIn, signUp, signInWithOAuth, isLoading } = useAuth();

  // Check for mode and redirect parameters
  const modeParam = searchParams.get("mode") as FormMode | null;
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<FormMode>(modeParam === "signup" ? "signup" : "login");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "student",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update password strength in real-time
  useEffect(() => {
    if (mode === "signup" && formData.password) {
      setPasswordStrength(getPasswordStrength(formData.password));
    }
  }, [formData.password, mode]);

  // Real-time email validation
  const validateEmailField = (email: string) => {
    if (!email) return;
    const emailError = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: emailError }));
  };

  // Real-time password validation
  const validatePasswordField = (password: string) => {
    if (!password) return;
    if (mode === "signup") {
      const passwordError = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  // Real-time confirm password validation
  const validateConfirmPasswordField = (confirmPassword: string) => {
    if (!confirmPassword) return;
    if (confirmPassword !== formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));

    // Real-time validation
    if (field === "email" && typeof value === "string") {
      validateEmailField(value);
    } else if (field === "password" && typeof value === "string") {
      validatePasswordField(value);
    } else if (field === "confirmPassword" && typeof value === "string") {
      validateConfirmPasswordField(value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    if (mode === "signup") {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
    } else {
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(formData.email, formData.password);
        addToast({
          type: "success",
          title: "Welcome back! Successfully logged in.",
        });
        router.push(redirectTo);
      } else {
        const result = await signUp(
          formData.email,
          formData.password,
          formData.role,
          formData.name
        );
        if (result.requiresEmailConfirmation) {
          addToast({
            type: "success",
            title: "Check your email - Confirmation link sent",
          });
          setMode("login");
        } else {
          addToast({
            type: "success",
            title: "Account created! Welcome to Knowlify.",
          });
          router.push(redirectTo);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setErrors({ general: errorMessage });
      addToast({
        type: "error",
        title: `${mode === "login" ? "Login failed" : "Signup failed"}: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      const { url } = await signInWithOAuth(provider, redirectTo);
      window.location.href = url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OAuth login failed";
      addToast({
        type: "error",
        title: `Authentication failed: ${errorMessage}`,
      });
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      name: "",
    }));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return "bg-error";
    if (passwordStrength < 3) return "bg-warning";
    if (passwordStrength < 4) return "bg-info";
    return "bg-success";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 2) return "Weak";
    if (passwordStrength < 3) return "Fair";
    if (passwordStrength < 4) return "Good";
    return "Strong";
  };

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
            {mode === "login" ? "Welcome back" : "Create your account"}
          </motion.h1>
          <motion.p
            className="text-foreground-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {mode === "login"
              ? "Login to continue your learning journey"
              : "Join thousands of learners and instructors"}
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-lg p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* General Error */}
              {errors.general && (
                <motion.div
                  className="mb-4 p-3 bg-error/10 border border-error rounded-xl"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-error-foreground">{errors.general}</p>
                </motion.div>
              )}

              {/* Name Field (Signup only) */}
              {mode === "signup" && (
                <FormField>
                  <Input
                    id="name"
                    type="text"
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    error={errors.name}
                    fullWidth
                    required
                    aria-label="Full name"
                  />
                </FormField>
              )}

              {/* Email Field */}
              <FormField>
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={(e) => validateEmailField(e.target.value)}
                  error={errors.email}
                  fullWidth
                  required
                  aria-label="Email address"
                />
              </FormField>

              {/* Password Field */}
              <FormField>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={(e) => validatePasswordField(e.target.value)}
                  error={errors.password}
                  fullWidth
                  required
                  aria-label="Password"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-foreground-secondary hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />

                {/* Password Strength Indicator (Signup only) */}
                {mode === "signup" && formData.password && (
                  <motion.div
                    className="mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-foreground-secondary">
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </FormField>

              {/* Confirm Password Field (Signup only) */}
              {mode === "signup" && (
                <FormField>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    label="Confirm Password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onBlur={(e) => validateConfirmPasswordField(e.target.value)}
                    error={errors.confirmPassword}
                    fullWidth
                    required
                    aria-label="Confirm password"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-foreground-secondary hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    }
                  />
                </FormField>
              )}

              {/* Role Selection (Signup only) */}
              {mode === "signup" && (
                <FormField>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange("role", "student")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.role === "student"
                          ? "border-foreground bg-muted"
                          : "border-border hover:border-border-secondary"
                      }`}
                      aria-pressed={formData.role === "student"}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎓</div>
                        <div className="font-medium text-foreground">Learn</div>
                        <div className="text-xs text-foreground-secondary">Student</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("role", "instructor")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.role === "instructor"
                          ? "border-foreground bg-muted"
                          : "border-border hover:border-border-secondary"
                      }`}
                      aria-pressed={formData.role === "instructor"}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">👨‍🏫</div>
                        <div className="font-medium text-foreground">Teach</div>
                        <div className="text-xs text-foreground-secondary">Instructor</div>
                      </div>
                    </button>
                  </div>
                </FormField>
              )}

              {/* Remember Me (Login only) */}
              {mode === "login" && (
                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2"
                      aria-label="Remember me"
                    />
                    <span className="text-sm text-foreground-secondary">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-foreground hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                loading={isSubmitting || isLoading}
                disabled={isSubmitting || isLoading}
                className="mb-4"
              >
                {mode === "login" ? "Login" : "Create account"}
              </Button>

              {/* Toggle Mode */}
              <p className="text-center text-sm text-foreground-secondary mb-6">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-foreground hover:underline font-medium"
                  disabled={isSubmitting || isLoading}
                >
                  {mode === "login" ? "Sign up" : "Login"}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-foreground-secondary">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading || isSubmitting}
              className="flex items-center justify-center gap-3 border border-border bg-card hover:bg-card-hover w-full py-2 rounded-xl transition-colors text-foreground"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              disabled={isLoading || isSubmitting}
              className="flex items-center justify-center gap-3 border border-border bg-card hover:bg-card-hover w-full py-2 rounded-xl transition-colors text-foreground"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Terms and Privacy */}
          <motion.p
            className="mt-6 text-xs text-center text-foreground-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-foreground hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-foreground hover:underline">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Icon components
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}
