import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forceReauth = request.nextUrl.searchParams.get("reauth") === "1";

  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for server-side auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || user?.app_metadata?.role;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/upload", "/learn", "/instructor", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const roleOnboardingRoute = pathname.startsWith("/onboarding/role");

  // Instructor-only routes
  const instructorRoutes = ["/upload", "/instructor"];
  const isInstructorRoute = instructorRoutes.some((route) => pathname.startsWith(route));

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated but role is missing, force role onboarding before protected pages
  if (isProtectedRoute && session && !userRole && !roleOnboardingRoute) {
    const redirectUrl = new URL("/onboarding/role", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing an instructor route without instructor role, redirect to home
  if (isInstructorRoute && session) {
    if (userRole !== "instructor") {
      // Redirect to home with error message
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && session && !forceReauth) {
    if (!userRole) {
      return NextResponse.redirect(new URL("/onboarding/role", request.url));
    }
    if (String(userRole).toLowerCase() === "instructor") {
      return NextResponse.redirect(new URL("/instructor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
