## by.alan.ooo

Personal site powered by Next.js App Router + MDX.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Content authoring

Posts and projects live in `src/content/{posts|projects}/` as `.md` (plain
markdown, Obsidian/Zed-safe) or `.mdx` (with components) — either flat files
or folders with colocated images:

```
src/content/posts/my-post/
  index.md
  cover.jpg
  image-1.png
```

Relative image paths (`cover.jpg` or `./cover.jpg`), Obsidian `![[embeds]]`
and `[[wikilinks]]` all work. Minimal frontmatter is fine — title, date, and
excerpt are derived when missing; add `draft: true` to keep a file out of
lists and production. See `CONTENT.md` for the full guide.

In dev, colocated media is served directly from `src/content`. For production,
the build mirrors it into `public/content/` via `bun run sync:content`
(run automatically by `bun run build`).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Revalidation

An on-demand revalidation endpoint is available at `POST /api/revalidate`.
Provide `{ "secret": "<REVALIDATE_SECRET>", "path": "/posts/my-post" }`.
