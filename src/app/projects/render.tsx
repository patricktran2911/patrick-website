"use client";

import { motion } from "framer-motion";

const projects = [
  {
    title: "NeuroSpring Hospital Camera",
    description:
      "A real-time camera streaming app built with WebRTC, React, FastAPI, and Python. Designed for ambulance use with integrated OpenCV and custom AI classification using UNIK.",
    tech: ["React", "TypeScript", "Python", "WebRTC", "MediaPipe"],
    link: "https://neurospring.org/current-projects",
  },
  {
    title: "iOS FanFly App",
    description:
      "Developed the first modular SwiftUI app connecting artists and fans, focused on reusable UI components and rapid feature iteration.",
    tech: ["SwiftUI", "UIKit", "Figma", "Alamofire"],
    link: "https://fanfly.live",
  },
  {
    title: "Scoop iOS",
    description:
      "Implemented front-end features using SwiftUI and UIKit, integrating APIs with PromiseKit and Alamofire based on Figma designs during a real-world internship.",
    tech: ["SwiftUI", "UIKit", "PromiseKit", "Alamofire"],
    link: "#",
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-gray-800">
        {projects.map((project, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-between p-5 sm:p-6 bg-white border border-gray-200 rounded-xl shadow hover:shadow-xl transition duration-300"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                {project.title}
              </h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            {project.link && project.link !== "#" && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-blue-600 hover:underline text-sm font-medium"
              >
                View Project →
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
