'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import RawFallback from './RawFallback';

interface Feature {
  title: string;
  body: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface CopywriterShape {
  hero: { headline: string; sub: string };
  features: Feature[];
  faq: FaqItem[];
  cta?: string;
}

function isCopywriter(a: unknown): a is CopywriterShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.hero === 'object' &&
    o.hero !== null &&
    Array.isArray(o.features) &&
    Array.isArray(o.faq)
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-surface hover:bg-surface-raised transition-colors duration-micro"
      >
        <span className="text-body-md text-text font-medium">{item.q}</span>
        <ChevronDown
          className={`h-4 w-4 text-text-faint shrink-0 transition-transform duration-state ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border bg-surface-sunken">
          <p className="text-body-sm text-text-muted">{item.a}</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  artifact: unknown;
}

export default function CopywriterArtifact({ artifact }: Props): JSX.Element {
  if (!isCopywriter(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const { hero, features, faq, cta } = artifact;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-display-md font-display text-text leading-tight">{hero.headline}</p>
        <p className="text-body-lg text-text-muted">{hero.sub}</p>
      </div>

      {features.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-surface p-4 space-y-1">
              <p className="text-body-md font-semibold text-text">{f.title}</p>
              <p className="text-body-sm text-text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      )}

      {faq.length > 0 && (
        <div className="space-y-2">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">FAQ</p>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <FaqRow key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {cta && (
        <div className="flex">
          <span className="inline-block rounded-full bg-accent px-6 py-2.5 text-body-md font-semibold text-bg">
            {cta}
          </span>
        </div>
      )}
    </div>
  );
}
