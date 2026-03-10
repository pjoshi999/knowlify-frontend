"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Tag, Target, Lightbulb, TrendingUp } from "lucide-react";

interface AIAnalysis {
  summary: string;
  topics: string[];
  learningObjectives: string[];
  keyPoints: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  transcription?: string;
}

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis;
  className?: string;
}

const difficultyColors = {
  beginner: "text-green-400 bg-green-900/20 border-green-800",
  intermediate: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
  advanced: "text-red-400 bg-red-900/20 border-red-800",
};

const difficultyLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  analysis,
  className = "",
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-white" />
        <h3 className="text-lg font-medium text-white">AI Analysis</h3>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 rounded-lg p-4 border border-zinc-800"
      >
        <h4 className="text-sm font-medium text-white mb-2">Summary</h4>
        <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* Difficulty Level */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <TrendingUp className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-500">Difficulty:</span>
        <span
          className={`text-xs px-2 py-1 rounded border ${difficultyColors[analysis.difficulty]}`}
        >
          {difficultyLabels[analysis.difficulty]}
        </span>
      </motion.div>

      {/* Topics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-zinc-500" />
          <h4 className="text-sm font-medium text-white">Topics Covered</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.topics.map((topic, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="text-xs px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700"
            >
              {topic}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Learning Objectives */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <h4 className="text-sm font-medium text-white">Learning Objectives</h4>
        </div>
        <ul className="space-y-2">
          {analysis.learningObjectives.map((objective, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <span className="text-zinc-600 mt-1">•</span>
              <span>{objective}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Key Points */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-zinc-500" />
          <h4 className="text-sm font-medium text-white">Key Points</h4>
        </div>
        <ul className="space-y-2">
          {analysis.keyPoints.map((point, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <span className="text-zinc-600 mt-1">•</span>
              <span>{point}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Transcription (if available) */}
      {analysis.transcription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-zinc-900 rounded-lg p-4 border border-zinc-800"
        >
          <h4 className="text-sm font-medium text-white mb-2">Transcription</h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-h-40 overflow-y-auto">
            {analysis.transcription}
          </p>
        </motion.div>
      )}
    </div>
  );
};
