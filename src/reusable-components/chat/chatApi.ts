import { AI_USER_ID, BASE_URL } from "@/reusable-components/chat/chatShared";

interface ChatRequestOptions {
  context: string;
  sessionId?: string;
  userId?: string;
}

interface ParsedPayload {
  data: unknown;
  text: string;
}

export interface TextToTextResult {
  answer: string;
  resolvedContext: string;
  chunksValidated?: string | number;
  chunksRetrieved?: string | number;
}

export interface SpeechAudioResult {
  audioUrl: string;
  audioMimeType: string;
}

export interface TextToSpeechResult extends TextToTextResult {
  audioUrl?: string;
  audioMimeType?: string;
}

export interface SpeechToSpeechResult {
  transcript: string;
  answer: string;
  resolvedContext: string;
  audioUrl?: string;
  audioMimeType?: string;
}

const AUDIO_RESPONSE_FORMAT = "mp3";
const DEFAULT_VOICE_SPEED = 0.86;
const DEFAULT_VOICE_INSTRUCTIONS =
  "Speak in natural, warm conversational English at a lightly brisk pace. Keep every word clear and easy to understand, with a calm Vietnamese-English accent.";

export const VOICE_SAMPLE_TEXT =
  "Hi, this is Patrick's AI voice test. I will speak a little faster, but still clearly for the website chat.";

function getVoiceSpeed() {
  const configured = Number(process.env.NEXT_PUBLIC_AI_VOICE_SPEED);
  if (Number.isFinite(configured) && configured >= 0.25 && configured <= 4) {
    return configured;
  }

  return DEFAULT_VOICE_SPEED;
}

function getVoiceInstructions() {
  return (
    process.env.NEXT_PUBLIC_AI_VOICE_INSTRUCTIONS ??
    DEFAULT_VOICE_INSTRUCTIONS
  ).trim();
}

function getNestedValue(payload: unknown, path: string[]) {
  return path.reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }, payload);
}

function pickString(payload: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = getNestedValue(payload, path);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function pickNumberLike(payload: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = getNestedValue(payload, path);
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  return undefined;
}

function getJsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

function extractErrorMessage(payload: unknown, fallbackStatus: number) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload.trim();
  }

  return (
    pickString(payload, [
      ["error"],
      ["message"],
      ["detail"],
      ["data", "error"],
      ["data", "message"],
    ]) || `HTTP ${fallbackStatus}`
  );
}

function buildChatPayload(text: string, options: ChatRequestOptions) {
  return {
    message: text,
    context: options.context,
    session_id: options.sessionId,
    user_id: options.userId ?? AI_USER_ID,
  };
}

function buildSpeechPayload(text: string) {
  const instructions = getVoiceInstructions();

  return {
    text,
    response_format: AUDIO_RESPONSE_FORMAT,
    speed: getVoiceSpeed(),
    ...(instructions ? { instructions } : {}),
  };
}

function buildChatSpeechPayload(text: string, options: ChatRequestOptions) {
  const instructions = getVoiceInstructions();

  return {
    ...buildChatPayload(text, options),
    response_format: AUDIO_RESPONSE_FORMAT,
    speed: getVoiceSpeed(),
    ...(instructions ? { instructions } : {}),
  };
}

function createAudioUrlFromBase64(base64: string, mimeType: string) {
  const normalized = base64.includes(",") ? base64.split(",").pop() ?? base64 : base64;
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

async function parseResponsePayload(response: Response): Promise<ParsedPayload> {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return { data: {}, text: "" };
  }

  try {
    return {
      data: JSON.parse(trimmed) as unknown,
      text: trimmed,
    };
  } catch {
    return {
      data: trimmed,
      text: trimmed,
    };
  }
}

async function requestTextPayload(path: string, text: string, options: ChatRequestOptions) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(buildChatPayload(text, options)),
  });

  return {
    response,
    payload: await parseResponsePayload(response),
  };
}

function buildTextToTextResult(
  payload: ParsedPayload,
  options: ChatRequestOptions
): TextToTextResult {
  const answer =
    (typeof payload.data === "string" ? payload.data : "") ||
    pickString(payload.data, [
      ["answer"],
      ["text"],
      ["output"],
      ["data", "answer"],
      ["data", "text"],
      ["data", "output"],
      ["result", "answer"],
    ]);

  if (!answer) {
    throw new Error("The AI service returned an empty answer.");
  }

  return {
    answer,
    resolvedContext:
      pickString(payload.data, [
        ["context"],
        ["meta", "context"],
        ["data", "context"],
      ]) || options.context,
    chunksValidated: pickNumberLike(payload.data, [
      ["meta", "chunks_validated"],
      ["chunks_validated"],
    ]),
    chunksRetrieved: pickNumberLike(payload.data, [
      ["meta", "chunks_retrieved"],
      ["chunks_retrieved"],
    ]),
  };
}

export async function sendTextToText(
  text: string,
  options: ChatRequestOptions
): Promise<TextToTextResult> {
  const primary = await requestTextPayload("/text-to-text", text, options);

  if (primary.response.ok) {
    return buildTextToTextResult(primary.payload, options);
  }

  if (primary.response.status === 404) {
    const legacy = await requestTextPayload("/chat", text, options);
    if (!legacy.response.ok) {
      throw new Error(extractErrorMessage(legacy.payload.data, legacy.response.status));
    }

    return buildTextToTextResult(legacy.payload, options);
  }

  throw new Error(extractErrorMessage(primary.payload.data, primary.response.status));
}

export async function sendSpeech(
  text: string,
  _options?: ChatRequestOptions
): Promise<SpeechAudioResult> {
  const response = await fetch(`${BASE_URL}/speech`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(buildSpeechPayload(text)),
  });

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw new Error(extractErrorMessage(payload.data, response.status));
  }

  const audioBlob = await response.blob();
  return {
    audioUrl: URL.createObjectURL(audioBlob),
    audioMimeType: response.headers.get("content-type") || "audio/mpeg",
  };
}

export async function sendTextToSpeech(
  text: string,
  options: ChatRequestOptions
): Promise<TextToSpeechResult> {
  const response = await fetch(`${BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(buildChatSpeechPayload(text, options)),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload.data, response.status));
  }

  const textResult = buildTextToTextResult(payload, options);
  const audioBase64 = pickString(payload.data, [
    ["audio", "base64"],
    ["data", "audio", "base64"],
    ["audio_base64"],
    ["base64"],
  ]);
  const audioMimeType = getAudioMimeType(payload.data);

  return {
    ...textResult,
    audioUrl: audioBase64
      ? createAudioUrlFromBase64(audioBase64, audioMimeType)
      : undefined,
    audioMimeType,
  };
}

function getAudioMimeType(payload: unknown) {
  return (
    pickString(payload, [
      ["audio", "mimeType"],
      ["audio", "mime_type"],
      ["data", "audio", "mimeType"],
      ["data", "audio", "mime_type"],
      ["mimeType"],
      ["mime_type"],
    ]) || "audio/mpeg"
  );
}

function getAudioUploadName(blob: Blob) {
  const mimeType = blob.type || "audio/webm";
  const extension =
    mimeType.includes("webm")
      ? "webm"
      : mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mpeg") || mimeType.includes("mp3")
          ? "mp3"
          : mimeType.includes("mp4")
            ? "m4a"
            : "bin";

  return `voice-question.${extension}`;
}

export async function sendSpeechToSpeech(
  audioBlob: Blob,
  options: ChatRequestOptions
): Promise<SpeechToSpeechResult> {
  const formData = new FormData();

  formData.append("audio", audioBlob, getAudioUploadName(audioBlob));
  formData.append("context", options.context);
  formData.append("user_id", options.userId ?? AI_USER_ID);
  formData.append("response_format", AUDIO_RESPONSE_FORMAT);
  formData.append("speed", String(getVoiceSpeed()));

  const instructions = getVoiceInstructions();
  if (instructions) {
    formData.append("instructions", instructions);
  }

  if (options.sessionId) {
    formData.append("session_id", options.sessionId);
  }

  const response = await fetch(`${BASE_URL}/speech-to-speech`, {
    method: "POST",
    body: formData,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload.data, response.status));
  }

  const transcript = pickString(payload.data, [
    ["transcript"],
    ["data", "transcript"],
    ["result", "transcript"],
    ["question", "transcript"],
  ]);

  const answer = pickString(payload.data, [
    ["answer"],
    ["text"],
    ["output"],
    ["data", "answer"],
    ["data", "text"],
    ["result", "answer"],
  ]);

  if (!answer) {
    throw new Error("The AI service returned an empty spoken answer.");
  }

  const audioBase64 = pickString(payload.data, [
    ["audio", "base64"],
    ["data", "audio", "base64"],
    ["audio_base64"],
    ["base64"],
  ]);

  const audioMimeType = getAudioMimeType(payload.data);

  return {
    transcript: transcript || "Voice question",
    answer,
    resolvedContext:
      pickString(payload.data, [["context"], ["meta", "context"], ["data", "context"]]) ||
      options.context,
    audioUrl: audioBase64
      ? createAudioUrlFromBase64(audioBase64, audioMimeType)
      : undefined,
    audioMimeType,
  };
}
