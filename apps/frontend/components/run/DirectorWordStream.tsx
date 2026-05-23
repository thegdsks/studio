'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '@studio/ui';

interface DirectorWordStreamProps {
  text: string;
  /** Delay in ms between each word appearing. Default: 30 */
  wordDelay?: number;
  /** Whether to play the animation. When false, shows full text immediately. */
  playing: boolean;
  className?: string;
}

export function DirectorWordStream({
  text,
  wordDelay = 30,
  playing,
  className,
}: DirectorWordStreamProps) {
  const prefersReduced = usePrefersReducedMotion();
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(prefersReduced || !playing ? words.length : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(visibleCount);
  countRef.current = visibleCount;

  useEffect(() => {
    if (prefersReduced) {
      setVisibleCount(words.length);
      return;
    }

    if (!playing) {
      setVisibleCount(words.length);
      return;
    }

    // Reset and replay
    setVisibleCount(0);
    countRef.current = 0;

    const id = setInterval(() => {
      if (countRef.current >= words.length) {
        clearInterval(id);
        return;
      }
      setVisibleCount((n) => n + 1);
    }, wordDelay);

    intervalRef.current = id;
    return () => clearInterval(id);
    // words.length intentional: re-run only when playing toggles or text changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, text, wordDelay, prefersReduced]);

  if (prefersReduced || !playing) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} aria-label={text} aria-live="polite">
      {words.slice(0, visibleCount).map((word, idx) => (
        <AnimatePresence key={idx} mode="wait">
          <motion.span
            key={`${idx}-${word}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block mr-1"
          >
            {word}
          </motion.span>
        </AnimatePresence>
      ))}
    </span>
  );
}
