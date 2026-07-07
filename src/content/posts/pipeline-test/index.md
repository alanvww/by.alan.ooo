---
draft: true
---

# Pipeline Test

This draft exercises every feature of the markdown pipeline. It stays out of
lists and production builds (`draft: true`) but renders at
/posts/pipeline-test in dev.

Plain prose with {braces} and <angle brackets> must not crash a .md file.

## Wikilinks

A topic link to [[Gestura]], one with an alias [[gestura|my hand-tracking project]],
and one that does not resolve: [[Some Future Note]].

## Images

Obsidian-style embed: ![[test image.png]]

Bare relative markdown image with a caption:

![A test screenshot](<test image.png> "Colocated image, served straight from src/content")

## Table

| Feature            | Before      | After |
| ------------------ | ----------- | ----- |
| GFM tables         | raw pipes   | real tables |
| Syntax highlighting | none       | shiki, dual theme |
| Wikilinks          | literal text | resolved links |

## Code

```ts
interface WikilinkTarget {
  href: string;
  title: string;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
```

Inline `code` should look different from the block above.

- A task list too:
- [x] wire plugins
- [ ] write real posts

## External image

![external placeholder](https://placehold.co/1200x600/png "External image via any host")
