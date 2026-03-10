"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { ThemeToggle } from "../ui/theme-toggle";
import { Button } from "../ui/button";
import { useAuthStore } from "@/app/lib/stores/auth";

interface HeaderProps {
  className?: string;
}

// NavLink component - moved outside to avoid React Compiler error
function NavLink({
  href,
  children,
  onClick,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors relative ${
        isActive ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
      }`}
    >
      {children}
      {isActive && <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-white" />}
    </Link>
  );
}

/**
 * Enhanced navigation header component
 * Features:
 * - Logo and branding
 * - Navigation links (Home, Library, Dashboard)
 * - User menu with profile and logout
 * - Theme toggle button
 * - Responsive hamburger menu for mobile
 * - Active route highlighting
 *
 * Validates: Requirements 15.8
 */
export function Header({ className = "" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is intentional for hydration - we need to wait for client mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  // Helper function to check if a route is active
  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "User";
  const roleLabel = user?.role === "instructor" ? "Instructor" : "Learner";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Branding */}
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black font-bold text-lg">
              C
            </div>
            <span className="text-xl font-bold text-foreground">Knowlify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink href="/courses" isActive={isActiveRoute("/courses")}>
              Courses
            </NavLink>
            {mounted && user?.role === "instructor" && (
              <NavLink href="/instructor/dashboard" isActive={isActiveRoute("/instructor")}>
                Instructor
              </NavLink>
            )}
            {mounted && user && (
              <NavLink href="/profile" isActive={isActiveRoute("/profile")}>
                Profile
              </NavLink>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {!mounted ? (
                <div className="w-[120px] h-9" />
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-card-hover transition-colors"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-medium text-sm">
                        {displayName[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-foreground-secondary transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg py-1">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-foreground-secondary truncate">{user.email}</p>
                        <p className="text-xs text-foreground-secondary mt-1">{roleLabel}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-foreground-secondary hover:bg-card-hover hover:text-foreground transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-foreground-secondary hover:bg-card-hover hover:text-foreground transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground-secondary hover:text-foreground transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/courses"
                className={`text-sm font-medium transition-colors ${
                  isActiveRoute("/courses")
                    ? "text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </Link>
              {mounted && user?.role === "instructor" && (
                <>
                  <Link
                    href="/instructor/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      isActiveRoute("/instructor")
                        ? "text-foreground"
                        : "text-foreground-secondary hover:text-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Instructor
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-border flex flex-col space-y-2">
                {!mounted ? (
                  <div className="h-24" />
                ) : user ? (
                  <>
                    <div className="px-3 py-2 bg-card rounded-lg">
                      <div className="mb-2 flex items-center gap-2">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black text-xs font-semibold">
                            {displayName[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                      </div>
                      <p className="text-xs text-foreground-secondary truncate">{user.email}</p>
                      <p className="text-xs text-foreground-secondary mt-1">{roleLabel}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                        Profile Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
