"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Video, FileText, Image as ImageIcon } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "IMAGE";
  order: number;
  duration?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface ModuleEditorProps {
  modules: Module[];
  editable?: boolean;
  onModuleUpdate?: (moduleId: string, data: Partial<Module>) => void;
  onLessonUpdate?: (lessonId: string, data: Partial<Lesson>) => void;
  onModuleDelete?: (moduleId: string) => void;
  onLessonDelete?: (lessonId: string) => void;
}

const getLessonIcon = (type: string) => {
  switch (type) {
    case "VIDEO":
      return Video;
    case "PDF":
      return FileText;
    case "IMAGE":
      return ImageIcon;
    default:
      return FileText;
  }
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const ModuleEditor: React.FC<ModuleEditorProps> = ({
  modules,
  editable: _editable = false,
  onModuleUpdate: _onModuleUpdate,
  onLessonUpdate: _onLessonUpdate,
  onModuleDelete: _onModuleDelete,
  onLessonDelete: _onLessonDelete,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="w-full space-y-2">
      {modules.map((module, index) => {
        const isExpanded = expandedModules.has(module.id);
        const Icon = isExpanded ? ChevronDown : ChevronRight;

        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-medium text-white truncate">{module.title}</h3>
                  {module.description && (
                    <p className="text-xs text-zinc-500 truncate">{module.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-zinc-500">
                  {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                </span>
              </div>
            </button>

            {/* Lessons List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-zinc-800"
                >
                  <div className="p-2 space-y-1">
                    {module.lessons.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-zinc-500">
                        No lessons in this module
                      </div>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => {
                        const LessonIcon = getLessonIcon(lesson.type);

                        return (
                          <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: lessonIndex * 0.03 }}
                            className="px-4 py-2 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <LessonIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{lesson.title}</p>
                                {lesson.description && (
                                  <p className="text-xs text-zinc-500 truncate">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              {lesson.duration && (
                                <span className="text-xs text-zinc-500 flex-shrink-0">
                                  {formatDuration(lesson.duration)}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500">No modules yet</p>
        </div>
      )}
    </div>
  );
};
