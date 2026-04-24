"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Globe2, Radio, Sparkles, Smartphone } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import { homeHighlightIconMap } from "@/lib/content-icons";
import type { HomeContent } from "@/lib/site-content-schema";

const fallbackHomeHighlightIcons = {
  globe: Globe2,
  smartphone: Smartphone,
  brain: Brain,
  radio: Radio,
} as const;

interface HomeRenderProps {
  content: HomeContent;
}

function getHighlightIcon(iconKey: string) {
  return (
    homeHighlightIconMap[iconKey as keyof typeof homeHighlightIconMap] ??
    fallbackHomeHighlightIcons.globe
  );
}

export default function HomeRender({ content }: HomeRenderProps) {
  return (
    <PageWrapper className="min-h-full">
      <header className="flex flex-col items-center justify-center px-6 pb-16 pt-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-3xl font-bold text-white shadow-lg shadow-indigo-500/30"
        >
          {content.hero.monogram}
        </motion.div>

        <motion.p
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.32em] text-cyan-100/82"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Software Engineer
        </motion.p>

        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl"
        >
          {content.hero.greeting}{" "}
          <span className="gradient-text">{content.hero.name}</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="max-w-2xl text-lg font-light leading-relaxed text-white/80 sm:text-xl"
        >
          {content.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          {content.ctas.map((cta) => (
            <motion.div key={cta.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={cta.href}
                className={`inline-block rounded-xl px-7 py-3 font-semibold transition-colors ${
                  cta.style === "primary"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                    : "border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                }`}
              >
                {cta.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </header>

      <section className="flex justify-center px-4 pb-20">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          {content.highlights.map((item, index) => {
            const Icon = getHighlightIcon(item.iconKey);

            return (
              <motion.div
                key={item.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.12 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-cyan-200">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </PageWrapper>
  );
}
