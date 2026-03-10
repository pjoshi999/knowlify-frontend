"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/lib/auth/auth-provider";

export default function RoleOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/courses";
  const { user, isInitialized, updateRole, signOut } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isInitialized && !user) {
    router.replace("/login");
    return null;
  }

  const saveRole = async (role: "student" | "instructor") => {
    try {
      setIsSaving(true);
      setError(null);
      await updateRole(role);
      router.replace(nextPath.startsWith("/") ? nextPath : "/courses");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-[30%] rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Choose your role</h1>
        <p className="text-zinc-400 mb-8">
          This decides your default experience. You can still browse courses either way.
        </p>

        <div className="grid gap-4">
          <Button
            variant="primary"
            size="md"
            disabled={isSaving}
            loading={isSaving}
            onClick={() => saveRole("student")}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 text-base font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            I am a Learner
          </Button>
          <Button
            variant="accent"
            size="md"
            disabled={isSaving}
            onClick={() => saveRole("instructor")}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 text-base font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            I am an Instructor
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          className="mt-8 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-200 w-full text-center"
          onClick={() => void signOut()}
          disabled={isSaving}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
