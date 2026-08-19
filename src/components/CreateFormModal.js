"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreateForm from "./CreateForm";

export default function CreateFormModal({
  isOpen,
  onClose,
  onCardCreated,
  editingCard,
  onCardUpdated,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 my-auto rounded-2xl shadow-2xl"
          >
            <CreateForm
              onCardCreated={(newCard) => {
                onCardCreated(newCard);
                onClose();
              }}
              editingCard={editingCard}
              onCardUpdated={(updatedCard) => {
                onCardUpdated(updatedCard);
                onClose();
              }}
              onCancelEdit={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
