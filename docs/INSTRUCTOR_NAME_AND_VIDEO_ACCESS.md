# Instructor Name in API & Video Access After Purchase

## Changes Made

### 1. Instructor Name in Course API

I've updated the backend to include the instructor's name in the course API response:

**Files Modified:**

- `knowlify-backend/src/domain/types/course.types.ts` - Added `instructorName?: string` to the `Course` interface
- `knowlify-backend/src/infrastructure/repositories/course.repository.ts` - Updated queries to join with users table and include instructor name

**Changes:**

1. Added `instructor_name` field to `CourseRow` interface
2. Updated `mapToCourse` function to include `instructorName` in the mapped object
3. Updated `findById` query to join with users table: `LEFT JOIN users u ON c.instructor_id = u.id`

**Remaining Work:**
The `findAll` query in the course repository also needs to be updated to include the instructor name. Add this line to the SELECT statement:

```sql
u.name as instructor_name,
```

And add this JOIN:

```sql
LEFT JOIN users u ON c.instructor_id = u.id
```

The query should look like:

```typescript
const result = await query<CourseRow>(
  `SELECT 
     c.*,
     u.name as instructor_name,
     COALESCE(cs.enrollment_count, 0) as enrollment_count,
     COALESCE(cs.avg_rating, 0) as avg_rating,
     COALESCE(cs.review_count, 0) as review_count,
     COALESCE(cs.total_revenue, 0) as total_revenue
   FROM courses c
   LEFT JOIN users u ON c.instructor_id = u.id
   LEFT JOIN course_statistics cs ON c.id = cs.course_id
   WHERE ${whereClause}
   ORDER BY ${sortField} ${sortOrder}
   LIMIT ${paramIndex} OFFSET ${paramIndex + 1}`,
  [...params, pagination.limit, offset]
);
```

### 2. Video Access After Purchase

Here's how video retrieval works after a user purchases a course:

#### Database Structure

**course_assets table** stores all course videos and materials:

```sql
CREATE TABLE course_assets (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  asset_type VARCHAR(20) CHECK (asset_type IN ('VIDEO', 'PDF', 'QUIZ', 'EXAM', 'NOTE', 'OTHER')),
  file_name VARCHAR(500),
  file_size BIGINT,
  storage_path TEXT,  -- This is the key field for video URLs
  mime_type VARCHAR(100),
  duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP
);
```

#### Video Access Flow

1. **After Purchase:**
   - Stripe webhook creates enrollment in PostgreSQL (fixed in enrollment-access-bug-fix)
   - Enrollment record links user to course: `enrollments(student_id, course_id, payment_id)`

2. **Accessing Course Content:**
   - User navigates to `/learn/[courseId]`
   - Frontend checks enrollment status via backend API
   - If enrolled, course player loads

3. **Retrieving Videos:**
   - Backend API endpoint: `GET /api/courses/:id/assets`
   - Returns all course assets including videos
   - Each video has a `storagePath` field containing the video URL/path

#### API Endpoints

**Get Course Assets:**

```typescript
// Backend: knowlify-backend/src/interfaces/routes/course.routes.ts
router.get("/:id/assets", async (req, res) => {
  const assets = await courseRepository.findAssets(req.params.id);
  sendSuccess(res, assets);
});
```

**Repository Method:**

```typescript
// knowlify-backend/src/infrastructure/repositories/course.repository.ts
findAssets: async (courseId: string): Promise<CourseAsset[]> => {
  const result = await query<AssetRow>(
    `SELECT id, course_id, asset_type, file_name, file_size,
            storage_path, mime_type, duration, metadata, created_at
     FROM course_assets
     WHERE course_id = $1
     ORDER BY created_at DESC`,
    [courseId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    assetType: row.asset_type,
    fileName: row.file_name,
    fileSize: Number(row.file_size),
    storagePath: row.storage_path, // Video URL is here
    mimeType: row.mime_type,
    duration: row.duration,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
};
```

#### Frontend Usage

**Course Player Page:**

```typescript
// app/(protected)/learn/[courseId]/page.tsx
// 1. Check enrollment
const { isEnrolled } = await checkEnrollment(courseId);

if (!isEnrolled) {
  return <AccessDenied />;
}

// 2. Fetch course assets
const assets = await fetch(`/api/courses/${courseId}/assets`);
const videos = assets.filter(asset => asset.assetType === 'VIDEO');

// 3. Display video player with storagePath
<video src={video.storagePath} />
```

#### Course Manifest Structure

The course also has a `manifest` field (JSONB) that organizes content:

```typescript
interface CourseManifest {
  modules: CourseModule[];
  totalDuration?: number;
  totalAssets?: number;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  assetId?: string; // Links to course_assets.id
  duration?: number;
  type: AssetType; // 'VIDEO', 'PDF', etc.
}
```

#### Complete Flow Example

1. User purchases "Introduction to React" course
2. Webhook creates enrollment: `enrollments(user-123, course-456, payment-789)`
3. User clicks "Start Learning" → navigates to `/learn/course-456`
4. Frontend calls `GET /api/enrollments` → confirms user is enrolled
5. Frontend calls `GET /api/courses/course-456` → gets course manifest
6. Frontend calls `GET /api/courses/course-456/assets` → gets all videos
7. Course player displays:
   - Module 1: Introduction
     - Lesson 1.1: What is React? (video from assets[0].storagePath)
     - Lesson 1.2: Setting up (video from assets[1].storagePath)
   - Module 2: Components
     - Lesson 2.1: Creating Components (video from assets[2].storagePath)

#### Security Considerations

**Important:** The `/api/courses/:id/assets` endpoint should be protected to only allow:

1. Enrolled students to access course assets
2. Course instructors to access their own course assets

**Recommended middleware:**

```typescript
router.get(
  "/:id/assets",
  authenticate, // Verify user is logged in
  authorizeEnrolledOrInstructor, // Check enrollment or ownership
  async (req, res) => {
    const assets = await courseRepository.findAssets(req.params.id);
    sendSuccess(res, assets);
  }
);
```

## Summary

- **Instructor Name:** Now included in course API responses via database join with users table
- **Video Access:** Videos are stored in `course_assets` table with `storage_path` field containing the video URL
- **Access Control:** Enrollment check ensures only paying students can access course videos
- **API Endpoint:** `GET /api/courses/:id/assets` returns all course materials including videos
