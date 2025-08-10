// src/lib/mdx.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

type ContentType = 'posts' | 'projects';

/**
 * Get all files of a specific content type
 */
export async function getFiles(type: ContentType): Promise<string[]> {
  return fs.readdirSync(path.join(contentDirectory, type));
}

/**
 * Get the file extension for a given slug
 */
export async function getFileExtensionForSlug(type: ContentType, slug: string): Promise<string> {
  const mdxPath = path.join(contentDirectory, type, `${slug}.mdx`);
  const mdPath = path.join(contentDirectory, type, `${slug}.md`);
  
  if (fs.existsSync(mdxPath)) {
    return 'mdx';
  } else if (fs.existsSync(mdPath)) {
    return 'md';
  }
  
  throw new Error(`File with slug "${slug}" not found in ${type}`);
}

/**
 * Get data for a specific file by slug
 */
export async function getFileData(type: ContentType, slug: string): Promise<PostFrontmatter | ProjectFrontmatter> {
  // Try .mdx first, then .md if that fails
  let filePath = path.join(contentDirectory, type, `${slug}.mdx`);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(contentDirectory, type, `${slug}.md`);
    
    // If neither extension exists, throw an error
    if (!fs.existsSync(filePath)) {
      throw new Error(`File with slug "${slug}" not found in ${type}`);
    }
  }
  
  const source = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(source);

  return {
    ...data,
    slug,
  } as PostFrontmatter | ProjectFrontmatter;
}

/**
 * Get all posts with their frontmatter
 */
export async function getAllPosts(): Promise<PostFrontmatter[]> {
  const files = await getFiles('posts');
  
  const posts = files.map((filename) => {
    // Support both .mdx and .md extensions
    const slug = filename.replace(/\.(mdx|md)$/, '');
    const filePath = path.join(contentDirectory, 'posts', filename);
    const source = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(source);
    
    return {
      ...data,
      slug,
    } as PostFrontmatter;
  });
  
  return posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Get all projects with their frontmatter
 */
export async function getAllProjects(): Promise<ProjectFrontmatter[]> {
  const files = await getFiles('projects');
  
  const projects = files.map((filename) => {
    // Support both .mdx and .md extensions
    const slug = filename.replace(/\.(mdx|md)$/, '');
    const filePath = path.join(contentDirectory, 'projects', filename);
    const source = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(source);
    
    return {
      ...data,
      slug,
    } as ProjectFrontmatter;
  });
  
  return projects.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Legacy function for backward compatibility
 */
export async function getAllFilesFrontmatter(type: ContentType) {
  if (type === 'posts') {
    return getAllPosts();
  } else {
    return getAllProjects();
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function getFileBySlug(type: ContentType, slug: string) {
  const data = await getFileData(type, slug);
  
  return {
    // No code property needed with @next/mdx
    frontmatter: data,
  };
}

/**
 * Filter content by tags
 */
export function filterByTag<T extends BaseFrontmatter>(content: T[], tag: string): T[] {
  return content.filter(item => 
    item.tags && item.tags.some(t => 
      t.toLowerCase().includes(tag.toLowerCase())
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
