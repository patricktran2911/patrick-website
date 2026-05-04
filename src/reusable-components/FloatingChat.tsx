"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import {
  buildMetaLabel,
  COMPOSER_HINT,
  CONTEXT_OPTIONS,
  createClearedMessage,
  createWelcomeMessage,
  resetTextareaHeight,
  resizeTextarea,
  splitMetaLabel,
  type Message,
  type Role,
  uid,
} from "@/reusable-components/chat/chatShared";
import { sendSpeech, sendTextToText } from "@/reusable-components/chat/chatApi";
import {
  isPlaybackInterrupted,
  useAudioPlayback,
} from "@/reusable-components/chat/useAudioPlayback";
import FloatingWidgetFrame from "@/reusable-components/floating/FloatingWidgetFrame";
import type { ChatContent } from "@/lib/site-content-schema";

type ChatOpenDetail = {
  prompt?: string;
};

interface FloatingChatProps {
  content: ChatContent;
}

function renderMeta(meta?: string) {
  if (!meta) return null;

  return splitMetaLabel(meta).map((part) => (
    <span key={part} className="chat-meta-pill">
      {part}
    </span>
  ));
}

function formatVoiceRequestError(error: Error) {
  if (
    error.message.includes("temporarily unavailable") ||
    error.message.includes("Local voice service unavailable") ||
    error.message.includes("Speech provider 'local' error")
  ) {
    return "Patrick voice is temporarily unavailable right now.";
  }

  if (error.message.includes("404") || error.message.includes("Not Found")) {
    return "Patrick voice mode is not live on the current AI server yet.";
  }

  return error.message;
}

export default function FloatingChat({ content }: FloatingChatProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    createWelcomeMessage("welcome", content.welcomeMessage),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState("auto");
  const [sessionId, setSessionId] = useState(`session-${uid()}`);
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [synthesizingMessageId, setSynthesizingMessageId] = useState<string | null>(
    null
  );
  const [composerNotice, setComposerNotice] = useState<string | null>(null);

  const openRef = useRef(open);
  const sendingRef = useRef(sending);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    playingMessageId,
    playAudioUrlForMessage,
    rememberAudioUrl,
    revokeOwnedAudioUrls,
    stopPlayback,
  } = useAudioPlayback();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  useEffect(() => {
    if (!open) return;

    setHasUnread(false);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current) {
        resizeTextarea(inputRef.current, 150);
      }
    }, 220);

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
        }, 220);
      }
    };

    window.addEventListener(
      "patrick-chat:open",
      handleExternalOpen as EventListener
    );
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
      setMessages((previous) => [...previous, message]);

      if (role === "assistant" && !openRef.current) {
        setHasUnread(true);
      }

      return message.id;
    },
    []
  );

  const updateMessage = useCallback((id: string, update: Partial<Message>) => {
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, ...update } : message))
    );
  }, []);

  const handleSpeakMessage = useCallback(
    async (message: Message) => {
      if (!message.text.trim()) return;

      if (playingMessageId === message.id) {
        stopPlayback();
        return;
      }

      setComposerNotice(null);

      try {
        if (message.audioUrls?.length) {
          for (const audioUrl of message.audioUrls) {
            await playAudioUrlForMessage(message.id, audioUrl, true);
          }
          return;
        }

        if (message.audioUrl) {
          await playAudioUrlForMessage(message.id, message.audioUrl, true);
          return;
        }

        setSynthesizingMessageId(message.id);
        const spoken = await sendSpeech(message.text, {
          context: message.context ?? context,
          sessionId,
        });
        const audioUrl = rememberAudioUrl(spoken.audioUrl);

        updateMessage(message.id, {
          audioUrl,
          audioMimeType: spoken.audioMimeType,
        });

        await playAudioUrlForMessage(message.id, audioUrl, true);
      } catch (error) {
        if (!isPlaybackInterrupted(error)) {
          setComposerNotice(formatVoiceRequestError(error as Error));
        }
      } finally {
        setSynthesizingMessageId((previous) =>
          previous === message.id ? null : previous
        );
      }
    },
    [
      context,
      playAudioUrlForMessage,
      playingMessageId,
      rememberAudioUrl,
      sessionId,
      stopPlayback,
      updateMessage,
    ]
  );

  const submitTextMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sendingRef.current) return;

      setInput("");
      resetTextareaHeight(inputRef.current);
      setComposerNotice(null);
      sendingRef.current = true;
      setSending(true);
      stopPlayback();
      addMessage("user", text, {
        inputKind: "text",
      });

      try {
        const result = await sendTextToText(text, { context, sessionId });

        addMessage("assistant", result.answer, {
          context: result.resolvedContext,
          meta: buildMetaLabel({
            requestedContext: context,
            resolvedContext: result.resolvedContext,
            transport: "Text to text",
            chunksValidated: result.chunksValidated,
            chunksRetrieved: result.chunksRetrieved,
          }),
        });
      } catch (error) {
        if (!isPlaybackInterrupted(error)) {
          addMessage("assistant", `Error: ${(error as Error).message}`, {
            supported: false,
          });
          setComposerNotice((error as Error).message);
        }
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [addMessage, context, sessionId, stopPlayback]
  );

  const clearChat = useCallback(() => {
    stopPlayback();
    revokeOwnedAudioUrls();
    setMessages([createClearedMessage(undefined, content.clearedMessage)]);
    setInput("");
    setHasUnread(false);
    setComposerNotice(null);
    setSynthesizingMessageId(null);
    resetTextareaHeight(inputRef.current);
    inputRef.current?.focus();
  }, [content.clearedMessage, revokeOwnedAudioUrls, stopPlayback]);

  const handleSend = useCallback(async () => {
    await submitTextMessage(input);
  }, [input, submitTextMessage]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  const showQuickPrompts = messages.length <= 1 && !sending;
  const statusLabel = sending
    ? "Thinking"
    : playingMessageId
      ? "Speaking"
      : content.readyLabel;
  const activityLabel = sending
    ? "Patrick is thinking..."
    : playingMessageId
      ? "Playing Patrick's voice..."
      : "Text chat ready";

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <FloatingWidgetFrame
      open={open}
      onOpen={() => setOpen(true)}
      placementClassName="bottom-5 right-4 z-50 sm:bottom-6 sm:right-6"
      collapsedAriaLabel={content.widgetOpenLabel}
      collapsedWidth={56}
      collapsedHeight={56}
      expandedWidth="min(27rem, calc(100vw - 1.5rem))"
      expandedHeight="min(42rem, calc(100vh - 7rem))"
      collapsedRadius={999}
      expandedRadius={28}
      collapsedSurfaceClassName="chat-fab"
      expandedSurfaceClassName="chat-shell"
      collapsedContent={
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(44,195,255,0.18),transparent_70%)]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] shadow-lg shadow-sky-500/20">
            <MessageCircle className="h-5 w-5" />
          </span>

          <AnimatePresence>
            {hasUnread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-rose-500 text-[9px] font-bold text-white"
              >
                1
              </motion.span>
            )}
          </AnimatePresence>
        </>
      }
      expandedContent={
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
                <MessageCircle className="h-4.5 w-4.5" />
              </div>
              <div className="flex gap-2">
                <span className="chat-status-pill">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowSettings((previous) => !previous)}
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
                {content.quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => {
                      void submitTextMessage(prompt.prompt);
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
                  const canSpeakAssistantMessage =
                    message.role === "assistant" &&
                    !isError &&
                    message.text.trim().length > 0;
                  const isPlayingThisMessage = playingMessageId === message.id;
                  const isSynthesizingThisMessage = synthesizingMessageId === message.id;

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
                            <span>{isUser ? "You" : "Assistant"}</span>
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
                          </div>

                          {canSpeakAssistantMessage && (
                            <div className="mt-2 flex justify-start">
                              <button
                                onClick={() => {
                                  void handleSpeakMessage(message);
                                }}
                                className={`chat-audio-button ${
                                  isPlayingThisMessage ? "chat-audio-button-active" : ""
                                }`}
                                aria-label={
                                  isPlayingThisMessage
                                    ? "Stop assistant audio"
                                    : "Play assistant audio"
                                }
                              >
                                {isSynthesizingThisMessage ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Volume2 className="h-3.5 w-3.5" />
                                )}
                                {isSynthesizingThisMessage
                                  ? "Generating voice"
                                  : isPlayingThisMessage
                                    ? "Stop voice"
                                    : "Play voice"}
                              </button>
                            </div>
                          )}

                          {message.meta && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {renderMeta(message.meta)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {sending && (
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
                  placeholder={content.composerPlaceholder}
                  rows={1}
                  className="min-h-[48px] max-h-[150px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-white/35"
                  onInput={(event) => resizeTextarea(event.currentTarget, 150)}
                />

                <motion.button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={!input.trim() || sending}
                  whileHover={{ scale: input.trim() && !sending ? 1.02 : 1 }}
                  whileTap={{ scale: input.trim() && !sending ? 0.96 : 1 }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </motion.button>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2">
                <p
                  className={`text-[11px] ${
                    composerNotice ? "text-rose-300" : "text-white/40"
                  }`}
                >
                  {composerNotice ?? COMPOSER_HINT}
                </p>
                <p className="text-[11px] text-white/40">{activityLabel}</p>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
}
