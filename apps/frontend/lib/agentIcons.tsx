import type { AgentId } from '@studio/shared';
import {
  Target,
  IdCard,
  BarChart3,
  PenLine,
  Palette,
  Scale,
  Code2,
  Megaphone,
  Sprout,
  Clapperboard,
  type LucideIcon,
} from 'lucide-react';

// Map AgentId → Lucide icon (replaces emoji in all UI per user preference).
export const AGENT_ICON: Record<AgentId, LucideIcon> = {
  strategist: Target,
  namer:      IdCard,
  analyst:    BarChart3,
  copywriter: PenLine,
  designer:   Palette,
  legal:      Scale,
  developer:  Code2,
  marketer:   Megaphone,
  growth:     Sprout,
  director:   Clapperboard,
};

export function iconFor(id: AgentId): LucideIcon {
  return AGENT_ICON[id];
}
