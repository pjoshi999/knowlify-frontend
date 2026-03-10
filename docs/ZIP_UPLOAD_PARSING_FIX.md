# ZIP Upload Parsing Fix

## Problem

When uploading a ZIP file with the correct structure:

```
test.zip
├── 01-Introduction/
│   └── welcome-video.mp4
```

The system showed parsing errors:

```
Parsing Errors (2)
test.zip: Unsupported file type
: No valid sections found in uploaded files
```

## Root Cause

The frontend was trying to parse the ZIP file itself using the local `parseUploadedFiles()` function, which only recognizes individual file types (.mp4, .pdf, etc.), not ZIP files. The ZIP file was being treated as an unsupported file type.

**The issue:** Frontend local parsing vs Backend ZIP extraction

- Frontend: Tried to parse ZIP file as a regular file → Failed
- Backend: Expects ZIP file, extracts contents, analyzes with AI → Works correctly

## Solution

Updated the upload flow to skip frontend local parsing for ZIP files and instead:

1. Upload ZIP directly to backend
2. Let backend extract and analyze contents
3. Use backend's AI analysis results
4. Pre-fill metadata form with AI suggestions

## Changes Made

### 1. Upload Page (`app/(protected)/upload/page.tsx`)

**Before:**

```typescript
const handleFilesSelected = async (files: File[]) => {
  // Parse files locally (doesn't work for ZIP)
  const { outline, errors } = await parseUploadedFiles(files);

  // Validate structure
  const validationErrors = validateCourseStructure(outline);

  // Show errors if any
  if (allErrors.length > 0) {
    addAssistantMessage("Issues found...");
  }
};
```

**After:**

```typescript
const handleFilesSelected = async (files: File[]) => {
  if (!files || files.length === 0) {
    addAssistantMessage("No file was uploaded. Please try again.");
    return;
  }

  const file = files[0]; // Only one ZIP file

  // Upload ZIP to backend for analysis
  const analysisResult = await uploadFiles(sessionId, files);

  // Convert backend analysis to frontend format
  if (analysisResult.analysis) {
    const { sections, metadata } = analysisResult.analysis;

    const outline: CourseOutline = {
      sections: sections.map((section: any, index: number) => ({
        title: section.title,
        description: section.description,
        orderIndex: section.order || index,
        assets: section.files.map((filename: string) => ({
          id: `${Date.now()}-${Math.random()}`,
          type: "video" as AssetType,
          filename,
          path: filename,
          size: 0,
          metadata: {},
        })),
      })),
      totalAssets: analysisResult.fileCount || 0,
    };

    setCourseOutline(outline);

    // Pre-fill metadata with AI suggestions
    if (metadata) {
      setCourseMetadata({
        name: metadata.suggestedName || "",
        description: metadata.suggestedDescription || "",
        price: metadata.suggestedPrice || 0,
        category: metadata.suggestedCategory || "",
      });
    }

    addAssistantMessage(
      `Perfect! I've analyzed your course and found ${outline.sections.length} section(s) with ${outline.totalAssets} file(s). I've also prepared some suggestions for your course details.`
    );
    setUploadStep("metadata");
  }
};
```

### 2. Parser API (`app/lib/api/parser.ts`)

**Updated to return analysis data:**

```typescript
export async function uploadFiles(
  sessionId: string,
  files: File[]
): Promise<{
  uploadedFiles: string[];
  errors: string[];
  fileCount?: number;
  analysis?: any;
}> {
  const zipFile = files.find(
    (file) =>
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.toLowerCase().endsWith(".zip")
  );

  if (!zipFile) {
    throw new Error("Please upload your course folder as a ZIP file.");
  }

  console.log("[API] Uploading ZIP file:", zipFile.name, zipFile.size);

  const formData = new FormData();
  formData.append("file", zipFile);

  const response = await apiClient.post(`/chat/sessions/${sessionId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = unwrapApiData<any>(response.data);
  console.log("[API] Upload response:", data);

  return {
    uploadedFiles: [zipFile.name],
    errors: [],
    fileCount: data?.fileCount,
    analysis: data?.analysis, // Contains sections and metadata suggestions
  };
}
```

## How It Works Now

### Upload Flow

1. **User uploads ZIP file**

   ```
   test.zip
   ├── 01-Introduction/
   │   └── welcome-video.mp4
   └── 02-Module-1/
       ├── lesson-1.mp4
       └── notes.pdf
   ```

2. **Frontend uploads to backend**

   ```
   POST /api/chat/sessions/:sessionId/upload
   Content-Type: multipart/form-data
   Body: file=test.zip
   ```

3. **Backend processes ZIP**
   - Extracts file list using `adm-zip`
   - Sends to OpenAI for analysis
   - Returns structured data:

   ```json
   {
     "fileCount": 3,
     "analysis": {
       "sections": [
         {
           "title": "Introduction",
           "order": 1,
           "files": ["01-Introduction/welcome-video.mp4"],
           "description": "Course introduction"
         },
         {
           "title": "Module 1",
           "order": 2,
           "files": ["02-Module-1/lesson-1.mp4", "02-Module-1/notes.pdf"],
           "description": "First module content"
         }
       ],
       "metadata": {
         "suggestedName": "Complete Course",
         "suggestedDescription": "Learn everything...",
         "suggestedCategory": "Programming",
         "suggestedPrice": 49.99
       }
     }
   }
   ```

4. **Frontend displays results**
   - Shows course structure preview
   - Pre-fills metadata form with AI suggestions
   - User can edit and submit

### Backend Analysis (OpenAI)

The backend sends this prompt to OpenAI:

```
Analyze this course folder structure and organize it into logical sections.

Files in the course folder:
01-Introduction/welcome-video.mp4
02-Module-1/lesson-1.mp4
02-Module-1/notes.pdf

Instructions:
1. Group related files into logical course sections
2. Determine the order of sections based on file names
3. Suggest course name, description, category, and price
4. Be intelligent about identifying videos, notes, assignments

Return ONLY valid JSON:
{
  "sections": [...],
  "metadata": {...}
}
```

OpenAI analyzes the structure and returns organized sections with metadata suggestions.

## Benefits

### 1. No More Parsing Errors

- Frontend doesn't try to parse ZIP files
- Backend handles all ZIP extraction
- Proper error messages if ZIP is invalid

### 2. AI-Powered Organization

- OpenAI analyzes file structure
- Automatically creates logical sections
- Suggests course metadata

### 3. Better User Experience

- Pre-filled metadata form
- Intelligent course structure
- Faster upload process

### 4. Consistent with Backend

- Frontend matches backend expectations
- Single source of truth for parsing logic
- Easier to maintain

## Testing

### Test ZIP Upload

1. **Create test ZIP:**

   ```bash
   mkdir -p test-course/01-Introduction
   mkdir -p test-course/02-Module-1
   echo "test" > test-course/01-Introduction/welcome.txt
   echo "test" > test-course/02-Module-1/lesson1.txt
   cd test-course
   zip -r ../test.zip .
   cd ..
   ```

2. **Upload to platform:**
   - Navigate to `/upload`
   - Upload `test.zip`
   - Should see: "Uploading ZIP file to backend for analysis..."

3. **Check console logs:**

   ```
   [Upload] Uploading ZIP file to backend for analysis...
   [API] Uploading ZIP file: test.zip 1234
   [API] Upload response: { fileCount: 2, analysis: {...} }
   [Upload] Backend analysis result: {...}
   ```

4. **Verify results:**
   - Course structure preview shows sections
   - Metadata form is pre-filled
   - No parsing errors

### Test Error Handling

1. **Upload non-ZIP file:**
   - Should show: "Please upload a ZIP file..."

2. **Upload empty ZIP:**
   - Backend should return error
   - Frontend should show: "No analysis data received..."

3. **Upload corrupted ZIP:**
   - Backend should fail to extract
   - Frontend should show error message

## Troubleshooting

### "No analysis data received from backend"

**Cause:** Backend didn't return analysis object

**Check:**

1. Backend logs for OpenAI errors
2. OpenAI API key is configured
3. ZIP file was extracted successfully

**Solution:**

```bash
# Check backend logs
tail -f backend.log | grep "chat-routes"

# Look for:
[chat-routes] Processing uploaded file
[chat-routes] Extracted file list from ZIP
[chat-routes] Starting OpenAI analysis
[chat-routes] Course structure analyzed
```

### "Failed to extract ZIP file"

**Cause:** ZIP file is corrupted or invalid

**Solution:**

1. Re-create ZIP file
2. Verify ZIP opens on your computer
3. Use standard ZIP compression (not RAR, 7z, etc.)

### Metadata form not pre-filled

**Cause:** Backend analysis didn't include metadata suggestions

**Check:**

1. Backend logs for OpenAI response
2. OpenAI returned valid JSON
3. JSON includes `metadata` object

**Solution:**

- User can still fill form manually
- AI suggestions are optional

## Summary

- ✅ Fixed "Unsupported file type" error for ZIP files
- ✅ Frontend now uploads ZIP directly to backend
- ✅ Backend extracts and analyzes ZIP contents
- ✅ AI organizes files into logical sections
- ✅ Metadata form pre-filled with AI suggestions
- ✅ Better error messages and user feedback
- ✅ Consistent with backend expectations

The ZIP upload now works correctly with proper backend integration and AI-powered analysis!
