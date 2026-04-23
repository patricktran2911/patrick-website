"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Music4,
  Pause,
  Play,
  Volume2,
} from "lucide-react";

const PLAYLIST_ID = "PLCuMjAlHEc4r25Skw7YhHnOlzVUDpDrQS";
const PLAYER_CONTAINER_ID = "patrick-youtube-player";
const DEFAULT_VOLUME = 72;

type YTPlayerPlaylistConfig = {
  list: string;
  listType: "playlist";
  index?: number;
  startSeconds?: number;
};

type YTPlayerInstance = {
  cuePlaylist: (playlist: YTPlayerPlaylistConfig) => void;
  loadPlaylist: (playlist: YTPlayerPlaylistConfig) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getVideoData: () => { title?: string };
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YTPlayerEvent = {
  target: YTPlayerInstance;
  data: number;
};

type YTNamespace = {
  Player: new (
    elementId: string,
    options: {
      width: string;
      height: string;
      host: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: YTPlayerEvent) => void;
        onStateChange: (event: YTPlayerEvent) => void;
        onError: () => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __patrickYouTubeIframeApiPromise?: Promise<YTNamespace>;
  }
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is unavailable."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__patrickYouTubeIframeApiPromise) {
    return window.__patrickYouTubeIframeApiPromise;
  }

  window.__patrickYouTubeIframeApiPromise = new Promise<YTNamespace>(
    (resolve, reject) => {
      const previousHandler = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousHandler?.();
        if (window.YT) {
          resolve(window.YT);
        } else {
          reject(new Error("YouTube API loaded without a player instance."));
        }
      };

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-youtube-iframe-api="true"]'
      );

      if (existingScript) return;

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.youtubeIframeApi = "true";
      script.onerror = () => reject(new Error("Failed to load the YouTube API."));
      document.body.appendChild(script);
    }
  );

  return window.__patrickYouTubeIframeApiPromise;
}

export default function FloatingMusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("Patrick's playlist");
  const [statusText, setStatusText] = useState("Open the player, then press play");
  const [elapsed, setElapsed] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const shouldAutoplayRef = useRef(false);

  const updateSnapshot = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const title = player.getVideoData().title?.trim();
    const currentTime = player.getCurrentTime();
    const totalTime = player.getDuration();

    if (title) setCurrentTitle(title);
    setElapsed(formatTime(currentTime));
    setDuration(formatTime(totalTime));
    setProgress(totalTime > 0 ? Math.min((currentTime / totalTime) * 100, 100) : 0);
  }, []);

  const applyVolume = useCallback((nextVolume: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(nextVolume);
  }, []);

  const ensurePlayer = useCallback(
    async (autoplay = false) => {
      shouldAutoplayRef.current = autoplay;

      if (playerRef.current) {
        if (autoplay) playerRef.current.playVideo();
        return playerRef.current;
      }

      setLoading(true);
      setStatusText("Loading playlist...");

      const YT = await loadYouTubeIframeApi();

      const existingPlayer = playerRef.current as YTPlayerInstance | null;
      if (existingPlayer) {
        setLoading(false);
        if (autoplay) existingPlayer.playVideo();
        return existingPlayer;
      }

      return new Promise<YTPlayerInstance>((resolve, reject) => {
        const playlistConfig: YTPlayerPlaylistConfig = {
          list: PLAYLIST_ID,
          listType: "playlist",
          index: 0,
        };

        playerRef.current = new YT.Player(PLAYER_CONTAINER_ID, {
          width: "1",
          height: "1",
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              setPlayerReady(true);
              setLoading(false);
              event.target.setVolume(volume);
              setVolume(event.target.getVolume());
              setStatusText(
                shouldAutoplayRef.current ? "Starting playback..." : "Ready to play"
              );

              if (shouldAutoplayRef.current) {
                event.target.loadPlaylist(playlistConfig);
              } else {
                event.target.cuePlaylist(playlistConfig);
              }

              window.setTimeout(updateSnapshot, 300);
              resolve(event.target);
            },
            onStateChange: (event) => {
              const playerState = YT.PlayerState;

              if (event.data === playerState.PLAYING) {
                setIsPlaying(true);
                setStatusText("Now playing");
              } else if (event.data === playerState.PAUSED) {
                setIsPlaying(false);
                setStatusText("Paused");
              } else if (event.data === playerState.BUFFERING) {
                setStatusText("Buffering...");
              } else if (event.data === playerState.CUED) {
                setStatusText("Ready to play");
              } else if (event.data === playerState.ENDED) {
                setIsPlaying(false);
                setStatusText("Track ended");
              }

              window.setTimeout(updateSnapshot, 250);
            },
            onError: () => {
              setLoading(false);
              setIsPlaying(false);
              setStatusText("Playback could not start");
              reject(new Error("Unable to start YouTube playback."));
            },
          },
        });
      });
    },
    [updateSnapshot, volume]
  );

  useEffect(() => {
    if (!playerReady) return;

    const interval = window.setInterval(updateSnapshot, 1000);
    return () => window.clearInterval(interval);
  }, [playerReady, updateSnapshot]);

  useEffect(() => {
    applyVolume(volume);
  }, [applyVolume, volume]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  async function handleTogglePlay() {
    try {
      if (!playerRef.current) {
        const player = await ensurePlayer(false);
        player.playVideo();
        return;
      }

      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  async function handleNext() {
    try {
      const player = await ensurePlayer(false);
      player.nextVideo();
      player.playVideo();
      setStatusText("Skipping to the next track...");
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  async function handlePrevious() {
    try {
      const player = await ensurePlayer(false);
      player.previousVideo();
      player.playVideo();
      setStatusText("Going back...");
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  function handleExpand() {
    setExpanded(true);
    if (!playerRef.current && !loading) {
      void ensurePlayer(false);
    }
  }

  return (
    <>
      <div
        id={PLAYER_CONTAINER_ID}
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <div className="fixed bottom-5 left-4 z-30 sm:bottom-6 sm:left-6">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded-player"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 250, damping: 24 }}
              className="music-shell w-[min(22rem,calc(100vw-1.5rem))] rounded-[26px] p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
                    <Music4 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/42">
                      Playlist Player
                    </p>
                    <p className="truncate text-sm font-medium text-white">
                      {currentTitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(false)}
                  className="music-control h-9 w-9"
                  aria-label="Minimize music player"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="truncate text-sm text-white/70">Patrick's YouTube playlist</p>
                  <span className="text-[11px] text-white/42">
                    {loading ? "Loading" : statusText}
                  </span>
                </div>

                <div className="music-progress-track h-1.5">
                  <div
                    className="music-progress-bar h-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-white/42">
                  <span>{elapsed}</span>
                  <span>{duration}</span>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    void handlePrevious();
                  }}
                  className="music-control h-11 w-11"
                  aria-label="Previous track"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    void handleTogglePlay();
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed"
                  aria-label={isPlaying ? "Pause music" : "Play music"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => {
                    void handleNext();
                  }}
                  className="music-control h-11 w-11"
                  aria-label="Next track"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/60">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs">Volume</span>
                  </div>
                  <span className="text-xs text-white/48">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="music-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                  aria-label="Volume"
                />
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed-player"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 250, damping: 24 }}
              onClick={handleExpand}
              className="music-shell flex items-center gap-3 rounded-full px-3 py-3 text-left"
              aria-label="Open playlist player"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
                <Music4 className="h-4 w-4" />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/42">
                  Patrick Playlist
                </p>
                <p className="max-w-[13rem] truncate text-sm font-medium text-white">
                  Open player
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
