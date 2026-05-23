'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * Show a spinner and disable the button. Replaces `leadingIcon` while active.
   * @deprecated Prefer `loading` — `isLoading` kept for backward compat.
   */
  isLoading?: boolean;
  /** Show a spinner and disable the button. Children text is hidden. */
  loading?: boolean;
  /**
   * Add a soft accent glow to the primary variant.
   * Uses `shadow-glow-accent-soft` token — no effect on secondary/ghost.
   */
  glow?: boolean;
  /**
   * Keyboard shortcut chip rendered on the trailing edge (e.g. "⌘↵").
   * Displayed in mono, tracked +0.4px, at muted opacity.
   * Automatically hidden when `loading` is true.
   */
  kbd?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-text-on-accent hover:shadow-glow-accent focus-visible:shadow-glow-accent',
  secondary:
    'bg-surface-raised text-text border border-border hover:border-border-strong',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-raised hover:text-text',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-body-sm rounded-md gap-1.5',
  md: 'h-10 px-4 text-title-md rounded-lg gap-2',
  lg: 'h-12 px-6 text-title-md rounded-lg gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    isLoading,
    loading,
    glow,
    kbd,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const isSpinning = loading ?? isLoading ?? false;

  return (
    <button
      ref={ref}
      disabled={disabled || isSpinning}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-[background-color,box-shadow,border-color,color] duration-state',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        glow && variant === 'primary' && 'shadow-glow-accent-soft',
        className,
      )}
      {...rest}
    >
      {isSpinning ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {!isSpinning && <span>{children}</span>}
      {!isSpinning && trailingIcon}
      {!isSpinning && kbd && (
        <span
          className={cn(
            'ml-auto pl-2',
            'font-mono text-[10.5px] tracking-[0.4px]',
            'text-text-muted opacity-60',
            'select-none',
          )}
          aria-hidden="true"
        >
          {kbd}
        </span>
      )}
    </button>
  );
});
