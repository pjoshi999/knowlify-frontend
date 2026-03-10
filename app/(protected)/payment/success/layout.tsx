"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/app/lib/stripe/client";
import { useState } from "react";

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  const [stripePromise] = useState(() => getStripe());

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
