'use client';

/**
 * DesignerArtifact — delegates to DesignerCard (grid) or DesignerDetail (detail page).
 */

import DesignerCard from './DesignerCard';
import DesignerDetail from './DesignerDetail';
import RawFallback from './RawFallback';
import type { DesignerShape } from './designerTypes';
import { isDesigner } from './designerTypes';

export type DesignerVariant = 'card' | 'detail';

interface Props {
  artifact: unknown;
  variant?: DesignerVariant;
}

export default function DesignerArtifact({ artifact, variant = 'card' }: Props): JSX.Element {
  if (!isDesigner(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const shape = artifact as DesignerShape;
  if (variant === 'detail') {
    return <DesignerDetail shape={shape} />;
  }
  return <DesignerCard shape={shape} />;
}
