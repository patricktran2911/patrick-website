"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ChevronDown,
  Send,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import {
  BASE_URL,
  buildMetaLabel,
  COMPOSER_HINT,
  CONTEXT_OPTIONS,
  createClearedMessage,
  createWelcomeMessage,
  Message,
  Mode,
  QUICK_PROMPTS,
  resetTextareaHeight,
  resizeTextarea,
  Role,
  uid,
} from "@/reusable-components/chat/chatShared";

function renderMeta(meta?: string) {
  if (!meta) return null;

  return meta.split(" · ").map((part) => (
    <span key={part} className="chat-meta-pill">
      {part}
    </span>
  ));
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<Mode>("stream");
  const [context, setContext] = useState("auto");
  const [sessionId, setSessionId] = useState(`session-${uid()}`);
  const [showSettings, setShowSettings] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sending) {
      inputRef.current?.focus();
    }
  }, [sending]);

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
      prev.map((message) => (message.id === id ? { ...message, ...update } : message))
    );
  }, []);

  const clearChat = () => {
    setMessages([createClearedMessage()]);
    setStreamingId(null);
    setInput("");
    resetTextareaHeight(inputRef.current);
    inputRef.current?.focus();
  };

  async function submitMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;

    setInput("");
    resetTextareaHeight(inputRef.current);
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
    } catch (error) {
      addMessage("assistant", `Error: ${(error as Error).message}`, {
        supported: false,
      });
    } finally {
      setSending(false);
      setStreamingId(null);
    }
  }

  async function handleSend() {
    await submitMessage(input);
  }

  async function sendStream(body: Record<string, string>) {
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", text: "" },
    ]);
    setStreamingId(assistantId);

    const response = await fetch(`${BASE_URL}/api/v1/ai/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      updateMessage(assistantId, {
        text: "Rate limit reached. Please wait a minute before sending another message.",
        supported: false,
      });
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as Record<string, string>).error || `HTTP ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("The stream could not be read.");
    }

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
        buffer = lines.pop() ?? "";

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
      updateMessage(assistantId, {
        text: textContent || "I do not have enough information to answer that yet.",
        supported,
        context: resolvedContext,
        meta: buildMetaLabel({
          requestedContext: body.context,
          resolvedContext,
          transport: "Live stream",
        }),
      });
    }
  }

  async function sendSync(body: Record<string, string>) {
    const response = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      addMessage(
        "assistant",
        "Rate limit reached. Please wait a minute before sending another message.",
        { supported: false }
      );
      return;
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

    const answer = data.data?.answer || "";
    const isSupported = data.data?.supported !== false;
    const meta = data.meta || {};
    const resolvedContext = meta.context || body.context;

    addMessage("assistant", answer, {
      supported: isSupported,
      context: resolvedContext,
      meta: buildMetaLabel({
        requestedContext: body.context,
        resolvedContext,
        transport: "Single response",
        chunksValidated: meta.chunks_validated,
        chunksRetrieved: meta.chunks_retrieved,
      }),
    });
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  const showQuickPrompts = messages.length <= 1 && !sending;

  return (
    <PageWrapper className="min-h-[calc(100dvh-72px)] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto flex h-[calc(100dvh-96px)] max-w-6xl flex-col rounded-[30px] chat-shell">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="chat-status-pill">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Knowledge-aware assistant
              </span>
              <span className="chat-status-pill">
                <Bot className="h-3.5 w-3.5 text-indigo-300" />
                English + Vietnamese
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-base font-semibold text-white shadow-lg shadow-sky-500/20">
                P
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Chat with Patrick AI
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60 sm:text-[15px]">
                  Ask about experience, projects, product thinking, engineering depth,
                  or the stack Patrick enjoys building with. Responses stream in live
                  and can switch sources automatically when needed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowSettings((prev) => !prev)}
              className="chat-toolbar-button px-3 py-2 text-sm"
              aria-label="Toggle chat settings"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={clearChat}
              className="chat-toolbar-button px-3 py-2 text-sm"
              aria-label="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="overflow-hidden border-b border-white/10"
            >
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-3 sm:px-8">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                    Context
                  </label>
                  <div className="relative">
                    <select
                      value={context}
                      onChange={(event) => setContext(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-sky-400/50"
                    >
                      {CONTEXT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    {
                      CONTEXT_OPTIONS.find((option) => option.value === context)
                        ?.description
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                    Delivery mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                    {(["stream", "sync"] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => setMode(item)}
                        className={`rounded-xl px-3 py-2 text-sm transition-all ${
                          mode === item
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {item === "stream" ? "Live stream" : "Single reply"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Stream feels more conversational. Single reply is better for a
                    one-shot answer.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                    Session
                  </label>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(event) => setSessionId(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50"
                  />
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Keep this stable if you want the backend to preserve context
                    across messages.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={chatRef}
          className="chat-scroll-fade flex-1 overflow-y-auto px-5 py-6 sm:px-8"
        >
          {showQuickPrompts && (
            <div className="mb-6 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => {
                    void submitMessage(prompt.prompt);
                  }}
                  disabled={sending}
                  className="chat-chip px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5 pb-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isError = message.supported === false;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-4xl items-end gap-3 ${
                        isUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${
                          isUser
                            ? "bg-white/10 text-white"
                            : "bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20"
                        }`}
                      >
                        {isUser ? "You" : "AI"}
                      </div>

                      <div className={`min-w-0 ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/35 ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{isUser ? "You" : "Patrick AI"}</span>
                        </div>

                        <div
                          className={`rounded-[24px] px-4 py-3 text-[15px] leading-7 text-white/90 shadow-sm sm:px-5 sm:py-4 ${
                            isUser
                              ? "chat-user-bubble rounded-br-lg"
                              : isError
                                ? "rounded-bl-lg border border-red-400/30 bg-red-500/10 text-red-100"
                                : "chat-assistant-bubble rounded-bl-lg"
                          }`}
                        >
                          {message.text}
                          {streamingId === message.id && (
                            <span className="ml-1 inline-block h-4 w-0.5 align-text-bottom cursor-blink bg-sky-300" />
                          )}
                        </div>

                        {message.meta && (
                          <div
                            className={`mt-2 flex flex-wrap gap-2 ${
                              isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            {renderMeta(message.meta)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {sending && !streamingId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-end gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-xs font-semibold text-white shadow-lg shadow-sky-500/20">
                    AI
                  </div>
                  <div className="chat-assistant-bubble rounded-[24px] rounded-bl-lg px-5 py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <motion.div
                          key={dot}
                          className="h-2 w-2 rounded-full bg-sky-300"
                          animate={{ opacity: [0.28, 1, 0.28], y: [0, -2, 0] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: dot * 0.12,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="chat-input-shell mx-auto max-w-4xl rounded-[28px] p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Ask about Patrick's work, strengths, project history, or favorite stack..."
                rows={1}
                className="min-h-[52px] max-h-[180px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-white/35"
                onInput={(event) => resizeTextarea(event.currentTarget, 180)}
              />
              <motion.button
                onClick={() => {
                  void handleSend();
                }}
                disabled={!input.trim() || sending}
                whileHover={{ scale: input.trim() && !sending ? 1.02 : 1 }}
                whileTap={{ scale: input.trim() && !sending ? 0.96 : 1 }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </motion.button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2">
              <p className="text-xs text-white/40">{COMPOSER_HINT}</p>
              <p className="text-xs text-white/40">
                {sending
                  ? "Patrick AI is drafting a reply..."
                  : mode === "stream"
                    ? "Streaming replies are on."
                    : "Single-response mode is on."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
