import { getPrisma } from '@/lib/prisma';
import { filterSkills } from '@/lib/search';
import { FEATURED_SKILLS } from '@/data/skills';
import type { Skill } from '@/types';

type DbSkill = {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  documentationUrl: string | null;
  category: string | null;
  tags: string[];
  agents: string[];
  owner: string | null;
  repoName: string | null;
  installCommand: string | null;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  favorites?: { id: string }[];
  _count?: { favorites: number };
};

export function parseCsvParam(value?: string | string[]): string[] {
  const raw = Array.isArray(value) ? value.join(',') : value ?? '';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export function toSkill(skill: DbSkill, currentUserId?: string): Skill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    repositoryUrl: skill.repositoryUrl,
    documentationUrl: skill.documentationUrl ?? undefined,
    category: skill.category ?? undefined,
    tags: skill.tags,
    agents: skill.agents,
    owner: skill.owner ?? undefined,
    repoName: skill.repoName ?? undefined,
    installCommand: skill.installCommand ?? undefined,
    authorId: skill.authorId ?? undefined,
    authorName: skill.author?.name ?? undefined,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
    favoriteCount: skill._count?.favorites ?? 0,
    isFavorited: currentUserId ? (skill.favorites?.length ?? 0) > 0 : false,
  };
}

export async function getDirectorySkills(options: {
  query?: string;
  agents?: string[];
  category?: string;
  currentUserId?: string;
  limit?: number;
} = {}): Promise<{ skills: Skill[]; source: 'database' | 'fallback' }> {
  try {
    const prisma = getPrisma();
    const dbSkills = await prisma.skill.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        favorites: options.currentUserId
          ? {
              where: { userId: options.currentUserId },
              select: { id: true },
            }
          : false,
        _count: {
          select: { favorites: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit && !options.query && !options.agents?.length && !options.category ? options.limit : undefined,
    });

    const mapped = dbSkills.map((skill) => toSkill(skill, options.currentUserId));
    const filtered = filterSkills(mapped, options);
    return { skills: options.limit ? filtered.slice(0, options.limit) : filtered, source: 'database' };
  } catch (error) {
    console.warn('Falling back to static skills because database is unavailable:', error);
    const filtered = filterSkills(FEATURED_SKILLS, options);
    return { skills: options.limit ? filtered.slice(0, options.limit) : filtered, source: 'fallback' };
  }
}

export async function getSkillById(id: string, currentUserId?: string): Promise<Skill | null> {
  const fallback = FEATURED_SKILLS.find((skill) => skill.id === id) ?? null;

  try {
    const prisma = getPrisma();
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        favorites: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        _count: {
          select: { favorites: true },
        },
      },
    });

    return skill ? toSkill(skill, currentUserId) : fallback;
  } catch (error) {
    console.warn('Falling back to static skill because database is unavailable:', error);
    return fallback;
  }
}

export function extractGitHubRepository(url: string): { owner?: string; repoName?: string } {
  try {
    const parsed = new URL(url);
    if (!['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase())) {
      return {};
    }

    const [owner, repoName] = parsed.pathname.split('/').filter(Boolean);
    return { owner, repoName: repoName?.replace(/\.git$/, '') };
  } catch {
    return {};
  }
}
