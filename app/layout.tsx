import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/providers/theme-provider";
import { AuthProvider } from "./lib/auth/auth-provider";
import { SimpleQueryProvider } from "./lib/query/provider";
import { Toaster } from "./components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true, // Preload font files
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true, // Preload font files
});

export const metadata: Metadata = {
  title: "Course Marketplace Platform",
  description: "Discover, purchase, and learn from online courses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts - Next.js will handle font file preloading via next/font */}
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for likely external resources */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />

        {/* Preload critical CSS is handled by Next.js automatically */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background relative`}>
        <div className="relative z-10">
          <ThemeProvider>
            <SimpleQueryProvider>
              <AuthProvider>{children}</AuthProvider>
              <Toaster />
            </SimpleQueryProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
