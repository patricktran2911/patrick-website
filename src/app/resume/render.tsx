"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2 } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";

const RESUME_DOWNLOAD =
  "https://drive.google.com/uc?export=download&id=1wgqk3KyJd1mj3O02Swn9Hyf1jG6_iUYm";
const RESUME_VIEW =
  "https://drive.google.com/file/d/1wgqk3KyJd1mj3O02Swn9Hyf1jG6_iUYm/view";

const highlights = [
  "Full-stack development with React, Next.js, FastAPI",
  "Mobile experience with SwiftUI & UIKit",
  "AI/ML applications using MediaPipe, OpenCV, UNIK",
  "Strong communicator and agile collaborator",
  "Tools: Git, Supabase, AWS, Jira, Figma",
];

export default function Resume() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PageWrapper className="min-h-full">
      {/* Header */}
      <header className="text-center px-6 pt-12 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
        >
          My Resume
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/70 max-w-2xl mx-auto font-light"
        >
          Tap the preview to view in full screen, or download below.
        </motion.p>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-20 flex flex-col-reverse lg:flex-row items-center gap-8">
        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onClick={() => setIsOpen(true)}
          className="glass rounded-2xl p-2 cursor-pointer group hover:border-indigo-500/30 transition-all duration-300 relative"
        >
          <img
            src="/Assets/images/resume-thumbnail.png"
            alt="Resume thumbnail"
            className="rounded-xl w-full max-w-md"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 group-hover:bg-black/30 transition-colors">
            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        {/* Highlights & Download */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass rounded-2xl p-8 w-full max-w-md"
        >
          <h2 className="text-xl font-bold text-white mb-4">Highlights</h2>
          <ul className="space-y-2.5 mb-8">
            {highlights.map((h, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-2 text-sm text-white/70"
              >
                <span className="text-indigo-400 mt-0.5">•</span>
                {h}
              </motion.li>
            ))}
          </ul>

          <motion.a
            href={RESUME_DOWNLOAD}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Download PDF Resume
          </motion.a>
        </motion.div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.button
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
              onClick={() => setIsOpen(false)}
              whileHover={{ scale: 1.1 }}
            >
              <X size={28} />
            </motion.button>

            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl w-full max-h-[90vh] overflow-auto"
            >
              <img
                src="/Assets/images/resume-thumbnail.png"
                alt="Resume full view"
                className="w-full rounded-xl"
              />
              <div className="flex justify-center mt-4">
                <a
                  href={RESUME_VIEW}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                >
                  Open in Google Drive →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
