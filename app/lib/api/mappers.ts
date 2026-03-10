import type {
  Course,
  CourseSection,
  Enrollment,
  Instructor,
  Review,
  CourseStats,
  Transaction,
} from "./service-types";
import { replaceS3WithCloudFront } from "../utils/cdn";

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(typeof value === "string" || typeof value === "number" ? value : Date.now());
}

export function mapCourse(raw: any): Course {
  const priceInCents = Number(raw?.priceAmount ?? raw?.price ?? 0);
  const priceInDollars = Number.isFinite(priceInCents) ? priceInCents / 100 : 0;

  return {
    id: String(raw?.id ?? ""),
    instructorId: String(raw?.instructorId ?? ""),
    instructorName: raw?.instructorName ? String(raw.instructorName) : undefined,
    name: String(raw?.name ?? "Untitled Course"),
    description: String(raw?.description ?? ""),
    price: priceInDollars,
    thumbnailUrl: replaceS3WithCloudFront(raw?.thumbnailUrl),
    category: raw?.category || undefined,
    published: raw?.status === "PUBLISHED" || raw?.published === true,
    enrollmentCount: Number(raw?.enrollmentCount ?? 0),
    averageRating: Number(raw?.avgRating ?? raw?.averageRating ?? 0),
    reviewCount: Number(raw?.reviewCount ?? 0),
    createdAt: toDate(raw?.createdAt),
    updatedAt: toDate(raw?.updatedAt),
  };
}

export function mapCourseSections(rawCourse: any): CourseSection[] {
  const modules = rawCourse?.manifest?.modules;
  if (!Array.isArray(modules)) return [];

  return modules.flatMap((module: any, moduleIndex: number) => {
    const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
    return lessons.map((lesson: any, lessonIndex: number) => ({
      id: String(lesson?.id ?? `${rawCourse?.id}-lesson-${moduleIndex}-${lessonIndex}`),
      courseId: String(rawCourse?.id ?? ""),
      title: String(lesson?.title ?? "Untitled Lesson"),
      description:
        typeof lesson?.description === "string" ? lesson.description : module?.description,
      orderIndex: Number(lesson?.order ?? moduleIndex * 100 + lessonIndex),
      durationMinutes: Math.ceil(Number(lesson?.duration ?? 0) / 60),
      createdAt: toDate(rawCourse?.createdAt),
    }));
  });
}

export function mapInstructor(rawCourse: any): Instructor {
  return {
    id: String(rawCourse?.instructorId ?? ""),
    name: String(rawCourse?.instructorName ?? "Instructor"),
    email: String(rawCourse?.instructorEmail ?? ""),
    bio: rawCourse?.instructorBio || undefined,
  };
}

export function mapEnrollment(raw: any): Enrollment {
  const enrollment: Enrollment = {
    id: String(raw?.id ?? ""),
    userId: String(raw?.studentId ?? raw?.student_id ?? raw?.userId ?? ""),
    courseId: String(raw?.courseId ?? raw?.course_id ?? ""),
    paymentId: String(raw?.paymentId ?? raw?.payment_id ?? ""),
    progressPercentage: Number(
      raw?.completionPercentage ?? raw?.completion_percentage ?? raw?.progressPercentage ?? 0
    ),
    enrolledAt: toDate(raw?.enrolledAt ?? raw?.enrolled_at),
    lastAccessed:
      (raw?.lastAccessedAt ?? raw?.last_accessed_at)
        ? toDate(raw.lastAccessedAt ?? raw.last_accessed_at)
        : undefined,
  };

  // If course data is included in the enrollment response, add it
  if (raw?.course_name || raw?.courseName) {
    const coursePrice = Number(raw?.course_price ?? raw?.coursePrice ?? 0);
    (enrollment as any).course = {
      id: String(raw?.courseId ?? raw?.course_id ?? ""),
      instructorId: String(raw?.instructorId ?? raw?.instructor_id ?? ""),
      instructorName: String(raw?.instructor_name ?? raw?.instructorName ?? ""),
      name: String(raw?.course_name ?? raw?.courseName ?? "Untitled Course"),
      description: String(raw?.course_description ?? raw?.courseDescription ?? ""),
      price: coursePrice / 100, // Convert from cents to dollars
      thumbnailUrl: replaceS3WithCloudFront(raw?.course_thumbnail_url ?? raw?.courseThumbnailUrl),
      category: raw?.course_category ?? raw?.courseCategory,
      published: true,
      enrollmentCount: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: toDate(raw?.createdAt ?? raw?.created_at),
      updatedAt: toDate(raw?.updatedAt ?? raw?.updated_at),
    };
  }

  return enrollment;
}

export function mapReview(raw: any): Review {
  return {
    id: String(raw?.id ?? ""),
    userId: String(raw?.studentId ?? raw?.userId ?? ""),
    courseId: String(raw?.courseId ?? ""),
    rating: Number(raw?.rating ?? 0),
    comment: String(raw?.comment ?? ""),
    createdAt: toDate(raw?.createdAt),
    updatedAt: toDate(raw?.updatedAt),
    user: {
      id: String(raw?.studentId ?? raw?.userId ?? ""),
      name: String(raw?.studentName ?? raw?.user?.name ?? "Student"),
    },
  };
}

export function mapCourseStat(raw: any): CourseStats {
  return {
    courseId: String(raw?.id ?? raw?.courseId ?? ""),
    courseName: String(raw?.name ?? raw?.courseName ?? "Untitled Course"),
    enrollments: Number(raw?.enrollmentCount ?? raw?.enrollments ?? 0),
    revenue: Number(raw?.totalRevenue ?? raw?.revenue ?? 0),
    averageRating: Number(raw?.avgRating ?? raw?.averageRating ?? 0),
    reviewCount: Number(raw?.reviewCount ?? 0),
  };
}

export function mapTransaction(raw: any): Transaction {
  return {
    id: String(raw?.id ?? ""),
    courseId: String(raw?.courseId ?? ""),
    courseName: String(raw?.courseName ?? "Course"),
    amount: Number(raw?.amount ?? 0),
    currency: String(raw?.currency ?? "USD"),
    status: (raw?.status || "pending").toLowerCase(),
    studentName: String(raw?.studentName ?? "Student"),
    createdAt: toDate(raw?.createdAt),
  } as Transaction;
}
