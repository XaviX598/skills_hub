import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { getDirectorySkills } from '@/lib/skills';

const SITEMAP_PAGE_SIZE = 50_000;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { total } = await getDirectorySkills({ pageSize: 1 });
  const totalSitemaps = Math.max(Math.ceil(total / SITEMAP_PAGE_SIZE), 1);
  const sitemapUrls = [
    `${SITE_URL}/sitemap.xml`,
    ...Array.from({ length: totalSitemaps }, (_, id) => `${SITE_URL}/skills/sitemap/${id}.xml`),
  ];

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/submit', '/login', '/profile', '/api/'],
    },
    sitemap: sitemapUrls,
  };
}
