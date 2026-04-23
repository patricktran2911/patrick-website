"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import { QUICK_PROMPTS } from "@/reusable-components/chat/chatShared";

function openFloatingChat(prompt?: string) {
  window.dispatchEvent(
    new CustomEvent("patrick-chat:open", {
      detail: prompt ? { prompt } : undefined,
    })
  );
}

export default function Chat() {
  useEffect(() => {
    openFloatingChat();
  }, []);

  return (
    <PageWrapper className="min-h-full">
      <section className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-2xl shadow-sky-500/20"
        >
          <MessageCircle className="h-9 w-9" />
        </motion.div>

        <motion.h1
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          Patrick AI now opens as a floating popup
        </motion.h1>

        <motion.p
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mt-4 max-w-2xl text-base leading-7 text-white/68 sm:text-lg"
        >
          The assistant lives in the bottom-right corner so visitors can chat from
          anywhere without leaving the page. Use the prompt starters below or tap the
          floating button to jump straight in.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => openFloatingChat(prompt.prompt)}
              className="chat-chip px-4 py-2.5 text-sm text-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              {prompt.label}
            </button>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
          onClick={() => openFloatingChat()}
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-950 shadow-2xl shadow-sky-500/10 transition hover:-translate-y-0.5"
        >
          <MessageCircle className="h-4 w-4" />
          Open Patrick AI
        </motion.button>
      </section>
    </PageWrapper>
  );
}
