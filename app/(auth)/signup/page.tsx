/**
 * Signup Page
 *
 * Redirects to login page with signup mode
 * This allows for separate /signup and /login URLs while using the same component
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page - the login page will handle both modes
    router.replace("/login?mode=signup");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
        <p className="mt-4 text-foreground-secondary">Redirecting..</p>
      </div>
    </div>
  );
}
