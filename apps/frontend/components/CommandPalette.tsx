'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { Rocket, Moon, Sun, Eye, EyeOff, Github, BookOpen, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/useTheme';

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  textareaRef,
  privacyMode,
  onTogglePrivacy,
}: CommandPaletteProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'launch',
      label: 'LAUNCH NEW IDEA',
      hint: 'focus input',
      icon: <Rocket className="h-4 w-4 shrink-0" />,
      action: () => {
        onClose();
        setTimeout(() => textareaRef.current?.focus(), 50);
      },
    },
    {
      id: 'dashboard',
      label: 'GO TO DASHBOARD',
      hint: 'all runs',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      action: () => {
        onClose();
        router.push('/dashboard');
      },
    },
    {
      id: 'theme',
      label: 'TOGGLE THEME',
      hint: theme === 'dark' ? 'switch to light' : 'switch to dark',
      icon:
        theme === 'dark' ? (
          <Sun className="h-4 w-4 shrink-0" />
        ) : (
          <Moon className="h-4 w-4 shrink-0" />
        ),
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'privacy',
      label: 'TOGGLE PRIVACY MODE',
      hint: privacyMode ? 'currently ON' : 'currently OFF',
      icon: privacyMode ? (
        <EyeOff className="h-4 w-4 shrink-0" />
      ) : (
        <Eye className="h-4 w-4 shrink-0" />
      ),
      action: () => {
        onTogglePrivacy();
        onClose();
      },
    },
    {
      id: 'github',
      label: 'VIEW ON GITHUB',
      hint: 'opens new tab',
      icon: <Github className="h-4 w-4 shrink-0" />,
      action: () => {
        window.open('https://github.com/thegdsks/studio', '_blank');
        onClose();
      },
    },
    {
      id: 'docs',
      label: 'OPEN DOCS (README)',
      hint: 'opens new tab',
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
      action: () => {
        window.open('https://github.com/thegdsks/studio#readme', '_blank');
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()),
  );

  const runActive = useCallback(() => {
    const cmd = filtered[activeIndex];
    if (cmd) cmd.action();
  }, [filtered, activeIndex]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Keep activeIndex in bounds when filter changes
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  // Global keyboard handler
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runActive();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, filtered.length, runActive]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-surface border border-border rounded-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        {/* Header label */}
        <div className="px-3 pt-3 pb-1">
          <span className="font-mono text-label-sm text-text-faint uppercase tracking-wider">
            [ COMMAND PALETTE ]
          </span>
        </div>

        {/* Input */}
        <div className="px-3 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command..."
            className="
              w-full bg-surface-sunken border border-border rounded-sm
              font-mono text-body-sm text-text placeholder:text-text-faint
              px-3 py-2 focus:outline-none focus:border-border-accent
              transition-colors
            "
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Command list */}
        <div className="border-t border-border pb-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 font-mono text-label-sm text-text-faint">
              No commands found.
            </p>
          ) : (
            <ul role="listbox">
              {filtered.map((cmd, idx) => (
                <li
                  key={cmd.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                >
                  <button
                    type="button"
                    onClick={cmd.action}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      idx === activeIndex
                        ? 'bg-surface-raised text-text'
                        : 'text-text-muted hover:bg-surface-raised hover:text-text',
                    ].join(' ')}
                  >
                    <span className="text-text-muted">{cmd.icon}</span>
                    <span className="font-mono text-label-sm uppercase tracking-wider flex-1">
                      {cmd.label}
                    </span>
                    <span className="font-mono text-label-sm text-text-faint">
                      {idx === activeIndex ? '↵' : cmd.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
