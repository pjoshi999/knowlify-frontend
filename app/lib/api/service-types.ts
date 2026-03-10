/**
 * API Service Types
 *
 * Type definitions for all API service methods based on the design document
 */

// ============================================================================
// Core Data Models
// ============================================================================

export type UserRole = "instructor" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  instructorId: string;
  instructorName?: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  category?: string;
  published: boolean;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  durationMinutes: number;
  createdAt: Date;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  bio?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentId: string;
  progressPercentage: number;
  enrolledAt: Date;
  lastAccessed?: Date;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, "id" | "name">;
}

export interface SearchFilters {
  priceRange?: [number, number];
  rating?: number;
  category?: string;
}

// ============================================================================
// Course API Types
// ============================================================================

export interface GetCoursesParams {
  page?: number;
  limit?: number;
  sortBy?: "date" | "price" | "rating";
  filters?: SearchFilters;
}

export interface GetCoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface GetCourseResponse {
  course: Course;
  sections: CourseSection[];
  instructor: Instructor;
  isEnrolled: boolean;
  progress?: number;
  enrollmentId?: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  thumbnail?: File;
  category?: string;
}

export interface CreateCourseResponse {
  courseId: string;
  shareableLink: string;
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  price?: number;
  thumbnailUrl?: string;
  published?: boolean;
}

export interface DeleteCourseResponse {
  success: boolean;
}

// ============================================================================
// Enrollment API Types
// ============================================================================

export interface CreateEnrollmentRequest {
  courseId: string;
  paymentIntentId: string;
}

export interface CreateEnrollmentResponse {
  enrollmentId: string;
  course: Course;
}

export interface GetEnrollmentsResponse {
  enrollments: Enrollment[];
}

export interface UpdateProgressRequest {
  sectionId: string;
  completed: boolean;
  timeSpent?: number;
}

export interface UpdateProgressResponse {
  progress: number;
  completedSections: string[];
}

// ============================================================================
// Review API Types
// ============================================================================

export interface CreateReviewRequest {
  courseId: string;
  rating: number;
  comment: string;
}

export interface CreateReviewResponse {
  reviewId: string;
  review: Review;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface DeleteReviewResponse {
  success: boolean;
}

export interface GetReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// ============================================================================
// Search API Types
// ============================================================================

export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: Course[];
  total: number;
  suggestions: string[];
}

export interface SearchSuggestionsParams {
  query: string;
  limit?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

// ============================================================================
// Payment API Types
// ============================================================================

export interface CreatePaymentIntentRequest {
  courseId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  enrollmentId?: string;
}

export interface RefundRequest {
  enrollmentId: string;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: "succeeded" | "pending" | "failed";
}

// ============================================================================
// Instructor API Types
// ============================================================================

export interface CourseStats {
  courseId: string;
  courseName: string;
  enrollments: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
}

export interface GetInstructorStatsResponse {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  courseStats: CourseStats[];
}

export interface GetInstructorCoursesResponse {
  courses: Course[];
}

export interface Transaction {
  id: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  studentName: string;
  createdAt: Date;
}

export interface GetTransactionsParams {
  startDate?: string;
  endDate?: string;
  courseId?: string;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
  total: number;
}

// ============================================================================
// Course Parser API Types
// ============================================================================

export type AssetType = "video" | "document" | "quiz" | "exam";

export interface CourseAsset {
  id: string;
  type: AssetType;
  filename: string;
  path: string;
  size: number;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  duration?: number; // For videos (seconds)
  pageCount?: number; // For documents
  resolution?: string; // For videos
  format?: string;
  mimeType: string;
}

export interface ParsedSection {
  title: string;
  description?: string;
  orderIndex: number;
  assets: CourseAsset[];
}

export interface CourseOutline {
  sections: ParsedSection[];
  totalAssets: number;
  totalDuration?: number;
}

export interface ParseError {
  filename: string;
  error: string;
  type: "validation" | "parsing" | "unsupported";
}

export interface ParseCourseRequest {
  files: File[];
}

export interface ParseCourseResponse {
  outline: CourseOutline;
  errors: ParseError[];
  status: "success" | "partial" | "failed";
}

// ============================================================================
// Upload Session API Types
// ============================================================================

export interface CreateUploadSessionResponse {
  sessionId: string;
}

export interface UploadFilesRequest {
  sessionId: string;
  files: File[];
}

export interface UploadFilesResponse {
  uploadedFiles: string[];
  errors: UploadError[];
}

export interface UploadError {
  filename: string;
  error: string;
}

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  response: string;
  nextAction?: "upload_files" | "provide_metadata" | "confirm_structure";
}
