# AI Chat Integration

This website chat now uses the newer AI endpoints with a split transport model:

- Local browser requests use clean same-origin `/api/ai/...` routes first. On
  `patrickcs-web.com`, the browser calls
  `https://ai-dev.patrickcs-web.com/api/v1/ai/...` directly because the current
  Amplify production hosting returns `405` for Next API proxy routes.
- `POST /api/ai/text-to-text`
  Used for typed questions in the floating chat.
- `POST /api/ai/speech`
  Used when the user taps the speaker button on an assistant message.
- `POST /api/ai/text-to-speech`
  Used when voice mode is active and the user sends a typed prompt.
- `POST /api/ai/speech-to-speech`
  Used when the user records a voice question from the chat composer.

## Reusable structure

- `src/reusable-components/FloatingChat.tsx`
  Owns the floating chat experience, message rendering, recorder lifecycle, and playback UX.
- `src/reusable-components/chat/chatApi.ts`
  Centralizes all client-side AI endpoint calls so transport logic is not duplicated in the UI.
- `src/app/api/ai/[...path]/route.ts`
  Proxies local/development website-origin requests to the Hetzner AI API and
  keeps optional API keys server-side when that runtime path is available.
- `src/reusable-components/chat/chatAudio.ts`
  Holds small audio helpers such as recorder MIME selection and recording time formatting.
- `src/reusable-components/chat/chatShared.ts`
  Shared chat types, welcome helpers, context options, and textarea utilities.

## Behavior rules

- Typed input sends to `text-to-text` and renders a text answer in chat.
- Typed input in voice mode sends to `text-to-speech`, renders the answer, and
  auto-plays the returned audio.
- Voice input records in the browser, uploads to `speech-to-speech`, then renders:
  - the transcript as the user message
  - the answer as the assistant message
  - the returned `audio.base64` as playable audio
- Assistant replies can be spoken on demand through the `speech` endpoint.
- The voice panel includes a `Voice sample` action that asks the backend to
  generate a real MP3 through `POST /api/ai/speech`; this checks the same
  frontend delivery path used by assistant playback.

## Notes

- `chatApi.ts` is intentionally tolerant of plain-text or JSON text answers so backend response formatting can evolve without breaking the UI.
- The browser client calls the Hetzner AI API base URL on production and does
  not call Self-Host or CosyVoice services directly.
- Set `AI_API_KEY` or `APP_API_KEY` on the website server if the Hetzner backend
  enables API-key auth. Avoid exposing API keys with `NEXT_PUBLIC_` variables.
- Optional public tuning variables: set `NEXT_PUBLIC_AI_VOICE_SPEED` and
  `NEXT_PUBLIC_AI_VOICE_INSTRUCTIONS` to adjust the speed/style sent with every
  browser voice request. The default speed is `0.86`.
- Voice playback intentionally does not fall back to the browser speech engine, because that would use the device voice instead of Patrick's backend voice.
- The current voice routes are request-and-response flows, not true realtime streaming. ChatGPT-style live voice will need a continuous transport layer such as WebSocket or WebRTC on the AI backend.
- Object URLs created for generated audio are tracked and revoked when the chat clears or unmounts to avoid leaking browser memory.
