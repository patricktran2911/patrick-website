"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  Mic,
  PhoneCall,
  Send,
  Settings2,
  Sparkles,
  Square,
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
  Message,
  resetTextareaHeight,
  resizeTextarea,
  Role,
  splitMetaLabel,
  uid,
} from "@/reusable-components/chat/chatShared";
import FloatingWidgetFrame from "@/reusable-components/floating/FloatingWidgetFrame";
import type { ChatContent } from "@/lib/site-content-schema";
import {
  sendSpeech,
  sendSpeechToSpeech,
  sendTextToSpeech,
  sendTextToText,
  VOICE_SAMPLE_TEXT,
} from "@/reusable-components/chat/chatApi";
import {
  formatRecordingTime,
  getPreferredRecorderMimeType,
} from "@/reusable-components/chat/chatAudio";

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
  if (error.message.includes("404") || error.message.includes("Not Found")) {
    return "Patrick voice mode is not live on the current AI server yet.";
  }

  return error.message;
}

function formatMicrophoneError(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Microphone access needs HTTPS or localhost. Open the site in a secure URL and try again.";
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone permission was denied. Allow microphone access in the browser address bar, then try again.";
    }

    if (error.name === "NotFoundError") {
      return "No microphone was found on this device.";
    }

    if (error.name === "NotReadableError") {
      return "The microphone is busy in another app. Close the other app and try again.";
    }
  }

  return (error as Error)?.message || "Unable to access the microphone.";
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
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [synthesizingMessageId, setSynthesizingMessageId] = useState<string | null>(
    null
  );
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceSampleLoading, setVoiceSampleLoading] = useState(false);

  const openRef = useRef(open);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const shouldSubmitRecordingRef = useRef(false);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const ownedAudioUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    setHasUnread(false);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current) resizeTextarea(inputRef.current, 150);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!recording) return;

    const interval = window.setInterval(() => {
      setRecordingSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [recording]);

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

  const rememberAudioUrl = useCallback((audioUrl: string) => {
    ownedAudioUrlsRef.current.add(audioUrl);
    return audioUrl;
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = playbackAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    playbackAudioRef.current = null;
    setPlayingMessageId(null);
  }, []);

  const revokeOwnedAudioUrls = useCallback(() => {
    ownedAudioUrlsRef.current.forEach((audioUrl) => URL.revokeObjectURL(audioUrl));
    ownedAudioUrlsRef.current.clear();
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

  const stopRecorderStream = useCallback(() => {
    recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    recorderStreamRef.current = null;
  }, []);

  const abortRecording = useCallback(() => {
    if (!recorderRef.current) return;

    shouldSubmitRecordingRef.current = false;
    setRecording(false);
    setRecordingSeconds(0);
    recorderRef.current.stop();
  }, []);

  const toggleVoiceMode = useCallback(() => {
    if (recording) {
      abortRecording();
    }

    setVoiceMode((previous) => !previous);
    setComposerNotice(null);
  }, [abortRecording, recording]);

  const playAudioUrlForMessage = useCallback(
    async (messageId: string, audioUrl: string) => {
      stopPlayback();

      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      setPlayingMessageId(messageId);

      const cleanup = () => {
        if (playbackAudioRef.current === audio) {
          playbackAudioRef.current = null;
          setPlayingMessageId(null);
        }
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;

      try {
        await audio.play();
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    [stopPlayback]
  );

  const handleSpeakMessage = useCallback(
    async (message: Message) => {
      if (!message.text.trim()) return;

      if (playingMessageId === message.id) {
        stopPlayback();
        return;
      }

      setComposerNotice(null);

      try {
        if (message.audioUrl) {
          await playAudioUrlForMessage(message.id, message.audioUrl);
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

        await playAudioUrlForMessage(message.id, audioUrl);
      } catch (error) {
        setComposerNotice(formatVoiceRequestError(error as Error));
      } finally {
        setSynthesizingMessageId((previous) =>
          previous === message.id ? null : previous
        );
      }
    },
    [
      context,
      playingMessageId,
      playAudioUrlForMessage,
      rememberAudioUrl,
      sessionId,
      stopPlayback,
      updateMessage,
    ]
  );

  const playVoiceSample = useCallback(async () => {
    if (voiceSampleLoading || sending || recording) return;

    setVoiceMode(true);
    setComposerNotice(null);
    setVoiceSampleLoading(true);
    stopPlayback();

    try {
      const spoken = await sendSpeech(VOICE_SAMPLE_TEXT, { context, sessionId });
      const audioUrl = rememberAudioUrl(spoken.audioUrl);
      const assistantId = addMessage("assistant", VOICE_SAMPLE_TEXT, {
        audioUrl,
        audioMimeType: spoken.audioMimeType,
        meta: "Voice sample",
      });

      await playAudioUrlForMessage(assistantId, audioUrl);
    } catch (error) {
      setComposerNotice(formatVoiceRequestError(error as Error));
    } finally {
      setVoiceSampleLoading(false);
    }
  }, [
    addMessage,
    context,
    playAudioUrlForMessage,
    recording,
    rememberAudioUrl,
    sending,
    sessionId,
    stopPlayback,
    voiceSampleLoading,
  ]);

  const submitSpeechQuestion = useCallback(
    async (audioBlob: Blob) => {
      const placeholderId = addMessage("user", "Transcribing your voice question...", {
        inputKind: "speech",
        meta: "Voice input",
      });

      setSending(true);
      setComposerNotice(null);

      try {
        const result = await sendSpeechToSpeech(audioBlob, { context, sessionId });

        updateMessage(placeholderId, {
          text: result.transcript,
          meta: "Voice input",
          inputKind: "speech",
        });

        let audioUrl = result.audioUrl;
        let audioMimeType = result.audioMimeType;

        if (!audioUrl) {
          const spoken = await sendSpeech(result.answer);
          audioUrl = spoken.audioUrl;
          audioMimeType = spoken.audioMimeType;
        }

        const ownedAudioUrl = audioUrl ? rememberAudioUrl(audioUrl) : undefined;
        const assistantId = addMessage("assistant", result.answer, {
          context: result.resolvedContext,
          audioUrl: ownedAudioUrl,
          audioMimeType,
          meta: buildMetaLabel({
            requestedContext: context,
            resolvedContext: result.resolvedContext,
            transport: "Voice chat",
          }),
        });

        if (ownedAudioUrl) {
          await playAudioUrlForMessage(assistantId, ownedAudioUrl);
        }
      } catch (error) {
        const voiceError = formatVoiceRequestError(error as Error);
        updateMessage(placeholderId, {
          text: "Voice question",
          supported: false,
          meta: "Voice input",
        });
        addMessage("assistant", `Error: ${voiceError}`, {
          supported: false,
        });
        setComposerNotice(voiceError);
      } finally {
        setSending(false);
      }
    },
    [
      addMessage,
      context,
      playAudioUrlForMessage,
      rememberAudioUrl,
      sessionId,
      updateMessage,
    ]
  );

  const startRecording = useCallback(async () => {
    if (sending) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setComposerNotice("Voice capture is not supported in this browser.");
      return;
    }

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Microphone access needs HTTPS or localhost. Open the site in a secure URL and try again."
        );
      }

      setVoiceMode(true);
      stopPlayback();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getPreferredRecorderMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      recorderStreamRef.current = stream;
      recorderRef.current = recorder;
      recorderChunksRef.current = [];
      shouldSubmitRecordingRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recorderChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const shouldSubmit = shouldSubmitRecordingRef.current;
        shouldSubmitRecordingRef.current = false;

        const blob =
          recorderChunksRef.current.length > 0
            ? new Blob(recorderChunksRef.current, {
                type: recorder.mimeType || preferredMimeType || "audio/webm",
              })
            : null;

        recorderChunksRef.current = [];
        recorderRef.current = null;
        stopRecorderStream();

        if (shouldSubmit && blob && blob.size > 0) {
          void submitSpeechQuestion(blob);
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      setComposerNotice(null);
    } catch (error) {
      stopRecorderStream();
      recorderRef.current = null;
      setComposerNotice(formatMicrophoneError(error));
    }
  }, [sending, stopPlayback, stopRecorderStream, submitSpeechQuestion]);

  const stopRecordingAndSend = useCallback(() => {
    if (!recorderRef.current) return;

    shouldSubmitRecordingRef.current = true;
    setRecording(false);
    setRecordingSeconds(0);
    recorderRef.current.stop();
  }, []);

  const clearChat = useCallback(() => {
    abortRecording();
    stopPlayback();
    revokeOwnedAudioUrls();
    setMessages([createClearedMessage(undefined, content.clearedMessage)]);
    setInput("");
    setHasUnread(false);
    setComposerNotice(null);
    setSynthesizingMessageId(null);
    setVoiceSampleLoading(false);
    resetTextareaHeight(inputRef.current);
    inputRef.current?.focus();
  }, [
    abortRecording,
    content.clearedMessage,
    revokeOwnedAudioUrls,
    stopPlayback,
  ]);

  useEffect(() => {
    if (!open && recording) {
      abortRecording();
    }
  }, [abortRecording, open, recording]);

  useEffect(() => {
    return () => {
      abortRecording();
      stopRecorderStream();
      stopPlayback();
      revokeOwnedAudioUrls();
    };
  }, [
    abortRecording,
    revokeOwnedAudioUrls,
    stopPlayback,
    stopRecorderStream,
  ]);

  const submitTextMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending || recording) return;

      setInput("");
      setComposerNotice(null);
      resetTextareaHeight(inputRef.current);
      setSending(true);
      stopPlayback();
      addMessage("user", text, { inputKind: "text" });

      try {
        const result = voiceMode
          ? await sendTextToSpeech(text, { context, sessionId })
          : await sendTextToText(text, { context, sessionId });
        const audioUrl =
          voiceMode && "audioUrl" in result && typeof result.audioUrl === "string"
            ? rememberAudioUrl(result.audioUrl)
            : undefined;
        const audioMimeType =
          voiceMode &&
          "audioMimeType" in result &&
          typeof result.audioMimeType === "string"
            ? result.audioMimeType
            : undefined;

        const assistantId = addMessage("assistant", result.answer, {
          context: result.resolvedContext,
          audioUrl,
          audioMimeType,
          meta: buildMetaLabel({
            requestedContext: context,
            resolvedContext: result.resolvedContext,
            transport: voiceMode ? "Text to speech" : "Text to text",
            chunksValidated: result.chunksValidated,
            chunksRetrieved: result.chunksRetrieved,
          }),
        });

        if (voiceMode && audioUrl) {
          await playAudioUrlForMessage(assistantId, audioUrl);
        }
      } catch (error) {
        addMessage("assistant", `Error: ${(error as Error).message}`, {
          supported: false,
        });
        setComposerNotice((error as Error).message);
      } finally {
        setSending(false);
      }
    },
    [
      addMessage,
      context,
      playAudioUrlForMessage,
      recording,
      rememberAudioUrl,
      sending,
      sessionId,
      stopPlayback,
      voiceMode,
    ]
  );

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

  const showQuickPrompts = messages.length <= 1 && !sending && !recording;
  const voiceActivityLabel = recording
    ? `Listening ${formatRecordingTime(recordingSeconds)}`
    : sending
      ? "Patrick AI is thinking..."
      : playingMessageId
        ? "Playing Patrick's voice..."
        : voiceMode
          ? "Tap the mic and speak naturally."
          : "Text and voice ready";

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
                  {recording ? "Listening" : voiceMode ? "Voice chat" : content.readyLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={toggleVoiceMode}
                className={`chat-toolbar-button h-10 px-3 ${
                  voiceMode ? "chat-toolbar-button-active" : ""
                }`}
                aria-label={voiceMode ? "Turn off voice chat" : "Turn on voice chat"}
                aria-pressed={voiceMode}
              >
                <PhoneCall className="h-4 w-4" />
                <span className="hidden text-xs font-medium sm:inline">Voice</span>
              </motion.button>
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
                      Voice features
                    </label>
                    <p className="text-sm leading-6 text-white/58">
                      Text questions use Hetzner text-to-text by default. Voice chat
                      uploads microphone audio to speech-to-speech, and voice mode uses
                      text-to-speech for typed prompts with audio replies.
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
                    disabled={sending || recording}
                    className="chat-chip px-3.5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3 text-sky-300" />
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence initial={false}>
              {voiceMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="chat-voice-card mb-5 rounded-[26px] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`chat-voice-orb ${
                        recording ? "chat-voice-orb-recording" : ""
                      }`}
                    >
                      {recording ? (
                        <Square className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        Voice chat with Patrick AI
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/52">
                        {voiceActivityLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (recording) {
                          stopRecordingAndSend();
                        } else {
                          void startRecording();
                        }
                      }}
                      disabled={sending && !recording}
                      className="chat-voice-primary-button disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {recording ? "Send voice" : "Tap to talk"}
                    </button>
                    {recording && (
                      <button
                        type="button"
                        onClick={abortRecording}
                        className="chat-voice-secondary-button"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void playVoiceSample();
                      }}
                      disabled={voiceSampleLoading || sending || recording}
                      className="chat-voice-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {voiceSampleLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                      Voice sample
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                            {message.inputKind === "speech" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-1 text-[9px] tracking-[0.18em] text-white/42">
                                <Mic className="h-2.5 w-2.5" />
                                Voice
                              </span>
                            )}
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
                            <div
                              className={`mt-2 flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
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
                  disabled={sending || recording}
                  placeholder={content.composerPlaceholder}
                  rows={1}
                  className="min-h-[48px] max-h-[150px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-white/35"
                  onInput={(event) => resizeTextarea(event.currentTarget, 150)}
                />

                <motion.button
                  type="button"
                  onClick={() => {
                    if (recording) {
                      stopRecordingAndSend();
                    } else {
                      void startRecording();
                    }
                  }}
                  disabled={sending}
                  whileHover={{ scale: !sending ? 1.02 : 1 }}
                  whileTap={{ scale: !sending ? 0.96 : 1 }}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 ${
                    recording
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-white/10 text-white hover:bg-white/16"
                  }`}
                  aria-label={recording ? "Stop recording and send" : "Record voice question"}
                >
                  {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={!input.trim() || sending || recording}
                  whileHover={{ scale: input.trim() && !sending && !recording ? 1.02 : 1 }}
                  whileTap={{ scale: input.trim() && !sending && !recording ? 0.96 : 1 }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                <p className="text-[11px] text-white/40">
                  {voiceActivityLabel}
                </p>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
}
