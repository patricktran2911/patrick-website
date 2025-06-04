"use client";

import { motion } from "framer-motion";

const projects = [
  {
    title: "NeuroSpring Hospital Camera",
    description:
      "A real-time camera streaming app built with WebRTC, React, FastAPI, and Python. Designed for ambulance use with integrated OpenCV and custom AI classification using UNIK.",
    tech: ["React", "TypeScript", "Python", "WebRTC", "MediaPipe"],
    link: "https://neurospring.org/current-projects",
    icon: "/Assets/images/neurospring_logo.png",
    logoBackground: "bg-white",
  },
  {
    title: "iOS FanFly App",
    description:
      "Developed the first modular SwiftUI app connecting artists and fans, focused on reusable UI components and rapid feature iteration.",
    tech: ["SwiftUI", "UIKit", "Figma", "Alamofire"],
    link: "https://fanfly.live",
    icon: "/Assets/images/fanfly-icon.png",
    logoBackground: "bg-black",
  },
  {
    title: "Scoop iOS",
    description:
      "Implemented front-end features using SwiftUI and UIKit, integrating APIs with PromiseKit and Alamofire based on Figma designs during a real-world internship.",
    tech: ["SwiftUI", "UIKit", "PromiseKit", "Alamofire"],
    link: "#",
    icon: "/Assets/images/scoop-icon.png",
    logoBackground: "bg-[#00b372]",
  },
  {
    title: "iUSC Citizenship Prep",
    description:
      "An offline-first, accessible citizenship study app for iOS, helping users master the U.S. naturalization test with flashcards, bilingual support, adaptive quizzes, and personalized progress tracking.",
    tech: ["SwiftUI", "Combine", "CoreData", "UIKit", "In-App Purchase"],
    link: "https://apps.apple.com/us/app/iusc/id6745776441",
    icon: "/Assets/images/iUSC-icon.png",
    logoBackground: "bg-[#969798]",
  },
];

export default function Projects() {
  return (
    <section className="min-h-screen py-16 px-4 sm:px-6 md:px-12 bg-transparent overflow-hidden">
      {/* Page Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-4xl font-extrabold text-center mb-6 text-white"
      >
        Projects
      </motion.h1>

      {/* Short Intro */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-2xl mx-auto text-center mb-10 text-white text-md sm:text-lg"
      >
        Here’s a collection of real-world projects I’ve built across web,
        mobile, and AI domains — blending creativity, engineering, and
        user-centric problem solving.
      </motion.div>

      {/* Category Tags */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mb-12 text-sm sm:text-base"
      >
        {["Full-Stack", "iOS", "AI", "Streaming", "UI/UX"].map((tag, i) => (
          <span
            key={i}
            className="px-3 py-1 bg-white text-gray-800 border border-gray-300 rounded-full shadow-sm"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* Project Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-10">
        {projects.map((project, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.48 }}
            className="
        group relative flex flex-col p-7 pb-5 bg-white/80
        backdrop-blur-md border border-gray-100 rounded-2xl
        shadow-lg hover:shadow-2xl transition-all duration-300
        overflow-hidden
      "
            style={{
              border: "1.5px solid rgba(30,144,255,0.08)",
            }}
          >
            {/* Accent Gradient Border Ring */}
            <div
              className="absolute -inset-px z-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(120deg, #3b82f6 60%, #818cf8 100%)",
                opacity: 0.09,
              }}
            />

            <div className="z-10 flex flex-col items-center mb-4">
              {project.icon && (
                <div
                  className={`w-16 h-16 mb-3 rounded-full shadow-lg flex items-center justify-center ${project.logoBackground} border border-gray-200 group-hover:scale-105 transition`}
                >
                  <img
                    src={project.icon}
                    alt={`${project.title} icon`}
                    className="w-10 h-10 object-contain"
                    draggable={false}
                  />
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-1">
                {project.title}
              </h2>
            </div>
            <p className="text-[15px] text-gray-700 mb-4 text-center">
              {project.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {project.tech.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs bg-gray-100 border border-gray-200 rounded-full font-medium text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>
            {project.link && project.link !== "#" && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="
            inline-flex items-center justify-center mt-auto py-2 px-5
            rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500
            font-medium text-[15px] shadow hover:from-blue-600 hover:to-indigo-600
            transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
          "
                style={{ letterSpacing: "0.01em" }}
              >
                View Project
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
          </motion.div>
        ))}
      </div>

      {/* Reflection Section */}
      <motion.div
        initial={{ opacity: 0.5, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-20 bg-white border-l-4 border-blue-500 p-6 max-w-4xl mx-auto rounded shadow"
      >
        <h3 className="text-lg font-semibold mb-2 text-blue-600">Reflection</h3>
        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
          Working across diverse domains from ambulance-based real-time systems
          to modular SwiftUI apps has strengthened my ability to design
          scalable, performant solutions with clear UX in mind. I enjoy learning
          from real-world constraints and turning technical challenges into
          elegant code.
        </p>
      </motion.div>
    </section>
  );
}
