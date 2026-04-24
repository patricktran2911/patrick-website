"use client";

import { motion } from "framer-motion";
import PageWrapper from "@/reusable-components/PageWrapper";
import { skillIconMap } from "@/lib/content-icons";
import type { SkillsContent } from "@/lib/site-content-schema";

interface SkillsRenderProps {
  content: SkillsContent;
}

export default function Skills({ content }: SkillsRenderProps) {
  return (
    <PageWrapper className="min-h-full">
      <header className="px-6 pb-8 pt-12 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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

      <div className="mx-auto max-w-4xl space-y-8 px-6 pb-20">
        {content.sections.map((section, sectionIndex) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="mb-6 text-xl font-bold text-white">{section.title}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {section.items.map((item, itemIndex) => {
                const Icon = skillIconMap[item.iconKey];

                return (
                  <motion.div
                    key={`${item.iconKey}-${item.label}`}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
                    whileHover={{ y: -4, scale: 1.05 }}
                    className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:bg-white/5"
                  >
                    {Icon ? (
                      <Icon className="h-8 w-8 text-indigo-400" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs text-white/60">
                        ?
                      </div>
                    )}
                    <span className="text-center text-xs font-medium text-white/70">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>
    </PageWrapper>
  );
}
