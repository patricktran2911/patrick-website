"use client";

import { motion } from "framer-motion";
import PageWrapper from "@/reusable-components/PageWrapper";
import type { AboutContent } from "@/lib/site-content-schema";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface AboutRenderProps {
  content: AboutContent;
}

export default function About({ content }: AboutRenderProps) {
  return (
    <PageWrapper className="min-h-full">
      <header className="px-6 pb-8 pt-12 text-center">
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

      <div className="mx-auto max-w-4xl space-y-10 px-6 pb-20">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-white">{content.journeyTitle}</h2>
          <div className="space-y-6">
            {content.journey.map((item, index) => (
              <motion.div
                key={`${item.period}-${item.title}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="mt-1.5 h-3 w-3 rounded-full bg-indigo-500" />
                  {index < content.journey.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-indigo-500/30" />
                  )}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {item.period}
                  </span>
                  <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="mb-4 text-2xl font-bold text-white">{content.techStackTitle}</h2>
          <div className="flex flex-wrap gap-3">
            {content.techStack.map((tech, index) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="mb-4 text-2xl font-bold text-white">{content.beyondTitle}</h2>
          <p className="leading-relaxed text-white/60">{content.beyondBody}</p>
        </motion.section>
      </div>
    </PageWrapper>
  );
}
