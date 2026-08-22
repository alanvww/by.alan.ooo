// src/lib/xmb-navigation.ts
import type { XMBItem } from './xmb-types';

/**
 * Protocols that should open in a new tab rather than being handled by Next.js router.
 * Using URL constructor for parsing avoids fragile startsWith checks and automatically
 * covers edge cases like protocol-relative URLs.
 */
const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Returns true if the link is an external URL that should be opened in a new tab.
 * Relative paths (internal routes like "/about") will throw in `new URL()` and return false.
 */
export function isExternalLink(link: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(link).protocol);
  } catch {
    return false;
  }
}

interface RouterLike {
  push: (href: string) => void;
}

/**
 * Single, authoritative function for all XMB navigation.
 * - External links (http/https/mailto/tel) are opened in a new tab.
 * - Internal routes are handled by Next.js router with a loading state transition.
 *
 * Use this in both click handlers and keyboard handlers to keep routing behaviour in sync.
 */
export function navigateToLink(
  link: string,
  router: RouterLike,
  startNavigation: (href?: string) => void,
): void {
  if (isExternalLink(link)) {
    window.open(link, '_blank', 'noopener,noreferrer');
  } else {
    // The href lets the loading overlay pick a route-shaped skeleton.
    startNavigation(link);
    router.push(link);
  }
}

export type EnterActionLabel = 'Open' | 'Toggle' | 'Info';

/**
 * Whether activating this item does anything at all. The data layer can
 * produce shapes that look activatable but aren't — a `type: 'link'` row
 * with no `link`, or a folder with zero items (pinned tag folders are
 * materialized even while empty). Every activation entry point checks this
 * first so such rows give the deny cue instead of a silent no-op, and the
 * hint strip never advertises an ENTER that would do nothing.
 */
export function isActivatable(item: XMBItem): boolean {
  if (item.restricted) return true;
  if (item.type === 'folder') return (item.items?.length ?? 0) > 0;
  return Boolean(item.action || item.link);
}

/**
 * The verb that ENTER will perform on this item, or null when ENTER would
 * do nothing (see isActivatable). Used by the global command bar — keep
 * every hint surface in sync via this one function.
 */
export function getEnterActionLabel(item: XMBItem): EnterActionLabel | null {
  if (!isActivatable(item)) return null;
  if (item.restricted) return 'Info';
  if (item.type === 'folder') return 'Open';
  if (item.action) return 'Toggle';
  return 'Open';
}

export interface ActivateItemContext {
  router: RouterLike;
  startNavigation: (href?: string) => void;
  /** Optional — when omitted, folders are ignored (used by ArrowRight). */
  drillIntoFolder?: (index: number) => void;
  /** Restricted item activated: shake the row and show the info toast.
   *  The handler owns the deny sound. */
  onRestricted?: (item: XMBItem, index: number) => void;
}

/**
 * Authoritative "activate this item" handler used by both click and
 * keyboard paths. The priority is: restricted deny → folder drill →
 * run action → follow link. Previously click handlers checked link before
 * action while keyboard checked action before link, so an item with both
 * could behave differently across input modes — this function unifies
 * the order.
 */
export function activateItem(
  item: XMBItem,
  index: number,
  ctx: ActivateItemContext,
): void {
  if (item.restricted) {
    ctx.onRestricted?.(item, index);
    return;
  }
  if (item.type === 'folder') {
    // `[]` is truthy — an empty folder must not be drillable: nothing would
    // render inside and the list would become an inert focus dead-end.
    if (item.items && item.items.length > 0) {
      ctx.drillIntoFolder?.(index);
    }
    return;
  }
  if (item.action) {
    item.action();
    return;
  }
  if (item.link) {
    navigateToLink(item.link, ctx.router, ctx.startNavigation);
  }
}
