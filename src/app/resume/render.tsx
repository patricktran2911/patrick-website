"use client";

import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Resume() {
  return (
    <div className="flex flex-col items-center bg-none text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-transparent text-white pt-12 pb-10 px-6 sm:px-8 text-center overflow-hidden">
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
          A glimpse into my background, skills, and experience. You can preview
          it below or download the full PDF.
        </motion.p>
      </header>

      {/* Main Content */}
      <main className="flex flex-col-reverse lg:flex-row justify-center items-center gap-8 px-6 sm:px-12 py-12 bg-gray-100 hover:lg:bg-gray-100/100 lg:bg-gray-100/70 w-3/4 transition-all duration-300">
        {/* Resume Preview */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl lg:w-3/5"
        >
          <iframe
            src="/Assets/pdf/Patrick's-Resume-v2.pdf#zoom=FitH"
            className="w-full aspect-[30/33] rounded-lg border shadow-lg"
            title="Patrick Tran Resume Preview"
          ></iframe>
        </motion.section>

        {/* Download + Info */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
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
    </div>
  );
}
