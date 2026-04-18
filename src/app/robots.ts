import type { MetadataRoute } from 'next';

const BASE_URL = 'https://universal-skills-hub.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/submit', '/login', '/profile', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}