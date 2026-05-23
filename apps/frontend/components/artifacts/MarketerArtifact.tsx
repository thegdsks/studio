'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import RawFallback from './RawFallback';

interface ProductHunt {
  tagline: string;
  description: string;
}

interface HnShow {
  title: string;
  body?: string;
}

interface MarketerShape {
  tweet_thread?: string[];
  x?: string[];
  x_thread?: string[];
  producthunt?: ProductHunt;
  productHunt?: ProductHunt;
  hn_show?: string | HnShow;
  hackerNews?: string | HnShow;
  linkedin_post?: string;
}

function isMarketer(a: unknown): a is MarketerShape {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    'tweet_thread' in o ||
    'x' in o ||
    'x_thread' in o ||
    'producthunt' in o ||
    'productHunt' in o ||
    'hn_show' in o ||
    'hackerNews' in o ||
    'linkedin_post' in o
  );
}

function normalizeHn(hn: string | HnShow | undefined): { title: string; body?: string } | null {
  if (!hn) return null;
  if (typeof hn === 'string') return { title: hn };
  if (typeof hn === 'object' && typeof hn.title === 'string') {
    return { title: hn.title, body: typeof hn.body === 'string' ? hn.body : undefined };
  }
  return null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-label-sm text-text-faint hover:text-text transition-colors duration-micro"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-status-done" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

function XPanel({ posts }: { posts: string[] }) {
  const combined = posts.join('\n\n---\n\n');
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">X / Twitter Thread</p>
        <CopyButton text={combined} />
      </div>
      <div className="space-y-3">
        {posts.map((post, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <span className="font-mono text-label-sm text-text-muted">S</span>
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-semibold text-text">Studio</span>
                <span className="font-mono text-mono-sm text-text-faint">Just now</span>
              </div>
              <p className="text-body-sm text-text whitespace-pre-wrap">{post}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductHuntPanel({ ph }: { ph: ProductHunt }) {
  const text = `${ph.tagline}\n\n${ph.description}`;
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Product Hunt</p>
        <CopyButton text={text} />
      </div>
      <p className="text-body-md font-semibold text-text">{ph.tagline}</p>
      <p className="text-body-sm text-text-muted">{ph.description}</p>
      <div className="flex">
        <span className="inline-flex items-center gap-1.5 rounded border border-status-running px-3 py-1 text-body-sm text-status-running font-semibold">
          Upvote
        </span>
      </div>
    </div>
  );
}

function HNPanel({ title, body }: { title: string; body?: string }) {
  const copyText = body ? `Show HN: ${title}\n\n${body}` : `Show HN: ${title}`;
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">Hacker News</p>
        <CopyButton text={copyText} />
      </div>
      <div className="bg-surface-raised rounded px-3 py-1.5">
        <span className="text-label-sm font-mono text-accent uppercase tracking-wider">HN</span>
      </div>
      <p className="text-body-md text-text font-medium">Show HN: {title}</p>
      {body && (
        <p className="text-body-sm text-text-muted whitespace-pre-wrap">{body}</p>
      )}
      <p className="font-mono text-mono-sm text-text-faint">0 points by you 0 minutes ago | 0 comments</p>
    </div>
  );
}

function LinkedInPanel({ post }: { post: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-label-sm font-mono text-text-faint uppercase tracking-wider">LinkedIn</p>
        <CopyButton text={post} />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <span className="font-mono text-label-sm text-text-muted">S</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-body-sm font-semibold text-text">Studio User</p>
          <p className="font-mono text-mono-sm text-text-faint">Founder at Your Startup</p>
        </div>
      </div>
      <p className="text-body-sm text-text whitespace-pre-wrap">{post}</p>
    </div>
  );
}

interface Props {
  artifact: unknown;
  variant?: 'card' | 'detail';
}

export default function MarketerArtifact({ artifact }: Props): JSX.Element {
  if (!isMarketer(artifact)) {
    return <RawFallback artifact={artifact} />;
  }

  const xPosts = artifact.tweet_thread ?? artifact.x ?? artifact.x_thread ?? [];
  const ph = artifact.producthunt ?? artifact.productHunt;
  const hn = normalizeHn(artifact.hn_show ?? artifact.hackerNews);
  const li = artifact.linkedin_post;

  const hasContent = xPosts.length > 0 || ph || hn || li;
  if (!hasContent) {
    return <RawFallback artifact={artifact} />;
  }

  return (
    <div className="space-y-4">
      {xPosts.length > 0 && <XPanel posts={xPosts} />}
      {ph && <ProductHuntPanel ph={ph} />}
      {hn && <HNPanel title={hn.title} body={hn.body} />}
      {li && <LinkedInPanel post={li} />}
    </div>
  );
}
