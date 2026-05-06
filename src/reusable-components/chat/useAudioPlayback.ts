"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PLAYBACK_INTERRUPTED_ERROR = "PLAYBACK_INTERRUPTED";
const SILENT_WAV_DATA_URL =
  "data:audio/wav;base64," +
  "UklGRiQFAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

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
  const playbackPrimedRef = useRef(false);

  useEffect(() => {
    playingMessageIdRef.current = playingMessageId;
  }, [playingMessageId]);

  const rememberAudioUrl = useCallback((audioUrl: string) => {
    ownedAudioUrlsRef.current.add(audioUrl);
    return audioUrl;
  }, []);

  const getPlaybackAudio = useCallback(() => {
    if (!playbackAudioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      playbackAudioRef.current = audio;
    }

    return playbackAudioRef.current;
  }, []);

  const primePlayback = useCallback(() => {
    if (playbackPrimedRef.current) return;

    const audio = getPlaybackAudio();
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    audio.src = SILENT_WAV_DATA_URL;
    audio.load();

    void audio
      .play()
      .then(() => {
        if (audio.src === SILENT_WAV_DATA_URL) {
          audio.pause();
          audio.currentTime = 0;
          audio.removeAttribute("src");
          audio.load();
        }
        playbackPrimedRef.current = true;
      })
      .catch(() => {
        if (audio.src === SILENT_WAV_DATA_URL) {
          audio.removeAttribute("src");
          audio.load();
        }
      });
  }, [getPlaybackAudio]);

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
    audio.onended = null;
    audio.onerror = null;
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
      const audio = getPlaybackAudio();
      audio.src = audioUrl;
      audio.load();
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
    [getPlaybackAudio, stopPlayback]
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
    primePlayback,
    rememberAudioUrl,
    revokeOwnedAudioUrls,
    stopPlayback,
  };
}
