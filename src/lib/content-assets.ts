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
const contentRootPrefix = contentRoot + path.sep;
const publicRootPrefix = publicRoot + path.sep;
const HEADER_READ_BYTES = 65536;

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(/* turbopackIgnore: true */ filePath).isFile();
  } catch {
    return false;
  }
}

function isValidSegment(segment: string): boolean {
  return Boolean(
    segment &&
      segment !== '.' &&
      segment !== '..' &&
      !segment.includes('/') &&
      !segment.includes('\\') &&
      !segment.includes('\0'),
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Resolve /content/<...segments> to a file inside src/content.
 * Slugs in URLs are normalized ("My Project" -> my-project), so when the
 * direct path misses, the slug segment is mapped back to the real folder.
 */
export function resolveContentAssetFile(segments: string[]): string | null {
  if (segments.length === 0 || !segments.every(isValidSegment)) {
    return null;
  }

  const direct = path.join(contentRoot, ...segments);
  if (direct.startsWith(contentRootPrefix) && isFile(direct)) return direct;

  if (segments.length >= 2) {
    const [type, slugSegment, ...rest] = segments;
    const typeDir = path.join(contentRoot, type);
    try {
      const folder = fs
        .readdirSync(/* turbopackIgnore: true */ typeDir, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .find((entry) => entry.isDirectory() && slugify(entry.name) === slugSegment);
      if (folder) {
        const resolved = path.join(typeDir, folder.name, ...rest);
        if (resolved.startsWith(contentRootPrefix) && isFile(resolved)) return resolved;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/** Map a site-absolute image URL (/content/... or /assets/...) to a file on disk. */
export function resolveLocalImageFile(src: string): string | null {
  const clean = safeDecodeURIComponent(src.split(/[?#]/)[0]);
  if (!clean || !clean.startsWith('/') || clean.startsWith('//')) return null;

  const segments = clean.slice(1).split('/').filter(Boolean);
  if (!segments.every(isValidSegment)) return null;

  if (segments[0] === 'content') {
    return resolveContentAssetFile(segments.slice(1));
  }

  const publicPath = path.join(publicRoot, ...segments);
  return publicPath.startsWith(publicRootPrefix) && isFile(publicPath) ? publicPath : null;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

const dimensionsCache = new Map<string, ImageDimensions | null>();

function probeImageDimensions(filePath: string, fileSize: number): ImageDimensions | null {
  const readBytes = Math.min(fileSize, HEADER_READ_BYTES);
  if (readBytes <= 0) return null;

  const fd = fs.openSync(/* turbopackIgnore: true */ filePath, 'r');
  let headBuffer: Uint8Array;
  try {
    headBuffer = new Uint8Array(readBytes);
    const bytesRead = fs.readSync(fd, headBuffer, 0, readBytes, 0);
    if (bytesRead < readBytes) {
      headBuffer = headBuffer.subarray(0, bytesRead);
    }
  } finally {
    fs.closeSync(fd);
  }

  try {
    const { width, height } = imageSize(headBuffer);
    if (width && height) return { width, height };
  } catch {
    if (fileSize > HEADER_READ_BYTES) {
      const fullBuffer = new Uint8Array(fs.readFileSync(/* turbopackIgnore: true */ filePath));
      const { width, height } = imageSize(fullBuffer);
      if (width && height) return { width, height };
    }
  }

  return null;
}

/**
 * Intrinsic dimensions for a local image so next/image can reserve the right
 * aspect ratio (no layout shift for portrait/square screenshots). Returns
 * null for unknown files or formats — callers fall back to a 16:9 default.
 */
export function getLocalImageDimensions(src: string): ImageDimensions | null {
  const filePath = resolveLocalImageFile(src);
  if (!filePath) return null;

  let stat: fs.Stats;
  try {
    stat = fs.statSync(/* turbopackIgnore: true */ filePath);
  } catch {
    return null;
  }

  const cacheKey = `${filePath}:${stat.mtimeMs}`;
  const cached = dimensionsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let dimensions: ImageDimensions | null = null;
  try {
    dimensions = probeImageDimensions(filePath, stat.size);
  } catch {
    dimensions = null;
  }

  dimensionsCache.set(cacheKey, dimensions);
  return dimensions;
}
