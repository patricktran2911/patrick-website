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
  Legacy full-audio JSON flow.
- `POST /api/ai/text-to-speech/stream`
  Used when voice mode is active. It streams the answer first, then one MP3
  payload per sentence.

## Reusable structure

- `src/reusable-components/FloatingChat.tsx`
  Owns the floating chat experience, message rendering, browser speech-recognition lifecycle, and playback UX.
- `src/reusable-components/chat/chatApi.ts`
  Centralizes all client-side AI endpoint calls so transport logic is not duplicated in the UI.
- `src/app/api/ai/[...path]/route.ts`
  Proxies local/development website-origin requests to the Hetzner AI API and
  keeps optional API keys server-side when that runtime path is available.
- `src/reusable-components/chat/chatAudio.ts`
  Holds small audio helpers such as browser speech-recognition types, support checks, and timing helpers.
- `src/reusable-components/chat/chatShared.ts`
  Shared chat types, welcome helpers, context options, and textarea utilities.

## Behavior rules

- Typed input sends to `text-to-text` and renders a text answer in chat.
- Typed input in voice mode sends to `text-to-speech/stream`, renders the
  answer, and starts playing each sentence as soon as that sentence audio is
  generated.
- Hands-free voice call mode uses browser speech recognition for user speech,
  sends the transcript through `text-to-speech/stream`, and then resumes
  listening after Patrick's audio reply finishes.
- Assistant replies can be spoken on demand through the `speech` endpoint.

## Notes

- `chatApi.ts` is intentionally tolerant of plain-text or JSON text answers so backend response formatting can evolve without breaking the UI.
- The browser client calls the Hetzner AI API base URL on production and does
  not call Self-Host or CosyVoice services directly.
- Set `AI_API_KEY` or `APP_API_KEY` on the website server if the Hetzner backend
  enables API-key auth. Avoid exposing API keys with `NEXT_PUBLIC_` variables.
- Optional public tuning variables: set `NEXT_PUBLIC_AI_VOICE_SPEED` and
  `NEXT_PUBLIC_AI_VOICE_INSTRUCTIONS` to adjust the speed/style sent with every
  browser voice request. Set `NEXT_PUBLIC_AI_VOICE_INPUT_LANG` to override the
  browser speech-recognition language. The default speed is `0.86`.
- Voice playback intentionally does not fall back to the browser speech engine, because that would use the device voice instead of Patrick's backend voice.
- The current voice call is hands-free and turn-based, but it is still not true full-duplex realtime audio. ChatGPT-style live voice with simultaneous streaming both directions will need a continuous transport such as WebSocket or WebRTC on the AI backend.
- Object URLs created for generated audio are tracked and revoked when the chat clears or unmounts to avoid leaking browser memory.
