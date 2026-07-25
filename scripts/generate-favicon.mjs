// Regenerates src/app/favicon.ico — the fallback for Safari, which ignores
// SVG favicons and dynamic favicon swaps. Unlike icon.svg, an ico cannot
// react to prefers-color-scheme, so this variant is a white mid-pulse dot
// with a faint dark ring: the ring defines it on light tab strips, and
// disappears into dark ones where the white fill carries it.
//
// Run with: bun scripts/generate-favicon.mjs

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const icoPath = path.join(root, 'src', 'app', 'favicon.ico');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="17.5" fill="none" stroke="#0b0b14" stroke-opacity="0.45" stroke-width="3"/>
  <circle cx="32" cy="32" r="16" fill="#ffffff"/>
</svg>`;

const sizes = [16, 32, 48];
const pngs = sizes.map((size) =>
  Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng(),
  ),
);

await writeFile(icoPath, await pngToIco(pngs));
console.log(`Wrote ${icoPath} (${sizes.join('/')}px, ringed-dot fallback)`);
