import { MetadataRoute } from 'next';
import { getDirectorySkills } from '@/lib/skills';
import { AGENTS } from '@/data/agents';

const BASE_URL = 'https://universal-skills-hub.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { skills } = await getDirectorySkills({ limit: 1000 });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/skills`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Agent pages
  const agentPages: MetadataRoute.Sitemap = AGENTS.map((agent) => ({
    url: `${BASE_URL}/agents/${agent.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Skill detail pages (limit to first 500 for sitemap size)
  const skillPages: MetadataRoute.Sitemap = skills.slice(0, 500).map((skill) => ({
    url: `${BASE_URL}/skills/${skill.id}`,
    lastModified: skill.updatedAt ? new Date(skill.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...agentPages, ...skillPages];
}

export const dynamic = 'force-dynamic';