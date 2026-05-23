'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from '@studio/ui';
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

// ─── Card variant ─────────────────────────────────────────────────────────────

function CardView({ hero, features, faq, cta }: CopywriterShape) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-display-md font-display text-text leading-tight">{hero.headline}</p>
        <p className="text-body-md text-text-muted">{hero.sub}</p>
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

// ─── Detail variant ───────────────────────────────────────────────────────────

function DetailView({ hero, features, faq, cta }: CopywriterShape) {
  return (
    <div className="space-y-12">
      {/* Hero headline lifted to display-lg */}
      <div className="space-y-4 border-b border-border pb-10">
        <p className="text-display-lg font-display text-text leading-tight">{hero.headline}</p>
        <p className="text-headline-md text-text-muted max-w-2xl">{hero.sub}</p>
        {cta && (
          <div className="pt-2">
            <span className="inline-block rounded-full bg-accent px-8 py-3 text-body-md font-semibold text-bg">
              {cta}
            </span>
          </div>
        )}
      </div>

      {/* Features as 3-col cards */}
      {features.length > 0 && (
        <div className="space-y-4">
          <Label>Features</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface p-5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-mono-sm text-accent tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-md font-semibold text-text">{f.title}</p>
                </div>
                <p className="text-body-sm text-text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ as collapsible items */}
      {faq.length > 0 && (
        <div className="space-y-3">
          <Label>Frequently asked questions</Label>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <FaqRow key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function CopywriterArtifact({ artifact, variant = 'card' }: Props): JSX.Element {
  if (!isCopywriter(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  if (variant === 'detail') {
    return <DetailView {...artifact} />;
  }

  return <CardView {...artifact} />;
}
