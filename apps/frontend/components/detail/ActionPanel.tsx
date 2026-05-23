'use client';

import { useState } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@studio/ui';

export interface ActionButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface MetadataItem {
  label: string;
  value: string;
}

interface ActionPanelProps {
  buttons: ActionButton[];
  metadata: MetadataItem[];
  nextSteps: string[];
}

function ActionBtn({ btn }: { btn: ActionButton }) {
  const [flash, setFlash] = useState(false);
  const Icon = flash ? Check : btn.icon;

  function handleClick() {
    btn.onClick();
    if (btn.variant !== 'primary') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-body-sm font-medium transition-colors duration-micro',
        btn.variant === 'primary'
          ? 'bg-accent text-text-on-accent hover:opacity-90'
          : 'bg-surface-raised text-text border border-border hover:border-border-strong',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{btn.label}</span>
    </button>
  );
}

export default function ActionPanel({ buttons, metadata, nextSteps }: ActionPanelProps) {
  return (
    <aside className="space-y-6">
      {/* Quick actions */}
      <section className="space-y-2">
        <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Actions</p>
        <div className="space-y-2">
          {buttons.map((btn, i) => (
            <ActionBtn key={i} btn={btn} />
          ))}
        </div>
      </section>

      {/* Metadata */}
      {metadata.length > 0 && (
        <section className="space-y-2 border-t border-border pt-4">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Details</p>
          <dl className="space-y-1.5">
            {metadata.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-2">
                <dt className="font-mono text-mono-sm text-text-faint shrink-0">{item.label}</dt>
                <dd className="font-mono text-mono-sm text-text-muted text-right break-all">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Next steps */}
      {nextSteps.length > 0 && (
        <section className="space-y-2 border-t border-border pt-4">
          <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">What to do next</p>
          <ol className="space-y-2">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex gap-2 text-body-sm text-text-muted">
                <span className="font-mono text-text-faint shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </aside>
  );
}
