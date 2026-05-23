'use client';

import { Label } from '@studio/ui';

interface ExampleChipsProps {
  onSelect: (example: string) => void;
}

const EXAMPLES = [
  'a tool for dentists to manage referrals',
  'AI co-pilot for indie game devs',
  'marketplace for ceramic studio rentals',
] as const;

export default function ExampleChips({ onSelect }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Label className="mr-1">Try</Label>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onSelect(example)}
          className="
            rounded-full border border-border bg-surface-raised
            px-3 py-1.5 text-body-sm text-text-muted
            hover:border-border-primary hover:text-text
            transition-colors duration-state ease-ease
          "
        >
          {example}
        </button>
      ))}
    </div>
  );
}
