'use client';

/**
 * Compact footer controls for swapping headline/body fonts on the BrandKit preview.
 * Styled with design tokens — no hex literals, no inline pixel numbers.
 */

import { ALLOWED_GOOGLE_FONTS } from '@studio/ui';
import type { GoogleFontName } from '@studio/ui';
import type { BrandKitOverrides } from '@/lib/useBrandKitPersistence';

interface BrandFontPickerProps {
  headlineFont: GoogleFontName;
  bodyFont: GoogleFontName;
  overrides: BrandKitOverrides;
  onChange: (next: BrandKitOverrides) => void;
}

export function BrandFontPicker({
  headlineFont,
  bodyFont,
  overrides,
  onChange,
}: BrandFontPickerProps) {
  const currentHeadline = overrides.headlineFont ?? headlineFont;
  const currentBody = overrides.bodyFont ?? bodyFont;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
      <FontSelect
        id="bp-headline-font"
        label="Headline font"
        value={currentHeadline}
        onChange={(v) => onChange({ ...overrides, headlineFont: v })}
      />
      <FontSelect
        id="bp-body-font"
        label="Body font"
        value={currentBody}
        onChange={(v) => onChange({ ...overrides, bodyFont: v })}
      />
    </div>
  );
}

function FontSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: GoogleFontName;
  onChange: (v: GoogleFontName) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="font-mono text-mono-sm text-text-faint uppercase tracking-wider select-none"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as GoogleFontName)}
        className="
          font-mono text-mono-sm
          bg-surface-sunken text-text
          border border-border
          rounded
          px-2 py-1
          focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
          hover:border-border-strong
          transition-colors duration-micro
          cursor-pointer
          appearance-none
          pr-6
        "
      >
        {ALLOWED_GOOGLE_FONTS.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
}
