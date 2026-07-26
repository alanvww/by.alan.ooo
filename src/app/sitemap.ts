import type { MetadataRoute } from 'next';
import { getAllContent, getContentTypes } from '@/lib/mdx';
import { siteConfig } from '@/lib/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/cv', '/stack-and-gear'].map(
    (path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: new Date(),
    })
  );

  // getAllContent already excludes drafts in production, so they never leak here.
  const contentRoutes: MetadataRoute.Sitemap = [];
  for (const type of getContentTypes()) {
    const items = await getAllContent(type);
    contentRoutes.push(
      ...items.map((item) => ({
        url: `${siteConfig.url}/${type}/${item.slug}`,
        lastModified: new Date(item.date),
      }))
    );
  }

  return [...staticRoutes, ...contentRoutes];
}
