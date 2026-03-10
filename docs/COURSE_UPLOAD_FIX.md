# Course Upload Fix - API Integration & Thumbnail Upload

## Issues Fixed

### 1. No API Call on Upload Button Click

**Problem:** When clicking the "Create Course" button in the upload flow, the API wasn't being called properly, and the course creation was failing silently.

**Root Cause:**

- The `generateCourse` function wasn't properly logging or handling errors
- Price wasn't being converted to cents (backend expects integer cents)
- Missing manifest structure in the course creation payload

**Solution:**

- Added comprehensive logging throughout the upload flow
- Fixed price conversion (multiply by 100 to convert dollars to cents)
- Added proper manifest structure to course creation
- Added error handling and user feedback

### 2. Thumbnail Should Be File Format (Drag & Drop)

**Problem:** Thumbnail was just a URL input field, not allowing users to upload image files.

**Solution:**

- Replaced URL input with drag-and-drop file upload zone
- Added image preview functionality
- Added file validation (type and size checks)
- Integrated thumbnail upload with the course creation flow

## Changes Made

### Frontend Changes

#### 1. MetadataForm Component (`app/components/features/upload/MetadataForm.tsx`)

**Added thumbnail file upload:**

```typescript
export interface CourseMetadata {
  name: string;
  description: string;
  price: number;
  category?: string;
  thumbnailUrl?: string;
  thumbnailFile?: File; // New field
}
```

**Features:**

- Drag and drop zone for image upload
- Image preview before submission
- File validation (image types only, max 5MB)
- Remove/replace thumbnail functionality
- Visual feedback during drag operations

**UI Components:**

```typescript
// Drag and drop zone
<div
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className="border-2 border-dashed rounded-lg p-8"
>
  <input type="file" accept="image/*" onChange={handleThumbnailChange} />
  {/* Upload icon and instructions */}
</div>

// Image preview with remove button
{thumbnailPreview && (
  <div className="relative">
    <img src={thumbnailPreview} alt="Thumbnail preview" />
    <button onClick={removeThumbnail}>Remove</button>
  </div>
)}
```

#### 2. Parser API (`app/lib/api/parser.ts`)

**Enhanced generateCourse function:**

```typescript
export async function generateCourse(
  sessionId: string,
  metadata: {
    name: string;
    description: string;
    price: number;
    category?: string;
    thumbnailUrl?: string;
    thumbnailFile?: File; // New parameter
  }
): Promise<{ courseId: string; shareableLink: string }> {
  console.log("[API] generateCourse called with:", { sessionId, metadata });

  let thumbnailUrl = metadata.thumbnailUrl;

  // Upload thumbnail if file is provided
  if (metadata.thumbnailFile) {
    console.log("[API] Uploading thumbnail file...");
    const formData = new FormData();
    formData.append("thumbnail", metadata.thumbnailFile);

    try {
      const uploadResponse = await apiClient.post(
        `/chat/sessions/${sessionId}/thumbnail`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadData = unwrapApiData<any>(uploadResponse.data);
      thumbnailUrl = uploadData?.url || thumbnailUrl;
      console.log("[API] Thumbnail uploaded:", thumbnailUrl);
    } catch (error) {
      console.error("[API] Thumbnail upload failed:", error);
      // Continue without thumbnail
    }
  }

  console.log("[API] Creating course...");
  const createResponse = await apiClient.post("/courses", {
    name: metadata.name,
    description: metadata.description,
    category: metadata.category || "General",
    thumbnailUrl: thumbnailUrl,
    priceAmount: Math.round(metadata.price * 100), // Convert to cents
    priceCurrency: "USD",
    manifest: {
      modules: [],
    },
  });
  const created = unwrapApiData<any>(createResponse.data);
  console.log("[API] Course created:", created);

  // Publish immediately
  console.log("[API] Publishing course...");
  await apiClient.post(`/courses/${created.id}/publish`);
  console.log("[API] Course published");

  return {
    courseId: String(created.id),
    shareableLink: `/courses/${created.id}`,
  };
}
```

**Key improvements:**

1. **Thumbnail upload**: Uploads image file to server before creating course
2. **Price conversion**: Converts dollars to cents (e.g., $49.99 → 4999)
3. **Proper manifest**: Includes empty modules array
4. **Comprehensive logging**: Logs each step for debugging
5. **Error handling**: Continues even if thumbnail upload fails

## How It Works Now

### Course Upload Flow

1. **User uploads course files** (ZIP)
   - Files are parsed locally
   - Course structure is extracted
   - Validation errors are shown

2. **User fills metadata form**
   - Course name (required)
   - Description (required)
   - Price (required, $0-$10,000)
   - Category (optional)
   - Thumbnail (optional, drag & drop)

3. **User clicks "Create Course"**
   - Form validation runs
   - If thumbnail file exists:
     - Upload thumbnail to `/chat/sessions/:id/thumbnail`
     - Get thumbnail URL from response
   - Create course via `POST /courses`:
     ```json
     {
       "name": "Introduction to React",
       "description": "Learn React from scratch",
       "category": "Programming",
       "thumbnailUrl": "https://...",
       "priceAmount": 4999,
       "priceCurrency": "USD",
       "manifest": {
         "modules": []
       }
     }
     ```
   - Publish course via `POST /courses/:id/publish`
   - Show success message with course link

### Thumbnail Upload

**Drag & Drop:**

```
1. User drags image file over drop zone
2. Drop zone highlights (visual feedback)
3. User drops file
4. File validation:
   - Check if image type (image/*)
   - Check size (max 5MB)
5. Create preview using FileReader
6. Display preview with remove button
```

**Click to Upload:**

```
1. User clicks on drop zone
2. File picker opens
3. User selects image
4. Same validation and preview as drag & drop
```

**Preview & Remove:**

```
- Preview shows actual image
- Remove button in top-right corner
- Clicking remove clears file and preview
- User can upload different image
```

## Testing

### Test Course Creation

1. **Navigate to `/upload`** (must be logged in as instructor)

2. **Upload course files:**
   - Create a ZIP file with course content
   - Drag and drop or click to upload
   - Wait for parsing to complete

3. **Fill metadata form:**

   ```
   Name: Test Course
   Description: This is a test course
   Price: 49.99
   Category: Programming
   Thumbnail: [Upload an image]
   ```

4. **Click "Create Course"**

5. **Check browser console for logs:**

   ```
   [API] generateCourse called with: {...}
   [API] Uploading thumbnail file...
   [API] Thumbnail uploaded: https://...
   [API] Creating course...
   [API] Course created: {...}
   [API] Publishing course...
   [API] Course published
   ```

6. **Verify course was created:**
   ```bash
   # Check database
   SELECT * FROM courses ORDER BY created_at DESC LIMIT 1;
   ```

### Test Thumbnail Upload

1. **Drag and drop test:**
   - Drag an image file over the thumbnail zone
   - Zone should highlight
   - Drop the file
   - Preview should appear

2. **Click to upload test:**
   - Click on the thumbnail zone
   - File picker should open
   - Select an image
   - Preview should appear

3. **Validation tests:**
   - Try uploading a non-image file (should show error)
   - Try uploading a file > 5MB (should show error)
   - Try uploading a valid image (should work)

4. **Remove test:**
   - Upload an image
   - Click the remove button (X in top-right)
   - Preview should disappear
   - Can upload a different image

## Backend Requirements

### Thumbnail Upload Endpoint

The frontend expects this endpoint to exist:

```typescript
POST /api/chat/sessions/:sessionId/thumbnail
Content-Type: multipart/form-data

Body:
- thumbnail: File (image file)

Response:
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/thumbnails/abc123.jpg"
  }
}
```

**Implementation needed:**

1. Accept multipart/form-data
2. Validate image file
3. Upload to storage service (S3, CloudFlare R2, etc.)
4. Return public URL

**Example implementation:**

```typescript
router.post(
  "/chat/sessions/:sessionId/thumbnail",
  authenticate,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // Upload to storage
      const url = await storageService.upload(file);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Upload failed",
      });
    }
  }
);
```

### Course Creation Endpoint

The endpoint already exists but ensure it accepts:

- `priceAmount` as integer (cents)
- `manifest` as object with `modules` array

## Debugging

### If API is not called:

1. **Check browser console:**

   ```
   Look for: [Upload] Starting course generation...
   Look for: [API] generateCourse called with: {...}
   ```

2. **Check network tab:**
   - Should see `POST /api/courses`
   - Should see `POST /api/courses/:id/publish`
   - If thumbnail uploaded: `POST /api/chat/sessions/:id/thumbnail`

3. **Check for errors:**
   ```javascript
   // In upload page
   console.log("[Upload] Metadata:", metadata);
   console.log("[Upload] Session ID:", sessionId);
   console.log("[Upload] Files:", uploadedFiles);
   ```

### If thumbnail upload fails:

1. **Check if endpoint exists:**

   ```bash
   curl -X POST http://localhost:3001/api/chat/sessions/test/thumbnail \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "thumbnail=@image.jpg"
   ```

2. **Check file size:**
   - Max 5MB on frontend
   - Check backend limits (multer, nginx, etc.)

3. **Check file type:**
   - Frontend accepts: image/\*
   - Backend should accept: image/jpeg, image/png, image/gif, etc.

## Summary

- ✅ Fixed API call on upload button click
- ✅ Added comprehensive logging for debugging
- ✅ Fixed price conversion (dollars to cents)
- ✅ Added proper manifest structure
- ✅ Replaced thumbnail URL input with file upload
- ✅ Added drag and drop functionality
- ✅ Added image preview
- ✅ Added file validation
- ✅ Integrated thumbnail upload with course creation
- ⚠️ Backend thumbnail upload endpoint needs to be implemented

The course upload flow now properly calls the API and allows users to upload thumbnail images via drag and drop!
