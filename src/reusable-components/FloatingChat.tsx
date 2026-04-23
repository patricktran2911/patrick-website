"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ChevronDown,
  MessageCircle,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
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

type ChatOpenDetail = {
  prompt?: string;
};

function renderMeta(meta?: string) {
  if (!meta) return null;

  return meta.split(" · ").map((part) => (
    <span key={part} className="chat-meta-pill">
      {part}
    </span>
  ));
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<Mode>("stream");
  const [context, setContext] = useState("auto");
  const [sessionId, setSessionId] = useState(`session-${uid()}`);
  const [showSettings, setShowSettings] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const openRef = useRef(open);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    setHasUnread(false);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current) resizeTextarea(inputRef.current, 150);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const handleExternalOpen = (incoming: Event) => {
      const event = incoming as CustomEvent<ChatOpenDetail | undefined>;
      const prompt = event.detail?.prompt?.trim();

      setOpen(true);
      if (prompt) {
        setInput(prompt);
        window.setTimeout(() => {
          if (!inputRef.current) return;
          inputRef.current.focus();
          resizeTextarea(inputRef.current, 150);
          inputRef.current.setSelectionRange(prompt.length, prompt.length);
        }, 180);
      }
    };

    window.addEventListener("patrick-chat:open", handleExternalOpen as EventListener);
    return () => {
      window.removeEventListener(
        "patrick-chat:open",
        handleExternalOpen as EventListener
      );
    };
  }, []);

  const addMessage = useCallback(
    (role: Role, text: string, extra?: Partial<Message>) => {
      const message: Message = { id: uid(), role, text, ...extra };
      setMessages((prev) => [...prev, message]);

      if (role === "assistant" && !openRef.current) {
        setHasUnread(true);
      }

      return message.id;
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
    setHasUnread(false);
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
      throw new Error("The live response stream could not be read.");
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
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="floating-chat-modal"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-20 right-3 z-50 flex h-[min(38rem,calc(100vh-7.25rem))] w-[min(26rem,calc(100vw-1.5rem))] flex-col rounded-[28px] chat-shell sm:bottom-24 sm:right-6 sm:h-[min(40rem,calc(100vh-8rem))] sm:w-[26rem]"
          >
            <div className="flex items-start gap-3 border-b border-white/10 px-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-sm font-semibold text-white shadow-lg shadow-sky-500/20">
                P
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="chat-status-pill">
                    <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                    Popup assistant
                  </span>
                  <span className="chat-status-pill">
                    <Bot className="h-3.5 w-3.5 text-indigo-300" />
                    English + Vietnamese
                  </span>
                </div>
                <p className="text-base font-semibold text-white">Patrick AI</p>
                <p className="mt-1 text-sm leading-5 text-white/58">
                  Ask about projects, experience, product thinking, or Patrick&apos;s
                  favorite stack.
                </p>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="chat-toolbar-button h-10 w-10"
                  aria-label="Toggle chat settings"
                >
                  <Settings2 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={clearChat}
                  className="chat-toolbar-button h-10 w-10"
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setOpen(false)}
                  className="chat-toolbar-button h-10 w-10"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden border-b border-white/10"
                >
                  <div className="grid gap-3 px-4 py-4">
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
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={chatRef}
              className="chat-scroll-fade flex-1 overflow-y-auto px-4 py-4"
            >
              {showQuickPrompts && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => {
                        void submitMessage(prompt.prompt);
                      }}
                      disabled={sending}
                      className="chat-chip px-3.5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3 text-sky-300" />
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4 pb-5">
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    const isError = message.supported === false;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex max-w-[92%] items-end gap-2.5 ${
                            isUser ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-[11px] font-semibold ${
                              isUser
                                ? "bg-white/10 text-white"
                                : "bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20"
                            }`}
                          >
                            {isUser ? "You" : "AI"}
                          </div>

                          <div className="min-w-0">
                            <div
                              className={`mb-1 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/34 ${
                                isUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{isUser ? "You" : "Patrick AI"}</span>
                            </div>

                            <div
                              className={`rounded-[22px] px-4 py-3 text-sm leading-6 text-white/90 ${
                                isUser
                                  ? "chat-user-bubble rounded-br-lg"
                                  : isError
                                    ? "rounded-bl-lg border border-red-400/30 bg-red-500/10 text-red-100"
                                    : "chat-assistant-bubble rounded-bl-lg"
                              }`}
                            >
                              {message.text}
                              {streamingId === message.id && (
                                <span className="ml-1 inline-block h-3.5 w-0.5 align-text-bottom cursor-blink bg-sky-300" />
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
                    <div className="flex items-end gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-[11px] font-semibold text-white shadow-lg shadow-sky-500/20">
                        AI
                      </div>
                      <div className="chat-assistant-bubble rounded-[22px] rounded-bl-lg px-4 py-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((dot) => (
                            <motion.div
                              key={dot}
                              className="h-1.5 w-1.5 rounded-full bg-sky-300"
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

            <div className="border-t border-white/10 px-3 py-3">
              <div className="chat-input-shell rounded-[24px] p-2.5">
                <div className="flex items-start gap-2.5">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    placeholder="Ask about Patrick's projects, strengths, or stack..."
                    rows={1}
                    className="min-h-[48px] max-h-[150px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-white/35"
                    onInput={(event) => resizeTextarea(event.currentTarget, 150)}
                  />
                  <motion.button
                    onClick={() => {
                      void handleSend();
                    }}
                    disabled={!input.trim() || sending}
                    whileHover={{ scale: input.trim() && !sending ? 1.02 : 1 }}
                    whileTap={{ scale: input.trim() && !sending ? 0.96 : 1 }}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2">
                  <p className="text-[11px] text-white/40">{COMPOSER_HINT}</p>
                  <p className="text-[11px] text-white/40">
                    {sending
                      ? "Drafting..."
                      : mode === "stream"
                        ? "Live stream on"
                        : "Single reply on"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
          <motion.button
            onClick={() => setOpen(true)}
            aria-label="Open Patrick AI chat"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="chat-fab relative flex h-14 w-14 items-center justify-center rounded-full p-0 text-white sm:h-auto sm:w-auto sm:min-w-[17rem] sm:justify-start sm:gap-3 sm:px-3.5 sm:py-3"
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(44,195,255,0.18),transparent_70%)] sm:rounded-[999px]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />

            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] shadow-lg shadow-sky-500/20">
              <MessageCircle className="h-5 w-5" />
            </span>

            <span className="relative hidden min-w-0 text-left sm:block">
              <span className="block text-[10px] uppercase tracking-[0.24em] text-white/45">
                Patrick AI
              </span>
              <span className="block truncate text-sm font-medium text-white">
                Open the popup assistant
              </span>
            </span>

            <AnimatePresence>
              {hasUnread && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-rose-500 text-[9px] font-bold text-white sm:right-2 sm:top-2"
                >
                  1
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
    </>
  );
}
