import { MetadataRoute } from 'next';
import { AGENTS } from '@/data/agents';
import { SITE_URL } from '@/lib/site-url';
import { getPrisma } from '@/lib/prisma';
import { FEATURED_SKILLS } from '@/data/skills';

// Aliases for SEO - additional URLs that redirect to main agent pages
const AGENT_ALIASES: Record<string, string> = {
  'claude': 'claude-code',
  'claudeai': 'claude-code',
  'anthropic': 'claude-code',
  'open-code': 'opencode',
  'open_code': 'opencode',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let skillEntries: Array<{ id: string; updatedAt: Date | string }> = [];

  try {
    const prisma = getPrisma();
    skillEntries = await prisma.skill.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: 5000,
    });
  } catch {
    skillEntries = FEATURED_SKILLS.map((skill) => ({
      id: skill.id,
      updatedAt: skill.updatedAt,
    }));
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/skills`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Agent pages
  const agentPages: MetadataRoute.Sitemap = AGENTS.map((agent) => ({
    url: `${SITE_URL}/agents/${agent.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const agentSkillLandingPages: MetadataRoute.Sitemap = AGENTS.map((agent) => ({
    url: `${SITE_URL}/agents/${agent.id}/skills`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // Skill detail pages (cap at 5k until a sitemap index is introduced)
  const skillPages: MetadataRoute.Sitemap = skillEntries.map((skill) => ({
    url: `${SITE_URL}/skills/${skill.id}`,
    lastModified: skill.updatedAt ? new Date(skill.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Alias pages for SEO (claude -> claude-code, etc.)
  const aliasPages: MetadataRoute.Sitemap = Object.entries(AGENT_ALIASES).map(([alias, _target]) => ({
    url: `${SITE_URL}/agents/${alias}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...agentPages, ...agentSkillLandingPages, ...skillPages, ...aliasPages];
}

export const dynamic = 'force-dynamic';
