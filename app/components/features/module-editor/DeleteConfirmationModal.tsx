"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-zinc-300">{message}</p>
                {itemName && (
                  <div className="bg-zinc-800 rounded p-3 border border-zinc-700">
                    <p className="text-sm text-white font-medium">{itemName}</p>
                  </div>
                )}
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-800">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
                      </motion.div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

interface DeleteButtonProps {
  onDelete: () => void;
  itemType: "module" | "lesson";
  itemName: string;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  itemType,
  itemName,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-1 hover:bg-red-900/20 text-red-400 rounded transition-colors ${className}`}
        title={`Delete ${itemType}`}
      >
        <X className="w-4 h-4" />
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={`Delete ${itemType === "module" ? "Module" : "Lesson"}`}
        message={`Are you sure you want to delete this ${itemType}?${
          itemType === "module" ? " All lessons in this module will also be deleted." : ""
        }`}
        itemName={itemName}
        isDeleting={isDeleting}
      />
    </>
  );
};

interface BulkDeleteButtonProps {
  selectedCount: number;
  onDelete: () => void;
  itemType: "modules" | "lessons";
}

export const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
  selectedCount,
  onDelete,
  itemType,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-3 py-1.5 text-sm bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800 transition-colors"
      >
        Delete {selectedCount} {itemType}
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={`Delete ${selectedCount} ${itemType}`}
        message={`Are you sure you want to delete ${selectedCount} ${itemType}?`}
        isDeleting={isDeleting}
      />
    </>
  );
};
