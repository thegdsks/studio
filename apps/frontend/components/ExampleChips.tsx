'use client';

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
      <span className="text-xs text-slate-500 mr-1">Try:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onSelect(example)}
          className="
            rounded-full border border-slate-800
            bg-slate-900 px-3 py-1.5
            text-xs text-slate-400
            hover:border-sky-400/50 hover:text-sky-300 hover:bg-slate-800
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-sky-400/40
          "
        >
          {example}
        </button>
      ))}
    </div>
  );
}
