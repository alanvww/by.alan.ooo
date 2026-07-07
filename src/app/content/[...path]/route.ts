// src/app/content/[...path]/route.ts
//
// Serves colocated content assets (images dropped next to markdown files in
// src/content/) at /content/<type>/<slug>/<file>.
//
// In production, `scripts/sync-content-media.js` copies these files into
// public/content/ at build time and the static files win before this route
// runs — this handler is what makes the paste-image-in-Obsidian loop work in
// `bun dev` without a sync step, and acts as a fallback everywhere else.

import fs from 'fs/promises';
import path from 'path';
import { resolveContentAssetFile } from '@/lib/content-assets';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
};

/** Source markdown is never served as an asset. */
const BLOCKED_EXTENSIONS = new Set(['.md', '.mdx']);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: rawSegments } = await params;
  const segments = rawSegments.map((segment) => decodeURIComponent(segment));

  const extension = path.extname(segments[segments.length - 1] ?? '').toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return new Response(null, { status: 404 });
  }

  const filePath = resolveContentAssetFile(segments);
  if (!filePath) {
    return new Response(null, { status: 404 });
  }

  const file = await fs.readFile(filePath);

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream',
      'Cache-Control':
        process.env.NODE_ENV === 'development'
          ? 'no-store'
          : 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
