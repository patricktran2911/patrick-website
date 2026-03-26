"use client";

import { motion } from "framer-motion";
import PageWrapper from "@/reusable-components/PageWrapper";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const journey = [
  {
    period: "2025 – Present",
    title: "Full-Stack Developer @ NeuroSpring",
    desc: "Building real-time camera streaming and AI classification systems for ambulance-based clinical research.",
  },
  {
    period: "2024 – 2025",
    title: "iOS Developer @ FanFly",
    desc: "Developed the first modular SwiftUI app connecting artists and fans with reusable UI components.",
  },
  {
    period: "2023 – 2024",
    title: "iOS Developer @ Scoop",
    desc: "Implemented features using SwiftUI and UIKit, integrating APIs with PromiseKit and Alamofire.",
  },
];

const techStack = [
  "React / Next.js",
  "TypeScript / JavaScript",
  "Swift (SwiftUI, UIKit)",
  "FastAPI / Node.js",
  "Python / OpenCV / MediaPipe",
  "SQL / NoSQL / Supabase",
];

export default function About() {
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
          About Me
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/70 max-w-2xl mx-auto font-light"
        >
          I&apos;m Patrick Tran, a Software Engineer driven by curiosity and a
          love for elegant, practical code. My work spans mobile development,
          full-stack applications, and intelligent systems powered by computer
          vision and AI.
        </motion.p>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-10">
        {/* Journey */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">My Journey</h2>
          <div className="space-y-6">
            {journey.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1.5" />
                  {i < journey.length - 1 && (
                    <div className="w-px flex-1 bg-indigo-500/30 mt-1" />
                  )}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {item.period}
                  </span>
                  <h3 className="text-white font-semibold mt-1">{item.title}</h3>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="px-4 py-2 rounded-full text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.section>

        {/* Beyond the Code */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Beyond the Code
          </h2>
          <p className="text-white/60 leading-relaxed">
            Outside of development, I enjoy building PCs, exploring local
            trails, sipping hot tea while reading, and vibing to US-UK music. I
            believe a balanced life fuels better creativity and solutions.
          </p>
        </motion.section>
      </div>
    </PageWrapper>
  );
}
