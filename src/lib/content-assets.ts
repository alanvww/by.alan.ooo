// src/lib/content-assets.ts
//
// Server-side helpers for locating colocated content assets and probing
// image dimensions. Shared by the /content/[...path] route handler and the
// MDX image component.

import fs from 'fs';
import path from 'path';
import { imageSize } from 'image-size';
import { slugify } from './mdx';

// turbopackIgnore: these paths are resolved at request time from URL
// segments, so Turbopack's file tracer can't bound them statically — left
// alone it falls back to tracing the whole project into every serverless
// function (233MB of public/ media, 250MB Vercel limit blown). The files the
// routes actually need at runtime ship via outputFileTracingIncludes
// (src/content) in next.config.ts; public/ is served by the CDN, and the
// dimension probe below degrades to a 16:9 fallback if a file is absent.
const contentRoot = path.join(/* turbopackIgnore: true */ process.cwd(), 'src', 'content');
const publicRoot = path.join(/* turbopackIgnore: true */ process.cwd(), 'public');

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(/* turbopackIgnore: true */ filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve /content/<...segments> to a file inside src/content.
 * Slugs in URLs are normalized ("My Project" -> my-project), so when the
 * direct path misses, the slug segment is mapped back to the real folder.
 */
export function resolveContentAssetFile(segments: string[]): string | null {
  if (segments.length === 0 || segments.some((s) => !s || s === '..' || s.includes('\\'))) {
    return null;
  }

  const direct = path.join(contentRoot, ...segments);
  if (direct.startsWith(contentRoot) && isFile(direct)) return direct;

  if (segments.length >= 2) {
    const [type, slugSegment, ...rest] = segments;
    const typeDir = path.join(contentRoot, type);
    try {
      const folder = fs
        .readdirSync(/* turbopackIgnore: true */ typeDir, { withFileTypes: true })
        .find((entry) => entry.isDirectory() && slugify(entry.name) === slugSegment);
      if (folder) {
        const resolved = path.join(typeDir, folder.name, ...rest);
        if (resolved.startsWith(contentRoot) && isFile(resolved)) return resolved;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/** Map a site-absolute image URL (/content/... or /assets/...) to a file on disk. */
export function resolveLocalImageFile(src: string): string | null {
  const clean = decodeURIComponent(src.split(/[?#]/)[0]);
  if (!clean.startsWith('/')) return null;

  const segments = clean.slice(1).split('/').filter(Boolean);
  if (segments.some((s) => s === '..' || s.includes('\\'))) return null;

  if (segments[0] === 'content') {
    return resolveContentAssetFile(segments.slice(1));
  }

  const publicPath = path.join(publicRoot, ...segments);
  return publicPath.startsWith(publicRoot) && isFile(publicPath) ? publicPath : null;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

const dimensionsCache = new Map<string, ImageDimensions | null>();

/**
 * Intrinsic dimensions for a local image so next/image can reserve the right
 * aspect ratio (no layout shift for portrait/square screenshots). Returns
 * null for unknown files or formats — callers fall back to a 16:9 default.
 */
export function getLocalImageDimensions(src: string): ImageDimensions | null {
  const filePath = resolveLocalImageFile(src);
  if (!filePath) return null;

  let cacheKey: string;
  try {
    cacheKey = `${filePath}:${fs.statSync(/* turbopackIgnore: true */ filePath).mtimeMs}`;
  } catch {
    return null;
  }

  const cached = dimensionsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let dimensions: ImageDimensions | null = null;
  try {
    const { width, height } = imageSize(new Uint8Array(fs.readFileSync(/* turbopackIgnore: true */ filePath)));
    if (width && height) dimensions = { width, height };
  } catch {
    dimensions = null;
  }

  dimensionsCache.set(cacheKey, dimensions);
  return dimensions;
}
