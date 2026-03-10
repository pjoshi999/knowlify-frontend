"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
}

export const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  value: initialValue,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  className = "",
  inputClassName = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value.trim() === "") {
      setValue(initialValue);
      setIsEditing(false);
      return;
    }

    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      setValue(initialValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && multiline && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`text-left hover:bg-zinc-800/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${className}`}
      >
        {value || <span className="text-zinc-600">{placeholder}</span>}
      </button>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            rows={3}
            disabled={isSaving}
            className={`w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none ${inputClassName}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            disabled={isSaving}
            className={`w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 ${inputClassName}`}
          />
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {isSaving ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-1">
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          </motion.div>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-1 hover:bg-green-900/20 text-green-400 rounded transition-colors"
              title="Save (Enter)"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-red-900/20 text-red-400 rounded transition-colors"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface InlineEditableModuleProps {
  title: string;
  description?: string;
  onTitleSave: (title: string) => Promise<void> | void;
  onDescriptionSave: (description: string) => Promise<void> | void;
}

export const InlineEditableModule: React.FC<InlineEditableModuleProps> = ({
  title,
  description,
  onTitleSave,
  onDescriptionSave,
}) => {
  return (
    <div className="space-y-2">
      <InlineEditableField
        value={title}
        onSave={onTitleSave}
        placeholder="Module title"
        className="text-sm font-medium text-white"
      />
      <InlineEditableField
        value={description || ""}
        onSave={onDescriptionSave}
        placeholder="Add description..."
        multiline
        className="text-xs text-zinc-500"
      />
    </div>
  );
};

interface InlineEditableLessonProps {
  title: string;
  description?: string;
  onTitleSave: (title: string) => Promise<void> | void;
  onDescriptionSave: (description: string) => Promise<void> | void;
}

export const InlineEditableLesson: React.FC<InlineEditableLessonProps> = ({
  title,
  description,
  onTitleSave,
  onDescriptionSave,
}) => {
  return (
    <div className="space-y-1">
      <InlineEditableField
        value={title}
        onSave={onTitleSave}
        placeholder="Lesson title"
        className="text-sm text-white"
      />
      <InlineEditableField
        value={description || ""}
        onSave={onDescriptionSave}
        placeholder="Add description..."
        className="text-xs text-zinc-500"
      />
    </div>
  );
};
