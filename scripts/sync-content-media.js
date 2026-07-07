#!/usr/bin/env node
//
// Mirrors colocated content assets (everything except .md/.mdx) from
// src/content/ into public/content/ so production serves them statically.
// Output folders use the same slugified names as the site's URLs.
// Stale files in public/content that no longer exist in src/content are removed.
//
// In development this script is unnecessary: src/app/content/[...path]/route.ts
// serves the same files directly from src/content.

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const contentRoot = path.join(projectRoot, 'src', 'content');
const publicRoot = path.join(projectRoot, 'public', 'content');

const SOURCE_EXTENSIONS = new Set(['.md', '.mdx']);

// Keep in sync with slugify() in src/lib/mdx.ts
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function discoverTypes() {
  if (!fs.existsSync(contentRoot)) return [];
  return fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Copy one asset and record its output path (relative to publicRoot). */
function copyAsset(sourcePath, targetPath, synced) {
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
  synced.add(path.relative(publicRoot, targetPath));
}

function syncType(type, synced) {
  const typeDir = path.join(contentRoot, type);
  const entries = fs.readdirSync(typeDir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (entry.isFile()) {
      // Loose assets next to flat markdown files serve from /content/<type>/
      const ext = path.extname(entry.name);
      if (SOURCE_EXTENSIONS.has(ext)) return;
      copyAsset(
        path.join(typeDir, entry.name),
        path.join(publicRoot, type, entry.name),
        synced,
      );
      return;
    }

    if (!entry.isDirectory()) return;

    const slug = slugify(entry.name);
    if (!slug) return;
    const folderPath = path.join(typeDir, entry.name);
    const outputDir = path.join(publicRoot, type, slug);

    fs.readdirSync(folderPath, { withFileTypes: true }).forEach((file) => {
      if (!file.isFile()) return;
      if (SOURCE_EXTENSIONS.has(path.extname(file.name))) return;
      copyAsset(path.join(folderPath, file.name), path.join(outputDir, file.name), synced);
    });
  });
}

/** Remove files under public/content that were not produced by this sync. */
function removeStale(dir, synced) {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeStale(fullPath, synced);
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
      }
      return;
    }
    if (entry.name === '.gitkeep') return;
    if (!synced.has(path.relative(publicRoot, fullPath))) {
      fs.unlinkSync(fullPath);
      console.log(`Removed stale asset: ${path.relative(projectRoot, fullPath)}`);
    }
  });
}

const synced = new Set();
ensureDir(publicRoot);
discoverTypes().forEach((type) => syncType(type, synced));
removeStale(publicRoot, synced);

console.log(`Content media synced to public/content (${synced.size} file${synced.size === 1 ? '' : 's'}).`);
