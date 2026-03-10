"use client";

/**
 * MetadataForm Component
 *
 * Collects course metadata through a conversational flow.
 * Includes name, description, price, category, and thumbnail.
 *
 * Validates: Requirements 4.8, 4.9, 4.10
 */

import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export interface CourseMetadata {
  name: string;
  description: string;
  price: number;
  category?: string;
  thumbnailUrl?: string;
  thumbnailFile?: File;
}

interface MetadataFormProps {
  onSubmit: (metadata: CourseMetadata) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Health & Fitness",
  "Language",
  "Other",
];

export function MetadataForm({ onSubmit, onCancel }: MetadataFormProps) {
  const [metadata, setMetadata] = useState<CourseMetadata>({
    name: "",
    description: "",
    price: 0,
    category: "",
    thumbnailUrl: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseMetadata, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseMetadata, string>> = {};

    if (!metadata.name.trim()) {
      newErrors.name = "Course name is required";
    }

    if (!metadata.description.trim()) {
      newErrors.description = "Course description is required";
    } else if (metadata.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (metadata.price < 0) {
      newErrors.price = "Price must be 0 or greater";
    }

    if (metadata.price > 10000) {
      newErrors.price = "Price must be less than $10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        ...metadata,
        thumbnailFile: thumbnailFile || undefined,
      });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailFile(file);
    }
  };

  const handleThumbnailFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, thumbnailUrl: "Please upload an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, thumbnailUrl: "Image must be less than 5MB" });
      return;
    }

    setThumbnailFile(file);
    setErrors({ ...errors, thumbnailUrl: undefined });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleThumbnailFile(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview("");
    setMetadata({ ...metadata, thumbnailUrl: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Course Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
          Course Name *
        </label>
        <input
          id="name"
          type="text"
          value={metadata.name}
          onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-white"
          placeholder="e.g., Introduction to React"
        />
        {errors.name && <p className="text-sm text-white mt-1">{errors.name}</p>}
      </div>

      {/* Course Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          Course Description *
        </label>
        <textarea
          id="description"
          value={metadata.description}
          onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-white resize-none"
          placeholder="Describe what students will learn in this course..."
        />
        {errors.description && <p className="text-sm text-white mt-1">{errors.description}</p>}
      </div>

      {/* Course Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">
          Course Price (USD) *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-secondary">
            $
          </span>
          <input
            id="price"
            type="number"
            min="0"
            max="10000"
            step="0.01"
            value={metadata.price}
            onChange={(e) => setMetadata({ ...metadata, price: parseFloat(e.target.value) || 0 })}
            className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="0.00"
          />
        </div>
        {errors.price && <p className="text-sm text-white mt-1">{errors.price}</p>}
        <p className="text-xs text-foreground-secondary mt-1">Set to $0 for a free course</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
          Category (Optional)
        </label>
        <select
          id="category"
          value={metadata.category}
          onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-white"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Course Thumbnail (Optional)
        </label>

        {!thumbnailFile && !thumbnailPreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-white bg-white/10" : "border-border hover:border-white/50"
            }`}
          >
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="pointer-events-none">
              <svg
                className="mx-auto h-12 w-12 text-foreground-secondary mb-3"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-foreground mb-1">
                <span className="font-medium text-white">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-foreground-secondary">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={thumbnailPreview}
              alt="Thumbnail preview"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={removeThumbnail}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
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

        {errors.thumbnailUrl && <p className="text-sm text-white mt-1">{errors.thumbnailUrl}</p>}
        <p className="text-xs text-foreground-secondary mt-1">
          A default thumbnail will be generated if not provided
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          Create Course
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
