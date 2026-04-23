"use client";

export const BASE_URL =
  process.env.NEXT_PUBLIC_AI_API_URL ?? "https://ai-dev.patrickcs-web.com";

export type Role = "user" | "assistant";
export type Mode = "stream" | "sync";

export interface Message {
  id: string;
  role: Role;
  text: string;
  context?: string;
  supported?: boolean;
  meta?: string;
}

export interface PromptSuggestion {
  label: string;
  prompt: string;
}

export interface ContextOption {
  value: string;
  label: string;
  description: string;
}

export const QUICK_PROMPTS: PromptSuggestion[] = [
  {
    label: "Quick intro",
    prompt: "Give me a quick summary of Patrick as an engineer.",
  },
  {
    label: "Best project",
    prompt: "Which project best shows Patrick's product and engineering skills?",
  },
  {
    label: "AI experience",
    prompt: "What AI and machine learning experience does Patrick have?",
  },
  {
    label: "Tech stack",
    prompt: "What technologies does Patrick work with most often?",
  },
];

export const CONTEXT_OPTIONS: ContextOption[] = [
  {
    value: "auto",
    label: "Auto detect",
    description: "Let the assistant pick the best source.",
  },
  {
    value: "profile",
    label: "Profile",
    description: "Bias answers toward background and resume details.",
  },
  {
    value: "projects",
    label: "Projects",
    description: "Focus on shipped work, outcomes, and case studies.",
  },
  {
    value: "portfolio",
    label: "Portfolio",
    description: "Prefer site and presentation content.",
  },
  {
    value: "general",
    label: "General",
    description: "Use broader conversation mode when context is open-ended.",
  },
];

export const COMPOSER_HINT = "Enter sends. Shift + Enter adds a new line.";
export const META_SEPARATOR = " | ";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createWelcomeMessage(id = "welcome"): Message {
  return {
    id,
    role: "assistant",
    text: "Hi! I'm Patrick's AI assistant. Ask about his background, projects, skills, or experience.\n\nYou can chat in English or Vietnamese.",
  };
}

export function createClearedMessage(id = `welcome-${uid()}`): Message {
  return {
    id,
    role: "assistant",
    text: "Fresh chat. Ask about Patrick's work, strengths, projects, or stack.",
  };
}

export function buildMetaLabel({
  requestedContext,
  resolvedContext,
  transport,
  chunksValidated,
  chunksRetrieved,
}: {
  requestedContext: string;
  resolvedContext: string;
  transport: string;
  chunksValidated?: string | number;
  chunksRetrieved?: string | number;
}) {
  const parts = [
    requestedContext === "auto"
      ? `Auto -> ${resolvedContext}`
      : resolvedContext,
    transport,
  ];

  if (chunksValidated !== undefined || chunksRetrieved !== undefined) {
    parts.push(`${chunksValidated ?? "?"}/${chunksRetrieved ?? "?"} chunks`);
  }

  return parts.join(META_SEPARATOR);
}

export function splitMetaLabel(meta: string) {
  return meta.split(META_SEPARATOR);
}

export function resizeTextarea(
  textarea: HTMLTextAreaElement,
  maxHeight: number
) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
}

export function resetTextareaHeight(
  textarea: HTMLTextAreaElement | null | undefined
) {
  if (!textarea) return;
  textarea.style.height = "auto";
}
