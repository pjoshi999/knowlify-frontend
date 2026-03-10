/**
 * Payment API Service
 *
 * Service layer for Stripe payment operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RefundRequest,
  RefundResponse,
} from "./service-types";

/**
 * Create a payment intent for course purchase
 */
export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  const response = await apiClient.post("/payments/intent", {
    courseId: data.courseId,
  });
  return unwrapApiData<CreatePaymentIntentResponse>(response.data);
}

/**
 * Confirm a payment after Stripe processing
 */
export async function confirmPayment(data: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
  const response = await apiClient.get(`/payments/${data.paymentIntentId}`);
  const payment = unwrapApiData<any>(response.data);
  const status = String(payment?.status || "").toUpperCase();
  return {
    success: status === "COMPLETED",
  };
}

/**
 * Request a refund for a course purchase
 */
export async function requestRefund(data: RefundRequest): Promise<RefundResponse> {
  const paymentId = (data as RefundRequest & { paymentId?: string }).paymentId || data.enrollmentId;
  const response = await apiClient.post(`/payments/${paymentId}/refund`, {
    reason: data.reason || "requested_by_user",
  });
  unwrapApiData<{ message?: string }>(response.data);
  return {
    refundId: paymentId,
    status: "pending",
  };
}
