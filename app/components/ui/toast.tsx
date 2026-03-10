"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  retryable?: boolean;
  onRetry?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is intentional for portal hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
      bg: "bg-zinc-900/90 backdrop-blur-sm",
      border: "border-green-500",
      icon: "✓",
    },
    error: {
      bg: "bg-zinc-900/90 backdrop-blur-sm",
      border: "border-red-500",
      icon: "✕",
    },
    warning: {
      bg: "bg-zinc-900/90 backdrop-blur-sm",
      border: "border-yellow-500",
      icon: "⚠",
    },
    info: {
      bg: "bg-zinc-900/90 backdrop-blur-sm",
      border: "border-blue-500",
      icon: "ℹ",
    },
  };

  const styles = typeStyles[toast.type];

  return (
    <motion.div
      className={`${styles.bg} ${styles.border} border-l-4 rounded-xl p-4 shadow-lg`}
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          {styles.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white">{toast.title}</h4>
          {toast.description && <p className="mt-1 text-sm text-zinc-400">{toast.description}</p>}
          {toast.retryable && toast.onRetry && (
            <button
              onClick={() => {
                toast.onRetry?.();
                onClose();
              }}
              className="mt-2 text-sm text-white hover:text-zinc-300 underline transition-colors"
            >
              Retry
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
