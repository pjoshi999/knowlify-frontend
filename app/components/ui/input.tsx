"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

export type InputVariant = "default" | "error" | "success";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      type = "text",
      rightIcon,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const baseStyles =
      "w-full px-4 py-2 rounded-xl border-2 bg-input text-foreground transition-all duration-200 focus:outline-none";
    const withIconStyles = rightIcon ? "pr-12" : "";

    const variantStyles: Record<InputVariant, string> = {
      default: "border-input-border focus:border-input-focus",
      error: "border-white focus:border-white",
      success: "border-white focus:border-white",
    };

    const actualVariant = error ? "error" : variant;
    const widthStyle = fullWidth ? "w-full" : "";
    const combinedClassName =
      `${baseStyles} ${withIconStyles} ${variantStyles[actualVariant]} ${className}`.trim();

    return (
      <div className={widthStyle}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
        )}
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={ref}
            type={type}
            className={combinedClassName}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>
          )}
        </motion.div>
        {error && (
          <motion.p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-white"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
