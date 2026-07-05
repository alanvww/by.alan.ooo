// src/lib/xmb-data.ts
import { getAllContent, getContentTypes, getAllTags, getFeatured, BaseFrontmatter } from './mdx';
import { getContentTypeConfig, type ContentTypeConfig } from './content-config';
import type { XMBItem, XMBCategory } from './xmb-types';
import { siteConfig } from './site-config';
import { cache } from 'react';

/**
 * Generic function to group content items into XMB folders
 * Handles both tag-based grouping and simple recent/all grouping
 */
function groupItemsIntoFolders(
  items: BaseFrontmatter[],
  type: string,
  config: ContentTypeConfig
): XMBItem[] {
  const folders: XMBItem[] = [];
  const singular = config.singularLabel ?? type.replace(/s$/, '');

  // Featured folder (if enabled and items exist)
  if (config.showFeatured) {
    const featured = getFeatured(items);
    if (featured.length > 0) {
      folders.push({
        id: `folder-featured-${type}`,
        title: 'Featured',
        description: `${featured.length} featured ${featured.length === 1 ? singular : type}`,
        type: 'folder',
        items: featured.map((item) => ({
          id: `${type}-${item.slug}`,
          title: item.title,
          description: item.excerpt || '',
          image: item.coverImage,
          link: `/${type}/${item.slug}`,
          type: type.replace(/s$/, '') as 'project' | 'post',
          meta: item
        }))
      });
    }
  }

  if (config.groupByTags) {
    // Tag-based grouping (like the old project folders)
    const tagFolders = new Map<string, BaseFrontmatter[]>();
    
    items.forEach((item) => {
      if (item.tags && item.tags.length > 0) {
        // Use the first tag as the primary category
        const primaryTag = item.tags[0];
        
        // Extract category from tags like "school-project/itp" -> "School Projects"
        let category = primaryTag.includes('/') 
          ? primaryTag.split('/')[0] 
          : primaryTag;
        
        // Normalize category names
        category = category
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        if (!tagFolders.has(category)) {
          tagFolders.set(category, []);
        }
        tagFolders.get(category)!.push(item);
      }
    });

    // Create folder items for each category
    tagFolders.forEach((categoryItems, categoryName) => {
      // Skip if only one item in category (don't create single-item folders)
      if (categoryItems.length < 2) return;
      
      folders.push({
        id: `folder-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        title: categoryName,
        description: `${categoryItems.length} ${categoryItems.length === 1 ? singular : type}`,
        type: 'folder',
        items: categoryItems.map((item) => ({
          id: `${type}-${item.slug}`,
          title: item.title,
          description: item.excerpt || '',
          image: item.coverImage,
          link: `/${type}/${item.slug}`,
          type: type.replace(/s$/, '') as 'project' | 'post',
          meta: item
        }))
      });
    });
  } else {
    // Simple grouping: Recent + All (like the old posts folders)
    const recentItems = items.slice(0, 5);
    if (recentItems.length > 0) {
      folders.push({
        id: `folder-recent-${type}`,
        title: 'Recent',
        description: `Latest ${recentItems.length} ${recentItems.length === 1 ? singular : type}`,
        type: 'folder',
        items: recentItems.map((item) => ({
          id: `${type}-${item.slug}`,
          title: item.title,
          description: item.excerpt || '',
          image: item.coverImage,
          link: `/${type}/${item.slug}`,
          type: type.replace(/s$/, '') as 'project' | 'post',
          meta: item
        }))
      });
    }
  }

  // "All [Type]" folder at the end
  if (items.length > 0) {
    folders.push({
      id: `folder-all-${type}`,
      title: `All ${config.title}`,
      description: `View all ${items.length} ${items.length === 1 ? singular : type}`,
      type: 'folder',
      items: items.map((item) => ({
        id: `${type}-${item.slug}`,
        title: item.title,
        description: item.excerpt || '',
        image: item.coverImage,
        link: `/${type}/${item.slug}`,
        type: type.replace(/s$/, '') as 'project' | 'post',
        meta: item
      }))
    });
  }

  return folders;
}

/**
 * Build the profile category items
 */
function buildProfileItems(): XMBItem[] {
  return [
    {
      id: 'profile-github',
      title: 'GitHub',
      description: 'Open source projects and experiments.',
      link: siteConfig.links.github,
      type: 'link',
    },
    {
      id: 'profile-email',
      title: 'Email',
      description: siteConfig.contact.email,
      link: siteConfig.links.email,
      type: 'link',
    }
  ];
}

/**
 * Build the settings category items
 */
function buildSettingItems(): XMBItem[] {
  return [
    {
      id: 'setting-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark mode.',
      type: 'settings',
      actionId: 'toggle-theme'
    }
  ];
}

/**
 * Build the contact category items
 */
function buildContactItems(): XMBItem[] {
  return [
    {
      id: 'contact-email',
      title: 'Email',
      description: 'Send me an email.',
      link: `mailto:${siteConfig.contact.email}`,
      type: 'link'
    }
  ];
}

/**
 * Get XMB data with dynamic content categories
 * Categories are ordered: Settings (0), Profile (5), content types (10+), Contact (100)
 */
export const getXMBData = cache(async (): Promise<XMBCategory[]> => {
  // Fixed categories at the start
  const fixedStartCategories: XMBCategory[] = [
    {
      id: 'settings',
      title: 'Settings',
      iconName: 'Gear',
      items: buildSettingItems()
    },
    {
      id: 'profile',
      title: 'Profile',
      iconName: 'User',
      items: buildProfileItems()
    }
  ];

  // Fixed category at the end
  const fixedEndCategory: XMBCategory = {
    id: 'contact',
    title: 'Contact',
    iconName: 'EnvelopeSimple',
    items: buildContactItems()
  };

  // Dynamically discover and build content categories
  const contentTypes = getContentTypes();
  const contentCategories: XMBCategory[] = [];

  for (const type of contentTypes) {
    const config = getContentTypeConfig(type);
    const items = await getAllContent(type);
    
    // Skip empty content types
    if (items.length === 0) continue;
    
    const folders = groupItemsIntoFolders(items, type, config);
    
    contentCategories.push({
      id: type,
      title: config.title,
      iconName: config.iconName,
      items: folders
    });
  }

  // Sort content categories by their configured order
  contentCategories.sort((a, b) => {
    const configA = getContentTypeConfig(a.id);
    const configB = getContentTypeConfig(b.id);
    return configA.order - configB.order;
  });

  // Combine: fixed start + sorted content + fixed end
  return [
    ...fixedStartCategories,
    ...contentCategories,
    fixedEndCategory
  ];
});
