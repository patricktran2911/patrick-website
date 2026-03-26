"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { sendForm } from "emailjs-com";
import { Mail, MapPin, Linkedin } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import Modal from "@/reusable-components/Modal";
import PageWrapper from "@/reusable-components/PageWrapper";

const EMAILJS_SERVICE = "service_nt4r3gp";
const EMAILJS_TEMPLATE = "template_2fa157s";
const EMAILJS_PUBLIC_KEY = "61MNx-0wj6lZewpbw";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setCaptchaError("Please complete the bot verification.");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      if (!res.ok) {
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
      e.target as HTMLFormElement,
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

      {/* Header */}
      <header className="text-center px-6 pt-12 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
        >
          Get in Touch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/70 max-w-2xl mx-auto font-light"
        >
          Whether you&apos;re looking to collaborate, ask questions, or just say
          hi — I&apos;m always open to meaningful connections.
        </motion.p>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Info */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fade}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Contact Info</h2>
          <ul className="space-y-5">
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <a
                href="mailto:patricktran291197@gmail.com"
                className="text-white/70 hover:text-indigo-300 transition-colors text-sm"
              >
                patricktran291197@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span className="text-white/70 text-sm">
                Sacramento, CA, United States
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Linkedin className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <a
                href="https://linkedin.com/in/patrick-tran-99768828a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-indigo-300 transition-colors text-sm"
              >
                linkedin.com/in/patrick-tran-99768828a
              </a>
            </li>
          </ul>
        </motion.section>

        {/* Contact Form */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fade}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Send a Message
          </h2>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-green-400 font-semibold mb-2">
                Message sent!
              </p>
              <p className="text-white/50 text-sm">
                Thanks for reaching out. I&apos;ll get back to you soon.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(["name", "email", "message"] as const).map((field, idx) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                >
                  <label className="block mb-1.5 text-sm font-medium text-white/80 capitalize">
                    {field}
                  </label>
                  {field !== "message" ? (
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={form[field]}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition"
                      placeholder={
                        field === "email"
                          ? "your@email.com"
                          : "Your name"
                      }
                    />
                  ) : (
                    <textarea
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition resize-none"
                      placeholder="Your message…"
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
                {captchaError && (
                  <p className="text-red-400 text-xs text-center">{captchaError}</p>
                )}
              </div>
              <motion.button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: turnstileToken ? 1.02 : 1 }}
                whileTap={{ scale: turnstileToken ? 0.98 : 1 }}
                disabled={!turnstileToken}
              >
                Send Message
              </motion.button>
            </form>
          )}
        </motion.section>
      </div>
    </PageWrapper>
  );
}
