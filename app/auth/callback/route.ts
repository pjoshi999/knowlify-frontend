import { createServerClient } from "@/app/lib/auth/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/courses";

  // Handle errors from Supabase
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  // Exchange code for session
  if (code) {
    const supabase = await createServerClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Failed to exchange code for session:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    // Redirect based on type
    if (type === "recovery") {
      // Password reset - redirect to reset password page with token
      return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role || user?.app_metadata?.role;

    if (!role) {
      return NextResponse.redirect(
        new URL(`/onboarding/role?next=${encodeURIComponent(next)}`, requestUrl.origin)
      );
    }

    const safeNext = next.startsWith("/") ? next : "/courses";
    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
