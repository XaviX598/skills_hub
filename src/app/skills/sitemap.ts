import { MetadataRoute } from 'next';
import { getDirectorySkills } from '@/lib/skills';
import { SITE_URL } from '@/lib/site-url';

const SITEMAP_PAGE_SIZE = 50_000;

export async function generateSitemaps() {
  const { total } = await getDirectorySkills({ pageSize: 1 });
  const totalSitemaps = Math.max(Math.ceil(total / SITEMAP_PAGE_SIZE), 1);

  return Array.from({ length: totalSitemaps }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const page = Number.isFinite(id) ? id + 1 : 1;
  const { skills } = await getDirectorySkills({
    page,
    pageSize: SITEMAP_PAGE_SIZE,
  });

  return skills.map((skill) => ({
    url: `${SITE_URL}/skills/${skill.id}`,
    lastModified: skill.updatedAt ? new Date(skill.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
}

export const dynamic = 'force-dynamic';
