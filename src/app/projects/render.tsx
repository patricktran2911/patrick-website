"use client";

import { motion } from "framer-motion";
import PageWrapper from "@/reusable-components/PageWrapper";

const projects = [
  {
    title: "NeuroSpring Hospital Camera",
    description:
      "A real-time camera streaming app built with WebRTC, React, FastAPI, and Python. Designed for ambulance use with integrated OpenCV and custom AI classification using UNIK.",
    tech: ["React", "TypeScript", "Python", "WebRTC", "MediaPipe"],
    link: "https://neurospring.org/current-projects",
    icon: "/Assets/images/neurospring_logo.png",
    logoBg: "bg-white",
  },
  {
    title: "iOS FanFly App",
    description:
      "Developed the first modular SwiftUI app connecting artists and fans, focused on reusable UI components and rapid feature iteration.",
    tech: ["SwiftUI", "UIKit", "Figma", "Alamofire"],
    link: "https://fanfly.live",
    icon: "/Assets/images/fanfly-icon.png",
    logoBg: "bg-black",
  },
  {
    title: "Scoop iOS",
    description:
      "Implemented front-end features using SwiftUI and UIKit, integrating APIs with PromiseKit and Alamofire based on Figma designs during a real-world internship.",
    tech: ["SwiftUI", "UIKit", "PromiseKit", "Alamofire"],
    link: "#",
    icon: "/Assets/images/scoop-icon.png",
    logoBg: "bg-[#00b372]",
  },
  {
    title: "iUSC Citizenship Prep",
    description:
      "An offline-first, accessible citizenship study app for iOS, helping users master the U.S. naturalization test with flashcards, bilingual support, adaptive quizzes, and personalized progress tracking.",
    tech: ["SwiftUI", "Combine", "CoreData", "UIKit", "In-App Purchase"],
    link: "https://apps.apple.com/us/app/iusc/id6745776441",
    icon: "/Assets/images/iUSC-icon.png",
    logoBg: "bg-[#969798]",
  },
];

export default function Projects() {
  return (
    <PageWrapper className="min-h-full px-4 sm:px-6 md:px-12 py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
        >
          Projects
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/70 max-w-2xl mx-auto font-light"
        >
          A collection of real-world projects across web, mobile, and AI
          domains — blending creativity, engineering, and problem-solving.
        </motion.p>
      </header>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {projects.map((project, i) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -6 }}
            className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-indigo-500/30 transition-all duration-300 group"
          >
            {/* Icon + Title */}
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${project.logoBg} flex items-center justify-center overflow-hidden shadow-lg`}
              >
                <img
                  src={project.icon}
                  alt={project.title}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                {project.title}
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm text-white/60 leading-relaxed flex-1">
              {project.description}
            </p>

            {/* Tech chips */}
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Link */}
            {project.link !== "#" && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 font-medium mt-auto pt-2"
              >
                View Project
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
          </motion.article>
        ))}
      </div>

      {/* Reflection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-16 glass rounded-2xl p-6 max-w-4xl mx-auto border-l-4 border-indigo-500"
      >
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">
          Reflection
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Working across diverse domains from ambulance-based real-time systems
          to consumer iOS apps has taught me that great software comes from deeply
          understanding the user's context and constraints.
        </p>
      </motion.div>
    </PageWrapper>
  );
}
