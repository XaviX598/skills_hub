import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/submit', '/login', '/profile', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
