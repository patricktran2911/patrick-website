"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex-col bg-transparent text-gray-900 min-h-[680px] overflow-hidden font-sans">
      {/* Hero Section */}
      <header className="py-20 px-6 sm:px-8 text-center bg-transparent">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white"
        >
          Hi, I'm Patrick Tran
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-base sm:text-lg md:text-xl font-light text-white max-w-3xl mx-auto"
        >
          Detail-oriented Software Engineer experienced in full-stack web and
          mobile applications, specializing in TypeScript, React, Swift, Python,
          and AI-integrated solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <motion.a
            href="/projects"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 text-center bg-blue-700 text-white rounded-lg hover:bg-blue-500 hover:shadow-2xl transition-shadow duration-200"
          >
            View Projects
          </motion.a>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 text-center bg-blue-400 text-white rounded-lg hover:bg-blue-300 hover:shadow-2xl transition-shadow duration-200"
          >
            Get in Touch
          </motion.a>
        </motion.div>
      </header>

      {/* Skills Section */}
      <div className="flex justify-center transition-all duration-300">
        <section className="w-fit py-10 sm:py-12 px-4 sm:px-6 md:px-8 md:opacity-80 md:hover:opacity-100 md:rounded-2xl border-t border-gray-200 bg-white backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Full-Stack Development",
              "Mobile App Development",
              "AI & Computer Vision",
              "Streaming & WebRTC Systems",
            ].map((title, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.3 }}
                whileHover={{ scale: 1.03, y: -10 }}
                className="p-4 sm:p-6 bg-white border-2 rounded-xl shadow hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">
                  {title}
                </h3>
                <p className="text-sm sm:text-base md:text-lg mt-4">
                  {i === 0 &&
                    "Developing scalable web solutions with React, NextJS, Node.js, and FastAPI."}
                  {i === 1 &&
                    "Crafting modular iOS applications using SwiftUI and UIKit."}
                  {i === 2 &&
                    "Integrating real-time AI solutions using Python, OpenCV, and MediaPipe."}
                  {i === 3 &&
                    "Building real-time, low-latency video systems using WebRTC, React, and FastAPI for embedded and cross-device streaming."}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
