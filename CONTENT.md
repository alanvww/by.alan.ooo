# Content Guide

This guide explains how to create and manage content for the XMB-style portfolio site. It's designed for both humans and LLMs.

---

## Quick Reference

### Adding a New Post

1. Create a new `.mdx` file in `src/content/posts/`:
   ```
   src/content/posts/my-new-post.mdx
   ```

2. Add frontmatter and content:
   ```mdx
   ---
   title: "My New Post"
   date: "2026-02-14"
   excerpt: "A brief description shown in listings."
   coverImage: "/assets/posts/my-image.jpg"
   tags: ["category", "another-tag"]
   publish: true
   ---

   # My New Post

   Your content here...
   ```

3. The post automatically appears in the XMB "Writing" category.

---

### Adding a New Project

1. Create a new `.mdx` file in `src/content/projects/`:
   ```
   src/content/projects/my-project.mdx
   ```

2. Add frontmatter and content:
   ```mdx
   ---
   title: "My Project"
   date: "2026-02-14"
   excerpt: "A brief project description."
   coverImage: "/assets/projects/my-project/cover.jpg"
   tags: ["portfolio", "web"]
   featured: true
   publish: true
   projectUrl: "https://myproject.com"
   githubUrl: "https://github.com/user/myproject"
   technologies: ["React", "TypeScript", "Next.js"]
   status: "completed"
   ---

   # My Project

   Project details here...
   ```

3. The project automatically appears in the XMB "Projects" category.

---

## Content Locations

```
src/content/
├── posts/           # Blog posts → "Writing" category
│   ├── hello-world.mdx
│   └── ...
└── projects/        # Portfolio projects → "Projects" category
    ├── gestura.mdx
    └── ...
```

---

## Frontmatter Schema

### Required Fields (All Content Types)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display title |
| `date` | string | ISO date (YYYY-MM-DD) for sorting |
| `excerpt` | string | Short description for listings |
| `slug` | string | **Auto-derived from filename** — do not set manually |

### Optional Fields (All Content Types)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `coverImage` | string | — | Hero image path or URL |
| `tags` | string[] | `[]` | Categories for filtering/grouping |
| `publish` | boolean \| "true" \| "false" | `false` | Whether to show the content |
| `featured` | boolean | `false` | Show in "Featured" folder (projects only) |
| `readTime` | number | — | Estimated reading time in minutes |

### Post-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `author` | string | Author name |
| `category` | string | Post category |
| `updatedDate` | string | ISO date of last update |

### Project-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `projectUrl` | string | Live demo URL |
| `githubUrl` | string | Source code URL |
| `demoUrl` | string | Alternative demo URL |
| `technologies` | string[] | Tech stack used |
| `status` | "completed" \| "in-progress" \| "archived" | Project status |

---

## Content Type Configuration

Content types are configured in `src/lib/content-config.ts`:

```typescript
const contentConfig = {
  projects: {
    title: 'Projects',       // XMB category title
    iconName: 'Atom',        // Icon from XMB_ICON_NAMES
    order: 10,               // Position in XMB (lower = more left)
    groupByTags: true,       // Create tag-based sub-folders
    showFeatured: true,      // Show "Featured" folder
    singularLabel: 'project' // For "3 projects" labels
  },
  posts: {
    title: 'Writing',
    iconName: 'Notebook',
    order: 20,
    groupByTags: false,      // Simple "Recent" + "All" grouping
    showFeatured: false,
    singularLabel: 'post'
  }
};
```

### Available Icons

From `XMB_ICON_NAMES` in `src/lib/xmb-constants.ts`:
- `Gear`, `User`, `Atom`, `Notebook`, `EnvelopeSimple`
- `Folder`, `File`, `CaretRight`, `ArrowLeft`, `Question`

---

## Adding a New Content Type

To add a completely new content category (e.g., "notes", "talks"):

### Step 1: Create the Folder

```bash
mkdir src/content/notes
```

### Step 2: Add Content Files

Create `.mdx` files with the required frontmatter:

```
src/content/notes/
├── my-note-1.mdx
└── my-note-2.mdx
```

### Step 3: (Optional) Configure the Category

Add to `src/lib/content-config.ts`:

```typescript
const contentConfig = {
  // ... existing config
  notes: {
    title: 'Notes',
    iconName: 'File',
    order: 30,
    groupByTags: false,
    showFeatured: false,
    singularLabel: 'note'
  }
};
```

**Without configuration**, the system auto-discovers the folder and uses defaults:
- Title: Capitalized folder name ("Notes")
- Icon: `Folder`
- Order: `50` (appears after configured types)
- No tag grouping, no featured folder

### Step 4: Done!

The new category automatically appears in the XMB. Routes are generated at `/notes/[slug]`.

---

## URL Structure

| Content Type | URL Pattern |
|--------------|-------------|
| Posts | `/posts/hello-world` |
| Projects | `/projects/gestura` |
| Custom types | `/{folder-name}/{file-slug}` |

The slug is derived from the filename (without `.mdx` extension).

---

## XMB Category Ordering

Categories appear in this order:

1. **Settings** (fixed, order 0)
2. **Profile** (fixed, order 5)
3. **Content Types** (sorted by `order` property: 10, 20, 30...)
4. **Contact** (fixed, order 100)

---

## Asset Management

### Local Images

Store in `public/assets/`:

```
public/assets/
├── posts/
│   └── my-post/
│       ├── cover.jpg
│       └── diagram.png
└── projects/
    └── my-project/
        └── screenshot.png
```

Reference in frontmatter:
```yaml
coverImage: "/assets/posts/my-post/cover.jpg"
```

Reference in content:
```mdx
![Diagram](/assets/posts/my-post/diagram.png)
```

### External Images

Use full URLs:
```yaml
coverImage: "https://example.com/image.jpg"
```

---

## MDX Features

Standard Markdown plus React components:

### Code Blocks with Syntax Highlighting

````mdx
```typescript
interface User {
  id: string;
  name: string;
}
```
````

### Custom Components (if available)

Check `src/components/mdx/` for available components:
- `Alert` — Callout boxes
- `Badge` — Status badges
- `Callout` — Highlighted sections
- `Card` — Content cards
- `Figure` — Image figures with captions
- `Tabs` — Tabbed content

---

## Publishing Checklist

Before publishing content:

- [ ] Set `publish: true` in frontmatter
- [ ] Verify date is correct (ISO format: YYYY-MM-DD)
- [ ] Add meaningful excerpt (shown in listings)
- [ ] Include tags for discoverability
- [ ] For projects: set `featured: true` if it should appear in Featured folder
- [ ] Run `bun run build` to verify no errors

---

## Common Tasks for LLMs

When asked to add content:

1. **Create post**: Add `.mdx` file to `src/content/posts/`
2. **Create project**: Add `.mdx` file to `src/content/projects/`
3. **New content type**: Create folder in `src/content/`, optionally add config

When asked to modify content display:

1. **Change category title/icon/order**: Edit `src/lib/content-config.ts`
2. **Change grouping behavior**: Toggle `groupByTags` or `showFeatured`
3. **Add new icon**: Add to `XMB_ICON_NAMES` in `src/lib/xmb-constants.ts`

---

## File Naming Conventions

- Use lowercase with hyphens: `my-post-title.mdx`
- Avoid special characters
- Slug is auto-derived: `my-post-title.mdx` → `/posts/my-post-title`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Content not showing | Set `publish: true` |
| Wrong category order | Check `order` in content-config |
| Missing icon | Verify icon is in `XMB_ICON_NAMES` |
| Image not loading | Check path starts with `/` for local images |
| Build error | Check frontmatter syntax (YAML valid) |
