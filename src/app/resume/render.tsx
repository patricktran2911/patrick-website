"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Download, ExternalLink, Maximize2, X } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import { getGoogleDriveAssetUrls } from "@/lib/google-drive";
import type { ResumeContent } from "@/lib/site-content-schema";

interface ResumeRenderProps {
  content: ResumeContent;
}

function ResumePreview({
  previewUrl,
  interactive,
}: {
  previewUrl: string;
  interactive: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
      <div className="aspect-[8.5/11] w-full bg-white">
        <iframe
          src={previewUrl}
          title="Resume preview"
          className={`h-full w-full border-0 bg-white ${
            interactive ? "" : "pointer-events-none"
          }`}
          loading="lazy"
        />
      </div>
    </div>
  );
}

function InvalidResumeState({ driveUrl }: { driveUrl: string }) {
  return (
    <div className="glass flex min-h-[26rem] w-full max-w-md flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">Resume URL needed</h3>
      <p className="mt-3 text-sm leading-6 text-white/56">
        Add a valid public Google Drive resume URL in the admin dashboard to enable the
        live preview and download links.
      </p>
      {driveUrl.trim() && (
        <p className="mt-4 line-clamp-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/46">
          {driveUrl}
        </p>
      )}
    </div>
  );
}

export default function Resume({ content }: ResumeRenderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const driveAssets = useMemo(
    () => getGoogleDriveAssetUrls(content.driveUrl),
    [content.driveUrl]
  );

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
        {driveAssets ? (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => setIsOpen(true)}
            className="glass group relative w-full max-w-md cursor-pointer rounded-2xl p-2 transition-all duration-300 hover:border-indigo-500/30"
          >
            <ResumePreview previewUrl={driveAssets.previewUrl} interactive={false} />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition-colors group-hover:bg-black/25">
              <Maximize2 className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full"
          >
            <InvalidResumeState driveUrl={content.driveUrl} />
          </motion.div>
        )}

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

          {driveAssets ? (
            <div className="flex flex-wrap gap-3">
              <motion.a
                href={driveAssets.downloadUrl}
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

              <motion.a
                href={driveAssets.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-white/80 transition hover:bg-white/10"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ExternalLink className="h-4 w-4" />
                {content.driveLinkLabel}
              </motion.a>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Add a valid Google Drive URL in admin to enable resume actions.
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && driveAssets && (
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
              className="w-full max-w-5xl"
            >
              <div className="glass rounded-[28px] p-3">
                <div className="overflow-hidden rounded-[20px] bg-white">
                  <iframe
                    src={driveAssets.previewUrl}
                    title="Resume full preview"
                    className="h-[80vh] w-full border-0 bg-white"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
