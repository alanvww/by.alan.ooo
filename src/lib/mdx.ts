// src/lib/mdx.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

const contentDirectory = path.join(process.cwd(), 'src/content');
const isDev = process.env.NODE_ENV === 'development';

// Define TypeScript interfaces for frontmatter
export interface BaseFrontmatter {
  title: string;
  date: string;
  updatedDate?: string;
  excerpt: string;
  coverImage?: string;
  slug: string;
  tags?: string[];
  publish?: boolean | string;
  draft?: boolean;
  featured?: boolean;
  readTime?: number;
}

export interface PostFrontmatter extends BaseFrontmatter {
  author?: string;
  category?: string;
}

export interface ProjectFrontmatter extends BaseFrontmatter {
  projectUrl?: string;
  technologies?: string[];
  githubUrl?: string;
  demoUrl?: string;
  status?: 'completed' | 'in-progress' | 'archived';
  permalink?: string;
}

/**
 * Content type is the folder name under src/content/
 * (e.g., 'posts', 'projects', or any auto-discovered folder)
 */
type ContentType = string;

export type ContentExtension = 'md' | 'mdx';

interface ContentEntry {
  slug: string;
  filePath: string;
  /** Public URL base that colocated assets resolve against. */
  basePath: string;
  extension: ContentExtension;
}

interface ParsedContentEntry<T extends BaseFrontmatter = BaseFrontmatter> extends ContentEntry {
  frontmatter: T;
  content: string;
  published: boolean;
}

export interface ContentFile<T extends BaseFrontmatter> {
  frontmatter: T;
  content: string;
  slug: string;
  basePath: string;
  extension: ContentExtension;
}

/**
 * Normalize a file/folder name (or wikilink target) into a URL-safe slug.
 * "My Cool Note.md" -> "my-cool-note", "Altify" -> "altify".
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const RESTRICTED_TAG_SLUGS = new Set(['google-creative-lab']);

/**
 * Checks whether an item's primary tag belongs to a restricted tag folder.
 * Normalizes the tag segment via slugify so "Google Creative Lab" and
 * "google-creative-lab" behave identically across menu folders and routes.
 */
export function isRestrictedByTag(item: { tags?: unknown }): boolean {
  if (!Array.isArray(item.tags) || item.tags.length === 0) return false;
  const primary = String(item.tags[0] ?? '').split('/')[0];
  return Boolean(primary && RESTRICTED_TAG_SLUGS.has(slugify(primary)));
}

const getContentEntries = cache((type: ContentType): ContentEntry[] => {
  const typeDirectory = path.join(contentDirectory, type);
  const dirEntries = fs
    .readdirSync(typeDirectory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  const entries: ContentEntry[] = [];
  const seenSlugs = new Set<string>();

  const addEntry = (entry: ContentEntry): void => {
    if (seenSlugs.has(entry.slug)) {
      console.warn(`[content] Duplicate slug "${entry.slug}" in ${type} — skipping ${entry.filePath}`);
      return;
    }
    seenSlugs.add(entry.slug);
    entries.push(entry);
  };

  dirEntries.forEach((entry) => {
    if (entry.isDirectory()) {
      const folderPath = path.join(typeDirectory, entry.name);
      const slug = slugify(entry.name);
      if (!slug) return;

      for (const [file, extension] of [['index.mdx', 'mdx'], ['index.md', 'md']] as const) {
        const filePath = path.join(folderPath, file);
        if (fs.existsSync(filePath)) {
          addEntry({
            slug,
            filePath,
            extension,
            basePath: `/content/${type}/${slug}`,
          });
          return;
        }
      }
      return;
    }

    if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
      const extension = (path.extname(entry.name).slice(1)) as ContentExtension;
      const slug = slugify(entry.name.replace(/\.(mdx|md)$/, ''));
      if (!slug) return;
      addEntry({
        slug,
        filePath: path.join(typeDirectory, entry.name),
        extension,
        // Loose assets dropped next to flat files are served from the type root.
        basePath: `/content/${type}`,
      });
    }
  });

  return entries;
});

/** First `# Heading` in the body, if any. */
function firstHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/** Strip a leading `# Heading` when it duplicates the resolved frontmatter title. */
function stripLeadingMatchingH1(content: string, title: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/);
  if (match && match[1].trim().toLowerCase() === title.trim().toLowerCase()) {
    return content.slice(match[0].length);
  }
  return content;
}

/** "my-cool-note" -> "My Cool Note" */
function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Accepts YAML Date objects, strings, or nothing; returns YYYY-MM-DD. */
function normalizeDate(value: unknown, fallback: Date): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !Number.isNaN(new Date(trimmed).getTime())) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return fallback.toISOString().slice(0, 10);
}

/**
 * Derive a plain-text excerpt from the first real paragraph of the body:
 * code fences, headings, images, imports and wikilink/markdown syntax stripped.
 */
function deriveExcerpt(content: string, maxLength = 160): string {
  const withoutBlocks = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/!\[\[[^\]]*\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '');

  const paragraph = withoutBlocks
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('<') && !block.startsWith('|'));

  if (!paragraph) return '';

  const plain = paragraph
    .replace(/\[\[([^\][|]+)(?:\|([^\][]+))?\]\]/g, (_, target, alias) => alias ?? target)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

function estimateReadTime(content: string): number {
  const words = content.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * A file is published unless it opts out with `publish: false` or `draft: true`.
 * (Defaulting to published keeps minimal Obsidian frontmatter working.)
 */
function isPublished(data: Record<string, unknown>): boolean {
  if (data.draft === true || data.draft === 'true') return false;
  if (data.publish === false || data.publish === 'false') return false;
  return true;
}

function normalizeTags(raw: unknown): string[] | undefined {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : undefined;
  if (!list) return undefined;
  const cleaned = list.map((tag) => String(tag).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

const parseContentEntry = <T extends BaseFrontmatter>(entry: ContentEntry): ParsedContentEntry<T> => {
  const source = fs.readFileSync(entry.filePath, 'utf8');
  const stat = fs.statSync(entry.filePath);
  const { data, content } = matter(source);

  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    firstHeading(content) ||
    humanizeSlug(entry.slug);
  const cleanedContent = stripLeadingMatchingH1(content, title);
  const tags = normalizeTags(data.tags);
  const updatedDate =
    data.updatedDate !== undefined ? normalizeDate(data.updatedDate, stat.mtime) : undefined;

  const frontmatter = {
    ...data,
    title,
    date: normalizeDate(data.date, stat.mtime),
    ...(updatedDate ? { updatedDate } : {}),
    ...(tags ? { tags } : { tags: undefined }),
    excerpt: (typeof data.excerpt === 'string' && data.excerpt.trim()) || deriveExcerpt(cleanedContent),
    readTime: typeof data.readTime === 'number' ? data.readTime : estimateReadTime(cleanedContent),
    slug: entry.slug,
  } as T;

  return {
    ...entry,
    frontmatter: resolveFrontmatterAssets(frontmatter, entry.basePath),
    content: rewriteRelativeContentPaths(cleanedContent, entry.basePath),
    published: isPublished(data),
  };
};

const getParsedContentEntries = cache(<T extends BaseFrontmatter>(type: ContentType): ParsedContentEntry<T>[] => {
  return getContentEntries(type).flatMap((entry) => {
    try {
      return [parseContentEntry<T>(entry)];
    } catch (error) {
      console.error(`[content] Failed to parse ${entry.filePath}:`, error);
      return [];
    }
  });
});

/** Entries that appear in lists, menus and static params: published only. */
function getVisibleContentEntries<T extends BaseFrontmatter>(
  type: ContentType,
  options?: { includeRestricted?: boolean },
): ParsedContentEntry<T>[] {
  return getParsedContentEntries<T>(type).filter(
    (entry) => entry.published && (options?.includeRestricted || !isRestrictedByTag(entry.frontmatter)),
  );
}

function sortByDate<T extends BaseFrontmatter>(content: T[]): T[] {
  return [...content].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

function isRelativePath(value: string): boolean {
  return !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value);
}

function resolveFrontmatterAssets<T extends BaseFrontmatter>(
  frontmatter: T,
  basePath: string,
): T {
  const coverImage = frontmatter.coverImage;
  const resolvedCoverImage = coverImage && isRelativePath(coverImage)
    ? `${basePath}/${coverImage.replace(/^\.\//, '')}`
    : coverImage;

  return {
    ...frontmatter,
    coverImage: resolvedCoverImage,
  };
}

/**
 * Point relative asset references at the public /content/... URL space.
 * Handles markdown images (`![x](img.png)` and `![x](./img.png)`), raw
 * `<img src>`, `<Image src>`, `<Figure src>`, and JSX `src={"./..."}` —
 * skipping fenced and inline code spans so code examples are never mutated.
 */
function rewriteRelativeSegment(segment: string, basePath: string): string {
  const withMarkdownImages = segment.replace(
    /(!\[[^\]]*\]\()(?![a-z][a-z0-9+.-]*:|\/|#|<)(?:\.\/)?([^)\s]+)/gi,
    `$1${basePath}/$2`,
  );

  const withAngleBracketImages = withMarkdownImages.replace(
    /(!\[[^\]]*\]\(<)(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?([^>]+)(>)/gi,
    (_match, open: string, file: string, close: string) => `${open}${basePath}/${file}${close}`,
  );

  const withHtmlImages = withAngleBracketImages.replace(
    /(<(?:img|Image|Figure)[^>]*\s+src=)(["'])(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?/gi,
    `$1$2${basePath}/`,
  );

  return withHtmlImages.replace(
    /(\ssrc=\{\s*["'])(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?/g,
    `$1${basePath}/`,
  );
}

function rewriteRelativeContentPaths(content: string, basePath: string): string {
  const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return parts
    .map((part, index) => (index % 2 === 0 ? rewriteRelativeSegment(part, basePath) : part))
    .join('');
}

/**
 * Discover all content type folders in src/content/
 * Returns an array of folder names (e.g., ['posts', 'projects'])
 */
export const getContentTypes = cache((): string[] => {
  const entries = fs.readdirSync(contentDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
});

/**
 * Get data for a specific file by slug.
 * Drafts resolve in development (for previewing at their URL) but are
 * treated as missing in production. Restricted items never resolve as pages.
 */
export async function getFileData(
  type: ContentType,
  slug: string
): Promise<ContentFile<PostFrontmatter | ProjectFrontmatter>> {
  const entry = getParsedContentEntries(type).find((item) => item.slug === slug);

  if (!entry || (!entry.published && !isDev) || isRestrictedByTag(entry.frontmatter)) {
    throw new Error(`File with slug "${slug}" not found in ${type}`);
  }

  return {
    frontmatter: entry.frontmatter as PostFrontmatter | ProjectFrontmatter,
    content: entry.content,
    slug,
    basePath: entry.basePath,
    extension: entry.extension,
  };
}

/**
 * Generic function to get all content of any type
 * Used by dynamic XMB category generation (includes restricted items so the
 * menu can display them with `restricted: true` and show the toast).
 */
export async function getAllContent(type: string): Promise<BaseFrontmatter[]> {
  return sortByDate(
    getVisibleContentEntries(type, { includeRestricted: true }).map((entry) => entry.frontmatter),
  );
}

export const getContentManifest = cache(async (): Promise<Record<string, ParsedContentEntry[]>> => {
  const types = getContentTypes();

  return Object.fromEntries(
    types.map((type) => [
      type,
      [...getVisibleContentEntries(type)].sort((a, b) => {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }),
    ]),
  );
});

export interface WikilinkTarget {
  href: string;
  title: string;
}

/**
 * Lookup table for [[wikilinks]]: resolves a link target written as a slug
 * ("gestura"), a title ("Gestura"), or anything that slugifies to either.
 */
export const getWikilinkIndex = cache(async (): Promise<Map<string, WikilinkTarget>> => {
  const manifest = await getContentManifest();
  const index = new Map<string, WikilinkTarget>();

  for (const [type, entries] of Object.entries(manifest)) {
    for (const entry of entries) {
      const target: WikilinkTarget = {
        href: `/${type}/${entry.slug}`,
        title: entry.frontmatter.title,
      };
      if (!index.has(entry.slug)) index.set(entry.slug, target);
      const titleKey = slugify(entry.frontmatter.title);
      if (titleKey && !index.has(titleKey)) index.set(titleKey, target);
    }
  }

  return index;
});

/**
 * Get featured content
 */
export function getFeatured<T extends BaseFrontmatter>(content: T[]): T[] {
  return content.filter(item => item.featured === true);
}
