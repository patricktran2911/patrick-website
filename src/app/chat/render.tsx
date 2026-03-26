"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Settings2, ChevronDown } from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";

const BASE_URL = "https://ai-dev.patrickcs-web.com";

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

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm Patrick's personal AI. Ask me anything about his background, skills, projects, or experience.\n\nHỏi bằng tiếng Việt cũng được!",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<Mode>("stream");
  const [context, setContext] = useState("auto");
  const [sessionId, setSessionId] = useState("session-" + uid());
  const [showSettings, setShowSettings] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addMessage = useCallback(
    (role: Role, text: string, extra?: Partial<Message>) => {
      const msg: Message = { id: uid(), role, text, ...extra };
      setMessages((prev) => [...prev, msg]);
      return msg.id;
    },
    []
  );

  const updateMessage = useCallback((id: string, update: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...update } : m))
    );
  }, []);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "Chat cleared. Ask me anything!",
      },
    ]);
  };

  // ── Send message ──────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    addMessage("user", text);

    const body: Record<string, string> = { message: text, context };
    if (sessionId) body.session_id = sessionId;

    try {
      if (mode === "stream") {
        await sendStream(body);
      } else {
        await sendSync(body);
      }
    } catch (err) {
      addMessage("assistant", `Error: ${(err as Error).message}`, {
        supported: false,
      });
    } finally {
      setSending(false);
      setStreamingId(null);
    }
  }

  // ── SSE streaming ─────────────────────────────────────────────────
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
        text: "⚠️ Rate limit reached — please wait a minute before sending more messages.",
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
        body.context === "auto"
          ? `auto → ${resolvedContext}`
          : resolvedContext;
      updateMessage(assistantId, {
        text: textContent || "I don't have enough information to answer that.",
        supported,
        context: resolvedContext,
        meta: `${ctxLabel} · SSE stream`,
      });
    }
  }

  // ── Sync request ──────────────────────────────────────────────────
  async function sendSync(body: Record<string, string>) {
    const resp = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (resp.status === 429) {
      addMessage(
        "assistant",
        "⚠️ Rate limit reached — please wait a minute.",
        { supported: false }
      );
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

  // ── Key handler ───────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <PageWrapper className="flex flex-col h-[calc(100vh-70px)]">
      {/* ── Header bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 glass border-b border-white/5 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
          P
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">
            Patrick AI / Trợ Lý AI
          </h1>
          <p className="text-xs text-white/40 truncate">
            This is an AI representation for me - It trained on my resume, projects, and profile to answer questions about my background and experience. It can also chat in Vietnamese!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearChat}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── Settings panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/5 flex-shrink-0"
          >
            <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-3 bg-white/[0.03]">
              {/* Context */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/40">Context</label>
                <div className="relative">
                  <select
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="appearance-none bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-indigo-500 transition"
                  >
                    <option value="auto">✦ Auto-detect</option>
                    <option value="profile">profile</option>
                    <option value="projects">projects</option>
                    <option value="portfolio">portfolio</option>
                    <option value="general">general</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/40">Mode</label>
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                  {(["stream", "sync"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        mode === m
                          ? "bg-indigo-600 text-white shadow"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {m === "stream" ? "Stream (SSE)" : "Sync"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session ID */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/40">Session</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 w-36 outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 max-w-3xl ${
                msg.role === "user"
                  ? "ml-auto flex-row-reverse"
                  : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-gray-600 text-white"
                    : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                }`}
              >
                {msg.role === "user" ? "U" : "P"}
              </div>

              {/* Bubble */}
              <div className="flex flex-col gap-1 min-w-0">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : msg.supported === false
                        ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-md"
                        : "glass text-white/90 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                  {streamingId === msg.id && (
                    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-text-bottom cursor-blink" />
                  )}
                </div>

                {/* Meta badge */}
                {msg.meta && (
                  <span className="text-[10px] text-white/30 font-mono px-1">
                    {msg.context && (
                      <span className="inline-block bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-indigo-400 mr-1">
                        {msg.meta.includes("auto →") ? "✦ " : ""}
                        {msg.context}
                      </span>
                    )}
                    {msg.meta}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {sending && !streamingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-3xl"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              P
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Input bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/5 glass">
        <div className="flex items-end gap-3 px-4 sm:px-6 py-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Ask about Patrick… / Hỏi bằng tiếng Việt…"
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500 transition resize-none min-h-[44px] max-h-[140px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 140) + "px";
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-indigo-600 text-white disabled:bg-white/5 disabled:text-white/20 transition-colors shadow-lg shadow-indigo-600/30 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </PageWrapper>
  );
}
