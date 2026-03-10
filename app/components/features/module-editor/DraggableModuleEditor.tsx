"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react";

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

interface DraggableModuleEditorProps {
  modules: Module[];
  onModulesReorder?: (modules: Module[]) => void;
  onLessonsReorder?: (moduleId: string, lessons: Lesson[]) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface SortableModuleProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onLessonsReorder?: (lessons: Lesson[]) => void;
}

const SortableModule: React.FC<SortableModuleProps> = ({
  module,
  isExpanded,
  onToggle,
  onLessonsReorder,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = isExpanded ? ChevronDown : ChevronRight;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
      const newIndex = module.lessons.findIndex((l) => l.id === over.id);

      const reorderedLessons = arrayMove(module.lessons, oldIndex, newIndex).map(
        (lesson, index) => ({
          ...lesson,
          order: index + 1,
        })
      );

      onLessonsReorder?.(reorderedLessons);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"
    >
      {/* Module Header */}
      <div className="flex items-center">
        <button
          {...attributes}
          {...listeners}
          className="p-3 hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5 text-zinc-600" />
        </button>

        <button
          onClick={onToggle}
          className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
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
      </div>

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
            <div className="p-2">
              {module.lessons.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-zinc-500">
                  No lessons in this module
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleLessonDragEnd}
                >
                  <SortableContext
                    items={module.lessons.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => (
                        <SortableLesson key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SortableLessonProps {
  lesson: Lesson;
}

const SortableLesson: React.FC<SortableLessonProps> = ({ lesson }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center rounded hover:bg-zinc-800 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 hover:bg-zinc-700 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-zinc-600" />
      </button>

      <div className="flex-1 px-2 py-2 flex items-center gap-3 min-w-0">
        {lesson.type === "VIDEO" ? (
          <Video className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        ) : lesson.type === "PDF" ? (
          <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        ) : (
          <ImageIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{lesson.title}</p>
          {lesson.description && (
            <p className="text-xs text-zinc-500 truncate">{lesson.description}</p>
          )}
        </div>
        {lesson.duration && (
          <span className="text-xs text-zinc-500 flex-shrink-0">
            {formatDuration(lesson.duration)}
          </span>
        )}
      </div>
    </div>
  );
};

export const DraggableModuleEditor: React.FC<DraggableModuleEditorProps> = ({
  modules: initialModules,
  onModulesReorder,
  onLessonsReorder,
}) => {
  const [modules, setModules] = useState(initialModules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((m) => m.id === active.id);
        const newIndex = items.findIndex((m) => m.id === over.id);

        const reorderedModules = arrayMove(items, oldIndex, newIndex).map((module, index) => ({
          ...module,
          order: index + 1,
        }));

        onModulesReorder?.(reorderedModules);
        return reorderedModules;
      });
    }
  };

  const handleLessonsReorder = (moduleId: string, lessons: Lesson[]) => {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons } : m)));
    onLessonsReorder?.(moduleId, lessons);
  };

  return (
    <div className="w-full space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleModuleDragEnd}
      >
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((module) => (
            <SortableModule
              key={module.id}
              module={module}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              onLessonsReorder={(lessons) => handleLessonsReorder(module.id, lessons)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500">No modules yet</p>
        </div>
      )}
    </div>
  );
};
