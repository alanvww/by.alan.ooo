#!/usr/bin/env bun
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'public', 'audit', 'chsh');
  await ensureDir(outDir);

  const iPhone = devices['iPhone 15 Pro'];
  const desktopViewport = { width: 1440, height: 900 };

  const browser = await chromium.launch();
  try {
    // Desktop
    const contextDesktop = await browser.newContext({ viewport: desktopViewport, deviceScaleFactor: 2 });
    const pageDesktop = await contextDesktop.newPage();
    await pageDesktop.goto('https://ch.sh/', { waitUntil: 'networkidle' });
    await pageDesktop.waitForTimeout(500);
    await pageDesktop.screenshot({ path: path.join(outDir, 'desktop-home.png'), fullPage: true });

    // Extract minimal visual metrics
    const desktopMetrics = await pageDesktop.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue('background-color');
      const fontFamily = getComputedStyle(document.body).fontFamily;
      const headings = Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 5).map(h => ({
        tag: h.tagName,
        text: (h.textContent || '').trim().slice(0, 80)
      }));
      const links = Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
        text: (a.textContent || '').trim().slice(0, 60),
        href: (a as HTMLAnchorElement).href
      }));
      return { bgColor, fontFamily, headings, links };
    });
    await fs.promises.writeFile(path.join(outDir, 'desktop-metrics.json'), JSON.stringify(desktopMetrics, null, 2));
    await contextDesktop.close();

    // Mobile
    const contextMobile = await browser.newContext({ ...iPhone });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto('https://ch.sh/', { waitUntil: 'networkidle' });
    await pageMobile.waitForTimeout(500);
    await pageMobile.screenshot({ path: path.join(outDir, 'mobile-home.png'), fullPage: true });
    const mobileMetrics = await pageMobile.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue('background-color');
      const fontFamily = getComputedStyle(document.body).fontFamily;
      const headings = Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 5).map(h => ({
        tag: h.tagName,
        text: (h.textContent || '').trim().slice(0, 80)
      }));
      return { bgColor, fontFamily, headings };
    });
    await fs.promises.writeFile(path.join(outDir, 'mobile-metrics.json'), JSON.stringify(mobileMetrics, null, 2));
    await contextMobile.close();

    console.log('Audit complete. Outputs in /public/audit/chsh');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


