"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PLAYBACK_INTERRUPTED_ERROR = "PLAYBACK_INTERRUPTED";

export function isPlaybackInterrupted(error: unknown) {
  return error instanceof Error && error.message === PLAYBACK_INTERRUPTED_ERROR;
}

export function useAudioPlayback() {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackStopResolverRef = useRef<(() => void) | null>(null);
  const playbackRunIdRef = useRef(0);
  const ownedAudioUrlsRef = useRef<Set<string>>(new Set());
  const playingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    playingMessageIdRef.current = playingMessageId;
  }, [playingMessageId]);

  const rememberAudioUrl = useCallback((audioUrl: string) => {
    ownedAudioUrlsRef.current.add(audioUrl);
    return audioUrl;
  }, []);

  const stopPlayback = useCallback(() => {
    playbackRunIdRef.current += 1;
    playbackStopResolverRef.current?.();
    playbackStopResolverRef.current = null;
    playingMessageIdRef.current = null;

    const audio = playbackAudioRef.current;
    if (!audio) {
      setPlayingMessageId(null);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    playbackAudioRef.current = null;
    setPlayingMessageId(null);
  }, []);

  const revokeOwnedAudioUrls = useCallback(() => {
    ownedAudioUrlsRef.current.forEach((audioUrl) => URL.revokeObjectURL(audioUrl));
    ownedAudioUrlsRef.current.clear();
  }, []);

  const playAudioUrlForMessage = useCallback(
    async (messageId: string, audioUrl: string, waitForEnd = false) => {
      stopPlayback();

      const runId = playbackRunIdRef.current;
      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      playingMessageIdRef.current = messageId;
      setPlayingMessageId(messageId);

      let resolveDone: (() => void) | null = null;
      const donePromise = waitForEnd
        ? new Promise<void>((resolve) => {
            resolveDone = resolve;
            playbackStopResolverRef.current = resolve;
          })
        : null;

      const cleanup = () => {
        if (playbackAudioRef.current === audio) {
          playbackAudioRef.current = null;
          playingMessageIdRef.current = null;
          setPlayingMessageId(null);
        }
        if (playbackStopResolverRef.current === resolveDone) {
          playbackStopResolverRef.current = null;
        }
        resolveDone?.();
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;

      try {
        await audio.play();
        if (donePromise) {
          await donePromise;
          if (playbackRunIdRef.current !== runId) {
            throw new Error(PLAYBACK_INTERRUPTED_ERROR);
          }
        }
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    [stopPlayback]
  );

  useEffect(() => {
    return () => {
      stopPlayback();
      revokeOwnedAudioUrls();
    };
  }, [revokeOwnedAudioUrls, stopPlayback]);

  return {
    playingMessageId,
    playingMessageIdRef,
    playAudioUrlForMessage,
    rememberAudioUrl,
    revokeOwnedAudioUrls,
    stopPlayback,
  };
}
