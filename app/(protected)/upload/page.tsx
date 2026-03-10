"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/lib/stores/auth";
import { useVideoUpload } from "@/app/lib/hooks/use-video-upload";
import { formatFileSize } from "@/app/lib/utils/upload-progress";
import { createCourse } from "@/app/lib/api/courses";
import apiClient, { unwrapApiData } from "@/app/lib/api/client";
import { DraggableModuleEditor } from "@/app/components/features/module-editor";
import { ParticleBackground } from "@/app/components/ui/particle-background";
import { usdToCents } from "@/app/lib/utils/price";

export interface Message {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: Date;
  progress?: number;
  status?: string;
}

interface BuilderLesson {
  id: string;
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "IMAGE";
  order: number;
  duration?: number;
  sourceSessionId?: string;
}

interface BuilderModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: BuilderLesson[];
}

interface CourseMetadataFormState {
  name: string;
  description: string;
  price: number;
  category: string;
  thumbnail?: File | null;
}

interface UploadedVideo {
  id: string;
  sessionId: string;
  fileName: string;
  title: string;
  duration?: number;
}

function getUploadErrorMessage(uploadError: unknown, fallback: string): string {
  if (uploadError instanceof Error && uploadError.message) {
    return uploadError.message;
  }

  if (
    uploadError &&
    typeof uploadError === "object" &&
    "message" in uploadError &&
    typeof (uploadError as { message?: unknown }).message === "string"
  ) {
    return (uploadError as { message: string }).message;
  }

  return fallback;
}

const createLocalId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function ChatUploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showCourseBuilder, setShowCourseBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState<"metadata" | "structure">("metadata");
  const [metadata, setMetadata] = useState<CourseMetadataFormState>({
    name: "",
    description: "",
    price: 0,
    category: "General",
    thumbnail: null,
  });
  const [modules, setModules] = useState<BuilderModule[]>([]);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const lastProgressRef = useRef<{ upload: number; analysis: number }>({ upload: 0, analysis: 0 });
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const builderInitializedRef = useRef(false);
  const processedSessionIdsRef = useRef<Set<string>>(new Set());
  const currentUploadFileNameRef = useRef<string | null>(null);
  const addMoreVideoInputRef = useRef<HTMLInputElement>(null);

  function addMessage(role: Message["role"], content: string, progress?: number, status?: string) {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      progress,
      status,
    };
    setMessages((prev) => [...prev, newMessage]);
  }

  const {
    uploading,
    progress,
    error,
    sessionId,
    analysisProgress,
    analysisStatus,
    analysisResult,
    upload,
  } = useVideoUpload({
    instructorId: user?.id || "",
    onUploadComplete: () => {
      addMessage(
        "assistant",
        "Perfect! Your video has been analyzed successfully. You can now proceed to organize modules, lessons, and metadata before publishing."
      );
    },
  });

  useEffect(() => {
    if (analysisStatus !== "completed" || !sessionId) return;
    if (processedSessionIdsRef.current.has(sessionId)) return;

    processedSessionIdsRef.current.add(sessionId);

    const uploadFileName =
      currentUploadFileNameRef.current || selectedFile?.name || "Uploaded Video";
    const fallbackTitle = uploadFileName.replace(/\.[^/.]+$/, "") || "New Course";
    const lessonTitle = analysisResult?.title || fallbackTitle;
    const lessonDuration = analysisResult?.duration;

    setUploadedVideos((prev) => [
      ...prev,
      {
        id: createLocalId(),
        sessionId,
        fileName: uploadFileName,
        title: lessonTitle,
        duration: lessonDuration,
      },
    ]);

    if (!builderInitializedRef.current) {
      setMetadata({
        name: analysisResult?.title || fallbackTitle,
        description:
          analysisResult?.description ||
          "A structured course generated from your uploaded and analyzed videos.",
        price: 0,
        category: "General",
      });
      setModules([
        {
          id: createLocalId(),
          title: "Module 1: Foundations",
          description: "Core concepts from your uploaded videos.",
          order: 1,
          lessons: [
            {
              id: createLocalId(),
              title: lessonTitle,
              description: analysisResult?.description || "Lesson from uploaded video.",
              type: "VIDEO",
              order: 1,
              duration: lessonDuration,
              sourceSessionId: sessionId,
            },
          ],
        },
      ]);
      setBuilderError(null);
      builderInitializedRef.current = true;
      setTimeout(() => {
        addMessage(
          "assistant",
          "Next step: review metadata, then drag-and-drop modules/lessons to finalize structure."
        );
      }, 250);
      return;
    }

    setModules((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const firstModule = next[0];
      if (!firstModule) return prev;
      firstModule.lessons = [
        ...firstModule.lessons,
        {
          id: createLocalId(),
          title: lessonTitle,
          description: analysisResult?.description || "Lesson from uploaded video.",
          type: "VIDEO",
          order: firstModule.lessons.length + 1,
          duration: lessonDuration,
          sourceSessionId: sessionId,
        },
      ];
      return next;
    });
  }, [analysisStatus, analysisResult, selectedFile, sessionId]);

  // Redirect non-instructors
  useEffect(() => {
    if (user && user.role !== "instructor") {
      router.push("/");
    }
  }, [user, router]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage(
          "assistant",
          "Hi! I'm here to help you upload your course video. Please select a video file to get started."
        );
      }, 500);
    }
  }, []);

  // Auto-scroll to last message (not fixed input area)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    const el = messageRefs.current[lastMessage.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  // Update progress messages
  useEffect(() => {
    let progressMessageUpdateTimer: ReturnType<typeof setTimeout> | null = null;

    console.log("[Upload Page] Progress update:", {
      uploading,
      progressStatus: progress?.status,
      percentComplete: progress?.percentComplete,
      analysisProgress,
      analysisStatus,
    });

    if (!uploading) return;

    if (progress?.status === "uploading") {
      const currentProgress = progress.percentComplete;
      if (Math.abs(currentProgress - lastProgressRef.current.upload) >= 1) {
        console.log("[Upload Page] Updating upload progress:", currentProgress);
        lastProgressRef.current.upload = currentProgress;
        progressMessageUpdateTimer = setTimeout(() => {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.status === "uploading") {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastMsg,
                progress: currentProgress,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "system" as const,
                  content: "",
                  timestamp: new Date(),
                  progress: currentProgress,
                  status: "uploading",
                },
              ];
            }
          });
        }, 0);
      }
    } else if (progress?.status === "processing") {
      if (lastProgressRef.current.upload < 100) {
        lastProgressRef.current.upload = 100;
        progressMessageUpdateTimer = setTimeout(() => {
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i -= 1) {
              const msg = next[i];
              if (msg && msg.status === "uploading") {
                next[i] = { ...msg, progress: 100 };
                return next;
              }
            }
            return next;
          });
        }, 0);
      }

      if (analysisStatus === "not_started") {
        return () => {
          if (progressMessageUpdateTimer) {
            clearTimeout(progressMessageUpdateTimer);
          }
        };
      }

      if (Math.abs(analysisProgress - lastProgressRef.current.analysis) >= 1) {
        console.log("[Upload Page] Updating analysis progress:", analysisProgress);
        lastProgressRef.current.analysis = analysisProgress;
        progressMessageUpdateTimer = setTimeout(() => {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.status === "processing") {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastMsg,
                progress: analysisProgress,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "system" as const,
                  content: "",
                  timestamp: new Date(),
                  progress: analysisProgress,
                  status: "processing",
                },
              ];
            }
          });
        }, 0);
      }
    }

    return () => {
      if (progressMessageUpdateTimer) {
        clearTimeout(progressMessageUpdateTimer);
      }
    };
  }, [progress?.status, progress?.percentComplete, analysisProgress, analysisStatus, uploading]);

  useEffect(() => {
    if (analysisStatus !== "completed") return;

    const timer = setTimeout(() => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const msg = next[i];
          if (msg && msg.status === "processing") {
            next[i] = {
              ...msg,
              progress: 100,
            };
            return next;
          }
        }
        return next;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [analysisStatus]);

  const handleAddModule = () => {
    const moduleTitle = window.prompt("Module title", `Module ${modules.length + 1}`);
    if (!moduleTitle?.trim()) return;

    setModules((prev) => [
      ...prev,
      {
        id: createLocalId(),
        title: moduleTitle.trim(),
        description: "",
        order: prev.length + 1,
        lessons: [],
      },
    ]);
  };

  const moveSessionLessonToModule = (sourceSessionId: string, targetModuleId: string) => {
    setModules((prev) => {
      const next = prev.map((builderModule) => ({
        ...builderModule,
        lessons: builderModule.lessons.map((lesson) => ({ ...lesson })),
      }));

      let movingLesson: BuilderLesson | null = null;

      for (const builderModule of next) {
        const matchingLessons = builderModule.lessons.filter(
          (lesson) => lesson.sourceSessionId === sourceSessionId
        );
        if (matchingLessons.length > 0 && !movingLesson) {
          movingLesson = matchingLessons[0] || null;
        }

        builderModule.lessons = builderModule.lessons
          .filter((lesson) => lesson.sourceSessionId !== sourceSessionId)
          .map((lesson, lessonIndex) => ({
            ...lesson,
            order: lessonIndex + 1,
          }));
      }

      const targetModule = next.find((builderModule) => builderModule.id === targetModuleId);
      if (!targetModule) return prev;

      if (!movingLesson) {
        const uploadVideo = uploadedVideos.find((video) => video.sessionId === sourceSessionId);
        if (!uploadVideo) return prev;
        movingLesson = {
          id: createLocalId(),
          title: uploadVideo.title,
          description: `Lesson from ${uploadVideo.fileName}`,
          type: "VIDEO",
          order: targetModule.lessons.length + 1,
          duration: uploadVideo.duration,
          sourceSessionId,
        };
      }

      targetModule.lessons.push({
        ...movingLesson,
        order: targetModule.lessons.length + 1,
      });
      targetModule.lessons = targetModule.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        order: lessonIndex + 1,
      }));

      return next;
    });
  };

  const handleCreateCourseFlow = async () => {
    if (!metadata.name.trim()) {
      setBuilderError("Course name is required.");
      setBuilderStep("metadata");
      return;
    }
    if (!metadata.description.trim()) {
      setBuilderError("Course description is required.");
      setBuilderStep("metadata");
      return;
    }
    if (modules.length === 0) {
      setBuilderError("Add at least one module before creating the course.");
      setBuilderStep("structure");
      return;
    }
    if (modules.some((module) => module.lessons.length === 0)) {
      setBuilderError("Each module should contain at least one lesson.");
      setBuilderStep("structure");
      return;
    }

    setBuilderError(null);
    setIsSavingCourse(true);

    try {
      const createdCourse = await createCourse({
        name: metadata.name.trim(),
        description: metadata.description.trim(),
        price: usdToCents(metadata.price), // Convert USD to cents for backend
        category: metadata.category,
        thumbnail: metadata.thumbnail || undefined,
      });

      const sessionIdsToAttach = Array.from(
        new Set(
          modules
            .flatMap((module) => module.lessons)
            .map((lesson) => lesson.sourceSessionId)
            .filter((value): value is string => Boolean(value))
        )
      );

      const assetBySessionId = new Map<
        string,
        {
          id: string;
          assetType: string;
          storagePath: string;
          mimeType: string;
          duration?: number;
        }
      >();

      for (const sourceSessionId of sessionIdsToAttach) {
        const uploadedVideo = uploadedVideos.find((video) => video.sessionId === sourceSessionId);
        const attachAssetResponse = await apiClient.post(
          `/video-uploads/${sourceSessionId}/create-asset`,
          {
            courseId: createdCourse.courseId,
            title: uploadedVideo?.title,
            duration: uploadedVideo?.duration,
          }
        );
        const attachAssetPayload = unwrapApiData<{
          asset: {
            id: string;
            assetType: string;
            storagePath: string;
            mimeType: string;
            duration?: number;
          };
        }>(attachAssetResponse.data);
        assetBySessionId.set(sourceSessionId, attachAssetPayload.asset);
      }

      const manifestModules: Array<{
        id: string;
        title: string;
        description?: string;
        order: number;
        lessons: Array<{
          id: string;
          title: string;
          description?: string;
          order: number;
          type: string;
          duration?: number;
          assetId?: string;
          videoUrl?: string;
          fileUrl?: string;
        }>;
      }> = [];

      for (const [moduleIndex, module] of modules.entries()) {
        const moduleResponse = await apiClient.post(`/courses/${createdCourse.courseId}/modules`, {
          title: module.title,
          description: module.description,
          order: moduleIndex + 1,
        });
        const createdModule = unwrapApiData<{ module: { id: string } }>(moduleResponse.data);

        const manifestLessons: Array<{
          id: string;
          title: string;
          description?: string;
          order: number;
          type: string;
          duration?: number;
          assetId?: string;
          videoUrl?: string;
          fileUrl?: string;
        }> = [];

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          const attachedAsset = lesson.sourceSessionId
            ? assetBySessionId.get(lesson.sourceSessionId)
            : undefined;

          const lessonResponse = await apiClient.post(
            `/modules/${createdModule.module.id}/lessons`,
            {
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              order: lessonIndex + 1,
              duration: lesson.duration,
              assetId: attachedAsset?.id,
            }
          );
          const createdLesson = unwrapApiData<{
            lesson: {
              id: string;
              title: string;
              description?: string;
              order: number;
              type: string;
              duration?: number;
              assetId?: string;
            };
          }>(lessonResponse.data);

          manifestLessons.push({
            id: createdLesson.lesson.id,
            title: createdLesson.lesson.title,
            description: createdLesson.lesson.description,
            order: createdLesson.lesson.order,
            type: createdLesson.lesson.type,
            duration: createdLesson.lesson.duration,
            assetId: createdLesson.lesson.assetId,
            videoUrl: attachedAsset?.assetType === "VIDEO" ? attachedAsset?.storagePath : undefined,
            fileUrl: attachedAsset?.assetType !== "VIDEO" ? attachedAsset?.storagePath : undefined,
          });
        }

        manifestModules.push({
          id: createdModule.module.id,
          title: module.title,
          description: module.description,
          order: moduleIndex + 1,
          lessons: manifestLessons,
        });
      }

      await apiClient.put(`/courses/${createdCourse.courseId}`, {
        manifest: {
          modules: manifestModules,
        },
      });

      setCreatedCourseId(createdCourse.courseId);
      addMessage(
        "assistant",
        "Course shell created successfully. Metadata, modules, lessons, assets, and manifest are now synced."
      );
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create the course with module structure.";
      setBuilderError(message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file) return;

      setSelectedFile(file);
      currentUploadFileNameRef.current = file.name;

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage("user", `I've selected: ${file.name} (${formatFileSize(file.size)})`);

        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addMessage(
              "assistant",
              "Great! I can see your video file. Upload is starting automatically now."
            );

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "system",
                content: "",
                timestamp: new Date(),
                progress: 0,
                status: "uploading",
              },
            ]);

            void upload(file).catch((uploadError) => {
              console.error("[Upload Error]", uploadError);
              const message = getUploadErrorMessage(
                uploadError,
                error?.message || "Upload failed. Please try again."
              );

              // Show error message in chat
              addMessage("assistant", `❌ Upload failed: ${message}`);
            });
          }, 800);
        }, 500);
      }, 300);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setMessages([]);
    setShowCourseBuilder(false);
    setBuilderStep("metadata");
    setBuilderError(null);
    setCreatedCourseId(null);
    setUploadedVideos([]);
    builderInitializedRef.current = false;
    processedSessionIdsRef.current.clear();
    currentUploadFileNameRef.current = null;
    lastProgressRef.current = { upload: 0, analysis: 0 };
    setTimeout(() => {
      addMessage("assistant", "Let's start fresh! Please select a video file to upload.");
    }, 300);
  };

  if (!user || user.role !== "instructor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Particle Background */}
      <ParticleBackground particleCount={350} />

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center">
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-foreground font-semibold">Course Upload Assistant</h1>
              <p className="text-xs text-muted-foreground">AI-powered video processing</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el;
              }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
              )}

              <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                {message.status === "uploading" && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
                      <span className="text-foreground text-sm font-medium">Uploading video...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {message.progress?.toFixed(0)}% complete
                        </span>
                        <span className="text-muted-foreground">
                          {progress?.completedChunks} / {progress?.totalChunks} chunks
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${message.progress || 0}%` }}
                        />
                      </div>
                      {progress && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span>{progress.averageSpeed.toFixed(1)} MB/s</span>
                          <span>
                            {Math.ceil(progress.estimatedTimeRemaining / 60)} min remaining
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.status === "processing" && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
                      <span className="text-foreground text-sm font-medium">
                        {message.progress && message.progress < 30
                          ? "Downloading video..."
                          : message.progress && message.progress < 60
                            ? "Transcribing content..."
                            : message.progress && message.progress < 100
                              ? "Analyzing with AI..."
                              : "Finalizing..."}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {message.progress?.toFixed(0)}% complete
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${message.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {message.content && (
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {!selectedFile && !uploading && (
            <label className="flex items-center justify-center gap-3 px-6 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl cursor-pointer transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
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
                  d="M15 13l-3-3m0 0l-3 3m3-3v12M3 16.5v1.75A2.25 2.25 0 005.25 20.5h13.5A2.25 2.25 0 0021 18.25V16.5"
                />
              </svg>
              <span className="text-foreground font-medium">Select Video File</span>
            </label>
          )}

          {selectedFile &&
            !uploading &&
            analysisStatus !== "processing" &&
            analysisStatus !== "completed" && (
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

          {analysisStatus === "completed" && !showCourseBuilder && !createdCourseId && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCourseBuilder(true);
                  setBuilderStep("metadata");
                }}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-xl transition-colors"
              >
                Continue to Course Builder
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors"
              >
                Upload Another
              </button>
            </div>
          )}

          {showCourseBuilder && (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-semibold">Course Builder</h3>
                <div className="text-xs text-zinc-500">
                  Smooth flow: Metadata → Structure → Save
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBuilderStep("metadata")}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                    builderStep === "metadata"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  1. Metadata
                </button>
                <button
                  onClick={() => setBuilderStep("structure")}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                    builderStep === "structure"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  2. Modules & Lessons
                </button>
              </div>

              {builderStep === "metadata" && (
                <div className="space-y-3">
                  <input
                    value={metadata.name}
                    onChange={(e) => setMetadata((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Course title"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <textarea
                    value={metadata.description}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Course description"
                    rows={4}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={metadata.price}
                      onChange={(e) =>
                        setMetadata((prev) => ({
                          ...prev,
                          price: Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value),
                        }))
                      }
                      placeholder="Price (USD)"
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                    />
                    <input
                      value={metadata.category}
                      onChange={(e) =>
                        setMetadata((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="Category"
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-zinc-400">Course Thumbnail</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMetadata((prev) => ({ ...prev, thumbnail: file }));
                          }
                        }}
                        className="hidden"
                        id="thumbnail-input"
                      />
                      <label
                        htmlFor="thumbnail-input"
                        className="cursor-pointer px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        Choose Image
                      </label>
                      {metadata.thumbnail && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400">{metadata.thumbnail.name}</span>
                          <button
                            onClick={() => setMetadata((prev) => ({ ...prev, thumbnail: null }))}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                          >
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {metadata.thumbnail && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(metadata.thumbnail)}
                          alt="Thumbnail preview"
                          className="w-32 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBuilderStep("structure")}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {builderStep === "structure" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Uploaded Videos ({uploadedVideos.length})
                      </p>
                      <input
                        ref={addMoreVideoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          currentUploadFileNameRef.current = file.name;
                          void upload(file).catch((uploadError) => {
                            const message = getUploadErrorMessage(
                              uploadError,
                              "Failed to upload additional video."
                            );
                            setBuilderError(message);
                          });
                          e.currentTarget.value = "";
                        }}
                      />
                      <button
                        onClick={() => addMoreVideoInputRef.current?.click()}
                        className="px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        Upload More Videos
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedVideos.map((video) => (
                        <div
                          key={video.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/upload-session-id", video.sessionId);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-300"
                        >
                          <p className="font-medium text-zinc-100">{video.title}</p>
                          <p className="text-zinc-500 truncate max-w-[14rem]">{video.fileName}</p>
                          <select
                            className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200"
                            value={
                              modules.find((module) =>
                                module.lessons.some(
                                  (lesson) => lesson.sourceSessionId === video.sessionId
                                )
                              )?.id || ""
                            }
                            onChange={(e) => {
                              if (!e.target.value) return;
                              moveSessionLessonToModule(video.sessionId, e.target.value);
                            }}
                          >
                            <option value="">Assign to module</option>
                            {modules.map((module) => (
                              <option key={`${video.id}-${module.id}`} value={module.id}>
                                {module.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                      {uploadedVideos.length === 0 && (
                        <p className="text-xs text-zinc-500">
                          Upload at least one video to build lesson content.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Module Setup</p>
                      <button
                        onClick={handleAddModule}
                        className="px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        Add Module
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Drag uploaded videos onto modules to organize your course structure. Each
                      video becomes a lesson.
                    </p>
                    <div className="space-y-2">
                      {modules.map((module) => (
                        <div
                          key={`module-edit-${module.id}`}
                          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-2 py-2"
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceSessionId =
                              event.dataTransfer.getData("text/upload-session-id");
                            if (sourceSessionId) {
                              moveSessionLessonToModule(sourceSessionId, module.id);
                            }
                          }}
                        >
                          <input
                            value={module.title}
                            onChange={(e) =>
                              setModules((prev) =>
                                prev.map((item) =>
                                  item.id === module.id ? { ...item, title: e.target.value } : item
                                )
                              )
                            }
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
                          />
                          <span className="text-xs text-zinc-500">
                            {module.lessons.length} video{module.lessons.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 p-2">
                    <DraggableModuleEditor
                      modules={modules}
                      onModulesReorder={(reorderedModules) => setModules(reorderedModules)}
                      onLessonsReorder={(moduleId, reorderedLessons) => {
                        setModules((prev) =>
                          prev.map((module) =>
                            module.id === moduleId
                              ? {
                                  ...module,
                                  lessons: reorderedLessons.map((lesson, idx) => ({
                                    ...lesson,
                                    order: idx + 1,
                                  })),
                                }
                              : module
                          )
                        );
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setBuilderStep("metadata")}
                      className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateCourseFlow}
                      disabled={isSavingCourse}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60"
                    >
                      {isSavingCourse ? "Saving..." : "Create Course"}
                    </button>
                  </div>
                </div>
              )}

              {builderError && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <svg
                    className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{builderError}</p>
                  </div>
                  <button
                    onClick={() => setBuilderError(null)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {createdCourseId && (
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/courses/${createdCourseId}`)}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-xl transition-colors"
              >
                Open Course
              </button>
              <button
                onClick={() => router.push("/instructor/dashboard")}
                className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
