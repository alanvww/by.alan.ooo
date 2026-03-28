// src/lib/xmb-navigation.ts

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
  startNavigation: () => void,
): void {
  if (isExternalLink(link)) {
    window.open(link, '_blank');
  } else {
    startNavigation();
    router.push(link);
  }
}
