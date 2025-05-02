"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Resume() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-transparent text-white pt-12 pb-10 px-6 sm:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-5xl font-extrabold mb-4"
        >
          My Resume
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl max-w-3xl mx-auto font-light"
        >
          Tap the preview to view in full screen or download below.
        </motion.p>
      </header>

      {/* Main content */}
      <main className="flex flex-col-reverse lg:flex-row justify-center items-center gap-8 px-6 sm:px-12 py-12 bg-gray-100 w-full max-w-5xl transition-all duration-300">
        {/* Thumbnail Preview */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
          onClick={() => setIsOpen(true)}
          className="cursor-pointer w-full max-w-md rounded-lg border shadow hover:shadow-xl transition"
        >
          <img
            src="/Assets/images/resume-thumbnail.png"
            alt="Resume thumbnail"
            className="rounded w-full"
          />
        </motion.section>

        {/* Download & Highlights */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md text-center lg:text-right"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Highlights
          </h2>
          <ul className="text-sm sm:text-base text-gray-700 space-y-2 mb-6">
            <li>• Full-stack development with React, Next.js, FastAPI</li>
            <li>• Mobile experience with SwiftUI & UIKit</li>
            <li>• AI/ML applications using MediaPipe, OpenCV, UNIK</li>
            <li>• Strong communicator and agile collaborator</li>
            <li>• Tools: Git, Supabase, AWS, Jira, Figma</li>
          </ul>
          <motion.a
            href="https://drive.google.com/uc?export=download&id=1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw"
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Download PDF Resume
          </motion.a>
        </motion.section>
      </main>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-lg md:max-w-2xl lg:max-w-5xl h-[100vh] md:h-[70vh] lg:h-[90vh] bg-white  rounded-lg shadow-lg overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X size={28} />
              </button>

              {/* PDF in iframe */}
              <iframe
                src="/Assets/pdf/Patrick's-Resume-v2.pdf#view=FitH"
                className="w-full h-full border-none"
                title="Resume Fullscreen"
                content="application/pdf"
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
