"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

type AnalysisStatus = "pending" | "processing" | "completed" | "failed" | "missing";

interface AnalysisStatusIndicatorProps {
  status: AnalysisStatus;
  onRetry?: () => void;
  className?: string;
}

export const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({
  status,
  onRetry,
  className = "",
}) => {
  const renderStatus = () => {
    switch (status) {
      case "pending":
      case "processing":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-2 text-sm ${className}`}
          >
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            <span className="text-zinc-400">
              {status === "pending" ? "Analysis queued..." : "Analysis in progress..."}
            </span>
          </motion.div>
        );

      case "completed":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 text-sm ${className}`}
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Analysis complete</span>
          </motion.div>
        );

      case "failed":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-3 ${className}`}
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Analysis failed</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        );

      case "missing":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-2 text-sm ${className}`}
          >
            <AlertCircle className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-500">No analysis available</span>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return renderStatus();
};

interface AnalysisStatusBadgeProps {
  status: AnalysisStatus;
  compact?: boolean;
}

export const AnalysisStatusBadge: React.FC<AnalysisStatusBadgeProps> = ({
  status,
  compact = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: Loader2,
          label: compact ? "Queued" : "Analysis Queued",
          className: "bg-zinc-800 text-zinc-400 border-zinc-700",
          animate: true,
        };
      case "processing":
        return {
          icon: Loader2,
          label: compact ? "Processing" : "Analyzing",
          className: "bg-blue-900/20 text-blue-400 border-blue-800",
          animate: true,
        };
      case "completed":
        return {
          icon: CheckCircle,
          label: compact ? "Done" : "Complete",
          className: "bg-green-900/20 text-green-400 border-green-800",
          animate: false,
        };
      case "failed":
        return {
          icon: AlertCircle,
          label: compact ? "Failed" : "Failed",
          className: "bg-red-900/20 text-red-400 border-red-800",
          animate: false,
        };
      case "missing":
        return {
          icon: AlertCircle,
          label: compact ? "N/A" : "No Analysis",
          className: "bg-zinc-800 text-zinc-500 border-zinc-700",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${config.className}`}
    >
      <Icon className={`w-3 h-3 ${config.animate ? "animate-spin" : ""}`} />
      <span>{config.label}</span>
    </motion.div>
  );
};
