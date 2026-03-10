/**
 * Protected Route Components
 *
 * Provides route protection with:
 * - Authentication checks
 * - Role-based access control
 * - Loading states during auth initialization
 * - Automatic redirects for unauthorized access
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth/auth-provider";
import type { UserRole } from "@/app/lib/auth/auth-service";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * URL to redirect to when user is not authenticated
   * @default '/login'
   */
  redirectTo?: string;
  /**
   * Whether to show loading state during auth check
   * @default true
   */
  showLoading?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Protected Route Component
 *
 * Wraps content that requires authentication.
 * Redirects to login page if user is not authenticated.
 * Shows loading state while checking authentication.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardContent />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  showLoading = true,
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) {
      return;
    }

    // Redirect if not authenticated
    if (!user) {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(redirectUrl);
    }
  }, [user, isInitialized, router, redirectTo]);

  // Show loading state while checking auth
  if (!isInitialized || isLoading) {
    if (!showLoading) {
      return null;
    }

    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

interface RoleProtectedRouteProps extends ProtectedRouteProps {
  /**
   * Required role to access the route
   */
  requiredRole: UserRole;
  /**
   * URL to redirect to when user doesn't have required role
   * @default '/'
   */
  unauthorizedRedirectTo?: string;
  /**
   * Custom unauthorized component
   */
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Role Protected Route Component
 *
 * Wraps content that requires a specific role.
 * First checks authentication, then checks role.
 * Redirects to home page if user doesn't have required role.
 *
 * @example
 * ```tsx
 * <RoleProtectedRoute requiredRole="instructor">
 *   <InstructorDashboard />
 * </RoleProtectedRoute>
 * ```
 */
export function RoleProtectedRoute({
  children,
  requiredRole,
  unauthorizedRedirectTo = "/",
  unauthorizedComponent,
  ...protectedRouteProps
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) {
      return;
    }

    // Check role after authentication is confirmed
    if (user && user.role !== requiredRole) {
      router.push(unauthorizedRedirectTo);
    }
  }, [user, isInitialized, requiredRole, router, unauthorizedRedirectTo]);

  // First, check authentication
  return (
    <ProtectedRoute {...protectedRouteProps}>
      {/* Then check role */}
      {user && user.role === requiredRole ? (
        <>{children}</>
      ) : (
        <>
          {unauthorizedComponent || (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">Unauthorized</h1>
                <p className="text-foreground-secondary">
                  You don&apos;t have permission to access this page.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </ProtectedRoute>
  );
}

/**
 * Higher-order component to protect a page component
 *
 * @example
 * ```tsx
 * const ProtectedDashboard = withAuth(DashboardPage);
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, "children">
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Higher-order component to protect a page component with role check
 *
 * @example
 * ```tsx
 * const ProtectedInstructorDashboard = withRole(InstructorDashboardPage, 'instructor');
 * ```
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole,
  options?: Omit<RoleProtectedRouteProps, "children" | "requiredRole">
) {
  return function RoleProtectedComponent(props: P) {
    return (
      <RoleProtectedRoute requiredRole={requiredRole} {...options}>
        <Component {...props} />
      </RoleProtectedRoute>
    );
  };
}
