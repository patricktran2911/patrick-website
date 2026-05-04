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

export type TextToSpeechStreamEvent =
  | {
      type: "answer";
      answer: string;
      resolvedContext: string;
      chunksValidated?: string | number;
      chunksRetrieved?: string | number;
    }
  | {
      type: "audio";
      index: number;
      text: string;
      audioUrl: string;
      audioMimeType: string;
    }
  | {
      type: "done";
    };

const AUDIO_RESPONSE_FORMAT = "mp3";
const DEFAULT_VOICE_SPEED = 0.86;
const DEFAULT_VOICE_INSTRUCTIONS =
  "Speak in natural, warm conversational English at a lightly brisk pace. Keep every word clear and easy to understand, with a calm Vietnamese-English accent.";

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

function createAudioResultFromPayload(payload: unknown): SpeechAudioResult | undefined {
  const audioBase64 = pickString(payload, [
    ["audio", "base64"],
    ["data", "audio", "base64"],
    ["audio_base64"],
    ["base64"],
  ]);

  if (!audioBase64) return undefined;

  const audioMimeType = getAudioMimeType(payload);
  return {
    audioUrl: createAudioUrlFromBase64(audioBase64, audioMimeType),
    audioMimeType,
  };
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
    audioUrl: audioBase64 ? createAudioUrlFromBase64(audioBase64, audioMimeType) : undefined,
    audioMimeType,
  };
}

export async function streamTextToSpeech(
  text: string,
  options: ChatRequestOptions,
  onEvent: (event: TextToSpeechStreamEvent) => void | Promise<void>
): Promise<void> {
  const response = await fetch(`${BASE_URL}/text-to-speech/stream`, {
    method: "POST",
    headers: {
      ...getJsonHeaders(),
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify(buildChatSpeechPayload(text, options)),
  });

  if (!response.ok || !response.body) {
    const payload = await parseResponsePayload(response);
    throw new Error(extractErrorMessage(payload.data, response.status));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = async (line: string) => {
    if (!line.trim()) return;

    const payload = JSON.parse(line) as Record<string, unknown>;
    if (payload.type === "answer") {
      await onEvent({
        type: "answer",
        answer:
          pickString(payload, [
            ["answer"],
            ["data", "answer"],
          ]) || "",
        resolvedContext:
          pickString(payload, [
            ["data", "context"],
            ["meta", "context"],
            ["context"],
          ]) || options.context,
        chunksValidated: pickNumberLike(payload, [
          ["meta", "chunks_validated"],
          ["chunks_validated"],
        ]),
        chunksRetrieved: pickNumberLike(payload, [
          ["meta", "chunks_retrieved"],
          ["chunks_retrieved"],
        ]),
      });
      return;
    }

    if (payload.type === "audio") {
      const audio = createAudioResultFromPayload(payload);
      if (!audio) return;

      await onEvent({
        type: "audio",
        index:
          typeof payload.index === "number"
            ? payload.index
            : Number(payload.index ?? 0),
        text: typeof payload.text === "string" ? payload.text : "",
        audioUrl: audio.audioUrl,
        audioMimeType: audio.audioMimeType,
      });
      return;
    }

    if (payload.type === "done") {
      await onEvent({ type: "done" });
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      await handleLine(line);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    await handleLine(buffer);
  }
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
