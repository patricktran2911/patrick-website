"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { sendForm } from "emailjs-com";
import { Linkedin, Mail, MapPin } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import Modal from "@/reusable-components/Modal";
import PageWrapper from "@/reusable-components/PageWrapper";
import type { ContactContent } from "@/lib/site-content-schema";

const EMAILJS_SERVICE = "service_nt4r3gp";
const EMAILJS_TEMPLATE = "template_2fa157s";
const EMAILJS_PUBLIC_KEY = "61MNx-0wj6lZewpbw";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface ContactRenderProps {
  content: ContactContent;
}

export default function Contact({ content }: ContactRenderProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!turnstileToken) {
      setCaptchaError("Please complete the bot verification.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!response.ok) {
        setCaptchaError("Bot verification failed. Please refresh and try again.");
        setIsSending(false);
        return;
      }
    } catch {
      setCaptchaError("Verification request failed. Please try again.");
      setIsSending(false);
      return;
    }

    sendForm(
      EMAILJS_SERVICE,
      EMAILJS_TEMPLATE,
      event.target as HTMLFormElement,
      EMAILJS_PUBLIC_KEY
    ).finally(() => {
      setIsSending(false);
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    });
  };

  return (
    <PageWrapper className="min-h-full">
      {isSending && <Modal />}

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

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 pb-20 lg:grid-cols-2">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fade}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-white">{content.infoTitle}</h2>
          <ul className="space-y-5">
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 flex-shrink-0 text-indigo-400" />
              <a
                href={`mailto:${content.info.email}`}
                className="text-sm text-white/70 transition-colors hover:text-indigo-300"
              >
                {content.info.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-5 w-5 flex-shrink-0 text-indigo-400" />
              <span className="text-sm text-white/70">{content.info.location}</span>
            </li>
            <li className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 flex-shrink-0 text-indigo-400" />
              <a
                href={content.info.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-indigo-300"
              >
                {content.info.linkedin.replace(/^https?:\/\//, "")}
              </a>
            </li>
          </ul>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-white">{content.messageTitle}</h2>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="mb-3 text-4xl">✉️</div>
              <p className="mb-2 font-semibold text-green-400">{content.successTitle}</p>
              <p className="text-sm text-white/50">{content.successBody}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(["name", "email", "message"] as const).map((field, index) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <label className="mb-1.5 block text-sm font-medium capitalize text-white/80">
                    {field}
                  </label>
                  {field !== "message" ? (
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={form[field]}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      placeholder={field === "email" ? "your@email.com" : "Your name"}
                    />
                  ) : (
                    <textarea
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      required
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      placeholder="Your message..."
                    />
                  )}
                </motion.div>
              ))}

              <div className="flex flex-col items-center gap-2">
                <Turnstile
                  siteKey={
                    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
                    "1x00000000000000000000AA"
                  }
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setCaptchaError(null);
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => {
                    setTurnstileToken(null);
                    setCaptchaError("Bot check failed. Please refresh.");
                  }}
                  options={{ theme: "dark" }}
                />
                {captchaError && <p className="text-center text-xs text-red-400">{captchaError}</p>}
              </div>

              <motion.button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: turnstileToken ? 1.02 : 1 }}
                whileTap={{ scale: turnstileToken ? 0.98 : 1 }}
                disabled={!turnstileToken}
              >
                {content.submitLabel}
              </motion.button>
            </form>
          )}
        </motion.section>
      </div>
    </PageWrapper>
  );
}
