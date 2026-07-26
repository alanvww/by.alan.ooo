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
 * The verb that ENTER will perform on this item. Used by both the per-row
 * floating hint in the vertical list and the global command bar at the
 * bottom of the screen — keep both in sync via this one function.
 */
export function getEnterActionLabel(item: XMBItem): EnterActionLabel {
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
  if (item.type === 'folder' && item.items) {
    ctx.drillIntoFolder?.(index);
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
