export function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export interface BrowserSpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}

export interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

export interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

export interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
}

export function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

export function getPreferredRecognitionLanguage() {
  const configured = process.env.NEXT_PUBLIC_AI_VOICE_INPUT_LANG?.trim();
  if (configured) {
    return configured;
  }

  if (typeof navigator !== "undefined" && navigator.language.trim()) {
    return navigator.language.trim();
  }

  return "en-US";
}

export function getSpeechRecognitionErrorMessage(
  error: BrowserSpeechRecognitionErrorEvent | string | unknown
) {
  const code =
    typeof error === "string"
      ? error
      : typeof error === "object" &&
          error !== null &&
          "error" in error &&
          typeof (error as { error?: unknown }).error === "string"
        ? (error as { error: string }).error
        : "";

  switch (code) {
    case "audio-capture":
      return "No microphone input is available on this device.";
    case "network":
      return "Browser voice recognition lost its network connection.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow microphone access in the browser address bar, then try again.";
    default:
      return "";
  }
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionConstructor() !== null;
}

export function getPreferredRecorderMimeType() {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return "";
  }

  const options = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
  ];

  return options.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
}
