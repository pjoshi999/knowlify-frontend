/**
 * Lazy-loaded Payment Components
 *
 * Dynamically imports Stripe payment components to reduce initial bundle size.
 * These components include the heavy Stripe.js library.
 *
 * Validates: Requirements 18.7, 18.10
 */

"use client";

import { lazy, Suspense } from "react";

// Lazy load payment components
const CheckoutForm = lazy(() =>
  import("./CheckoutForm").then((module) => ({ default: module.CheckoutForm }))
);

const PaymentForm = lazy(() =>
  import("./PaymentForm").then((module) => ({ default: module.PaymentForm }))
);

const RefundRequestForm = lazy(() =>
  import("./RefundRequestForm").then((module) => ({ default: module.RefundRequestForm }))
);

const RefundHistory = lazy(() =>
  import("./RefundHistory").then((module) => ({ default: module.RefundHistory }))
);

// Loading skeletons
function PaymentFormSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="space-y-4">
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    </div>
  );
}

function RefundFormSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/2 mb-4" />
      <div className="space-y-4">
        <div className="h-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    </div>
  );
}

function RefundHistorySkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

// Lazy-loaded components with Suspense boundaries
interface CheckoutFormLazyProps {
  courseId: string;
  courseName: string;
  coursePrice: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutFormLazy(props: CheckoutFormLazyProps) {
  return (
    <Suspense fallback={<PaymentFormSkeleton />}>
      <CheckoutForm {...props} />
    </Suspense>
  );
}

interface PaymentFormLazyProps {
  courseId: string;
  courseName: string;
  amount: number;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentFormLazy(props: PaymentFormLazyProps) {
  return (
    <Suspense fallback={<PaymentFormSkeleton />}>
      <PaymentForm {...props} />
    </Suspense>
  );
}

interface RefundRequestFormLazyProps {
  enrollment: any; // TODO: Import proper Enrollment type
  onSuccess: () => void;
  onCancel: () => void;
}

export function RefundRequestFormLazy(props: RefundRequestFormLazyProps) {
  return (
    <Suspense fallback={<RefundFormSkeleton />}>
      <RefundRequestForm {...props} />
    </Suspense>
  );
}

interface RefundHistoryLazyProps {
  instructorId?: string;
  refunds: any[]; // TODO: Import proper Refund type
}

export function RefundHistoryLazy(props: RefundHistoryLazyProps) {
  return (
    <Suspense fallback={<RefundHistorySkeleton />}>
      <RefundHistory {...props} />
    </Suspense>
  );
}
