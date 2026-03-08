// src/lib/mdx.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

const contentDirectory = path.join(process.cwd(), 'src/content');

// Define TypeScript interfaces for frontmatter
export interface BaseFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  slug: string;
  tags?: string[];
  publish?: boolean | string;
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

interface ContentEntry {
  slug: string;
  filePath: string;
  basePath?: string;
}

interface ParsedContentEntry<T extends BaseFrontmatter = BaseFrontmatter> extends ContentEntry {
  frontmatter: T;
  content: string;
}

export interface ContentFile<T extends BaseFrontmatter> {
  frontmatter: T;
  content: string;
  slug: string;
}

/**
 * Get all files of a specific content type
 */
export async function getFiles(type: ContentType): Promise<string[]> {
  const entries = getContentEntries(type);
  return entries.map((entry) => entry.slug);
}

const getContentEntries = cache((type: ContentType): ContentEntry[] => {
  const typeDirectory = path.join(contentDirectory, type);
  const dirEntries = fs.readdirSync(typeDirectory, { withFileTypes: true });

  const entries: ContentEntry[] = [];

  dirEntries.forEach((entry) => {
    if (entry.isDirectory()) {
      const folderPath = path.join(typeDirectory, entry.name);
      const mdxPath = path.join(folderPath, 'index.mdx');
      const mdPath = path.join(folderPath, 'index.md');

      if (fs.existsSync(mdxPath)) {
        entries.push({
          slug: entry.name,
          filePath: mdxPath,
          basePath: `/content/${type}/${entry.name}`,
        });
        return;
      }

      if (fs.existsSync(mdPath)) {
        entries.push({
          slug: entry.name,
          filePath: mdPath,
          basePath: `/content/${type}/${entry.name}`,
        });
      }
      return;
    }

    if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
      const slug = entry.name.replace(/\.(mdx|md)$/, '');
      entries.push({
        slug,
        filePath: path.join(typeDirectory, entry.name),
      });
    }
  });

  return entries;
});

const parseContentEntry = <T extends BaseFrontmatter>(entry: ContentEntry): ParsedContentEntry<T> => {
  const source = fs.readFileSync(entry.filePath, 'utf8');
  const { data, content } = matter(source);

  return {
    ...entry,
    frontmatter: resolveFrontmatterAssets(
      {
        ...data,
        slug: entry.slug,
      } as T,
      entry.basePath,
    ),
    content: rewriteRelativeContentPaths(content, entry.basePath),
  };
};

const getParsedContentEntries = cache((type: ContentType): ParsedContentEntry[] => {
  return getContentEntries(type).map((entry) => parseContentEntry(entry));
});

function sortByDate<T extends BaseFrontmatter>(content: T[]): T[] {
  return [...content].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

function resolveFrontmatterAssets<T extends BaseFrontmatter>(
  frontmatter: T,
  basePath?: string
): T {
  if (!basePath) return frontmatter;

  const coverImage = frontmatter.coverImage;
  const resolvedCoverImage = coverImage && isRelativePath(coverImage)
    ? `${basePath}/${coverImage.replace(/^\.\//, '')}`
    : coverImage;

  return {
    ...frontmatter,
    coverImage: resolvedCoverImage,
  };
}

function rewriteRelativeContentPaths(content: string, basePath?: string): string {
  if (!basePath) return content;

  const withMarkdownImages = content.replace(
    /!\[([^\]]*)\]\(\.\//g,
    `![$1](${basePath}/`
  );

  const withHtmlImages = withMarkdownImages.replace(
    /(<img[^>]*\s+src=)(["'])\.\//g,
    `$1$2${basePath}/`
  );

  const withComponentImages = withHtmlImages.replace(
    /(<Image[^>]*\s+src=)(["'])\.\//g,
    `$1$2${basePath}/`
  );

  return withComponentImages.replace(
    /(\ssrc=\{\s*["'])\.\//g,
    `$1${basePath}/`
  );
}

function isRelativePath(value: string): boolean {
  return value.startsWith('./');
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
 * Get the file extension for a given slug
 */
export async function getFileExtensionForSlug(type: ContentType, slug: string): Promise<string> {
  const entries = getContentEntries(type);
  const entry = entries.find((item) => item.slug === slug);

  if (!entry) {
    throw new Error(`File with slug "${slug}" not found in ${type}`);
  }

  return path.extname(entry.filePath).replace('.', '');
}

/**
 * Get data for a specific file by slug
 */
export async function getFileData(
  type: ContentType,
  slug: string
): Promise<ContentFile<PostFrontmatter | ProjectFrontmatter>> {
  const entry = getParsedContentEntries(type).find((item) => item.slug === slug);

  if (!entry) {
    throw new Error(`File with slug "${slug}" not found in ${type}`);
  }

  return {
    frontmatter: entry.frontmatter as PostFrontmatter | ProjectFrontmatter,
    content: entry.content,
    slug,
  };
}

/**
 * Get all posts with their frontmatter
 */
export async function getAllPosts(): Promise<PostFrontmatter[]> {
  return sortByDate(getParsedContentEntries('posts').map((entry) => entry.frontmatter as PostFrontmatter));
}

/**
 * Get all projects with their frontmatter
 */
export async function getAllProjects(): Promise<ProjectFrontmatter[]> {
  return sortByDate(getParsedContentEntries('projects').map((entry) => entry.frontmatter as ProjectFrontmatter));
}

/**
 * Generic function to get all content of any type
 * Used by dynamic XMB category generation
 */
export async function getAllContent(type: string): Promise<BaseFrontmatter[]> {
  return sortByDate(getParsedContentEntries(type).map((entry) => entry.frontmatter));
}

export const getContentManifest = cache(async (): Promise<Record<string, ParsedContentEntry[]>> => {
  const types = getContentTypes();

  return Object.fromEntries(
    types.map((type) => [
      type,
      [...getParsedContentEntries(type)].sort((a, b) => {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }),
    ]),
  );
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
 * Filter published content only
 */
export function filterPublished<T extends BaseFrontmatter>(content: T[]): T[] {
  return content.filter(item => {
    const publish = item.publish;
    return publish === true || publish === 'true';
  });
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
