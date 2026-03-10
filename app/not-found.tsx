/**
 * 404 Not Found Page
 *
 * Custom 404 page displayed when a route is not found.
 * Provides helpful navigation options to get users back on track.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* 404 Illustration */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block"
          >
            <svg
              className="w-64 h-64 mx-auto text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>
        </div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-lg text-foreground-secondary mb-8 max-w-md mx-auto">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or
            deleted.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button variant="primary" size="lg" onClick={() => router.push("/")}>
            Go to Homepage
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.back()}>
            Go Back
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <p className="text-sm text-foreground-secondary mb-4">
            Here are some helpful links instead:
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/courses"
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Browse Courses
            </Link>
            <Link
              href="/dashboard"
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              My Library
            </Link>
            <Link
              href="/upload"
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Upload Course
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
