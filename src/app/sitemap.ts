import type { MetadataRoute } from 'next';
import { getContentManifest } from '@/lib/mdx';
import { siteConfig } from '@/lib/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/cv', '/stack-and-gear'].map(
    (path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: new Date(),
    })
  );

  // getContentManifest excludes drafts in production and restricted items everywhere.
  const manifest = await getContentManifest();
  const contentRoutes: MetadataRoute.Sitemap = Object.entries(manifest).flatMap(
    ([type, items]) =>
      items.map((item) => ({
        url: `${siteConfig.url}/${type}/${item.slug}`,
        lastModified: new Date(item.frontmatter.updatedDate ?? item.frontmatter.date),
      }))
  );

  return [...staticRoutes, ...contentRoutes];
}
