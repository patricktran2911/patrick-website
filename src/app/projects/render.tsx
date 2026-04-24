"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PageWrapper from "@/reusable-components/PageWrapper";
import type { ProjectsContent } from "@/lib/site-content-schema";

interface ProjectsRenderProps {
  content: ProjectsContent;
}

export default function Projects({ content }: ProjectsRenderProps) {
  return (
    <PageWrapper className="min-h-full px-4 py-12 sm:px-6 md:px-12">
      <header className="mb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-4xl font-extrabold text-white sm:text-5xl"
        >
          {content.headerTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl text-lg font-light text-white/70"
        >
          {content.intro}
        </motion.p>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {content.items.map((project, index) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            whileHover={{ y: -6 }}
            className="glass group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl shadow-lg ${project.logoBg}`}
              >
                <Image
                  src={project.icon}
                  alt={project.title}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-white transition-colors group-hover:text-indigo-300">
                {project.title}
              </h2>
            </div>

            <p className="flex-1 text-sm leading-relaxed text-white/60">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300"
                >
                  {tech}
                </span>
              ))}
            </div>

            {project.link !== "#" && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                View Project
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass mx-auto mt-16 max-w-4xl rounded-2xl border-l-4 border-indigo-500 p-6"
      >
        <h3 className="mb-2 text-lg font-semibold text-indigo-300">
          {content.reflectionTitle}
        </h3>
        <p className="text-sm leading-relaxed text-white/60">{content.reflectionBody}</p>
      </motion.div>
    </PageWrapper>
  );
}
