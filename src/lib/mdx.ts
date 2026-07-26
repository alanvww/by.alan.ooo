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
  updatedDate?: string;
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

/**
 * Get all files of a specific content type
 */
export async function getFiles(type: ContentType): Promise<string[]> {
  return getVisibleContentEntries(type).map((entry) => entry.slug);
}

const getContentEntries = cache((type: ContentType): ContentEntry[] => {
  const typeDirectory = path.join(contentDirectory, type);
  const dirEntries = fs.readdirSync(typeDirectory, { withFileTypes: true });

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
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) {
    return value;
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

const parseContentEntry = <T extends BaseFrontmatter>(entry: ContentEntry): ParsedContentEntry<T> => {
  const source = fs.readFileSync(entry.filePath, 'utf8');
  const stat = fs.statSync(entry.filePath);
  const { data, content } = matter(source);

  const frontmatter = {
    ...data,
    title: (typeof data.title === 'string' && data.title.trim()) || firstHeading(content) || humanizeSlug(entry.slug),
    date: normalizeDate(data.date, stat.mtime),
    excerpt: (typeof data.excerpt === 'string' && data.excerpt.trim()) || deriveExcerpt(content),
    readTime: typeof data.readTime === 'number' ? data.readTime : estimateReadTime(content),
    slug: entry.slug,
  } as T;

  return {
    ...entry,
    frontmatter: resolveFrontmatterAssets(frontmatter, entry.basePath),
    content: rewriteRelativeContentPaths(content, entry.basePath),
    published: isPublished(data),
  };
};

const getParsedContentEntries = cache(<T extends BaseFrontmatter>(type: ContentType): ParsedContentEntry<T>[] => {
  return getContentEntries(type).map((entry) => parseContentEntry<T>(entry));
});

/** Entries that appear in lists, menus and static params: published only. */
function getVisibleContentEntries<T extends BaseFrontmatter>(type: ContentType): ParsedContentEntry<T>[] {
  return getParsedContentEntries<T>(type).filter((entry) => entry.published);
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
 * `<img src>`, `<Image src>`, and JSX `src={"./..."}` — anything that is not
 * an absolute path, a protocol URL, or an anchor.
 */
function rewriteRelativeContentPaths(content: string, basePath: string): string {
  const withMarkdownImages = content.replace(
    /(!\[[^\]]*\]\()(?![a-z][a-z0-9+.-]*:|\/|#|<)(?:\.\/)?([^)\s]+)/gi,
    `$1${basePath}/$2`,
  );

  const withAngleBracketImages = withMarkdownImages.replace(
    /(!\[[^\]]*\]\(<)(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?([^>]+)(>)/gi,
    (_match, open: string, file: string, close: string) => `${open}${basePath}/${file}${close}`,
  );

  const withHtmlImages = withAngleBracketImages.replace(
    /(<(?:img|Image)[^>]*\s+src=)(["'])(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?/gi,
    `$1$2${basePath}/`,
  );

  return withHtmlImages.replace(
    /(\ssrc=\{\s*["'])(?![a-z][a-z0-9+.-]*:|\/)(?:\.\/)?/g,
    `$1${basePath}/`,
  );
}

/**
 * Discover all content type folders in src/content/
 * Returns an array of folder names (e.g., ['posts', 'projects'])
 */
export function getContentTypes(): string[] {
  const entries = fs.readdirSync(contentDirectory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Check if a content type folder exists
 */
export function contentTypeExists(type: string): boolean {
  const typeDirectory = path.join(contentDirectory, type);
  return fs.existsSync(typeDirectory);
}

/**
 * Get data for a specific file by slug.
 * Drafts resolve in development (for previewing at their URL) but are
 * treated as missing in production.
 */
export async function getFileData(
  type: ContentType,
  slug: string
): Promise<ContentFile<PostFrontmatter | ProjectFrontmatter>> {
  const entry = getParsedContentEntries(type).find((item) => item.slug === slug);

  if (!entry || (!entry.published && !isDev)) {
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
 * Get all posts with their frontmatter
 */
export async function getAllPosts(): Promise<PostFrontmatter[]> {
  return sortByDate(getVisibleContentEntries<PostFrontmatter>('posts').map((entry) => entry.frontmatter));
}

/**
 * Get all projects with their frontmatter
 */
export async function getAllProjects(): Promise<ProjectFrontmatter[]> {
  return sortByDate(getVisibleContentEntries<ProjectFrontmatter>('projects').map((entry) => entry.frontmatter));
}

/**
 * Generic function to get all content of any type
 * Used by dynamic XMB category generation
 */
export async function getAllContent(type: string): Promise<BaseFrontmatter[]> {
  return sortByDate(getVisibleContentEntries(type).map((entry) => entry.frontmatter));
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
 * Filter content by tags (exact match)
 */
export function filterByTag<T extends BaseFrontmatter>(content: T[], tag: string): T[] {
  return content.filter(item =>
    item.tags && item.tags.some(t =>
      t.toLowerCase() === tag.toLowerCase()
    )
  );
}

/**
 * Get all unique tags from content
 */
export function getAllTags<T extends BaseFrontmatter>(content: T[]): string[] {
  const tags = new Set<string>();
  content.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

/**
 * Search content by title and excerpt
 */
export function searchContent<T extends BaseFrontmatter>(content: T[], query: string): T[] {
  const searchTerm = query.toLowerCase();
  return content.filter(item =>
    item.title.toLowerCase().includes(searchTerm) ||
    item.excerpt.toLowerCase().includes(searchTerm) ||
    (item.tags && item.tags.some(tag =>
      tag.toLowerCase().includes(searchTerm)
    ))
  );
}

/**
 * Get featured content
 */
export function getFeatured<T extends BaseFrontmatter>(content: T[]): T[] {
  return content.filter(item => item.featured === true);
}
