"use client";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex-col bg-transparent text-gray-900 min-h-[680px] min-w-64 overflow-hidden font-sans">
      <header className="py-20 px-8 text-center bg-transparent">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl font-extrabold mb-4 text-white"
        >
          Hi, I'm Patrick Tran
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-xl font-light text-white"
        >
          Detail-oriented Software Engineer experienced in full-stack web and
          mobile applications, specializing in TypeScript, React, Swift, Python,
          and AI-integrated solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-10 flex justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 hover:cursor-pointer bg-blue-700 text-white rounded-lg hover:bg-blue-400 hover:shadow-2xl transition-shadow duration-200"
          >
            View Projects
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 hover:cursor-pointer bg-blue-400 text-white rounded-lg hover:bg-blue-200 hover:shadow-2xl transition-shadow duration-200"
          >
            Get in Touch
          </motion.button>
        </motion.div>
      </header>

      <section className="flex py-3 sm:px-2 lg:py-16 lg:px-8 border-gray-200 md:sm:opacity-100 lg:opacity-80 hover:opacity-100 bg-white backdrop-blur-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            "Full-Stack Development",
            "Mobile App Development",
            "AI & Computer Vision",
          ].map((title, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.3 }}
              whileHover={{ scale: 1.03, y: -10 }}
              className="p-3 lg:p-6 bg-white border-[2px] rounded-lg shadow hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="sm:text-lg lg:text-2xl font-semibold">{title}</h3>
              <p className="lg:text-lg text-sm mt-4">
                {i === 0 &&
                  "Developing scalable web solutions with React, NextJS, Node.js, and FastAPI."}
                {i === 1 &&
                  "Crafting modular iOS applications using SwiftUI and UIKit."}
                {i === 2 &&
                  "Integrating real-time AI solutions using Python, OpenCV, and MediaPipe."}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
