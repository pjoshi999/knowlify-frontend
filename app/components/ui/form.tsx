"use client";

import { forwardRef, HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
  children: ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`.trim()} {...props}>
        {children}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export interface FormLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "className"> {
  className?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className = "", required = false, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-foreground mb-1.5 ${className}`.trim()}
        {...props}
      >
        {children}
        {required && (
          <span className="text-white ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = "FormLabel";

export interface FormErrorProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "className"> {
  className?: string;
  children: ReactNode;
}

export const FormError = forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className = "", children }, ref) => {
    if (!children) return null;

    return (
      <motion.p
        ref={ref}
        className={`mt-1.5 text-sm text-white ${className}`.trim()}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        role="alert"
      >
        {children}
      </motion.p>
    );
  }
);

FormError.displayName = "FormError";

export interface FormHelperTextProps extends Omit<
  HTMLAttributes<HTMLParagraphElement>,
  "className"
> {
  className?: string;
  children: ReactNode;
}

export const FormHelperText = forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className = "", children, ...props }, ref) => {
    if (!children) return null;

    return (
      <p
        ref={ref}
        className={`mt-1.5 text-sm text-muted-foreground ${className}`.trim()}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormHelperText.displayName = "FormHelperText";

export interface FormMessageProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "className"> {
  className?: string;
  type?: "error" | "success" | "info";
  children: ReactNode;
}

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className = "", type = "info", children }, ref) => {
    if (!children) return null;

    const typeStyles: Record<string, string> = {
      error: "text-white",
      success: "text-white",
      info: "text-white",
    };

    return (
      <motion.p
        ref={ref}
        className={`mt-1.5 text-sm ${typeStyles[type]} ${className}`.trim()}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        role={type === "error" ? "alert" : "status"}
      >
        {children}
      </motion.p>
    );
  }
);

FormMessage.displayName = "FormMessage";
