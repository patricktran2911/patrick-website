"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Mic,
  PhoneCall,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import {
  buildMetaLabel,
  splitMetaLabel,
  type Message,
  uid,
} from "@/reusable-components/chat/chatShared";
import {
  getVoiceServiceAvailability,
  sendSpeechToText,
  streamVoiceReply,
  type VoiceReplyStreamEvent,
} from "@/reusable-components/chat/chatApi";
import {
  type BrowserSpeechRecognition,
  type BrowserSpeechRecognitionErrorEvent,
  type BrowserSpeechRecognitionEvent,
  formatRecordingTime,
  getPreferredRecognitionLanguage,
  getPreferredRecorderMimeType,
  getSpeechRecognitionConstructor,
  getSpeechRecognitionErrorMessage,
  isSpeechRecognitionSupported,
} from "@/reusable-components/chat/chatAudio";
import {
  isPlaybackInterrupted,
  useAudioPlayback,
} from "@/reusable-components/chat/useAudioPlayback";
import FloatingWidgetFrame from "@/reusable-components/floating/FloatingWidgetFrame";
import type { VoiceChatContent } from "@/lib/site-content-schema";

type VoicePhase = "idle" | "connecting" | "listening" | "thinking" | "speaking";
type RecognitionDesiredState = "off" | "listening" | "paused";
type VoiceInputMode = "recognition" | "recorder";

type QueuedAudioChunk = {
  index: number;
  text: string;
  sentences: string[];
  audioUrl: string;
  audioMimeType: string;
  audioBytes?: number;
};

interface FloatingVoiceChatProps {
  content: VoiceChatContent;
}

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const RECORDER_SILENCE_MS = 1200;
const RECORDER_MIN_RECORDING_MS = 900;
const RECORDER_MAX_RECORDING_MS = 14000;
const RECORDER_VOICE_THRESHOLD = 0.018;

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

function formatMicrophoneAccessError(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Microphone access needs HTTPS or localhost. Open the site in a secure URL and try again.";
  }

  const rawMessage = (error as Error)?.message ?? "";
  if (rawMessage.includes("not allowed by the user agent or the platform")) {
    return "Safari or iOS blocked microphone access in this context. Open the HTTPS site directly in Safari, allow Microphone for this website, then start the call again.";
  }

  const recognitionMessage = getSpeechRecognitionErrorMessage(error);
  if (recognitionMessage) {
    return recognitionMessage;
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

  return rawMessage || "Unable to access the microphone.";
}

function getStatusLabel(content: VoiceChatContent, phase: VoicePhase) {
  switch (phase) {
    case "connecting":
      return content.connectingLabel;
    case "listening":
      return content.listeningLabel;
    case "thinking":
      return content.thinkingLabel;
    case "speaking":
      return content.speakingLabel;
    default:
      return content.readyLabel;
  }
}

function isMediaRecorderSupported() {
  return typeof MediaRecorder !== "undefined";
}

function getPreferredVoiceInputMode(): VoiceInputMode | null {
  if (isMediaRecorderSupported()) {
    return "recorder";
  }

  if (isSpeechRecognitionSupported()) {
    return "recognition";
  }

  if (isMediaRecorderSupported()) {
    return "recorder";
  }

  return null;
}

export default function FloatingVoiceChat({
  content,
}: FloatingVoiceChatProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callActive, setCallActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const [sessionId] = useState(`voice-session-${uid()}`);

  const callActiveRef = useRef(callActive);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionActiveRef = useRef(false);
  const desiredRecognitionStateRef = useRef<RecognitionDesiredState>("off");
  const voiceInputModeRef = useRef<VoiceInputMode>("recognition");
  const recognitionStartTimerRef = useRef<number | null>(null);
  const startVoiceRecognitionRef = useRef<(() => Promise<void>) | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaRecorderChunksRef = useRef<Blob[]>([]);
  const recorderIntervalRef = useRef<number | null>(null);
  const recorderStartedAtRef = useRef(0);
  const recorderHeardSpeechRef = useRef(false);
  const recorderLastVoiceAtRef = useRef(0);
  const recorderAudioContextRef = useRef<AudioContext | null>(null);
  const turnIdRef = useRef(0);
  const queuedAudioRef = useRef<Map<number, QueuedAudioChunk>>(new Map());
  const nextAudioIndexRef = useRef(0);
  const audioDrainResolverRef = useRef<(() => void) | null>(null);
  const queuePlaybackActiveRef = useRef(false);
  const streamDoneRef = useRef(false);

  const {
    playingMessageId,
    playingMessageIdRef,
    playAudioUrlForMessage,
    rememberAudioUrl,
    revokeOwnedAudioUrls,
    stopPlayback,
  } = useAudioPlayback();

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open, liveTranscript]);

  useEffect(() => {
    if (voicePhase !== "listening") {
      setListeningSeconds(0);
      return;
    }

    const interval = window.setInterval(() => {
      setListeningSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [voicePhase]);

  const addMessage = useCallback((message: Message) => {
    setMessages((previous) => [...previous, message]);
    return message.id;
  }, []);

  const updateMessage = useCallback((id: string, update: Partial<Message>) => {
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, ...update } : message))
    );
  }, []);

  const appendMessageText = useCallback((id: string, nextText: string) => {
    if (!nextText) return;

    setMessages((previous) =>
      previous.map((message) =>
        message.id === id
          ? {
              ...message,
              text: `${message.text}${nextText}`,
            }
          : message
      )
    );
  }, []);

  const appendMessageAudioUrl = useCallback(
    (id: string, audioUrl: string, audioMimeType: string) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === id
            ? {
                ...message,
                audioUrls: [...(message.audioUrls ?? []), audioUrl],
                audioMimeType,
              }
            : message
        )
      );
    },
    []
  );

  const clearScheduledRecognitionStart = useCallback(() => {
    if (recognitionStartTimerRef.current !== null) {
      window.clearTimeout(recognitionStartTimerRef.current);
      recognitionStartTimerRef.current = null;
    }
  }, []);

  const stopVoiceRecognition = useCallback(
    (mode: "stop" | "abort" = "stop") => {
      clearScheduledRecognitionStart();
      recognitionActiveRef.current = false;
      setLiveTranscript("");
      setListeningSeconds(0);

      const recognition = recognitionRef.current;
      if (!recognition) return;

      try {
        if (mode === "abort") {
          recognition.abort();
        } else {
          recognition.stop();
        }
      } catch {
        // Browsers can throw when repeated stop/abort calls race each other.
      }
    },
    [clearScheduledRecognitionStart]
  );

  const resetQueuedAudio = useCallback(() => {
    turnIdRef.current += 1;
    queuedAudioRef.current.clear();
    nextAudioIndexRef.current = 0;
    streamDoneRef.current = false;
    queuePlaybackActiveRef.current = false;
    audioDrainResolverRef.current?.();
    audioDrainResolverRef.current = null;
  }, []);

  const scheduleVoiceRecognitionStart = useCallback(
    (delay = 260) => {
      if (typeof window === "undefined") return;

      clearScheduledRecognitionStart();
      recognitionStartTimerRef.current = window.setTimeout(() => {
        recognitionStartTimerRef.current = null;
        void startVoiceRecognitionRef.current?.();
      }, delay);
    },
    [clearScheduledRecognitionStart]
  );

  const clearRecorderTimer = useCallback(() => {
    if (recorderIntervalRef.current !== null) {
      window.clearInterval(recorderIntervalRef.current);
      recorderIntervalRef.current = null;
    }
  }, []);

  const closeRecorderAudioContext = useCallback(() => {
    const audioContext = recorderAudioContextRef.current;
    recorderAudioContextRef.current = null;

    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close();
    }
  }, []);

  const releaseMicrophoneStream = useCallback(() => {
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
  }, []);

  const requestMicrophoneStream = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    if (!window.isSecureContext) {
      throw new Error(
        "Microphone access needs HTTPS or localhost. Open the site in a secure URL and try again."
      );
    }

    const existingStream = microphoneStreamRef.current;
    if (existingStream?.getAudioTracks().some((track) => track.readyState === "live")) {
      return existingStream;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    microphoneStreamRef.current = stream;
    return stream;
  }, []);

  const stopRecorderCapture = useCallback(
    (mode: "stop" | "abort" = "stop") => {
      clearRecorderTimer();
      closeRecorderAudioContext();

      const recorder = mediaRecorderRef.current;
      if (!recorder) return;

      if (mode === "abort") {
        mediaRecorderChunksRef.current = [];
      }

      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch {
        // Safari can throw if the recorder has already stopped itself.
      }
    },
    [clearRecorderTimer, closeRecorderAudioContext]
  );

  const deactivateCall = useCallback(
    (clearNotice = false) => {
      desiredRecognitionStateRef.current = "off";
      callActiveRef.current = false;
      setCallActive(false);
      setVoicePhase("idle");
      setLiveTranscript("");
      setListeningSeconds(0);
      stopVoiceRecognition("abort");
      stopRecorderCapture("abort");
      releaseMicrophoneStream();
      stopPlayback();
      resetQueuedAudio();

      if (clearNotice) {
        setCallNotice(null);
      }
    },
    [
      releaseMicrophoneStream,
      resetQueuedAudio,
      stopPlayback,
      stopRecorderCapture,
      stopVoiceRecognition,
    ]
  );

  const maybeResumeListening = useCallback(() => {
    if (!callActiveRef.current) {
      setVoicePhase("idle");
      return;
    }

    desiredRecognitionStateRef.current = "listening";
    setVoicePhase("listening");
    scheduleVoiceRecognitionStart(120);
  }, [scheduleVoiceRecognitionStart]);

  const flushQueuedAudio = useCallback(
    async (turnId: number, assistantId: string) => {
      if (queuePlaybackActiveRef.current || turnId !== turnIdRef.current) {
        return;
      }

      queuePlaybackActiveRef.current = true;

      try {
        while (turnId === turnIdRef.current) {
          const nextChunk = queuedAudioRef.current.get(nextAudioIndexRef.current);
          if (!nextChunk) {
            break;
          }

          queuedAudioRef.current.delete(nextAudioIndexRef.current);
          nextAudioIndexRef.current += 1;
          setVoicePhase("speaking");

          appendMessageAudioUrl(
            assistantId,
            nextChunk.audioUrl,
            nextChunk.audioMimeType
          );

          await playAudioUrlForMessage(assistantId, nextChunk.audioUrl, true);
        }
      } catch (error) {
        if (!isPlaybackInterrupted(error)) {
          setCallNotice(formatVoiceRequestError(error as Error));
        }
      } finally {
        queuePlaybackActiveRef.current = false;

        if (
          turnId === turnIdRef.current &&
          streamDoneRef.current &&
          queuedAudioRef.current.size === 0 &&
          !playingMessageIdRef.current
        ) {
          audioDrainResolverRef.current?.();
          audioDrainResolverRef.current = null;
        }
      }
    },
    [appendMessageAudioUrl, playAudioUrlForMessage, playingMessageIdRef]
  );

  const handleVoiceTurn = useCallback(
    async (userText: string) => {
      const transcript = userText.trim();
      if (!transcript || !callActiveRef.current) return;

      stopPlayback();
      resetQueuedAudio();
      desiredRecognitionStateRef.current = "paused";
      setVoicePhase("thinking");
      setLiveTranscript("");
      setCallNotice(null);

      const turnId = turnIdRef.current;
      const userMessageId = uid();
      addMessage({
        id: userMessageId,
        role: "user",
        text: transcript,
        inputKind: "speech",
      });

      let assistantId: string | null = null;
      let resolvedContext = "auto";
      let finalAnswer = "";
      let audioReceived = false;
      let sentenceCount = 0;

      const ensureAssistantMessage = () => {
        if (assistantId) return assistantId;

        assistantId = addMessage({
          id: uid(),
          role: "assistant",
          text: "",
          inputKind: "speech",
          context: resolvedContext,
          meta: buildMetaLabel({
            requestedContext: "auto",
            resolvedContext,
            transport: "Voice call",
          }),
        });

        return assistantId;
      };

      const audioDrainPromise = new Promise<void>((resolve) => {
        audioDrainResolverRef.current = resolve;
      });

      try {
        await streamVoiceReply(
          transcript,
          {
            context: "auto",
            sessionId,
          },
          async (event: VoiceReplyStreamEvent) => {
            if (turnId !== turnIdRef.current) {
              return;
            }

            if (event.type === "meta") {
              resolvedContext = event.resolvedContext || "auto";
              if (assistantId) {
                updateMessage(assistantId, {
                  context: resolvedContext,
                  meta: buildMetaLabel({
                    requestedContext: "auto",
                    resolvedContext,
                    transport: "Voice call",
                  }),
                });
              }
              return;
            }

            if (event.type === "answer_delta") {
              if (!event.text) return;
              appendMessageText(ensureAssistantMessage(), event.text);
              return;
            }

            if (event.type === "sentence") {
              sentenceCount = Math.max(sentenceCount, event.index + 1);
              return;
            }

            if (event.type === "audio") {
              audioReceived = true;
              sentenceCount = Math.max(sentenceCount, event.index + 1);
              const assistantMessageId = ensureAssistantMessage();
              const audioUrl = rememberAudioUrl(event.audioUrl);

              queuedAudioRef.current.set(event.index, {
                ...event,
                audioUrl,
              });

              void flushQueuedAudio(turnId, assistantMessageId);
              return;
            }

            if (event.type === "done") {
              streamDoneRef.current = true;
              finalAnswer = event.answer.trim();
              resolvedContext = event.resolvedContext || resolvedContext;

              if (finalAnswer) {
                updateMessage(ensureAssistantMessage(), {
                  text: finalAnswer,
                  context: resolvedContext,
                  meta: buildMetaLabel({
                    requestedContext: "auto",
                    resolvedContext,
                    transport: "Voice call",
                  }),
                  supported: event.success && event.supported,
                });
              }

              if (!event.success || !event.supported) {
                setCallNotice(
                  event.supported
                    ? "Patrick voice could not finish this answer."
                    : "Patrick AI could not support that voice question."
                );

                if (!finalAnswer) {
                  updateMessage(ensureAssistantMessage(), {
                    text: event.supported
                      ? "Patrick voice could not finish this answer."
                      : "Patrick AI could not support that voice question.",
                    context: resolvedContext,
                    supported: false,
                    meta: buildMetaLabel({
                      requestedContext: "auto",
                      resolvedContext,
                      transport: "Voice call",
                    }),
                  });
                }
              }

              if (
                queuedAudioRef.current.size === 0 &&
                !queuePlaybackActiveRef.current &&
                !playingMessageIdRef.current
              ) {
                audioDrainResolverRef.current?.();
                audioDrainResolverRef.current = null;
              }
            }
          }
        );

        await audioDrainPromise;

        if (turnId !== turnIdRef.current) {
          return;
        }

        if (!audioReceived) {
          setCallNotice(
            "Patrick voice is temporarily unavailable right now. The text answer arrived without audio."
          );
        } else if (sentenceCount > 0) {
          setCallNotice(null);
        }

        maybeResumeListening();
      } catch (error) {
        if (!isPlaybackInterrupted(error)) {
          const assistantMessageId = assistantId ?? ensureAssistantMessage();
          updateMessage(assistantMessageId, {
            text:
              finalAnswer ||
              `Error: ${formatVoiceRequestError(error as Error)}`,
            supported: finalAnswer.length > 0,
          });
          setCallNotice(formatVoiceRequestError(error as Error));
        }

        if (callActiveRef.current) {
          maybeResumeListening();
        }
      }
    },
    [
      addMessage,
      appendMessageText,
      flushQueuedAudio,
      maybeResumeListening,
      playingMessageIdRef,
      rememberAudioUrl,
      resetQueuedAudio,
      sessionId,
      stopPlayback,
      updateMessage,
    ]
  );

  const startRecorderListening = useCallback(async () => {
    if (
      !callActiveRef.current ||
      desiredRecognitionStateRef.current !== "listening" ||
      recognitionActiveRef.current ||
      playingMessageIdRef.current
    ) {
      return;
    }

    if (!isMediaRecorderSupported()) {
      deactivateCall();
      setCallNotice(
        "This browser cannot record microphone audio for voice chat."
      );
      return;
    }

    try {
      const stream = await requestMicrophoneStream();
      const mimeType = getPreferredRecorderMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      const AudioContextConstructor =
        window.AudioContext ??
        (window as WindowWithWebkitAudioContext).webkitAudioContext;

      mediaRecorderRef.current = recorder;
      mediaRecorderChunksRef.current = [];
      recorderStartedAtRef.current = performance.now();
      recorderLastVoiceAtRef.current = recorderStartedAtRef.current;
      recorderHeardSpeechRef.current = false;
      recognitionActiveRef.current = true;
      setVoicePhase("listening");
      setCallNotice(null);

      let analyser: AnalyserNode | null = null;
      let sampleBuffer: Uint8Array | null = null;

      if (AudioContextConstructor) {
        const audioContext = new AudioContextConstructor();
        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => undefined);
        }
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        sampleBuffer = new Uint8Array(analyser.fftSize);
        recorderAudioContextRef.current = audioContext;
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearRecorderTimer();
        closeRecorderAudioContext();
        recognitionActiveRef.current = false;
        setListeningSeconds(0);

        const chunks = mediaRecorderChunksRef.current;
        mediaRecorderChunksRef.current = [];

        if (
          desiredRecognitionStateRef.current === "off" ||
          !callActiveRef.current
        ) {
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 900) {
          scheduleVoiceRecognitionStart(180);
          return;
        }

        desiredRecognitionStateRef.current = "paused";
        setVoicePhase("thinking");
        setLiveTranscript(
          recorderHeardSpeechRef.current
            ? ""
            : "Checking the recording with Patrick's voice server..."
        );

        void (async () => {
          try {
            const result = await sendSpeechToText(audioBlob);
            await handleVoiceTurn(result.transcript);
          } catch (error) {
            const message = (error as Error).message;
            if (
              !message.includes("empty transcript") &&
              !message.includes("No transcript")
            ) {
              setCallNotice(formatVoiceRequestError(error as Error));
            }
            maybeResumeListening();
          }
        })();
      };

      recorder.onerror = () => {
        recognitionActiveRef.current = false;
        setCallNotice("The browser stopped microphone recording unexpectedly.");
        maybeResumeListening();
      };

      recorder.start(250);

      recorderIntervalRef.current = window.setInterval(() => {
        const now = performance.now();

        if (analyser && sampleBuffer) {
          analyser.getByteTimeDomainData(sampleBuffer);
          let total = 0;

          for (const value of sampleBuffer) {
            const normalized = (value - 128) / 128;
            total += normalized * normalized;
          }

          const volume = Math.sqrt(total / sampleBuffer.length);
          if (volume > RECORDER_VOICE_THRESHOLD) {
            recorderHeardSpeechRef.current = true;
            recorderLastVoiceAtRef.current = now;
            setLiveTranscript("Listening...");
          }
        }

        const recordingDuration = now - recorderStartedAtRef.current;
        const silenceDuration = now - recorderLastVoiceAtRef.current;
        const shouldStopForSilence =
          recorderHeardSpeechRef.current &&
          recordingDuration > RECORDER_MIN_RECORDING_MS &&
          silenceDuration > RECORDER_SILENCE_MS;
        const shouldStopForMaxDuration =
          recordingDuration > RECORDER_MAX_RECORDING_MS;

        if (
          (shouldStopForSilence || shouldStopForMaxDuration) &&
          recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      }, 120);
    } catch (error) {
      recognitionActiveRef.current = false;
      setCallNotice(formatMicrophoneAccessError(error));
      deactivateCall();
    }
  }, [
    clearRecorderTimer,
    closeRecorderAudioContext,
    deactivateCall,
    handleVoiceTurn,
    maybeResumeListening,
    playingMessageIdRef,
    requestMicrophoneStream,
    scheduleVoiceRecognitionStart,
  ]);

  const startVoiceRecognition = useCallback(async () => {
    if (
      !callActiveRef.current ||
      desiredRecognitionStateRef.current !== "listening" ||
      recognitionActiveRef.current ||
      playingMessageIdRef.current
    ) {
      return;
    }

    if (voiceInputModeRef.current === "recorder") {
      await startRecorderListening();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      deactivateCall();
      setCallNotice(
        "Hands-free voice call currently needs Chrome, Edge, or another browser with speech recognition."
      );
      return;
    }

    const recognition = recognitionRef.current ?? new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getPreferredRecognitionLanguage();
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setVoicePhase("listening");
      setCallNotice(null);
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) continue;

        if (result.isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      setLiveTranscript(interimTranscript);

      if (!finalTranscript) {
        return;
      }

      desiredRecognitionStateRef.current = "paused";
      recognitionActiveRef.current = false;
      setVoicePhase("thinking");
      setLiveTranscript("");

      try {
        recognition.stop();
      } catch {
        // Ignore browser teardown races after a final transcript arrives.
      }

      void handleVoiceTurn(finalTranscript);
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      recognitionActiveRef.current = false;
      setListeningSeconds(0);

      if (event.error === "aborted") {
        return;
      }

      if (event.error === "no-speech") {
        setLiveTranscript("");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        deactivateCall();
      }

      setCallNotice(formatMicrophoneAccessError(event));
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      setListeningSeconds(0);

      if (
        callActiveRef.current &&
        desiredRecognitionStateRef.current === "listening" &&
        !playingMessageIdRef.current
      ) {
        scheduleVoiceRecognitionStart();
        return;
      }

      if (desiredRecognitionStateRef.current === "off") {
        setVoicePhase("idle");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      const message = (error as Error).message.toLowerCase();
      if (message.includes("already started")) {
        return;
      }

      setCallNotice(formatMicrophoneAccessError(error));
    }
  }, [
    deactivateCall,
    handleVoiceTurn,
    playingMessageIdRef,
    scheduleVoiceRecognitionStart,
    startRecorderListening,
  ]);

  useEffect(() => {
    startVoiceRecognitionRef.current = startVoiceRecognition;
  }, [startVoiceRecognition]);

  const activateCall = useCallback(async () => {
    const inputMode = getPreferredVoiceInputMode();

    if (!inputMode) {
      setCallNotice(
        "Voice chat needs microphone recording support in this browser."
      );
      return;
    }

    try {
      setVoicePhase("connecting");
      const microphoneStream = await requestMicrophoneStream();
      const voiceAvailability = await getVoiceServiceAvailability();
      if (!voiceAvailability.available) {
        throw new Error(voiceAvailability.message);
      }

      voiceInputModeRef.current = inputMode;
      if (inputMode === "recognition") {
        microphoneStream.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;
      }

      stopPlayback();
      setCallNotice(null);
      setLiveTranscript("");
      setCallActive(true);
      callActiveRef.current = true;
      desiredRecognitionStateRef.current = "listening";
      setVoicePhase("listening");
      scheduleVoiceRecognitionStart(80);
    } catch (error) {
      deactivateCall();
      setCallNotice(formatMicrophoneAccessError(error));
    }
  }, [
    deactivateCall,
    requestMicrophoneStream,
    scheduleVoiceRecognitionStart,
    stopPlayback,
  ]);

  const toggleCall = useCallback(() => {
    if (callActive) {
      deactivateCall(true);
      return;
    }

    void activateCall();
  }, [activateCall, callActive, deactivateCall]);

  const clearHistory = useCallback(() => {
    deactivateCall(true);
    revokeOwnedAudioUrls();
    setMessages([]);
    setLiveTranscript("");
  }, [deactivateCall, revokeOwnedAudioUrls]);

  useEffect(() => {
    if (!open && callActiveRef.current) {
      deactivateCall();
    }
  }, [deactivateCall, open]);

  useEffect(() => {
    return () => {
      deactivateCall();
      revokeOwnedAudioUrls();
      recognitionRef.current = null;
    };
  }, [deactivateCall, revokeOwnedAudioUrls]);

  const voiceActivityLabel =
    voicePhase === "listening"
      ? `${content.listeningLabel} ${formatRecordingTime(listeningSeconds)}`
      : voicePhase === "connecting"
        ? "Preparing Patrick's voice..."
        : voicePhase === "thinking"
          ? "Patrick is thinking..."
          : voicePhase === "speaking"
            ? "Patrick is speaking..."
            : content.panelDescription;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <FloatingWidgetFrame
      open={open}
      onOpen={() => setOpen(true)}
      placementClassName="bottom-[5.5rem] right-4 z-50 sm:bottom-[6.25rem] sm:right-6"
      collapsedAriaLabel={content.widgetOpenLabel}
      collapsedWidth={56}
      collapsedHeight={56}
      expandedWidth="min(24rem, calc(100vw - 1.5rem))"
      expandedHeight="min(34rem, calc(100vh - 9rem))"
      collapsedRadius={999}
      expandedRadius={28}
      collapsedSurfaceClassName="chat-fab"
      expandedSurfaceClassName="chat-shell"
      collapsedContent={
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(44,195,255,0.18),transparent_70%)]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] shadow-lg shadow-sky-500/20">
            <PhoneCall className="h-4.5 w-4.5" />
          </span>

          <AnimatePresence>
            {callActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-400"
              />
            )}
          </AnimatePresence>
        </>
      }
      expandedContent={
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
                <PhoneCall className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{content.panelTitle}</p>
                <span className="chat-status-pill mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  {getStatusLabel(content, voicePhase)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={clearHistory}
                className="chat-toolbar-button h-10 w-10"
                aria-label={content.clearLabel}
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setOpen(false)}
                className="chat-toolbar-button h-10 w-10"
                aria-label={content.minimizeLabel}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              {callActive ? (
                <motion.div
                  key="compact-call"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden px-4 pt-4"
                >
                  <div className="chat-voice-card rounded-[22px] p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                          voicePhase === "listening"
                            ? "chat-voice-orb-recording"
                            : "bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)]"
                        }`}
                      >
                        {voicePhase === "thinking" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : voicePhase === "speaking" ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {voiceActivityLabel}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/48">
                          {liveTranscript || callNotice || content.panelDescription}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={toggleCall}
                        className="chat-voice-secondary-button min-h-9 px-3"
                      >
                        {content.endCallLabel}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="full-call"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="p-4"
                >
                  <div className="chat-voice-card rounded-[26px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="chat-voice-orb">
                        {voicePhase === "connecting" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {content.panelDescription}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/52">
                          {voiceActivityLabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">
                        {content.transcriptLabel}
                      </p>
                      <p className="mt-2 min-h-[2.75rem] text-sm leading-6 text-white/82">
                        {liveTranscript || content.transcriptPlaceholder}
                      </p>
                    </div>

                    {callNotice && (
                      <div className="mt-4 rounded-[20px] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
                        {callNotice}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={toggleCall}
                        className="chat-voice-primary-button"
                      >
                        {content.startCallLabel}
                      </button>

                      <button
                        type="button"
                        onClick={clearHistory}
                        className="chat-voice-secondary-button"
                      >
                        {content.clearLabel}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={chatRef}
              className="chat-scroll-fade flex-1 overflow-y-auto px-4 pb-4"
            >
              <div className="mb-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/34">
                  {content.historyLabel}
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white/54">
                  {content.emptyHistoryLabel}
                </div>
              ) : (
                <div className="space-y-4 pb-3">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      const isError = message.supported === false;
                      const isPlayingThisMessage = playingMessageId === message.id;

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 14, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex max-w-[94%] items-end gap-2.5 ${
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
                                <span>{isUser ? "You" : "Patrick"}</span>
                                {message.inputKind === "speech" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-1 text-[9px] tracking-[0.18em] text-white/42">
                                    <Mic className="h-2.5 w-2.5" />
                                    Voice
                                  </span>
                                )}
                                {!isUser && isPlayingThisMessage && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/12 px-2 py-1 text-[9px] tracking-[0.18em] text-emerald-100">
                                    <Volume2 className="h-2.5 w-2.5" />
                                    Live
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
                                {message.text || (
                                  <span className="inline-flex items-center gap-2 text-white/54">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Patrick is answering...
                                  </span>
                                )}
                              </div>

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
                </div>
              )}
            </div>
          </div>
        </>
      }
    />
  );
}
