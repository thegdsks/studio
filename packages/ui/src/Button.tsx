'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-text-on-primary hover:shadow-glow-iris focus-visible:shadow-glow-iris',
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
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-[background-color,box-shadow,border-color,color] duration-state ease-ease',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!isLoading && trailingIcon}
    </button>
  );
});
