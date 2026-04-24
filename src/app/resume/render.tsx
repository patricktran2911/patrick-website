"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Download, Maximize2, X } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import type { ResumeContent } from "@/lib/site-content-schema";

interface ResumeRenderProps {
  content: ResumeContent;
}

export default function Resume({ content }: ResumeRenderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const resumeDownload = `https://drive.google.com/uc?export=download&id=${content.resumeFileId}`;
  const resumeView = `https://drive.google.com/file/d/${content.resumeFileId}/view`;

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl text-lg font-light text-white/70"
        >
          {content.intro}
        </motion.p>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-8 px-6 pb-20 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onClick={() => setIsOpen(true)}
          className="glass group relative cursor-pointer rounded-2xl p-2 transition-all duration-300 hover:border-indigo-500/30"
        >
          <Image
            src={content.thumbnail}
            alt="Resume thumbnail"
            width={720}
            height={920}
            className="w-full max-w-md rounded-xl"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition-colors group-hover:bg-black/30">
            <Maximize2 className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass w-full max-w-md rounded-2xl p-8"
        >
          <h2 className="mb-4 text-xl font-bold text-white">{content.highlightsTitle}</h2>
          <ul className="mb-8 space-y-2.5">
            {content.highlights.map((highlight, index) => (
              <motion.li
                key={`${highlight}-${index}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.08 }}
                className="flex items-start gap-2 text-sm text-white/70"
              >
                <span className="mt-0.5 text-indigo-400">•</span>
                {highlight}
              </motion.li>
            ))}
          </ul>

          <motion.a
            href={resumeDownload}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="h-4 w-4" />
            {content.downloadLabel}
          </motion.a>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.button
              className="absolute right-4 top-4 p-2 text-white/70 hover:text-white"
              onClick={() => setIsOpen(false)}
              whileHover={{ scale: 1.1 }}
            >
              <X size={28} />
            </motion.button>

            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-auto"
            >
              <Image
                src={content.thumbnail}
                alt="Resume full view"
                width={1200}
                height={1600}
                className="w-full rounded-xl"
              />
              <div className="mt-4 flex justify-center">
                <a
                  href={resumeView}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {content.driveLinkLabel} →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
