import { EnhancedHeader } from "@/app/components/layouts/EnhancedHeader";
import { Footer } from "@/app/components/layouts/Footer";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Enhanced Header with Search */}
      <EnhancedHeader />

      {/* Main content */}
      <main className="relative z-10 pt-20">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
