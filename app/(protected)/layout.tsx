/**
 * Protected Routes Layout
 *
 * Layout for all protected routes.
 * Provides consistent structure for authenticated pages.
 */

import { EnhancedHeader } from "@/app/components/layouts/EnhancedHeader";
import { Footer } from "@/app/components/layouts/Footer";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <EnhancedHeader />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
