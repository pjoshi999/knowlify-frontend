"use client";

import { Suspense } from "react";
import { PageTransition } from "./components/ui/page-transition";
import { NavigationProgress } from "./components/ui/navigation-progress";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <PageTransition>{children}</PageTransition>
    </>
  );
}
