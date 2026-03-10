/**
 * Stripe Webhook Handler
 *
 * POST /api/payments/webhook
 * Handles Stripe webhook events for payment confirmation
 *
 * This endpoint acts as a proxy that forwards webhook events to the backend API.
 * The backend API handles all payment processing and enrollment creation using PostgreSQL.
 *
 * Requirements:
 * - Forward webhook events to backend API at /api/payments/webhook
 * - Preserve raw body and stripe-signature header for backend verification
 * - Return backend response to Stripe
 */

import { NextRequest, NextResponse } from "next/server";

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ErrorResponse {
  error: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json<ErrorResponse>(
        {
          error: "INVALID_REQUEST",
          message: "Missing stripe-signature header",
        },
        { status: 400 }
      );
    }

    // Log webhook event for debugging
    console.log("Forwarding webhook to backend:", {
      backendUrl: `${backendApiUrl}/payments/webhook`,
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    // Forward the webhook to the backend API
    const response = await fetch(`${backendApiUrl}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: body,
    });

    // Get the response from the backend
    const responseData = await response.json();

    // Log the result
    if (response.ok) {
      console.log("Webhook processed successfully by backend:", responseData);
    } else {
      console.error("Backend webhook processing failed:", {
        status: response.status,
        data: responseData,
      });
    }

    // Return the backend response to Stripe
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("Webhook proxy error:", error);

    // Handle fetch errors
    if (error instanceof Error) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "BACKEND_ERROR",
          message: `Failed to forward webhook to backend: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // Handle generic errors
    return NextResponse.json<ErrorResponse>(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing webhook",
      },
      { status: 500 }
    );
  }
}
