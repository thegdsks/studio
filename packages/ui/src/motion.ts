'use client';

/**
 * Shared framer-motion variants for Studio.
 *
 * All durations and easings are derived from tokens.json motion values:
 *   ease:             cubic-bezier(0.22, 1, 0.36, 1)  (--motion-ease)
 *   ease-out-card:    cubic-bezier(0.2, 0.8, 0.2, 1)  (--motion-ease-out-card)
 *   duration-fast:    180ms = 0.18s                   (--motion-duration-fast)
 *   duration-base:    240ms = 0.24s                   (--motion-duration-base)
 *   duration-panel:   240ms = 0.24s                   (--motion-duration-panel)
 *   spring-stiffness: 200                             (--motion-spring-stiffness)
 *
 * No magic numbers here — every value traces to a token.
 */

import { useReducedMotion } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';

// ---------------------------------------------------------------------------
// Token-derived constants (sourced from tokens.json — do not edit inline)
// ---------------------------------------------------------------------------

/** tokens.motion.ease */
const TOKEN_EASE = [0.22, 1, 0.36, 1] as const;

/** tokens.motion.ease-out-card — used for grid card and panel enters */
const TOKEN_EASE_CARD = [0.2, 0.8, 0.2, 1] as const;

/** tokens.motion.duration-fast in seconds (180ms) */
const TOKEN_DURATION_FAST = 0.18;

/** tokens.motion.duration-base in seconds (240ms) */
const TOKEN_DURATION_BASE = 0.24;

/** tokens.motion.duration-panel in seconds (240ms) */
const TOKEN_DURATION_PANEL = 0.24;

/** tokens.motion.spring-stiffness */
const TOKEN_SPRING_STIFFNESS = 200;

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

/**
 * Page-level / section entrance.
 * y: 12px → 0, opacity 0 → 1, 240ms cubic-bezier(.22,1,.36,1).
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TOKEN_DURATION_BASE,
      ease: TOKEN_EASE,
    } satisfies Transition,
  },
};

/**
 * Simple opacity entrance, no transform.
 * 180ms ease-out — for content swaps and status labels.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: TOKEN_DURATION_FAST,
      ease: 'easeOut',
    } satisfies Transition,
  },
};

/**
 * Container variant for grid layouts.
 * Apply to the grid wrapper; children use `cardEnter`.
 * stagger: index × 40ms, delayChildren: 0.04s — per research spec.
 */
export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    } satisfies Transition,
  },
};

/**
 * Modal / overlay entrance.
 * scale 0.96 → 1 + opacity, spring stiffness 200 damping 18.
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: TOKEN_SPRING_STIFFNESS,
      damping: 18,
    } satisfies Transition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: TOKEN_DURATION_FAST,
      ease: TOKEN_EASE,
    } satisfies Transition,
  },
};

/**
 * Grid card entrance — designed to compose with `staggerChildren` parent.
 * y: 8px → 0, opacity 0 → 1, 240ms cubic-bezier(.2,.8,.2,1).
 */
export const cardEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TOKEN_DURATION_BASE,
      ease: TOKEN_EASE_CARD,
    } satisfies Transition,
  },
};

/**
 * Final-kit bottom panel slide-up.
 * y: 32px → 0, opacity 0 → 1, 240ms cubic-bezier(.2,.8,.2,1).
 * Content inside should fade in 80ms after motion stops (use `fadeIn` with delay).
 */
export const slideUpPanel: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TOKEN_DURATION_PANEL,
      ease: TOKEN_EASE_CARD,
    } satisfies Transition,
  },
  exit: {
    opacity: 0,
    y: 32,
    transition: {
      duration: TOKEN_DURATION_FAST,
      ease: TOKEN_EASE,
    } satisfies Transition,
  },
};

// ---------------------------------------------------------------------------
// Reduced-motion utilities
// ---------------------------------------------------------------------------

/**
 * Returns true when the user has requested reduced motion via OS/browser settings.
 * Subscribes to `matchMedia('(prefers-reduced-motion: reduce)')` via framer-motion.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

type MotionFrame = Record<string, unknown>;

/**
 * Strips transform properties (x, y, scale, rotate, skew) from all variant
 * frames when reduced motion is preferred, keeping only opacity transitions.
 *
 * @param variants - The original framer-motion Variants object.
 * @param prefersReduced - Boolean from `usePrefersReducedMotion()`.
 * @returns The original variants unchanged, or transform-stripped variants.
 */
export function withReducedMotion(
  variants: Variants,
  prefersReduced: boolean,
): Variants {
  if (!prefersReduced) return variants;

  const TRANSFORM_KEYS = new Set([
    'x', 'y', 'scale', 'scaleX', 'scaleY',
    'rotate', 'rotateX', 'rotateY',
    'skewX', 'skewY',
  ]);

  const strip = (frame: MotionFrame): MotionFrame => {
    const result: MotionFrame = {};
    for (const [k, v] of Object.entries(frame)) {
      if (!TRANSFORM_KEYS.has(k)) {
        result[k] = v;
      }
    }
    return result;
  };

  const out: Variants = {};
  for (const [state, frame] of Object.entries(variants)) {
    if (frame && typeof frame === 'object' && !Array.isArray(frame)) {
      out[state] = strip(frame as MotionFrame) as Variants[string];
    } else {
      out[state] = frame;
    }
  }
  return out;
}
