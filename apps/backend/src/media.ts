/**
 * Media store. Persists generated assets (banana backdrops, composed SVG
 * brand mockups, logos) to disk + indexes them in SQLite so the dashboard
 * and BrandPreview can serve them back.
 *
 * Layout on disk:
 *   apps/backend/.studio/media/{run_id}/{slug}.{ext}
 *
 * Slug rules: kebab-case, no extension in slug. Extension is derived from mime.
 * Re-saving the same (run_id, slug) overwrites the row + file (UPSERT in db.ts).
 *
 * R2 / S3 upload is out of scope here — see /docs-local/TASKS.md task #34.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AgentId } from '@studio/shared';
import {
  dbInsertMedia,
  dbListMediaByRun,
  dbGetMedia,
  type MediaRecord,
} from './db.js';

const MEDIA_ROOT = process.env['STUDIO_MEDIA_DIR']
  ? resolve(process.env['STUDIO_MEDIA_DIR'])
  : resolve(process.cwd(), '.studio/media');

mkdirSync(MEDIA_ROOT, { recursive: true });

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/html': 'html',
};

interface SaveOpts {
  runId: string;
  agentId?: AgentId;
  slug: string;          // 'logo' | 'hero-backdrop' | 'hero' | etc.
  kind: string;          // 'logo' | 'backdrop' | 'mockup' | 'site'
  mime: string;
  bytes: Buffer | string;
  prompt?: string;
  width?: number;
  height?: number;
}

export interface SavedMedia extends MediaRecord {
  /** Convenience public URL through the backend. */
  url: string;
}

export function saveMedia(opts: SaveOpts): SavedMedia {
  const ext = EXT_BY_MIME[opts.mime];
  if (!ext) {
    throw new Error(`[media] unsupported mime ${opts.mime}`);
  }
  const slug = opts.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const dir = join(MEDIA_ROOT, opts.runId);
  const filePath = join(dir, `${slug}.${ext}`);
  mkdirSync(dirname(filePath), { recursive: true });

  const buf =
    typeof opts.bytes === 'string'
      ? Buffer.from(opts.bytes, 'utf8')
      : opts.bytes;
  writeFileSync(filePath, buf);

  const record = dbInsertMedia({
    id: randomUUID(),
    run_id: opts.runId,
    agent_id: opts.agentId ?? null,
    slug,
    kind: opts.kind,
    mime: opts.mime,
    path: filePath,
    prompt: opts.prompt ?? null,
    width: opts.width ?? null,
    height: opts.height ?? null,
    bytes: buf.length,
  });

  return { ...record, url: `/api/media/file/${opts.runId}/${slug}` };
}

export function listMedia(runId: string): SavedMedia[] {
  return dbListMediaByRun(runId).map((r) => ({
    ...r,
    url: `/api/media/file/${r.run_id}/${r.slug}`,
  }));
}

export function readMediaFile(runId: string, slug: string): {
  bytes: Buffer;
  mime: string;
} | undefined {
  const record = dbGetMedia(runId, slug);
  if (!record) return undefined;
  if (!existsSync(record.path)) return undefined;
  return { bytes: readFileSync(record.path), mime: record.mime };
}
