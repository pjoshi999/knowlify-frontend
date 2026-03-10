"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/app/components/ui/loading";

export default function MarketplaceLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading courses...</p>
      </div>
    </motion.div>
  );
}
