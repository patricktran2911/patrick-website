"use client";
import { motion, AnimatePresence } from "framer-motion";

type ModalProps = {
  children?: React.ReactNode;
};

export default function Modal({ children }: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-xl text-center max-w-xs w-full"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-700">Sending...</p>
            <p className="text-sm text-gray-500">
              Please wait while we process your message.
            </p>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
