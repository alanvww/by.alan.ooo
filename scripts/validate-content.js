#!/usr/bin/env node
//
// Validates content files under src/content/ for schema correctness,
// broken local media references, duplicate hero images, and oversized assets.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const projectRoot = process.cwd();
const contentRoot = path.join(projectRoot, 'src', 'content');
const publicRoot = path.join(projectRoot, 'public');

const VALID_STATUSES = new Set(['completed', 'in-progress', 'archived']);
const LARGE_ASSET_BYTES = 15 * 1024 * 1024; // 15 MB

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveAssetOnDisk(assetRef, entryDir) {
  const clean = decodeURIComponent(assetRef.split(/[?#]/)[0].trim());
  if (!clean || /^([a-z][a-z0-9+.-]*:|#)/i.test(clean)) return { external: true };

  if (clean.startsWith('/')) {
    const publicCandidate = path.join(publicRoot, clean);
    if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
      return { found: true, path: publicCandidate };
    }
    return { found: false, tried: publicCandidate };
  }

  const relativeCandidate = path.join(entryDir, clean.replace(/^\.\//, ''));
  if (fs.existsSync(relativeCandidate) && fs.statSync(relativeCandidate).isFile()) {
    return { found: true, path: relativeCandidate };
  }
  return { found: false, tried: relativeCandidate };
}

function extractBodyMediaRefs(content) {
  const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');
  const refs = [];

  // Markdown ![alt](src "title") or ![alt](<src> "title")
  const mdImgRe = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g;
  let match;
  while ((match = mdImgRe.exec(withoutCode)) !== null) {
    refs.push(match[1] || match[2]);
  }

  // Obsidian ![[target|alias]]
  const wikiEmbedRe = /!\[\[([^\][|]+?)(?:\|[^\][]+?)?\]\]/g;
  while ((match = wikiEmbedRe.exec(withoutCode)) !== null) {
    refs.push(match[1].trim());
  }

  // JSX/HTML <img|Image|Figure|video|Video src="...">
  const jsxMediaRe = /<(?:img|Image|Figure|video|Video)[^>]*\s+src=(?:["']([^"']+)["']|\{\s*["']([^"']+)["']\s*\})/g;
  while ((match = jsxMediaRe.exec(withoutCode)) !== null) {
    refs.push(match[1] || match[2]);
  }

  return refs;
}

function firstBodyImageRef(content) {
  const withoutH1 = content.replace(/^\s*#\s+.+?(?:\r?\n)+/, '').trimStart();
  const mdMatch = /^!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))/.exec(withoutH1);
  if (mdMatch) return (mdMatch[1] || mdMatch[2]).replace(/^\.\//, '');
  const wikiMatch = /^!\[\[([^\][|]+?)(?:\|[^\][]+?)?\]\]/.exec(withoutH1);
  if (wikiMatch) return wikiMatch[1].trim();
  return null;
}

const errors = [];
const warnings = [];

const types = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .sort();

let totalEntries = 0;

for (const type of types) {
  const typeDir = path.join(contentRoot, type);
  const dirEntries = fs.readdirSync(typeDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const seenSlugs = new Map();

  for (const entry of dirEntries) {
    if (entry.name.startsWith('.')) continue;

    let filePath = null;
    let entryDir = typeDir;
    let slug = '';

    if (entry.isDirectory()) {
      slug = slugify(entry.name);
      entryDir = path.join(typeDir, entry.name);
      for (const candidate of ['index.mdx', 'index.md']) {
        const candidatePath = path.join(entryDir, candidate);
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath;
          break;
        }
      }
      if (!filePath) continue;
    } else if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
      slug = slugify(entry.name.replace(/\.(mdx|md)$/, ''));
      filePath = path.join(typeDir, entry.name);
    } else {
      continue;
    }

    totalEntries += 1;
    const relFile = path.relative(projectRoot, filePath);

    if (seenSlugs.has(slug)) {
      errors.push(`${relFile}: duplicate slug "${slug}" (collides with ${seenSlugs.get(slug)})`);
    } else {
      seenSlugs.set(slug, relFile);
    }

    let parsed;
    try {
      parsed = matter(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      errors.push(`${relFile}: invalid YAML frontmatter (${err.message})`);
      continue;
    }

    const { data, content } = parsed;

    if (data.status !== undefined && !VALID_STATUSES.has(data.status)) {
      errors.push(`${relFile}: invalid status "${data.status}" (expected completed | in-progress | archived)`);
    }

    if (data.order !== undefined && (typeof data.order !== 'number' || !Number.isFinite(data.order))) {
      errors.push(`${relFile}: frontmatter "order" must be a finite number`);
    }

    if (data.coverImage) {
      const check = resolveAssetOnDisk(String(data.coverImage), entryDir);
      if (!check.external && !check.found) {
        errors.push(`${relFile}: missing coverImage "${data.coverImage}" (looked at ${path.relative(projectRoot, check.tried)})`);
      }

      const firstImg = firstBodyImageRef(content);
      const normalizedCover = String(data.coverImage).replace(/^\.\//, '');
      if (firstImg && (firstImg === normalizedCover || path.basename(firstImg) === path.basename(normalizedCover))) {
        warnings.push(`${relFile}: duplicate hero image — body starts with "${firstImg}" which matches coverImage`);
      }
    }

    for (const ref of extractBodyMediaRefs(content)) {
      const check = resolveAssetOnDisk(ref, entryDir);
      if (!check.external && !check.found) {
        errors.push(`${relFile}: broken media reference "${ref}" (looked at ${path.relative(projectRoot, check.tried)})`);
      } else if (check.found) {
        const size = fs.statSync(check.path).size;
        if (size > LARGE_ASSET_BYTES) {
          warnings.push(
            `${relFile}: oversized asset "${path.relative(projectRoot, check.path)}" (${(size / (1024 * 1024)).toFixed(1)} MB > 15 MB)`,
          );
        }
      }
    }

    // Check for paragraphs ending with a dangling colon right before an image or EOF
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('-') || line.startsWith('*')) continue;
      if (line.endsWith(':')) {
        // Look ahead to next non-empty line
        let nextLine = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            nextLine = lines[j].trim();
            break;
          }
        }
        if (!nextLine || nextLine.startsWith('![')) {
          warnings.push(`${relFile}:${i + 1}: paragraph ends with a dangling colon ("...${line.slice(-35)}") before image/EOF`);
        }
      }
    }
  }
}

console.log(`Validated ${totalEntries} content files across [${types.join(', ')}].`);

if (warnings.length > 0) {
  console.warn(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

console.log('\n0 broken links or schema errors.');
