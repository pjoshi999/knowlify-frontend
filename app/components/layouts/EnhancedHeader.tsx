"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Container } from "./Container";
import { ThemeToggle } from "../ui/theme-toggle";
import { Button } from "../ui/button";
import { useAuthStore } from "@/app/lib/stores/auth";
import { useSearchSuggestions } from "@/app/lib/hooks/use-search";
import { SearchModal } from "../features/search-modal";

interface EnhancedHeaderProps {
  className?: string;
}

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
      {isActive && <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-foreground" />}
    </Link>
  );
}

export function EnhancedHeader({ className = "" }: EnhancedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Get search suggestions
  const { data: suggestions = [] } = useSearchSuggestions(searchQuery, {
    enabled: searchQuery.length > 2,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Cmd/Ctrl+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle scroll for resizable navbar - trigger on any scroll
  useEffect(() => {
    const handleScroll = () => {
      // Trigger resizable header on any scroll, even minimal
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
    };

    handleScroll(); // Check initial scroll position
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/courses?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (userMenuOpen || searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen, searchOpen]);

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
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent border-b border-transparent"
      } ${className}`}
    >
      <Container>
        <div
          className={`flex items-center justify-between transition-all duration-500 ease-in-out ${
            isScrolled ? "h-14 py-0" : "h-20 py-2"
          }`}
        >
          {/* Logo */}
          <Link
            href="/courses"
            className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300"
          >
            <div
              className={`flex items-center justify-center rounded-xl font-bold transition-all duration-500 ${
                isScrolled
                  ? "w-7 h-7 text-base bg-foreground text-background"
                  : "w-9 h-9 text-lg bg-foreground/90 text-background"
              }`}
            >
              K
            </div>
            <span
              className={`font-bold transition-all duration-500 ${
                isScrolled ? "text-lg text-foreground" : "text-xl text-foreground"
              }`}
            >
              Knowlify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink href="/courses" isActive={isActiveRoute("/courses")}>
              Courses
            </NavLink>
            {mounted && user && (
              <NavLink href="/dashboard" isActive={isActiveRoute("/dashboard")}>
                Dashboard
              </NavLink>
            )}
            {mounted && user?.role === "instructor" && (
              <NavLink href="/instructor/dashboard" isActive={isActiveRoute("/instructor")}>
                Instructor
              </NavLink>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Search Icon Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <ThemeToggle />

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {!mounted ? (
                <div className="w-[120px] h-9" />
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-card-hover transition-colors"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={32}
                        height={32}
                        className={`profile-image border-2 border-border/50 transition-all duration-300 ${
                          isScrolled ? "w-7 h-7" : "w-8 h-8"
                        }`}
                      />
                    ) : (
                      <div
                        className={`flex items-center justify-center profile-image bg-foreground text-background font-medium text-sm transition-all duration-300 ${
                          isScrolled ? "w-7 h-7" : "w-8 h-8"
                        }`}
                      >
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

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1">
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
              className="md:hidden p-2 text-foreground hover:text-foreground bg-card hover:bg-card-hover border border-border rounded-xl transition-colors"
              onClick={toggleMobileMenu}
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

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 bg-card/95 backdrop-blur-md mx-4 mt-4 rounded-xl border border-border">
              <div className="relative px-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                  className="w-full h-10 px-4 pr-10 bg-muted border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                  autoFocus
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted-foreground/10 rounded-full transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Mobile Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 mx-4 bg-muted border border-border rounded-xl py-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-card transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 bg-card/95 backdrop-blur-md mx-4 mt-4 rounded-xl border border-border">
              <nav className="flex flex-col space-y-4 px-4">
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
                {mounted && user && (
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      isActiveRoute("/dashboard")
                        ? "text-foreground"
                        : "text-foreground-secondary hover:text-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {mounted && user?.role === "instructor" && (
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
                )}
                <div className="pt-4 border-t border-border flex flex-col space-y-2">
                  {!mounted ? (
                    <div className="h-24" />
                  ) : user ? (
                    <>
                      <div className="px-3 py-2 bg-muted rounded-xl">
                        <div className="mb-2 flex items-center gap-2">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName}
                              width={28}
                              height={28}
                              className="h-7 w-7 profile-image border-2 border-border/50"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center profile-image bg-foreground text-background text-xs font-semibold">
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
          </div>
        )}
      </Container>

      {/* Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </header>
  );
}
