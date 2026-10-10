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
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
};

/** Source markdown is never served as an asset. */
const BLOCKED_EXTENSIONS = new Set(['.md', '.mdx']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: rawSegments } = await params;
  let segments: string[];
  try {
    segments = rawSegments.map((segment) => decodeURIComponent(segment));
  } catch {
    return new Response(null, { status: 400 });
  }

  const extension = path.extname(segments[segments.length - 1] ?? '').toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return new Response(null, { status: 404 });
  }

  const filePath = resolveContentAssetFile(segments);
  if (!filePath) {
    return new Response(null, { status: 404 });
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return new Response(null, { status: 404 });
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Cache-Control':
      process.env.NODE_ENV === 'development'
        ? 'no-store'
        : 'public, max-age=3600, stale-while-revalidate=86400',
  };

  if (extension === '.svg') {
    baseHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match || (match[1] === '' && match[2] === '')) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, 'Content-Range': `bytes */${stat.size}` },
      });
    }

    const start = match[1] === '' ? Math.max(0, stat.size - Number(match[2])) : Number(match[1]);
    const end = match[1] === '' ? stat.size - 1 : match[2] === '' ? stat.size - 1 : Math.min(stat.size - 1, Number(match[2]));

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, 'Content-Range': `bytes */${stat.size}` },
      });
    }

    const chunkSize = end - start + 1;
    const buffer = new Uint8Array(chunkSize);
    const handle = await fs.open(filePath, 'r');
    try {
      await handle.read(buffer, 0, chunkSize, start);
    } finally {
      await handle.close();
    }

    return new Response(buffer, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': String(chunkSize),
      },
    });
  }

  let file: Buffer;
  try {
    file = await fs.readFile(filePath);
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      ...baseHeaders,
      'Content-Length': String(stat.size),
    },
  });
}
