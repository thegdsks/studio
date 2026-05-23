'use client';

import type { ComponentType } from 'react';
import type { AgentId } from '@studio/shared';
import StrategistArtifact from './StrategistArtifact';
import NamerArtifact from './NamerArtifact';
import DesignerArtifact from './DesignerArtifact';
import CopywriterArtifact from './CopywriterArtifact';
import DeveloperArtifact from './DeveloperArtifact';
import MarketerArtifact from './MarketerArtifact';
import GrowthArtifact from './GrowthArtifact';
import LegalArtifact from './LegalArtifact';
import AnalystArtifact from './AnalystArtifact';
import RawFallback from './RawFallback';

interface ArtifactProps {
  artifact: unknown;
}

const RENDERERS: Partial<Record<AgentId, ComponentType<ArtifactProps>>> = {
  strategist: StrategistArtifact,
  namer: NamerArtifact,
  designer: DesignerArtifact,
  copywriter: CopywriterArtifact,
  developer: DeveloperArtifact,
  marketer: MarketerArtifact,
  growth: GrowthArtifact,
  legal: LegalArtifact,
  analyst: AnalystArtifact,
};

interface ArtifactRendererProps {
  agentId: AgentId;
  artifact: unknown;
}

export default function ArtifactRenderer({ agentId, artifact }: ArtifactRendererProps): JSX.Element {
  const Comp = RENDERERS[agentId] ?? RawFallback;
  return <Comp artifact={artifact} />;
}
