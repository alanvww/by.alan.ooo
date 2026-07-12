# Content Guide

How to create and manage content for the XMB-style portfolio site. Written for
both humans and LLMs. The pipeline is designed so files authored in external
editors (Obsidian, Zed, anything that writes markdown) work without extra steps.

---

## Quick Reference

### The fastest possible post

Create `src/content/posts/My New Idea.md` in any editor:

```md
# My New Idea

Write here. That's it.
```

Everything else is derived:

- **URL/slug** — from the filename, normalized: `/posts/my-new-idea`
- **Title** — frontmatter `title`, else the first `# Heading`, else the filename
- **Date** — frontmatter `date`, else the file's modification time
- **Excerpt** — frontmatter `excerpt`, else the first paragraph
- **Read time** — computed from word count
- **Published** — yes, unless `draft: true` or `publish: false`

### The recommended shape (folder + colocated images)

```
src/content/posts/my-new-post/
├── index.md          (or index.mdx)
├── cover.jpg
└── sketch.png
```

```md
---
title: "My New Post"
date: "2026-07-05"
excerpt: "A brief description shown in listings."
coverImage: "./cover.jpg"
tags: ["creative-coding"]
---

Paste images next to the file and reference them however your editor does it:

![[sketch.png]]                          ← Obsidian embed
![alt text](sketch.png)                  ← bare relative path
![alt text](./sketch.png "A caption")    ← ./ prefix + visible caption
```

All three image forms work. In `bun dev` they are served directly from
`src/content` (no sync step); `bun run build` mirrors them into
`public/content` for static serving.

---

## .md vs .mdx — pick by content

| Extension | Behavior |
| --------- | -------- |
| `.md` | Plain markdown. `{braces}` and `<angle brackets>` in prose are safe. No JSX. This is what Obsidian/Zed output — **default to this**. |
| `.mdx` | Full MDX: can use `<Figure>`, `<Demo>`, `<Tabs>`, `<Callout>` and JSX expressions. A stray `{` or `<` in prose is a syntax error, so reserve `.mdx` for files that need components. |

One caveat for `.md`: raw HTML fragments (including accidental `<word>` in
prose) are dropped silently rather than rendered. Escape as `\<word\>` or wrap
in backticks when you mean the literal characters.

One caveat for `.mdx`: next-mdx-remote v6 blocks JavaScript expressions by
default (`blockJS: true`). On the dynamic content pages
(`src/app/[type]/[slug]/page.tsx`) any JSX attribute expression —
`<Tabs items={[...]}>`, inline `{expressions}` — is silently stripped at
compile time: string attributes like `title="..."` survive, expression
attributes arrive as `undefined`. In posts and projects, stick to string
attributes for custom components. A page rendering trusted content can opt
out the way the standalone CV page does: `src/app/cv/page.tsx` passes
`options={{ mdxOptions, blockJS: false }}` because `src/content/cv.mdx` uses
`<CVEntry links={[...]} />` (see the comment there).

---

## Wikilinks (topic links)

`[[...]]` resolves against every published post and project, by slug or title:

```md
[[Gestura]]                     → link to /projects/gestura
[[gestura|my hand-tracking app]] → same link, custom label
[[Some Future Note]]            → renders as inert dashed text until the note exists
![[image.png]]                  → embeds a colocated image
```

Unresolved links are not errors — they mark notes you haven't written yet.

---

## Markdown features (both .md and .mdx)

- **GFM**: tables, task lists, strikethrough, autolinked URLs
- **Code fences** with shiki syntax highlighting (dual light/dark theme),
  language label, and a copy button
- **Heading anchors**: hover a heading for its `#` link
- **External links** open in a new tab automatically; in-page `#anchors` and
  internal `/paths` stay in-tab

Images get intrinsic dimensions read at build time (no layout shift), show an
XMB-style dot-wave placeholder while loading, and a markdown title
(`![alt](src "caption")`) renders as a visible caption — `alt` stays for
accessibility. External image URLs work from any host.

---

## Frontmatter Schema

### Shared fields (all optional)

| Field | Type | Default |
| ----- | ---- | ------- |
| `title` | string | first `# Heading`, else filename |
| `date` | YYYY-MM-DD | file modification time |
| `excerpt` | string | first paragraph |
| `coverImage` | path/URL | none — `./name.jpg` resolves to the colocated file |
| `tags` | string[] | none — first tag groups projects into XMB folders |
| `draft` | boolean | `false` — `true` hides from lists and production (still viewable at its URL in dev) |
| `publish` | boolean | `true` — `false` behaves like `draft: true` |
| `featured` | boolean | `false` — featured projects get a Featured folder |
| `readTime` | number | computed |

### Project-only fields (optional)

`projectUrl`, `githubUrl`, `demoUrl`, `technologies` (string[]),
`status` (`completed` | `in-progress` | `archived`)

### Slugs

Always derived from the file/folder name, normalized to URL-safe form
(`My Note.md` → `my-note`, `Altify.mdx` → `altify`). Never set `slug` manually.
Duplicate slugs within a type log a warning and the later file is skipped.

---

## Content Locations

```
src/content/
├── posts/                    # → "Writing" category
│   ├── quick-note.md         # flat file — loose images go next to it
│   └── my-post/              # folder — preferred for anything with images
│       ├── index.md
│       └── cover.jpg
└── projects/                 # → "Projects" category
    └── gestura/
        ├── index.mdx
        └── demo.png
```

Adding a **new content type** is dropping a new folder in `src/content/` —
it auto-appears as an XMB category (configure title/icon/order in
`src/lib/content-config.ts`).

---

## How media serving works

- **Dev**: `src/app/content/[...path]/route.ts` serves colocated files
  straight from `src/content` — paste an image, refresh, done.
- **Build**: `scripts/sync-content-media.js` mirrors them into
  `public/content/<type>/<slug>/` (slug-normalized, stale files removed) so
  production serves them statically. The route stays as a fallback.

Legacy images under `public/assets/...` keep working via absolute paths.

---

## Common Tasks for LLMs

- **"Add a post about X"** → create `src/content/posts/<slug>/index.md` with
  minimal frontmatter (title, date, excerpt, tags). Prefer `.md` unless the
  content needs interactive components.
- **"Hide/unpublish something"** → add `draft: true` to its frontmatter.
- **"Scaffold interactively"** → `bun run new` (refuses to overwrite existing
  slugs).
- **"Check everything renders"** → `/posts/pipeline-test` is a permanent draft
  exercising every pipeline feature; view it in dev after pipeline changes.
- **Do not** set `slug` in frontmatter, hand-copy images into `public/`, or
  edit `public/content` (it is generated and cleaned by the sync script).
