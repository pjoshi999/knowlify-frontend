"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/app/lib/stripe/client";
import { CheckoutForm } from "@/app/components/features/payment/CheckoutForm";
import { Spinner } from "@/app/components/ui/loading";
import { useCourse } from "@/app/lib/hooks/use-course";
import { Container } from "@/app/components/layouts/Container";
import { formatPrice } from "@/app/lib/utils/price";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const clientSecret = searchParams.get("client_secret");
  const paymentIntentId = searchParams.get("payment_intent");

  const [stripePromise] = useState(() => getStripe());
  const { data: courseData, isLoading: courseLoading } = useCourse({ courseId });

  useEffect(() => {
    if (!clientSecret) {
      // Redirect back to course page if no client secret
      router.push(`/courses/${courseId}`);
    }
  }, [clientSecret, courseId, router]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const course = courseData?.course;

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <button
            onClick={() => router.push("/courses")}
            className="text-foreground-secondary hover:text-foreground"
          >
            Return to courses
          </button>
        </div>
      </div>
    );
  }

  // Only render Elements when we have a valid clientSecret
  if (!clientSecret || typeof clientSecret !== "string" || !clientSecret.includes("_secret_")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid payment session</h1>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="text-foreground-secondary hover:text-foreground"
          >
            Return to course
          </button>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "hsl(var(--accent))",
        colorBackground: "hsl(var(--card))",
        colorText: "hsl(var(--foreground))",
        colorDanger: "hsl(var(--error))",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "12px",
      },
    },
  };

  return (
    <div className="min-h-screen relative py-12">
      <Container>
        <div className="mx-auto">
          {/* Course Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Purchase</h1>
            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">{course.name}</h2>
              <p className="text-foreground-secondary mb-4">{course.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-foreground-secondary">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Stripe Payment Form */}
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              courseId={courseId}
              courseName={course.name}
              amount={course.price}
              paymentIntentId={paymentIntentId || undefined}
            />
          </Elements>
        </div>
      </Container>
    </div>
  );
}
