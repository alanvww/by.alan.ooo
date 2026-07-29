// src/lib/xmb-routes.ts

/**
 * Standalone document routes: fully static pages that own a route-shaped
 * loading skeleton and are cheap to prefetch. LayoutWrapper's DOC_SKELETONS
 * map is keyed by this list, so adding a route here forces a matching
 * skeleton entry at compile time; the menu links also use it to decide
 * which internal routes keep Next's default viewport prefetch.
 */
export const STANDALONE_DOC_ROUTES = ['/', '/cv', '/stack-and-gear'] as const;

export type StandaloneDocRoute = (typeof STANDALONE_DOC_ROUTES)[number];

/**
 * Strip query, hash, and trailing slash so '/cv?utm=x#top' and '/cv/' both
 * resolve to '/cv'. Returns null for hrefs that can't be parsed.
 */
export function normalizePathname(href: string | null): string | null {
  if (!href) return null;
  try {
    const { pathname } = new URL(href, 'http://internal');
    return pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;
  } catch {
    return null;
  }
}

/** True when the href (after normalization) is a standalone doc route. */
export function isStandaloneDocRoute(href: string): boolean {
  const pathname = normalizePathname(href);
  return pathname !== null && (STANDALONE_DOC_ROUTES as readonly string[]).includes(pathname);
}
