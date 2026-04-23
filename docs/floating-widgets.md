# Floating Widget Architecture

This project uses a shared floating widget system for the chatbot and music player.

## Core pieces

- `src/reusable-components/floating/FloatingWidgetFrame.tsx`
  Owns the expand and collapse morph animation, shell sizing, placement, and the collapsed vs expanded render swap.
- `src/reusable-components/FloatingChat.tsx`
  Contains chat-specific state, streaming logic, quick prompts, and composer behavior.
- `src/reusable-components/FloatingMusicPlayer.tsx`
  Contains playlist playback state, YouTube player integration, volume control, and the player vs playlist slide view.
- `src/reusable-components/chat/chatShared.ts`
  Holds chat-specific shared types and helpers such as prompt suggestions, context options, message helpers, and metadata formatting.

## Why this structure

- Motion logic is centralized so the widgets feel consistent and changes to the expand animation only need to happen in one place.
- Domain logic stays local to each widget, which keeps the chat transport code separate from the music playback code.
- Shared helpers are small and intentional. We only extract code when it improves consistency or reduces duplication.

## Extension rules

- If a new floating widget needs the same open and close morph, build it on `FloatingWidgetFrame.tsx`.
- Put widget-specific state and side effects in the widget component, not in the shared frame.
- Add shared helpers only when at least two widgets need them.
- Keep user-facing copy and formatting utilities in the domain they belong to unless they are reused across widgets.

## Notes for future updates

- The chat metadata separator is ASCII-only in `chatShared.ts` to avoid encoding drift across shells and editors.
- The music playlist titles are hydrated incrementally from the current YouTube player state because the iframe API only exposes the active track title directly.
