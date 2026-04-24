"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Minimize2,
  Music4,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import FloatingWidgetFrame, {
  FLOATING_WIDGET_FRAME_TRANSITION,
} from "@/reusable-components/floating/FloatingWidgetFrame";
import type { MusicContent } from "@/lib/site-content-schema";

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
  playVideoAt: (index: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
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

interface FloatingMusicPlayerProps {
  content: MusicContent;
}

export default function FloatingMusicPlayer({
  content,
}: FloatingMusicPlayerProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<"player" | "playlist">("player");
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(content.defaultTrackTitle);
  const [statusText, setStatusText] = useState(content.openPrompt);
  const [elapsed, setElapsed] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [playlistIds, setPlaylistIds] = useState<string[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [playlistTitles, setPlaylistTitles] = useState<Record<string, string>>({});

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const shouldAutoplayRef = useRef(false);

  const updateSnapshot = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const title = player.getVideoData().title?.trim();
    const currentTime = player.getCurrentTime();
    const totalTime = player.getDuration();
    const playlist = player.getPlaylist();
    const nextIndex = player.getPlaylistIndex();

    if (title) setCurrentTitle(title);
    if (playlist.length > 0) {
      setPlaylistIds((prev) =>
        prev.length === playlist.length && prev.every((item, index) => item === playlist[index])
          ? prev
          : playlist
      );
    }
    if (Number.isFinite(nextIndex) && nextIndex >= 0) {
      setPlaylistIndex(nextIndex);
    }
    if (title && playlist[nextIndex]) {
      setPlaylistTitles((prev) =>
        prev[playlist[nextIndex]] === title
          ? prev
          : { ...prev, [playlist[nextIndex]]: title }
      );
    }

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
      setStatusText(content.loadingLabel);

      const YT = await loadYouTubeIframeApi();
      const existingPlayer = playerRef.current as YTPlayerInstance | null;

      if (existingPlayer) {
        setLoading(false);
        if (autoplay) existingPlayer.playVideo();
        return existingPlayer;
      }

      return new Promise<YTPlayerInstance>((resolve, reject) => {
        const playlistConfig: YTPlayerPlaylistConfig = {
          list: content.playlistId,
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
                shouldAutoplayRef.current ? content.playLabel : content.defaultStatus
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
                setStatusText(content.playLabel);
              } else if (event.data === playerState.PAUSED) {
                setIsPlaying(false);
                setStatusText(content.pauseLabel);
              } else if (event.data === playerState.BUFFERING) {
                setStatusText(content.loadingLabel);
              } else if (event.data === playerState.CUED) {
                setStatusText(content.defaultStatus);
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
    [
      content.defaultStatus,
      content.loadingLabel,
      content.pauseLabel,
      content.playLabel,
      content.playlistId,
      updateSnapshot,
      volume,
    ]
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
      setView("player");
      setStatusText(content.nextLabel);
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  async function handlePrevious() {
    try {
      const player = await ensurePlayer(false);
      player.previousVideo();
      player.playVideo();
      setView("player");
      setStatusText(content.previousLabel);
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  function handleExpand() {
    setExpanded(true);
    setView("player");
    if (!playerRef.current && !loading) {
      void ensurePlayer(false);
    }
  }

  async function handleSelectTrack(index: number) {
    try {
      const player = await ensurePlayer(false);
      player.playVideoAt(index);
      setPlaylistIndex(index);
      setView("player");
      setStatusText(`${content.playLabel} ${String(index + 1).padStart(2, "0")}...`);
    } catch (error) {
      setStatusText((error as Error).message);
    }
  }

  function getTrackLabel(videoId: string, index: number) {
    if (playlistTitles[videoId]) return playlistTitles[videoId];
    if (index === playlistIndex && currentTitle) return currentTitle;
    return `Track ${String(index + 1).padStart(2, "0")}`;
  }

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div
        id={PLAYER_CONTAINER_ID}
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <FloatingWidgetFrame
        open={expanded}
        onOpen={handleExpand}
        placementClassName="bottom-5 left-4 z-30 sm:bottom-6 sm:left-6"
        collapsedAriaLabel={content.widgetOpenLabel}
        collapsedWidth={56}
        collapsedHeight={56}
        expandedWidth="min(22rem, calc(100vw - 1.5rem))"
        expandedHeight="min(32rem, calc(100vh - 7rem))"
        collapsedRadius={999}
        expandedRadius={26}
        collapsedSurfaceClassName="music-shell"
        expandedSurfaceClassName="music-shell"
        transformOrigin="bottom left"
        collapsedContent={
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
            <Music4 className="h-4 w-4" />
          </span>
        }
        expandedContent={
          <>
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-accent-start)] to-[var(--chat-accent-end)] text-white shadow-lg shadow-sky-500/20">
                  <Music4 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/42">
                    {content.panelTitle}
                  </p>
                  <p className="truncate text-sm font-medium text-white">
                    {currentTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setView((prev) => (prev === "player" ? "playlist" : "player"))
                  }
                  className="music-control h-9 w-9"
                  aria-label={
                    view === "player" ? content.showPlaylistLabel : content.showPlayerLabel
                  }
                >
                  {view === "player" ? (
                    <ListMusic className="h-4 w-4" />
                  ) : (
                    <ArrowLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setExpanded(false);
                    setView("player");
                  }}
                  className="music-control h-9 w-9"
                  aria-label={content.minimizeLabel}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-4 py-4">
              <motion.div
                className="flex h-full w-[200%]"
                animate={{ x: view === "player" ? "0%" : "-50%" }}
                transition={FLOATING_WIDGET_FRAME_TRANSITION}
              >
                <div className="flex h-full w-1/2 flex-col pr-2">
                  <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-white/70">
                        {content.playlistTitle}
                      </p>
                      <span className="text-[11px] text-white/42">
                        {loading ? content.loadingLabel : statusText}
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
                      aria-label={content.previousLabel}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        void handleTogglePlay();
                      }}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed"
                      aria-label={isPlaying ? content.pauseLabel : content.playLabel}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isPlaying ? content.pauseLabel : content.playLabel}
                    </button>
                    <button
                      onClick={() => {
                        void handleNext();
                      }}
                      className="music-control h-11 w-11"
                      aria-label={content.nextLabel}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-white/60">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-xs">{content.volumeLabel}</span>
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
                </div>

                <div className="flex h-full w-1/2 flex-col pl-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {content.playlistHeading}
                      </p>
                      <p className="text-[11px] text-white/42">
                        {content.playlistDescription}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/42">
                      {playlistIds.length} tracks
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {playlistIds.length > 0 ? (
                      playlistIds.map((videoId, index) => {
                        const active = index === playlistIndex;

                        return (
                          <button
                            key={videoId}
                            onClick={() => {
                              void handleSelectTrack(index);
                            }}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-sky-400/35 bg-sky-400/10"
                                : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <span className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                                Track {String(index + 1).padStart(2, "0")}
                              </span>
                              {active && (
                                <span className="text-[11px] font-medium text-sky-300">
                                  {content.currentBadge}
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-sm font-medium text-white">
                              {getTrackLabel(videoId, index)}
                            </p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/48">
                        {loading
                          ? content.loadingLabel
                          : content.openPrompt}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        }
      />
    </>
  );
}
