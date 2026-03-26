"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PageWrapper from "@/reusable-components/PageWrapper";

const highlights = [
  {
    title: "Full-Stack Development",
    desc: "Scalable web solutions with React, Next.js, Node.js, and FastAPI.",
    icon: "🌐",
  },
  {
    title: "Mobile App Development",
    desc: "Modular iOS applications using SwiftUI and UIKit.",
    icon: "📱",
  },
  {
    title: "AI & Computer Vision",
    desc: "Real-time AI solutions with Python, OpenCV, and MediaPipe.",
    icon: "🤖",
  },
  {
    title: "Streaming & WebRTC",
    desc: "Low-latency real-time video streaming for critical systems.",
    icon: "📡",
  },
];

export default function Home() {
  return (
    <PageWrapper className="min-h-full">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-lg shadow-indigo-500/30"
        >
          PT
        </motion.div>

        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4"
        >
          Hi, I&apos;m{" "}
          <span className="gradient-text">Patrick Tran</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl font-light leading-relaxed"
        >
          Detail-oriented Software Engineer specializing in TypeScript, React,
          Swift, Python, and AI-integrated solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects"
              className="inline-block px-7 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
            >
              View Projects
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/contact"
              className="inline-block px-7 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur border border-white/20"
            >
              Get in Touch
            </Link>
          </motion.div>
        </motion.div>
      </header>

      {/* Highlights */}
      <section className="flex justify-center px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl w-full">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.12 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300"
            >
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
