"use client";
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  return (
    <div className="flex flex-col space-y-2 w-full h-full text-gray-900 font-sans">
      <header className="bg-transparent text-white text-center overflow-hidden py-8">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold mb-4"
        >
          About Me
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:max-w-5xl lg:max-w-3xl mx-auto font-light"
        >
          I'm Patrick Tran, a Software Engineer driven by curiosity and a love
          for elegant, practical code. My work spans mobile development,
          full-stack applications, and intelligent systems powered by computer
          vision and AI.
        </motion.p>
      </header>

      <main className="bg-gray-300 hover:opacity-100 lg:opacity-90 px-8 py-4 max-w-5xl mx-auto space-y-8 transition-opacity duration-300">
        {["My Journey", "Tech Stack", "Beyond the Code"].map((title, idx) => (
          <motion.section
            key={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: idx * 0.2 }}
            variants={sectionVariants}
          >
            <h2 className="text-xl lg:text-2xl font-bold mb-4">{title}</h2>

            {title === "My Journey" && (
              <ul className="text-sm lg:text-[16px] space-y-6">
                <li>
                  <strong>2025–Present:</strong> Full-Stack Developer @
                  NeuroSpring – Built a camera streaming platform for ambulances
                  using React, FastAPI, OpenCV, and MediaPipe.
                </li>
                <li>
                  <strong>2023–2024:</strong> iOS Developer @ FANFLY – Designed
                  modular iOS components to speed up feature development.
                </li>
                <li>
                  <strong>2023:</strong> iOS Intern @ Scoop Inc – Collaborated
                  on SwiftUI/UIKit interfaces, and integrated REST APIs.
                </li>
                <li>
                  <strong>2022–Present:</strong> CS Student @ California State
                  University, Sacramento – Focused on AI, full-stack, and
                  systems design.
                </li>
              </ul>
            )}

            {title === "Tech Stack" && (
              <>
                <p>Here’s what I use daily and love working with:</p>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 list-disc list-inside text-sm lg:text-[16px]">
                  <li>React / Next.js</li>
                  <li>TypeScript / JavaScript</li>
                  <li>Swift (SwiftUI, UIKit)</li>
                  <li>FastAPI / Node.js</li>
                  <li>Python / OpenCV / MediaPipe</li>
                  <li>SQL / NoSQL / Supabase</li>
                </ul>
              </>
            )}

            {title === "Beyond the Code" && (
              <p className="text-sm lg:text-[16px]">
                Outside of development, I enjoy building PCs, exploring local
                trails, sipping hot tea while reading, and vibing to US-UK
                music. I believe a balanced life fuels better creativity and
                solutions.
              </p>
            )}
          </motion.section>
        ))}
      </main>
    </div>
  );
}
