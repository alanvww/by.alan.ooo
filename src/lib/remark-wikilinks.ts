// src/lib/remark-wikilinks.ts
//
// Obsidian-style wikilinks for the content pipeline:
//   [[Gestura]]            -> link to /projects/gestura (resolved via the content index)
//   [[gestura|my project]] -> same link, custom label
//   ![[screenshot.png]]    -> image resolved against the entry's colocated-asset base
//   [[No Such Note]]       -> <a class="wikilink wikilink-missing"> (rendered as inert text
//                             by the `a` component mapping)
//
// Operates on mdast text nodes only, so wikilinks inside code fences and
// inline code are naturally left alone (code is not a text node).

import { slugify, type WikilinkTarget } from './mdx';

interface MdastNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string;
  title?: string | null;
  children?: MdastNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
}

export interface RemarkWikilinksOptions {
  /** Resolves a wikilink target (already slugified) to a content page. */
  resolve: (key: string) => WikilinkTarget | undefined;
  /** Public URL base for ![[embeds]], e.g. /content/posts/my-note */
  assetBase: string;
}

const WIKILINK_RE = /(!)?\[\[([^\][|]+?)(?:\|([^\][]+?))?\]\]/g;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/** Parents whose text children should not be transformed. */
const SKIP_PARENTS = new Set(['link', 'linkReference', 'definition']);

function transformText(node: MdastNode, options: RemarkWikilinksOptions): MdastNode[] | null {
  const value = node.value ?? '';
  if (!value.includes('[[')) return null;

  const result: MdastNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;

  while ((match = WIKILINK_RE.exec(value)) !== null) {
    const [full, bang, rawTarget, rawAlias] = match;
    const target = rawTarget.trim();
    const alias = rawAlias?.trim();

    if (match.index > lastIndex) {
      result.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }

    if (bang && IMAGE_EXT_RE.test(target)) {
      // ![[image.png]] — colocated image embed
      result.push({
        type: 'image',
        url: `${options.assetBase}/${encodeURI(target)}`,
        alt: alias ?? '',
      });
    } else {
      const resolved = options.resolve(slugify(target));
      if (resolved) {
        result.push({
          type: 'link',
          url: resolved.href,
          children: [{ type: 'text', value: alias ?? target }],
          data: { hProperties: { className: 'wikilink' } },
        });
      } else {
        result.push({
          type: 'link',
          url: '#',
          title: `No published note named “${target}”`,
          children: [{ type: 'text', value: alias ?? target }],
          data: { hProperties: { className: 'wikilink wikilink-missing' } },
        });
      }
    }

    lastIndex = match.index + full.length;
  }

  if (result.length === 0) return null;

  if (lastIndex < value.length) {
    result.push({ type: 'text', value: value.slice(lastIndex) });
  }

  return result;
}

function walk(node: MdastNode, options: RemarkWikilinksOptions): void {
  const children = node.children;
  if (!children || SKIP_PARENTS.has(node.type)) return;

  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.type === 'text') {
      const replacement = transformText(child, options);
      if (replacement) {
        children.splice(i, 1, ...replacement);
      }
    } else {
      walk(child, options);
    }
  }
}

export function remarkWikilinks(options: RemarkWikilinksOptions) {
  return (tree: MdastNode): void => {
    walk(tree, options);
  };
}
