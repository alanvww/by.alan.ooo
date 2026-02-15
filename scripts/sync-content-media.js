#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const contentRoot = path.join(projectRoot, 'src', 'content');
const publicRoot = path.join(projectRoot, 'public', 'content');

const TYPES = ['posts', 'projects'];
const MDX_EXTENSIONS = new Set(['.mdx', '.md']);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFolderMedia(type) {
  const typeDir = path.join(contentRoot, type);
  if (!fs.existsSync(typeDir)) return;

  const entries = fs.readdirSync(typeDir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (!entry.isDirectory()) return;

    const slug = entry.name;
    const folderPath = path.join(typeDir, slug);
    const outputDir = path.join(publicRoot, type, slug);
    ensureDir(outputDir);

    const files = fs.readdirSync(folderPath, { withFileTypes: true });

    files.forEach((file) => {
      if (!file.isFile()) return;
      const ext = path.extname(file.name);
      if (MDX_EXTENSIONS.has(ext)) return;

      const sourcePath = path.join(folderPath, file.name);
      const targetPath = path.join(outputDir, file.name);
      fs.copyFileSync(sourcePath, targetPath);
    });
  });
}

ensureDir(publicRoot);
TYPES.forEach(copyFolderMedia);

console.log('Content media synced to public/content.');
