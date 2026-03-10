"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AIAnalysisLoaderProps {
  message?: string;
  estimatedTime?: number; // in seconds
  progress?: number; // 0-100
}

export const AIAnalysisLoader: React.FC<AIAnalysisLoaderProps> = ({
  message = "Analyzing your course structure...",
  estimatedTime,
  progress,
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Animated icon */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="relative"
        >
          <Sparkles className="w-16 h-16 text-white" />
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-16 h-16 text-white" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <p className="text-lg text-white">{message}</p>
        {estimatedTime && (
          <p className="text-sm text-zinc-400">
            Estimated time: {Math.ceil(estimatedTime / 60)} minute
            {Math.ceil(estimatedTime / 60) !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>

      {/* Progress bar */}
      {progress !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-zinc-500 text-center">{Math.round(progress)}% complete</p>
        </motion.div>
      )}

      {/* Animated dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-zinc-600 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Status messages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center space-y-1"
      >
        <motion.p
          className="text-xs text-zinc-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          AI is processing your content...
        </motion.p>
      </motion.div>
    </div>
  );
};

interface AIAnalysisErrorProps {
  error: string;
  onRetry?: () => void;
}

export const AIAnalysisError: React.FC<AIAnalysisErrorProps> = ({ error, onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-red-400">Analysis Failed</p>
            <p className="text-xs text-red-300">{error}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded-lg transition-colors text-sm"
          >
            Try Again
          </button>
        )}
      </div>
    </motion.div>
  );
};
