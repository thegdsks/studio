import type { HTMLAttributes } from 'react';
import { cn } from './cn.js';

type SpaceKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceKey;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export function VStack({ gap = '4', align = 'stretch', className, ...rest }: StackProps) {
  return <div className={cn('flex flex-col', `gap-${gap}`, alignMap[align], className)} {...rest} />;
}

export function HStack({ gap = '4', align = 'center', className, ...rest }: StackProps) {
  return <div className={cn('flex flex-row', `gap-${gap}`, alignMap[align], className)} {...rest} />;
}
