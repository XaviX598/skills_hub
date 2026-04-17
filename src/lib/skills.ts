import { getPrisma } from '@/lib/prisma';
import { expandNaturalQuery, filterSkills, normalizeText } from '@/lib/search';
import { FEATURED_SKILLS } from '@/data/skills';
import type { Prisma } from '@prisma/client';
import type { Skill } from '@/types';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

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

interface DirectorySkillOptions {
  query?: string;
  agents?: string[];
  category?: string;
  currentUserId?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}

interface DirectorySkillResult {
  skills: Skill[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  source: 'database' | 'fallback';
}

export function parseCsvParam(value?: string | string[]): string[] {
  const raw = Array.isArray(value) ? value.join(',') : value ?? '';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export function parsePositiveIntegerParam(value?: string | string[], fallback = 1): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function clampPageSize(pageSize?: number): number {
  if (!Number.isInteger(pageSize) || !pageSize || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}

function getPagination(options: DirectorySkillOptions, total: number) {
  const pageSize = clampPageSize(options.limit ?? options.pageSize);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(Math.max(options.page ?? 1, 1), totalPages);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    totalPages,
  };
}

function buildSkillWhere(options: DirectorySkillOptions): Prisma.SkillWhereInput {
  const selectedAgents = options.agents?.filter(Boolean) ?? [];
  const normalizedCategory = normalizeText(options.category ?? '');
  const terms = options.query ? expandNaturalQuery(options.query).slice(0, 12) : [];
  const where: Prisma.SkillWhereInput = {};

  if (selectedAgents.length > 0) {
    where.agents = { hasSome: selectedAgents };
  }

  if (normalizedCategory) {
    where.category = { equals: options.category, mode: 'insensitive' };
  }

  if (terms.length > 0) {
    where.OR = terms.flatMap((term): Prisma.SkillWhereInput[] => [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { repositoryUrl: { contains: term, mode: 'insensitive' } },
      { documentationUrl: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
      { owner: { contains: term, mode: 'insensitive' } },
      { repoName: { contains: term, mode: 'insensitive' } },
      { installCommand: { contains: term, mode: 'insensitive' } },
      { tags: { has: term } },
      { agents: { has: term } },
    ]);
  }

  return where;
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

export async function getDirectorySkills(options: DirectorySkillOptions = {}): Promise<DirectorySkillResult> {
  try {
    const prisma = getPrisma();
    const where = buildSkillWhere(options);
    const total = await prisma.skill.count({ where });
    const pagination = getPagination(options, total);
    const dbSkills = await prisma.skill.findMany({
      where,
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
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.pageSize,
    });

    const mapped = dbSkills.map((skill) => toSkill(skill, options.currentUserId));
    return { skills: mapped, total, source: 'database', ...pagination };
  } catch (error) {
    console.warn('Falling back to static skills because database is unavailable:', error);
    const filtered = filterSkills(FEATURED_SKILLS, options);
    const total = filtered.length;
    const pagination = getPagination(options, total);
    const skills = filtered.slice(pagination.skip, pagination.skip + pagination.pageSize);

    return { skills, total, source: 'fallback', ...pagination };
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
