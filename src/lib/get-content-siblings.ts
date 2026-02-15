import { getAllContent, BaseFrontmatter } from './mdx';

export interface SiblingInfo {
    prev?: { slug: string; title: string };
    next?: { slug: string; title: string };
}

/**
 * Get sibling content for navigation
 * Works with any content type (posts, projects, or auto-discovered types)
 */
export async function getContentSiblings(
    type: string,
    currentSlug: string
): Promise<SiblingInfo> {
    const items = await getAllContent(type);

    const currentIndex = items.findIndex(item => item.slug === currentSlug);
    
    if (currentIndex === -1) return {};

    const siblings: SiblingInfo = {};

    // Previous item (actually next in chronological order since they are sorted newest first)
    if (currentIndex > 0) {
        siblings.next = {
            slug: items[currentIndex - 1].slug,
            title: items[currentIndex - 1].title
        };
    }

    // Next item (actually previous in chronological order)
    if (currentIndex < items.length - 1) {
        siblings.prev = {
            slug: items[currentIndex + 1].slug,
            title: items[currentIndex + 1].title
        };
    }

    return siblings;
}
