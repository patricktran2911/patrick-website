"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Settings2,
  X,
  MessageCircle,
  Minimize2,
} from "lucide-react";

const BASE_URL =
  process.env.NEXT_PUBLIC_AI_API_URL ?? "https://ai-dev.patrickcs-web.com";

type Role = "user" | "assistant";
type Mode = "stream" | "sync";

interface Message {
  id: string;
  role: Role;
  text: string;
  context?: string;
  supported?: boolean;
  meta?: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm Patrick's personal AI. Ask me anything about his background, skills, projects, or experience.\n\nHỏi bằng tiếng Việt cũng được!",
};

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<Mode>("stream");
  const context = "auto";
  const [sessionId] = useState("session-" + uid());
  const [showSettings, setShowSettings] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const addMessage = useCallback(
    (role: Role, text: string, extra?: Partial<Message>) => {
      const msg: Message = { id: uid(), role, text, ...extra };
      setMessages((prev) => [...prev, msg]);
      if (role === "assistant" && !open) setHasUnread(true);
      return msg.id;
    },
    [open]
  );

  const updateMessage = useCallback(
    (id: string, update: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...update } : m))
      );
    },
    []
  );

  const clearChat = () =>
    setMessages([{ ...WELCOME, id: "welcome-" + uid(), text: "Chat cleared. Ask me anything!" }]);

  // ── Send ────────────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    addMessage("user", text);

    const body: Record<string, string> = { message: text, context };
    if (sessionId) body.session_id = sessionId;

    try {
      if (mode === "stream") await sendStream(body);
      else await sendSync(body);
    } catch (err) {
      addMessage("assistant", `Error: ${(err as Error).message}`, {
        supported: false,
      });
    } finally {
      setSending(false);
      setStreamingId(null);
    }
  }

  // ── SSE stream ──────────────────────────────────────────────────
  async function sendStream(body: Record<string, string>) {
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", text: "" },
    ]);
    setStreamingId(assistantId);

    const resp = await fetch(`${BASE_URL}/api/v1/ai/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (resp.status === 429) {
      updateMessage(assistantId, {
        text: "⚠️ Rate limit reached — please wait a minute.",
        supported: false,
      });
      return;
    }
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(
        (err as Record<string, string>).error || `HTTP ${resp.status}`
      );
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let textContent = "";
    let supported = true;
    let resolvedContext = body.context;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.token !== undefined) {
            textContent += payload.token;
            updateMessage(assistantId, { text: textContent });
          }
          if (payload.done) {
            supported = payload.supported !== false;
            if (payload.context) resolvedContext = payload.context;
          }
          if (payload.error) {
            textContent += `[Error: ${payload.error}]`;
            updateMessage(assistantId, { text: textContent });
            supported = false;
          }
        }
      }
    } finally {
      const ctxLabel =
        body.context === "auto" ? `auto → ${resolvedContext}` : resolvedContext;
      updateMessage(assistantId, {
        text: textContent || "I don't have enough information to answer that.",
        supported,
        context: resolvedContext,
        meta: `${ctxLabel} · SSE`,
      });
    }
  }

  // ── Sync ────────────────────────────────────────────────────────
  async function sendSync(body: Record<string, string>) {
    const resp = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (resp.status === 429) {
      addMessage("assistant", "⚠️ Rate limit reached — please wait a minute.", {
        supported: false,
      });
      return;
    }
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

    const answer = data.data?.answer || "";
    const isSupported = data.data?.supported !== false;
    const meta = data.meta || {};
    const resolvedContext = meta.context || body.context;
    const ctxLabel =
      body.context === "auto" ? `auto → ${resolvedContext}` : resolvedContext;

    addMessage("assistant", answer, {
      supported: isSupported,
      context: resolvedContext,
      meta: `${ctxLabel} · sync · ${meta.chunks_validated ?? "?"}/${meta.chunks_retrieved ?? "?"} chunks`,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Backdrop (mobile) ──────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 sm:hidden bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Chat panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ transformOrigin: "bottom right" }}
            className={[
              "fixed z-50 flex flex-col overflow-hidden",
              "bottom-0 right-0 sm:bottom-24 sm:right-6",
              "w-full sm:w-[400px]",
              "h-[100dvh] sm:h-[560px]",
              "sm:rounded-2xl shadow-2xl shadow-black/50",
              "bg-[#13151f] border-0 sm:border border-white/10",
            ].join(" ")}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#1a1d27] flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                P
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  Patrick AI
                </p>
                <p className="text-[11px] text-white/40 truncate">
                  RAG + LLM · Hỗ trợ tiếng Việt
                </p>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Settings"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={clearChat}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Settings drawer */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-white/5 flex-shrink-0 bg-[#0f1117]"
                >
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    {/* Mode toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white/40">Mode</span>
                      <div className="flex bg-white/5 rounded-md p-0.5 border border-white/10">
                        {(["stream", "sync"] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-2.5 py-0.5 text-[11px] rounded transition-all ${
                              mode === m
                                ? "bg-indigo-600 text-white"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            {m === "stream" ? "Stream" : "Sync"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2.5 ${
                      msg.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-1">
                        P
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[78%]">
                      <div
                        className={[
                          "px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : msg.supported === false
                              ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm"
                              : "bg-[#1e2130] text-white/90 rounded-bl-sm",
                        ].join(" ")}
                      >
                        {msg.text}
                        {streamingId === msg.id && msg.text === "" && (
                          <span className="flex gap-1 py-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </span>
                        )}
                        {streamingId === msg.id && msg.text !== "" && (
                          <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 align-text-bottom cursor-blink" />
                        )}
                      </div>
                      {msg.meta && (
                        <span className="text-[10px] text-white/25 font-mono px-1">
                          {msg.meta}
                        </span>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-1">
                        U
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {sending && !streamingId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5 justify-start"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    P
                  </div>
                  <div className="bg-[#1e2130] px-3 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-white/5 bg-[#1a1d27] px-3 py-3 pb-[env(safe-area-inset-bottom,12px)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder="Ask about Patrick…"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-base sm:text-[13px] text-white placeholder:text-white/30 outline-none focus:border-indigo-500 transition resize-none min-h-[38px] max-h-[100px]"
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 100) + "px";
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:bg-white/5 disabled:text-white/20 transition-colors shadow-lg shadow-indigo-600/30 disabled:shadow-none flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB button ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50">
        {/* Pulse ring */}
        {!open && (
          <motion.div
            className="absolute inset-0 rounded-full bg-indigo-500/30"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        <motion.button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close chat" : "Open AI chat"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 text-white"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {hasUnread && !open && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0f1117] text-[9px] font-bold text-white flex items-center justify-center"
              >
                •
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
