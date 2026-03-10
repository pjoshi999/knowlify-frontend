# Course Upload Format - ZIP File Structure

## Overview

The course upload system expects course materials to be packaged as a **ZIP file**. The backend analyzes the ZIP file structure using AI to automatically organize content into logical course sections.

## Backend Requirements

### File Format

- **Required**: ZIP file (`.zip`)
- **Max Size**: 100MB
- **Content**: Course materials organized in folders

### Backend Processing Flow

1. **Upload Endpoint**: `POST /api/chat/sessions/:sessionId/upload`
   - Accepts: `multipart/form-data` with field name `file`
   - Validates: File must be ZIP format
   - Stores: File buffer in memory for processing

2. **ZIP Extraction**:

   ```typescript
   const zip = new AdmZip(req.file.buffer);
   const zipEntries = zip.getEntries();
   const fileList = zipEntries
     .filter((entry) => !entry.isDirectory)
     .map((entry) => entry.entryName);
   ```

3. **AI Analysis**:
   - Sends file list to OpenAI
   - AI organizes files into logical sections
   - AI suggests course metadata (name, description, category, price)

4. **Response**:
   ```json
   {
     "success": true,
     "data": {
       "fileCount": 42,
       "analysis": {
         "sections": [
           {
             "title": "Introduction",
             "order": 1,
             "files": ["intro.mp4", "welcome.pdf"],
             "description": "Getting started with the course"
           }
         ],
         "metadata": {
           "suggestedName": "Complete Web Development Course",
           "suggestedDescription": "Learn web development from scratch...",
           "suggestedCategory": "Programming",
           "suggestedPrice": 49.99
         }
       }
     }
   }
   ```

## Frontend Implementation

### Changes Made

#### 1. FileUploadZone Component (`app/components/features/upload/FileUploadZone.tsx`)

**Before:**

- Accepted multiple individual files
- Supported various file types (.mp4, .pdf, .doc, etc.)
- Had "Browse Files" and "Browse Folder" buttons
- Max file size: 500MB per file

**After:**

- Accepts only ONE ZIP file
- Only supports .zip files
- Single "Browse ZIP File" button
- Max file size: 100MB (matches backend)

**Key Changes:**

```typescript
// File validation
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = [".zip"];

const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (max 100MB)`;
  }

  const isZip =
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";

  if (!isZip) {
    return `Please upload a ZIP file containing your course materials`;
  }

  return null;
};

// Only allow one ZIP file
const processFiles = (fileList: FileList | File[]) => {
  const filesArray = Array.from(fileList);

  if (filesArray.length > 1) {
    alert("Please upload only one ZIP file at a time");
    return;
  }

  // Replace existing files (only one ZIP allowed)
  setFiles(processedFiles);

  // ...
};
```

**UI Updates:**

- Drop zone text: "Drag and drop your course ZIP file here"
- Instructions: "Your ZIP file should contain all course materials organized in folders"
- Button: "Browse ZIP File" (removed "Browse Folder")
- File list title: "Uploaded ZIP File" (singular)
- ZIP icon instead of generic file/video icons

## Recommended ZIP Structure

### Option 1: Flat Structure with Prefixes

```
course-materials.zip
├── 01-intro-video.mp4
├── 01-intro-slides.pdf
├── 02-lesson1-video.mp4
├── 02-lesson1-notes.pdf
├── 03-lesson2-video.mp4
├── 03-lesson2-quiz.json
└── 04-conclusion-video.mp4
```

### Option 2: Folder-Based Structure (Recommended)

```
course-materials.zip
├── 01-Introduction/
│   ├── welcome-video.mp4
│   ├── course-overview.pdf
│   └── getting-started.pdf
├── 02-Module-1-Basics/
│   ├── lesson-1-video.mp4
│   ├── lesson-1-notes.pdf
│   ├── lesson-2-video.mp4
│   └── quiz.json
├── 03-Module-2-Advanced/
│   ├── advanced-concepts.mp4
│   ├── examples.pdf
│   └── assignment.pdf
└── 04-Conclusion/
    ├── summary-video.mp4
    └── certificate.pdf
```

### Option 3: Nested Structure

```
course-materials.zip
├── videos/
│   ├── week1/
│   │   ├── intro.mp4
│   │   └── lesson1.mp4
│   └── week2/
│       ├── lesson2.mp4
│       └── lesson3.mp4
├── documents/
│   ├── slides/
│   │   ├── week1-slides.pdf
│   │   └── week2-slides.pdf
│   └── notes/
│       ├── week1-notes.pdf
│       └── week2-notes.pdf
└── assessments/
    ├── quiz1.json
    └── quiz2.json
```

## Supported File Types Inside ZIP

The AI will recognize and categorize these file types:

### Videos

- `.mp4` - MP4 video
- `.mov` - QuickTime video
- `.avi` - AVI video
- `.webm` - WebM video
- `.mkv` - Matroska video

### Documents

- `.pdf` - PDF documents
- `.doc`, `.docx` - Word documents
- `.txt` - Text files
- `.md` - Markdown files

### Presentations

- `.ppt`, `.pptx` - PowerPoint presentations
- `.key` - Keynote presentations

### Assessments

- `.json` - Quiz/exam definitions
- `.xml` - Assessment data

### Code/Examples

- `.zip` - Nested ZIP files (code examples)
- `.js`, `.py`, `.java`, etc. - Source code files

## Creating a ZIP File

### macOS

```bash
# From Finder
1. Select your course folder
2. Right-click → Compress "folder-name"
3. Rename to course-materials.zip

# From Terminal
cd /path/to/course-folder
zip -r course-materials.zip .
```

### Windows

```bash
# From File Explorer
1. Select your course folder
2. Right-click → Send to → Compressed (zipped) folder
3. Rename to course-materials.zip

# From Command Prompt
cd C:\path\to\course-folder
tar -a -c -f course-materials.zip *
```

### Linux

```bash
cd /path/to/course-folder
zip -r course-materials.zip .
```

## Upload Flow

### 1. User Prepares Course Materials

```
1. Organize course materials in folders
2. Create ZIP file (max 100MB)
3. Verify ZIP contains all materials
```

### 2. User Uploads ZIP

```
1. Navigate to /upload page
2. Drag and drop ZIP file OR click "Browse ZIP File"
3. Frontend validates:
   - File is ZIP format
   - File size ≤ 100MB
4. Upload begins
```

### 3. Backend Processing

```
1. Receives ZIP file
2. Extracts file list
3. Sends to OpenAI for analysis
4. Returns structured course outline
```

### 4. User Reviews Structure

```
1. Frontend displays parsed sections
2. Shows suggested metadata
3. User can proceed to metadata form
```

### 5. User Completes Metadata

```
1. Fills in course name (or uses suggestion)
2. Fills in description (or uses suggestion)
3. Sets price (or uses suggestion)
4. Selects category (or uses suggestion)
5. Uploads thumbnail (optional)
6. Clicks "Create Course"
```

## Error Handling

### File Too Large

```
Error: "File too large (max 100MB)"
Solution:
- Compress videos to reduce size
- Split into multiple courses
- Use lower quality videos
```

### Not a ZIP File

```
Error: "Please upload a ZIP file containing your course materials"
Solution:
- Ensure file has .zip extension
- Re-create ZIP file using proper compression
- Don't rename other file types to .zip
```

### Empty ZIP

```
Error: "ZIP file contains no files"
Solution:
- Ensure ZIP contains course materials
- Check that files aren't in nested folders
- Verify ZIP was created correctly
```

### Corrupted ZIP

```
Error: "Failed to extract ZIP file"
Solution:
- Re-create ZIP file
- Verify ZIP opens on your computer
- Try different compression tool
```

## Testing

### Test ZIP Upload

1. **Create test ZIP:**

   ```bash
   mkdir test-course
   cd test-course
   echo "Test content" > lesson1.txt
   echo "Test content" > lesson2.txt
   cd ..
   zip -r test-course.zip test-course/
   ```

2. **Upload to platform:**
   - Navigate to `/upload`
   - Drag and drop `test-course.zip`
   - Verify upload succeeds

3. **Check backend logs:**

   ```
   [chat-routes] Processing uploaded file
   [chat-routes] Extracted file list from ZIP
   [chat-routes] Starting OpenAI analysis
   [chat-routes] Course structure analyzed
   ```

4. **Verify response:**
   - Check that sections are created
   - Check that metadata suggestions are provided
   - Verify file count matches

### Test File Validation

1. **Test non-ZIP file:**
   - Try uploading .pdf file
   - Should show error: "Please upload a ZIP file..."

2. **Test oversized file:**
   - Create ZIP > 100MB
   - Should show error: "File too large (max 100MB)"

3. **Test multiple files:**
   - Try selecting multiple ZIP files
   - Should show alert: "Please upload only one ZIP file at a time"

## Best Practices

### Naming Conventions

- Use descriptive folder names: `01-Introduction`, `02-Getting-Started`
- Use prefixes for ordering: `01-`, `02-`, `03-`
- Use hyphens instead of spaces: `lesson-1-intro.mp4`
- Include file type in name: `quiz-1.json`, `slides-1.pdf`

### Organization

- Group related materials in folders
- Keep folder structure shallow (2-3 levels max)
- Use consistent naming across all files
- Include README.txt with structure explanation

### File Sizes

- Compress videos before adding to ZIP
- Use appropriate video quality (720p recommended)
- Optimize PDFs (reduce image quality if needed)
- Keep total ZIP under 100MB

### Content

- Include all necessary materials
- Don't include source files (e.g., .psd, .ai)
- Include only final versions
- Test ZIP extraction before uploading

## Summary

- ✅ Backend expects ZIP file format
- ✅ Frontend updated to accept only ZIP files
- ✅ Max file size: 100MB
- ✅ Single ZIP file per upload
- ✅ AI analyzes ZIP structure automatically
- ✅ Supports various file types inside ZIP
- ✅ Drag and drop or browse to upload
- ✅ Clear error messages for validation

The course upload system now properly matches the backend's ZIP file requirement!
