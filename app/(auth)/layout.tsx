/**
 * Authentication Layout
 *
 * Provides a consistent layout for authentication pages with:
 * - Dark theme background
 * - Centered content
 * - Responsive design
 *
 * Validates: Requirements 14.1-14.7, 15.1-15.4
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
