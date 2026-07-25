// src/lib/xmb-data.ts
import { getAllContent, getContentTypes, getFeatured, BaseFrontmatter } from './mdx';
import { getContentTypeConfig, type ContentTypeConfig } from './content-config';
import type { XMBItem, XMBCategory } from './xmb-types';
import type { XMBIconName } from './xmb-constants';
import { siteConfig } from './site-config';
import { cache } from 'react';

/** Unique thumbnails for known tag folders, keyed by folder slug;
 *  unmapped categories fall back to the generic Folder icon. */
const TAG_FOLDER_ICONS: Partial<Record<string, XMBIconName>> = {
  'creative-coding': 'Code',
  'design-engineering': 'CompassTool',
  'google-creative-lab': 'Crab',
  'installation': 'Cube',
  'virtual-reality': 'VirtualReality',
};

/** Tag folders that must exist even before enough tagged projects land,
 *  each pinned directly above the folder named by `aboveSlug` (or to the
 *  top of the tag folders if that anchor is missing). Curate a pinned
 *  folder by tagging projects with its slug, or via `extraItems` — hand-made
 *  rows for work that lives elsewhere and has no MDX page of its own. */
const PINNED_TAG_FOLDERS: {
  slug: string;
  title: string;
  aboveSlug: string;
  extraItems?: XMBItem[];
  /** Stamp every item in this folder `restricted` — activation shakes the
   *  row and shows the "reach out" toast instead of opening anything. */
  restrictItems?: boolean;
}[] = [
  {
    slug: 'google-creative-lab',
    title: 'Google Creative Lab',
    aboveSlug: 'design-engineering',
    restrictItems: true,
    extraItems: [
      {
        id: 'gcl-little-language-lessons',
        title: 'Little Language Lessons',
        description: 'Bite-sized language-learning experiments built with Gemini',
        image: '/assets/projects/google-creative-lab/little-language-lessons.png',
        link: 'https://labs.google/lll',
        type: 'link',
      },
      {
        id: 'gcl-flow-tools',
        title: 'Google Flow Tools',
        description: "First-party tools in Flow's official gallery, and the tool builder agent",
        image: '/assets/projects/google-creative-lab/flow-tools-shader.jpg',
        link: 'https://blog.google/innovation-and-ai/models-and-research/google-labs/flow-updates/',
        type: 'link',
      },
    ],
  },
];

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

    // Materialize pinned folders even when no item carries their tag yet
    for (const pinned of PINNED_TAG_FOLDERS) {
      if (!tagFolders.has(pinned.title)) {
        tagFolders.set(pinned.title, []);
      }
    }

    // Create folder items for each category
    const tagFolderItems: { slug: string; folder: XMBItem }[] = [];
    tagFolders.forEach((categoryItems, categoryName) => {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      const pinned = PINNED_TAG_FOLDERS.find((p) => p.slug === slug);
      // Skip if only one item in category (don't create single-item folders);
      // pinned folders always render, even while empty
      if (categoryItems.length < 2 && !pinned) return;

      let folderItems: XMBItem[] = [
        ...categoryItems.map((item) => ({
          id: `${type}-${item.slug}`,
          title: item.title,
          description: item.excerpt || '',
          image: item.coverImage,
          link: `/${type}/${item.slug}`,
          type: type.replace(/s$/, '') as 'project' | 'post',
          meta: item
        })),
        ...(pinned?.extraItems ?? []),
      ];
      if (pinned?.restrictItems) {
        folderItems = folderItems.map((item) => ({ ...item, restricted: true }));
      }

      tagFolderItems.push({
        slug,
        folder: {
          id: `folder-${slug}`,
          title: categoryName,
          description: `${folderItems.length} ${folderItems.length === 1 ? singular : type}`,
          type: 'folder',
          icon: TAG_FOLDER_ICONS[slug],
          items: folderItems
        }
      });
    });

    // Move each pinned folder directly above its anchor folder
    for (const pinned of PINNED_TAG_FOLDERS) {
      const from = tagFolderItems.findIndex((f) => f.slug === pinned.slug);
      if (from === -1) continue;
      const [entry] = tagFolderItems.splice(from, 1);
      const anchor = tagFolderItems.findIndex((f) => f.slug === pinned.aboveSlug);
      tagFolderItems.splice(anchor === -1 ? 0 : anchor, 0, entry);
    }

    folders.push(...tagFolderItems.map((f) => f.folder));
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
 * Build the About me category items
 */
function buildAboutMeItems(): XMBItem[] {
  return [
    {
      id: 'about-resume',
      title: 'Resume',
      description: 'Latest resume (PDF)',
      link: siteConfig.links.resume,
      type: 'link',
      icon: 'FilePdf',
      hidePreview: true,
    },
    {
      id: 'about-cv',
      title: 'CV',
      description: 'Curriculum vitae with PDF download',
      link: '/cv',
      type: 'link',
      icon: 'ReadCvLogo',
      hidePreview: true,
    },
    {
      id: 'about-stack-gear',
      title: 'Stack & Gear',
      description: 'Software stack and everyday gear',
      link: '/stack-and-gear',
      type: 'link',
      icon: 'Backpack',
      hidePreview: true,
    }
  ];
}

/**
 * Build the Socials category items
 */
function buildSocialsItems(): XMBItem[] {
  return [
    {
      id: 'social-instagram',
      title: 'Instagram',
      description: '@alan.k.y',
      link: siteConfig.links.instagram,
      type: 'link',
      icon: 'InstagramLogo',
      hidePreview: true,
    },
    {
      id: 'social-github',
      title: 'GitHub',
      description: 'alanvww',
      link: siteConfig.links.github,
      type: 'link',
      icon: 'GithubLogo',
      hidePreview: true,
    },
    {
      id: 'social-mastodon',
      title: 'Mastodon',
      description: '@alanvww@mas.to',
      link: siteConfig.links.mastodon,
      type: 'link',
      icon: 'MastodonLogo',
      hidePreview: true,
    },
    {
      id: 'social-bluesky',
      title: 'Bluesky',
      description: '@alan.ooo',
      link: siteConfig.links.bluesky,
      type: 'link',
      icon: 'Butterfly',
      hidePreview: true,
    },
    {
      id: 'social-linkedin',
      title: 'LinkedIn',
      description: 'in/alanyam',
      link: siteConfig.links.linkedin,
      type: 'link',
      icon: 'LinkedinLogo',
      hidePreview: true,
    },
    {
      id: 'social-x',
      title: 'X',
      description: '@alanvww',
      link: siteConfig.links.x,
      type: 'link',
      icon: 'XLogo',
      hidePreview: true,
    },
    {
      id: 'social-email',
      title: 'Email',
      description: siteConfig.contact.email,
      link: siteConfig.links.email,
      type: 'link',
      icon: 'EnvelopeSimple',
      hidePreview: true,
    }
  ];
}

/**
 * Get XMB data with dynamic content categories
 * Categories are ordered: Settings (0), About me (5), content types (10+), Socials (100)
 */
export const getXMBData = cache(async (): Promise<XMBCategory[]> => {
  // Fixed categories at the start
  const fixedStartCategories: XMBCategory[] = [
    {
      id: 'profile',
      title: 'About me',
      iconName: 'User',
      items: buildAboutMeItems()
    }
  ];

  // Fixed category at the end
  const fixedEndCategory: XMBCategory = {
    id: 'contact',
    title: 'Socials',
    iconName: 'ShareNetwork',
    items: buildSocialsItems()
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
