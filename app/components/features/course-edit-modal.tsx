"use client";

import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/app/components/ui/modal";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useUpdateCourse } from "@/app/lib/hooks/use-instructor-courses";
import { centsToUSD, usdToCents } from "@/app/lib/utils/price";
import type { Course } from "@/app/lib/api/service-types";

export interface CourseEditModalProps {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  thumbnailUrl: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  thumbnailUrl?: string;
}

export function CourseEditModal({ course, open, onClose, onSuccess }: CourseEditModalProps) {
  const updateCourseMutation = useUpdateCourse();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    thumbnailUrl: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // Pre-fill form when course changes - use key prop on Modal instead
  // This resets the component state when course changes
  useEffect(() => {
    if (course && open) {
      // Only update when modal opens with a course
      setFormData({
        name: course.name,
        description: course.description,
        price: centsToUSD(course.price).toFixed(2), // Convert cents to USD for display
        thumbnailUrl: course.thumbnailUrl || "",
      });
      setErrors({});
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only run when modal opens

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Course name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Course name must be at least 3 characters";
    } else if (formData.name.trim().length > 200) {
      newErrors.name = "Course name must be less than 200 characters";
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = "Course description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = "Description must be less than 5000 characters";
    }

    // Validate price
    const priceNum = parseFloat(formData.price);
    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(priceNum)) {
      newErrors.price = "Price must be a valid number";
    } else if (priceNum < 0) {
      newErrors.price = "Price cannot be negative";
    } else if (priceNum > 9999.99) {
      newErrors.price = "Price cannot exceed $9,999.99";
    }

    // Validate thumbnail URL (optional but must be valid if provided)
    if (formData.thumbnailUrl.trim()) {
      try {
        new URL(formData.thumbnailUrl);
      } catch {
        newErrors.thumbnailUrl = "Thumbnail URL must be a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!course) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Optimistic update with rollback on error
      await updateCourseMutation.mutateAsync({
        courseId: course.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: usdToCents(parseFloat(formData.price)), // Convert USD to cents for backend
          thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
        },
      });

      // Success - close modal and notify parent
      onSuccess?.();
      onClose();
    } catch (_error) {
      // Error is handled by the mutation's onError
      console.error("Failed to update course:", _error);

      // Show error message to user
      alert(
        "Failed to update course: " + (_error instanceof Error ? _error.message : "Unknown error")
      );
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmed) return;
    }
    onClose();
  };

  if (!course) return null;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Edit Course"
      description="Update course information and metadata"
      size="lg"
    >
      <div className="space-y-4">
        {/* Course Name */}
        <Input
          id="course-name"
          label="Course Name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          error={errors.name}
          placeholder="Enter course name"
          fullWidth
          maxLength={200}
        />

        {/* Course Description */}
        <div>
          <label
            htmlFor="course-description"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Course Description
          </label>
          <textarea
            id="course-description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter course description"
            rows={6}
            maxLength={5000}
            className={`w-full px-4 py-2 rounded-xl border-2 bg-input text-foreground transition-all duration-200 focus:outline-none resize-none ${
              errors.description
                ? "border-white focus:border-white"
                : "border-input-border focus:border-input-focus"
            }`}
          />
          {errors.description && <p className="mt-1.5 text-sm text-white">{errors.description}</p>}
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formData.description.length} / 5000 characters
          </p>
        </div>

        {/* Course Price */}
        <Input
          id="course-price"
          label="Price (USD)"
          type="number"
          value={formData.price}
          onChange={(e) => handleInputChange("price", e.target.value)}
          error={errors.price}
          placeholder="0.00"
          fullWidth
          min="0"
          max="9999.99"
          step="0.01"
        />

        {/* Thumbnail URL */}
        <Input
          id="course-thumbnail"
          label="Thumbnail URL (Optional)"
          value={formData.thumbnailUrl}
          onChange={(e) => handleInputChange("thumbnailUrl", e.target.value)}
          error={errors.thumbnailUrl}
          placeholder="https://example.com/image.jpg"
          fullWidth
          helperText="Enter a URL to an image for the course thumbnail"
        />
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleCancel} disabled={updateCourseMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={updateCourseMutation.isPending}
          disabled={updateCourseMutation.isPending || !isDirty}
        >
          Save Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
