// src/lib/content-config.ts
import type { XMBIconName } from './xmb-constants';

/**
 * Configuration for a content type folder
 * Controls how the content appears in the XMB interface
 */
export interface ContentTypeConfig {
  /** Display name in XMB category column (e.g., "Projects", "Writing") */
  title: string;
  /** Icon for the category column */
  iconName: XMBIconName;
  /** Sort order - lower = more left in XMB. Fixed categories use 0-9, content uses 10+ */
  order: number;
  /** Whether to create tag-based sub-folders for this content type */
  groupByTags: boolean;
  /** Whether to show a "Featured" folder at the top */
  showFeatured: boolean;
  /** Singular label for count displays (e.g., "project" for "5 projects"). Auto-derived if omitted. */
  singularLabel?: string;
}

/**
 * Registry of content type configurations
 * Keys must match folder names in src/content/
 */
const contentConfig: Record<string, ContentTypeConfig> = {
  projects: {
    title: 'Projects',
    iconName: 'Atom',
    order: 10,
    groupByTags: true,
    showFeatured: true,
    singularLabel: 'project',
  },
  posts: {
    title: 'Writing',
    iconName: 'Notebook',
    order: 20,
    groupByTags: false,
    showFeatured: false,
    singularLabel: 'post',
  },
};

/**
 * Default configuration for auto-discovered content folders
 * that don't have an explicit entry in contentConfig
 */
function createDefaultConfig(folderName: string): ContentTypeConfig {
  // Capitalize first letter for display
  const title = folderName.charAt(0).toUpperCase() + folderName.slice(1);
  
  // Derive singular by removing trailing 's' if present
  const singularLabel = folderName.endsWith('s') 
    ? folderName.slice(0, -1) 
    : folderName;
  
  return {
    title,
    iconName: 'Folder',
    order: 50, // Default order puts unknown types after configured ones
    groupByTags: false,
    showFeatured: false,
    singularLabel,
  };
}

/**
 * Get configuration for a content type folder
 * Returns explicit config if defined, otherwise generates defaults
 */
export function getContentTypeConfig(folderName: string): ContentTypeConfig {
  return contentConfig[folderName] ?? createDefaultConfig(folderName);
}

/**
 * Get all explicitly configured content types
 */
export function getConfiguredContentTypes(): string[] {
  return Object.keys(contentConfig);
}

export { contentConfig };
