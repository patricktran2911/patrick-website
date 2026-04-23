"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export const FLOATING_WIDGET_FRAME_TRANSITION = {
  type: "spring",
  stiffness: 260,
  damping: 28,
} as const;

export const FLOATING_WIDGET_CONTENT_TRANSITION = {
  duration: 0.18,
} as const;

interface FloatingWidgetFrameProps {
  open: boolean;
  onOpen: () => void;
  placementClassName: string;
  collapsedAriaLabel: string;
  collapsedWidth: number | string;
  collapsedHeight: number | string;
  expandedWidth: number | string;
  expandedHeight: number | string;
  collapsedRadius: number | string;
  expandedRadius: number | string;
  collapsedSurfaceClassName: string;
  expandedSurfaceClassName: string;
  collapsedContent: ReactNode;
  expandedContent: ReactNode;
  collapsedButtonClassName?: string;
  expandedContentClassName?: string;
  transformOrigin?: string;
}

/**
 * Shared floating widget shell used by both the chatbot and the music player.
 * It owns the expand/collapse morph animation so feature-specific widgets can
 * focus on their content instead of duplicating layout motion logic.
 */
export default function FloatingWidgetFrame({
  open,
  onOpen,
  placementClassName,
  collapsedAriaLabel,
  collapsedWidth,
  collapsedHeight,
  expandedWidth,
  expandedHeight,
  collapsedRadius,
  expandedRadius,
  collapsedSurfaceClassName,
  expandedSurfaceClassName,
  collapsedContent,
  expandedContent,
  collapsedButtonClassName = "relative flex h-full w-full items-center justify-center rounded-full text-white",
  expandedContentClassName = "flex h-full flex-col",
  transformOrigin = "bottom right",
}: FloatingWidgetFrameProps) {
  return (
    <div className={`pointer-events-none fixed ${placementClassName}`}>
      <motion.div
        animate={
          open
            ? {
                width: expandedWidth,
                height: expandedHeight,
                borderRadius: expandedRadius,
              }
            : {
                width: collapsedWidth,
                height: collapsedHeight,
                borderRadius: collapsedRadius,
              }
        }
        transition={FLOATING_WIDGET_FRAME_TRANSITION}
        style={{ transformOrigin }}
        className={`pointer-events-auto relative overflow-hidden ${
          open ? expandedSurfaceClassName : collapsedSurfaceClassName
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FLOATING_WIDGET_CONTENT_TRANSITION}
              className={expandedContentClassName}
            >
              {expandedContent}
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FLOATING_WIDGET_CONTENT_TRANSITION}
              onClick={onOpen}
              aria-label={collapsedAriaLabel}
              className={collapsedButtonClassName}
            >
              {collapsedContent}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
