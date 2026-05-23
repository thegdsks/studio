// ─── Layout / chrome ────────────────────────────────────────────────────────
export { TopBar } from './TopBar.js';
export { StatusBar } from './StatusBar.js';
export { PageHeader } from './PageHeader.js';
export { Sidebar } from './Sidebar.js';
export type { SidebarItem } from './Sidebar.js';
export { Breadcrumbs } from './Breadcrumbs.js';
export type { BreadcrumbItem } from './Breadcrumbs.js';

// ─── Primitives ──────────────────────────────────────────────────────────────
export { Button } from './Button.js';
export type { ButtonVariant, ButtonSize } from './Button.js';

export { Card, CardHeader, CardBody, CardFooter } from './Card.js';
export type { CardTone, CardGlow, CardSurface } from './Card.js';

export { Chip } from './Chip.js';
export type { ChipTone } from './Chip.js';

export { Heading } from './Heading.js';
export type { HeadingLevel } from './Heading.js';

export { Mono, Label } from './Mono.js';

export { VStack, HStack } from './Stack.js';

// ─── Status / feedback ───────────────────────────────────────────────────────
export { StatusDot } from './StatusDot.js';
export type { StatusKind } from './StatusDot.js';
export { StatusBadge } from './StatusBadge.js';

// ─── Motion ──────────────────────────────────────────────────────────────────
export {
  fadeUp,
  fadeIn,
  staggerChildren,
  scaleIn,
  cardEnter,
  slideUpPanel,
  usePrefersReducedMotion,
  withReducedMotion,
} from './motion.js';

// ─── Error handling ──────────────────────────────────────────────────────────
export { ErrorBoundary } from './ErrorBoundary.js';
export { requireProp, requireEnv, assertNever } from './failLoud.js';

// ─── Async / retry ───────────────────────────────────────────────────────────
export { useRetry } from './useRetry.js';

// ─── Brand / theming ─────────────────────────────────────────────────────────
export { BrandThemeScope } from './BrandThemeScope.js';
export {
  ALLOWED_GOOGLE_FONTS,
  isAllowedFont,
  assertValidBrandKit,
  contrastRatio,
} from './BrandKit.js';
export type { BrandKit, GoogleFontName } from './BrandKit.js';

export { useGoogleFonts } from './useGoogleFonts.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export { cn } from './cn.js';
