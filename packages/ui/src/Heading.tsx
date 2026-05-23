import type { HTMLAttributes, ElementType } from 'react';
import { cn } from './cn.js';

export type HeadingLevel = 'display-lg' | 'display-md' | 'headline-lg' | 'headline-md';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: ElementType;
}

const levelMap: Record<HeadingLevel, string> = {
  'display-lg':  'text-display-lg font-display',
  'display-md':  'text-display-md font-display',
  'headline-lg': 'text-headline-lg font-display',
  'headline-md': 'text-headline-md font-display',
};

const defaultTag: Record<HeadingLevel, ElementType> = {
  'display-lg': 'h1',
  'display-md': 'h1',
  'headline-lg': 'h2',
  'headline-md': 'h3',
};

export function Heading({ level, as, className, ...rest }: HeadingProps) {
  const Tag = as ?? defaultTag[level];
  return <Tag className={cn(levelMap[level], 'text-text', className)} {...rest} />;
}
