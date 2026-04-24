"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { parseMusicTrackUrls, type MusicTrack } from "@/lib/music-tracks";

const PLAYER_CONTAINER_ID = "patrick-youtube-player";
const DEFAULT_VOLUME = 72;

type YTPlayerInstance = {
  cueVideoById: (videoId: string) => void;
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
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
  const tracks = useMemo(() => parseMusicTrackUrls(content.songUrls), [content.songUrls]);

  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<"player" | "playlist">("player");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTitle, setCurrentTitle] = useState(content.defaultTrackTitle);
  const [statusText, setStatusText] = useState(
    tracks.length > 0 ? content.openPrompt : content.emptyStateLabel
  );
  const [elapsed, setElapsed] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [trackTitles, setTrackTitles] = useState<Record<string, string>>({});

  const youtubePlayerRef = useRef<YTPlayerInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeKindRef = useRef<MusicTrack["kind"] | null>(null);
  const currentIndexRef = useRef(0);
  const playTrackAtIndexRef = useRef<(index: number, autoplay: boolean) => Promise<void>>(
    async () => {}
  );

  const emptyStatus = tracks.length > 0 ? content.openPrompt : content.emptyStateLabel;

  const getTrackLabel = useCallback(
    (track: MusicTrack, index: number) =>
      trackTitles[track.url] ?? track.label ?? `Track ${String(index + 1).padStart(2, "0")}`,
    [trackTitles]
  );

  const resetPlaybackState = useCallback(
    (nextTitle = content.defaultTrackTitle, nextStatus = emptyStatus) => {
      setCurrentTitle(nextTitle);
      setStatusText(nextStatus);
      setElapsed("0:00");
      setDuration("0:00");
      setProgress(0);
      setLoading(false);
      setIsPlaying(false);
    },
    [content.defaultTrackTitle, emptyStatus]
  );

  const ensureAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  const updateSnapshot = useCallback(() => {
    const track = tracks[currentIndexRef.current];
    if (!track) {
      resetPlaybackState();
      return;
    }

    setCurrentTitle(getTrackLabel(track, currentIndexRef.current));

    if (activeKindRef.current === "youtube" && youtubePlayerRef.current) {
      const player = youtubePlayerRef.current;
      const title = player.getVideoData().title?.trim();

      if (title) {
        setTrackTitles((previous) =>
          previous[track.url] === title ? previous : { ...previous, [track.url]: title }
        );
        setCurrentTitle(title);
      }

      const currentTime = player.getCurrentTime();
      const totalTime = player.getDuration();
      setElapsed(formatTime(currentTime));
      setDuration(formatTime(totalTime));
      setProgress(totalTime > 0 ? Math.min((currentTime / totalTime) * 100, 100) : 0);
      return;
    }

    if (activeKindRef.current === "audio" && audioRef.current) {
      const audio = audioRef.current;
      const currentTime = audio.currentTime;
      const totalTime = audio.duration;
      setElapsed(formatTime(currentTime));
      setDuration(formatTime(totalTime));
      setProgress(totalTime > 0 ? Math.min((currentTime / totalTime) * 100, 100) : 0);
      return;
    }

    setElapsed("0:00");
    setDuration("0:00");
    setProgress(0);
  }, [getTrackLabel, resetPlaybackState, tracks]);

  const ensureYouTubePlayer = useCallback(async () => {
    if (youtubePlayerRef.current) {
      return youtubePlayerRef.current;
    }

    const YT = await loadYouTubeIframeApi();

    if (youtubePlayerRef.current) {
      return youtubePlayerRef.current;
    }

    return new Promise<YTPlayerInstance>((resolve, reject) => {
      youtubePlayerRef.current = new YT.Player(PLAYER_CONTAINER_ID, {
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
            event.target.setVolume(volume);
            setVolume(event.target.getVolume());
            resolve(event.target);
          },
          onStateChange: (event) => {
            if (activeKindRef.current !== "youtube") {
              return;
            }

            const playerState = YT.PlayerState;

            if (event.data === playerState.PLAYING) {
              setLoading(false);
              setIsPlaying(true);
              setStatusText(content.playLabel);
            } else if (event.data === playerState.PAUSED) {
              setLoading(false);
              setIsPlaying(false);
              setStatusText(content.pauseLabel);
            } else if (event.data === playerState.BUFFERING) {
              setLoading(true);
              setStatusText(content.loadingLabel);
            } else if (event.data === playerState.CUED) {
              setLoading(false);
              setIsPlaying(false);
              setStatusText(content.defaultStatus);
            } else if (event.data === playerState.ENDED) {
              setLoading(false);
              setIsPlaying(false);
              void playTrackAtIndexRef.current(currentIndexRef.current + 1, true);
            }

            window.setTimeout(updateSnapshot, 180);
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
  }, [
    content.defaultStatus,
    content.loadingLabel,
    content.pauseLabel,
    content.playLabel,
    updateSnapshot,
    volume,
  ]);

  const playTrackAtIndex = useCallback(
    async (index: number, autoplay: boolean) => {
      if (tracks.length === 0) {
        resetPlaybackState(content.defaultTrackTitle, content.emptyStateLabel);
        return;
      }

      const nextIndex = ((index % tracks.length) + tracks.length) % tracks.length;
      const track = tracks[nextIndex];

      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setCurrentTitle(getTrackLabel(track, nextIndex));
      setStatusText(content.loadingLabel);
      setElapsed("0:00");
      setDuration("0:00");
      setProgress(0);
      setLoading(true);
      setIsPlaying(false);

      if (track.kind === "youtube") {
        activeKindRef.current = "youtube";
        audioRef.current?.pause();

        try {
          const player = await ensureYouTubePlayer();
          player.setVolume(volume);

          if (autoplay) {
            player.loadVideoById(track.videoId);
          } else {
            player.cueVideoById(track.videoId);
          }
        } catch (error) {
          setLoading(false);
          setStatusText((error as Error).message);
        }

        return;
      }

      activeKindRef.current = "audio";
      youtubePlayerRef.current?.pauseVideo();

      const audio = ensureAudioElement();
      audio.volume = volume / 100;
      audio.src = track.url;
      audio.load();

      if (!autoplay) {
        setLoading(false);
        setStatusText(content.defaultStatus);
        return;
      }

      try {
        await audio.play();
      } catch (error) {
        setLoading(false);
        setStatusText((error as Error).message);
      }
    },
    [
      content.defaultStatus,
      content.defaultTrackTitle,
      content.emptyStateLabel,
      content.loadingLabel,
      ensureAudioElement,
      ensureYouTubePlayer,
      getTrackLabel,
      resetPlaybackState,
      tracks,
      volume,
    ]
  );

  useEffect(() => {
    playTrackAtIndexRef.current = playTrackAtIndex;
  }, [playTrackAtIndex]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const audio = ensureAudioElement();

    const handlePlay = () => {
      if (activeKindRef.current !== "audio") return;
      setLoading(false);
      setIsPlaying(true);
      setStatusText(content.playLabel);
      updateSnapshot();
    };

    const handlePause = () => {
      if (activeKindRef.current !== "audio" || audio.ended) return;
      setLoading(false);
      setIsPlaying(false);
      setStatusText(content.pauseLabel);
      updateSnapshot();
    };

    const handleWaiting = () => {
      if (activeKindRef.current !== "audio") return;
      setLoading(true);
      setStatusText(content.loadingLabel);
    };

    const handleCanPlay = () => {
      if (activeKindRef.current !== "audio") return;
      setLoading(false);
      setStatusText(audio.paused ? content.defaultStatus : content.playLabel);
      updateSnapshot();
    };

    const handleTimeUpdate = () => {
      if (activeKindRef.current !== "audio") return;
      updateSnapshot();
    };

    const handleEnded = () => {
      if (activeKindRef.current !== "audio") return;
      setLoading(false);
      setIsPlaying(false);
      void playTrackAtIndexRef.current(currentIndexRef.current + 1, true);
    };

    const handleError = () => {
      if (activeKindRef.current !== "audio") return;
      setLoading(false);
      setIsPlaying(false);
      setStatusText("Playback could not start");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [
    content.defaultStatus,
    content.loadingLabel,
    content.pauseLabel,
    content.playLabel,
    ensureAudioElement,
    updateSnapshot,
  ]);

  useEffect(() => {
    audioRef.current?.pause();
    youtubePlayerRef.current?.pauseVideo();
    activeKindRef.current = null;

    if (tracks.length === 0) {
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      resetPlaybackState(content.defaultTrackTitle, content.emptyStateLabel);
      return;
    }

    const nextIndex = Math.min(currentIndexRef.current, tracks.length - 1);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    resetPlaybackState(getTrackLabel(tracks[nextIndex], nextIndex), content.openPrompt);
  }, [
    content.defaultTrackTitle,
    content.emptyStateLabel,
    content.openPrompt,
    getTrackLabel,
    resetPlaybackState,
    tracks,
  ]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }

    youtubePlayerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!expanded) return;

    const interval = window.setInterval(updateSnapshot, 1000);
    return () => window.clearInterval(interval);
  }, [expanded, updateSnapshot]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, []);

  const handleTogglePlay = async () => {
    if (tracks.length === 0) {
      setStatusText(content.emptyStateLabel);
      return;
    }

    if (activeKindRef.current === "audio" && audioRef.current) {
      if (audioRef.current.paused) {
        try {
          await audioRef.current.play();
        } catch (error) {
          setStatusText((error as Error).message);
        }
      } else {
        audioRef.current.pause();
      }
      return;
    }

    if (activeKindRef.current === "youtube" && youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
      return;
    }

    await playTrackAtIndex(currentIndexRef.current, true);
  };

  const handleNext = async () => {
    await playTrackAtIndex(currentIndexRef.current + 1, true);
    setView("player");
  };

  const handlePrevious = async () => {
    await playTrackAtIndex(currentIndexRef.current - 1, true);
    setView("player");
  };

  const handleExpand = () => {
    setExpanded(true);
    setView("player");
  };

  const handleSelectTrack = async (index: number) => {
    await playTrackAtIndex(index, true);
    setView("player");
  };

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
                    setView((previous) => (previous === "player" ? "playlist" : "player"))
                  }
                  className="music-control h-9 w-9"
                  aria-label={
                    view === "player" ? content.showQueueLabel : content.showPlayerLabel
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
                        {content.queueTitle}
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
                      aria-label={content.volumeLabel}
                    />
                  </div>
                </div>

                <div className="flex h-full w-1/2 flex-col pl-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{content.queueHeading}</p>
                      <p className="text-[11px] text-white/42">{content.queueDescription}</p>
                    </div>
                    <span className="text-[11px] text-white/42">{tracks.length} tracks</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {tracks.length > 0 ? (
                      tracks.map((track, index) => {
                        const active = index === currentIndex;

                        return (
                          <button
                            key={`${track.kind}-${track.url}`}
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
                              {getTrackLabel(track, index)}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs text-white/40">{track.url}</p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/48">
                        {content.emptyStateLabel}
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
