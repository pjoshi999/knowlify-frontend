/**
 * Payment Intent API Route
 *
 * POST /api/payments/intent
 * Creates a Stripe payment intent for course purchase
 *
 * Requirements:
 * - Validate user authentication
 * - Check if user already enrolled in course
 * - Create payment record in database with 'pending' status
 * - Create Stripe payment intent
 * - Return client secret for frontend payment processing
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/auth/supabase-server";
import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

interface CreatePaymentIntentRequest {
  courseId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreatePaymentIntentRequest = await request.json();
    const { courseId, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!courseId || !successUrl || !cancelUrl) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "VALIDATION_ERROR",
          message: "Missing required fields: courseId, successUrl, and cancelUrl are required",
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createServerClient();

    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "UNAUTHORIZED",
          message: "Authentication required. Please log in to purchase courses.",
        },
        { status: 401 }
      );
    }

    // Check if course exists and get course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, name, price, instructor_id, published")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "NOT_FOUND",
          message: "Course not found",
        },
        { status: 404 }
      );
    }

    // Check if course is published
    if (!course.published) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "FORBIDDEN",
          message: "This course is not available for purchase",
        },
        { status: 403 }
      );
    }

    // Check if user is already enrolled in the course (duplicate purchase prevention)
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrollmentCheckError) {
      console.error("Error checking enrollment:", enrollmentCheckError);
      return NextResponse.json<ErrorResponse>(
        {
          error: "DATABASE_ERROR",
          message: "Failed to check enrollment status",
        },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "ALREADY_ENROLLED",
          message: "You are already enrolled in this course",
        },
        { status: 409 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Convert to cents
      currency: "usd",
      metadata: {
        courseId: course.id,
        courseName: course.name,
        userId: user.id,
        userEmail: user.email || "",
        successUrl,
        cancelUrl,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database with 'pending' status
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: course.price,
        currency: "usd",
        status: "pending",
        metadata: {
          successUrl,
          cancelUrl,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);

      // Cancel the Stripe payment intent since we couldn't create the database record
      await stripe.paymentIntents.cancel(paymentIntent.id);

      return NextResponse.json<ErrorResponse>(
        {
          error: "DATABASE_ERROR",
          message: "Failed to create payment record",
        },
        { status: 500 }
      );
    }

    // Return client secret for frontend payment processing
    return NextResponse.json<CreatePaymentIntentResponse>(
      {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment intent creation error:", error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "STRIPE_ERROR",
          message: error.message || "Payment processing error",
        },
        { status: 500 }
      );
    }

    // Handle generic errors
    return NextResponse.json<ErrorResponse>(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred while creating payment intent",
      },
      { status: 500 }
    );
  }
}
