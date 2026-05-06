# AI Chat Integration

The website now exposes two separate floating AI experiences instead of mixing
voice state into the text widget:

- `FloatingChat.tsx`
  Text-first chatbot for typed questions and optional per-message playback.
- `FloatingVoiceChat.tsx`
  Separate hands-free voice call widget mounted above the text chatbot.

Both widgets share the same floating shell and audio playback plumbing, but
their interaction models are intentionally separate.

## Endpoint usage

- `POST /api/ai/text-to-text`
  Used by the text chatbot for normal typed questions.
- `POST /api/ai/speech`
  Used when the user taps play on an assistant message inside the text chat.
- `POST /api/ai/text-to-speech/stream`
  Used only by the separate voice widget.

The live voice stream contract is newline-delimited JSON and currently looks
like this:

- `meta`
  Announces resolved context and streaming mode.
- `answer_delta`
  Appends text into the assistant transcript as it is generated.
- `sentence`
  Announces sentence boundaries, indexes, and any short-sentence batches.
- `audio`
  Carries one MP3 chunk per sentence batch in `audio.base64`, plus byte and
  MIME metadata.
- `done`
  Finalizes the assistant answer text, support state, success state, and
  resolved context for the turn.

## Reusable structure

- `src/reusable-components/floating/FloatingWidgetFrame.tsx`
  Shared expand/collapse shell for floating widgets.
- `src/reusable-components/chat/useAudioPlayback.ts`
  Shared audio URL tracking, playback control, and cleanup.
- `src/reusable-components/chat/chatApi.ts`
  Shared client-side transport layer for text and voice endpoints.
- `src/reusable-components/chat/chatAudio.ts`
  Browser speech-recognition helpers and recognition-error formatting support.
- `src/reusable-components/chat/chatShared.ts`
  Shared chat types, context labels, meta-label helpers, and textarea utilities.

## Behavior rules

- The text chatbot stays text-first. It no longer owns the hands-free voice
  loop.
- The voice widget opens from its own floating icon above the text chatbot.
- Voice turns use browser speech recognition for the user's speech, then call
  `text-to-speech/stream`.
- On iPhone Safari, the widget prefers a recorder-based input path and sends
  the captured turn to `speech-to-text` before calling `text-to-speech/stream`.
- `answer_delta` events append into the transcript live.
- `audio` events are converted from base64 into MP3 object URLs, queued by
  `index`, and played in order as each sentence arrives.
- `done.context` updates the final assistant metadata so `auto` reflects the
  backend's routed context, such as `profile`, `projects`, or `portfolio`.
- If the stream finishes without audio, the transcript remains visible and the
  UI shows a Patrick-voice unavailable notice instead of trying to play a bad
  source.
- After Patrick finishes speaking, the mic automatically reopens for the next
  turn.

## Notes

- On production, the browser calls the Hetzner AI endpoint directly because the
  current Amplify hosting path does not reliably proxy streaming AI requests.
- Voice activation still preflights `/api/ai/voice/local-health` before opening
  the hands-free loop.
- `getUserMedia` still requires a secure browser context and an allowed site
  microphone permission. If iOS blocks the microphone before recording starts,
  the UI surfaces a Safari-specific permission message.
- Patrick voice playback intentionally does not fall back to the browser speech
  engine, because that would use the device voice instead of Patrick's backend
  voice.
- The current voice call is hands-free and turn-based, but it is not true
  full-duplex realtime audio. Simultaneous live input and output will still
  need a continuous backend transport such as WebSocket or WebRTC.
