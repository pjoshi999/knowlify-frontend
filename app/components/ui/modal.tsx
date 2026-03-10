"use client";

import { forwardRef, HTMLAttributes, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, description, size = "md", className = "", children }, ref) => {
    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          onClose();
        }
      };

      if (open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [open, onClose]);

    const sizeStyles: Record<string, string> = {
      sm: "max-w-md",
      md: "max-w-[90%]",
      lg: "max-w-[70%]",
      xl: "max-w-4xl",
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      // This is intentional for portal hydration
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                ref={ref}
                className={`bg-card border border-border rounded-2xl shadow-lg w-full ${sizeStyles[size]} ${className}`.trim()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
                aria-describedby={description ? "modal-description" : undefined}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || description) && (
                  <div className="px-6 pt-6 pb-4 border-b border-border">
                    {title && (
                      <h2 id="modal-title" className="text-xl font-semibold text-foreground">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id="modal-description"
                        className="mt-1.5 text-sm text-foreground-secondary"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4">{children}</div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

Modal.displayName = "Modal";

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-border ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = "ModalFooter";

export { Modal, ModalFooter };
