## by.alan.ooo

Personal site powered by Next.js App Router + MDX.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Content authoring

Posts and projects live in `src/content/{posts|projects}/{slug}/index.mdx` with images in the same folder.

Example:

```
src/content/posts/my-post/
  index.mdx
  cover.jpg
  image-1.png
```

Use relative image paths in MDX/frontmatter:

```
coverImage: "./cover.jpg"
```

Before building, media files are copied to `public/content/...` via:

```
bun run sync:content
```

The build script runs this automatically.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Revalidation

An on-demand revalidation endpoint is available at `POST /api/revalidate`.
Provide `{ "secret": "<REVALIDATE_SECRET>", "path": "/posts/my-post" }`.
