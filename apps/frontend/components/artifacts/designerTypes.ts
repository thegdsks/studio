// Shared types for DesignerArtifact variants.

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface BrandKit {
  name?: string;
  tagline?: string;
  primary?: string;
  secondary?: string;
  headlineFont?: string;
  bodyFont?: string;
}

export interface Media {
  backdropUrl?: string;
  composedUrl?: string;
}

export interface DesignerShape {
  mockupUrl?: string;
  palette?: Palette;
  brandKit?: BrandKit;
  media?: Media;
}

export function isDesigner(a: unknown): a is DesignerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return 'mockupUrl' in o || 'palette' in o || 'brandKit' in o || 'media' in o;
}
