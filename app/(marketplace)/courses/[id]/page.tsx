"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useCourse } from "@/app/lib/hooks/use-course";
import { useReviews } from "@/app/lib/hooks/use-reviews";
import {
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/app/lib/hooks/use-review-mutations";
import { useAuthStore } from "@/app/lib/stores/auth";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/loading";
import { ErrorMessage } from "@/app/components/ui/error-message";
import { ReviewForm } from "@/app/components/features/review-form";
import { ReviewList } from "@/app/components/features/review-list";
import { RatingDistribution } from "@/app/components/features/rating-distribution";
import { OptimizedImage } from "@/app/components/ui/optimized-image";
import { formatPrice } from "@/app/lib/utils/price";
import apiClient, { getErrorMessage } from "@/app/lib/api/client";
import { useState, useEffect } from "react";
import type { Review } from "@/app/lib/api/service-types";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const paymentStatus = searchParams.get("payment");

  const {
    data: courseData,
    isLoading: courseLoading,
    error: courseError,
    refetch: refetchCourse,
  } = useCourse({ courseId });
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({ courseId });
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(paymentStatus === "success");

  // Refetch course data immediately when payment success is detected
  useEffect(() => {
    if (paymentStatus === "success") {
      refetchCourse();
    }
  }, [paymentStatus, refetchCourse]);

  // Auto-trigger purchase flow if user returns from login
  useEffect(() => {
    const shouldPurchase = searchParams.get("purchase");
    if (shouldPurchase === "true" && user && courseData && !courseData.isEnrolled && !isPurchasing) {
      // Remove the purchase parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("purchase");
      router.replace(newUrl.pathname + newUrl.search);
      
      // Trigger purchase flow
      const triggerPurchase = async () => {
        if (!user) {
          const returnUrl = `/courses/${courseId}?purchase=true`;
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
          return;
        }

        setIsPurchasing(true);
        try {
          const response = await apiClient.post("/payments/intent", {
            courseId,
          });

          const paymentData = response.data.data || response.data;
          const { clientSecret, paymentIntentId } = paymentData;

          if (!clientSecret) {
            throw new Error("No client secret received from payment service");
          }

          router.push(
            `/checkout/${courseId}?client_secret=${clientSecret}&payment_intent=${paymentIntentId}`
          );
        } catch (error) {
          console.error("Purchase error:", error);
          const errorMessage = getErrorMessage(error);
          alert(errorMessage || "Failed to initiate purchase. Please try again.");
        } finally {
          setIsPurchasing(false);
        }
      };
      
      triggerPurchase();
    }
  }, [user, courseData, isPurchasing, searchParams, router, courseId]);

  // Auto-dismiss payment success message and clean URL
  useEffect(() => {
    if (paymentSuccess && paymentStatus === "success") {
      const timer = setTimeout(() => {
        setPaymentSuccess(false);
        // Clean the URL by removing the payment query param
        router.replace(`/courses/${courseId}`);
        // Refetch course data to get updated enrollment status
        refetchCourse();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, paymentStatus, router, courseId, refetchCourse]);

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (courseError || !courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          error={courseError || new Error("Failed to load course")}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const { course, sections, instructor, isEnrolled, progress } = courseData;
  const { reviews = [], averageRating = 0, totalReviews = 0 } = reviewsData || {};

  // Check if current user has already reviewed this course
  const userReview = user ? reviews.find((review) => review.userId === user.id) : null;
  const canReview = isEnrolled && !userReview;

  const handlePurchase = async () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login with return URL to continue purchase after login
      const returnUrl = `/courses/${courseId}?purchase=true`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsPurchasing(true);
    try {
      // Create payment intent using API client
      const response = await apiClient.post("/payments/intent", {
        courseId,
      });

      const paymentData = response.data.data || response.data;
      const { clientSecret, paymentIntentId } = paymentData;

      if (!clientSecret) {
        throw new Error("No client secret received from payment service");
      }

      // Navigate to checkout page with client secret and payment intent ID
      router.push(
        `/checkout/${courseId}?client_secret=${clientSecret}&payment_intent=${paymentIntentId}`
      );
    } catch (error) {
      console.error("Purchase error:", error);
      const errorMessage = getErrorMessage(error);
      alert(errorMessage || "Failed to initiate purchase. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGoToCourse = () => {
    // Navigate to course player - it will automatically resume from last accessed section
    router.push(`/learn/${courseId}`);
  };

  const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
    try {
      if (editingReview) {
        // Update existing review
        await updateReviewMutation.mutateAsync({
          reviewId: editingReview.id,
          courseId,
          data: {
            rating: data.rating,
            comment: data.comment,
          },
        });
      } else {
        // Create new review
        await createReviewMutation.mutateAsync({
          courseId,
          rating: data.rating,
          comment: data.comment,
        });
      }

      setShowReviewForm(false);
      setEditingReview(null);
      setReviewSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (error) {
      // Error is handled by the form component
      throw error;
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteReviewMutation.mutateAsync({
        reviewId,
        courseId,
      });

      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch {
      alert("Failed to delete review. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  return (
    <>
      <div className="bg-background">
        {/* Hero Section - Theme Compatible */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <button
                onClick={() => router.push("/courses")}
                className="hover:text-foreground transition-colors"
              >
                Courses
              </button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-foreground">{course.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Course Info */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                    {course.name}
                  </h1>

                  <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

                  {/* Rating, Students, Instructor */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 font-bold">
                        {averageRating > 0 ? averageRating.toFixed(1) : "New"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <svg
                            key={index}
                            className={`w-4 h-4 ${
                              index < Math.round(averageRating)
                                ? "text-yellow-500 fill-current"
                                : "text-muted fill-current"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        ({totalReviews} ratings)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-foreground">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span className="text-sm">{course.enrollmentCount} students</span>
                    </div>
                  </div>

                  {/* Instructor Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">
                        {instructor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <p className="text-foreground font-medium">{instructor.name}</p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Last updated {new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Course Preview (Desktop Only - will be sticky sidebar below) */}
              <div className="hidden lg:block">
                {/* Placeholder for spacing - actual card is sticky below */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Success Message */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 flex items-center gap-3"
          >
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">Payment successful!</p>
              <p className="text-sm">You now have access to this course. Start learning now!</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Master the fundamentals",
                  "Build real-world projects",
                  "Learn industry best practices",
                  "Get hands-on experience",
                  "Understand core concepts",
                  "Apply your knowledge",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Course Content Section - Expandable Curriculum */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Course content</h2>
              <div className="mb-4 text-sm text-muted-foreground">
                {sections.length} sections •{" "}
                {sections.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)} min total length
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {sections.length > 0 ? (
                  sections.map((section, index) => (
                    <div key={section.id} className="border-b border-border last:border-b-0">
                      <button
                        className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors text-left"
                        onClick={() => {}}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Section {index + 1}: {section.title}
                            </h3>
                            {section.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {section.durationMinutes > 0 && `${section.durationMinutes} min`}
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No sections available yet
                  </div>
                )}
              </div>
            </motion.section>

            {/* Requirements Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Requirements</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-foreground">
                  <span className="text-muted-foreground">•</span>
                  <span>No prior experience required</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <span className="text-muted-foreground">•</span>
                  <span>A computer with internet access</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <span className="text-muted-foreground">•</span>
                  <span>Willingness to learn</span>
                </li>
              </ul>
            </motion.section>

            {/* Description Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
              <div className="text-foreground space-y-4">
                <p>{course.description}</p>
              </div>
            </motion.section>

            {/* Instructor Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Instructor</h2>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-foreground">
                      {instructor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{instructor.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{instructor.email}</p>
                    {instructor.bio && <p className="text-foreground">{instructor.bio}</p>}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Reviews Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Student feedback</h2>

              {/* Rating Distribution */}
              {totalReviews > 0 && (
                <div className="mb-6">
                  <RatingDistribution
                    reviews={reviews}
                    averageRating={averageRating}
                    totalReviews={totalReviews}
                  />
                </div>
              )}

              {/* Success Message */}
              {reviewSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400"
                >
                  ✓{" "}
                  {editingReview
                    ? "Your review has been updated successfully!"
                    : deleteReviewMutation.isSuccess
                      ? "Your review has been deleted successfully!"
                      : "Your review has been submitted successfully!"}
                </motion.div>
              )}

              {/* Review Form for Enrolled Students */}
              {canReview && !showReviewForm && (
                <div className="mb-6">
                  <Button
                    className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Write a Review
                  </Button>
                </div>
              )}

              {showReviewForm && (canReview || editingReview) && (
                <div className="mb-6">
                  <ReviewForm
                    courseId={courseId}
                    onSubmit={handleReviewSubmit}
                    onCancel={handleCancelEdit}
                    initialRating={editingReview?.rating}
                    initialComment={editingReview?.comment}
                    isEditing={!!editingReview}
                  />
                </div>
              )}

              {/* Message for non-enrolled users */}
              {!isEnrolled && (
                <div className="mb-6 p-4 bg-card border border-border rounded-lg text-muted-foreground text-center">
                  Purchase this course to leave a review
                </div>
              )}

              {/* Message if user already reviewed */}
              {userReview && !editingReview && (
                <div className="mb-6 p-4 bg-card border border-border rounded-lg text-foreground text-center">
                  You have already reviewed this course. You can edit or delete your review below.
                </div>
              )}

              {/* Review List */}
              <ReviewList
                reviews={reviews}
                isLoading={reviewsLoading}
                emptyMessage="No reviews yet. Be the first to review this course!"
                currentUserId={user?.id}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            </motion.section>
          </div>

          {/* Right Column - Sticky Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-4"
            >
              <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {/* Video Preview */}
                <div className="relative w-full aspect-video bg-muted">
                  {course.thumbnailUrl ? (
                    <OptimizedImage
                      src={course.thumbnailUrl}
                      alt={course.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Price - Large, Prominent */}
                  <div className="text-3xl font-bold text-foreground mb-4">
                    {formatPrice(course.price)}
                  </div>

                  {/* Action Buttons */}
                  {isEnrolled ? (
                    <>
                      <Button
                        size="lg"
                        className="w-full mb-3 bg-foreground text-background hover:bg-foreground/90"
                        onClick={handleGoToCourse}
                      >
                        {progress && progress > 0 ? "Continue Learning" : "Start Learning"}
                      </Button>
                      {progress !== undefined && progress > 0 && (
                        <div className="text-sm text-center text-muted-foreground">
                          {progress}% Complete
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        size="md"
                        className="w-full mb-3 bg-foreground text-background hover:bg-foreground/90"
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? "Processing.." : "Enroll Now"}
                      </Button>
                    </>
                  )}

                  {/* This Course Includes */}
                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <p className="font-semibold text-foreground mb-4">This course includes:</p>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{sections.length} sections</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Access on mobile and desktop</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
