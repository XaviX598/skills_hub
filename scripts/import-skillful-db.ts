// Import Skillful.sh skills directly into the database.
// This is intentionally DB-first: importing 80k+ records into a generated TS file
// would punish local dev, linting, and bundling.
//
// Usage:
//   npm run import:skillful-db
//   SKILLFUL_DB_IMPORT_LIMIT=90000 npm run import:skillful-db
//   SKILLFUL_DB_IMPORT_START_PAGE=52 npm run import:skillful-db
//   SKILLFUL_DB_IMPORT_SORT=newest npm run import:skillful-db

import { readFileSync } from 'node:fs';
import { PrismaClient, type Prisma } from '@prisma/client';

const SKILLFUL_API_URL = 'https://skillful.sh/api/v1/items';
const DEFAULT_IMPORT_LIMIT = Number.POSITIVE_INFINITY;
const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 1000;
const MAX_RETRY_ATTEMPTS = 6;
const MAX_DATABASE_RETRY_ATTEMPTS = 5;
const DATABASE_RETRY_DELAY_MS = 10_000;
const SOURCE_NAME = 'skillful';
const IMPORT_USER_EMAIL = 'demo@example.com';

const SKILLFUL_SORT = {
  STARS: 'stars',
  NEWEST: 'newest',
  UPDATED: 'updated',
  CREATED: 'created',
  NAME: 'name',
} as const;

type SkillfulSort = (typeof SKILLFUL_SORT)[keyof typeof SKILLFUL_SORT];

const CATEGORY = {
  AI_AUTOMATION: 'AI & Automation',
  CLOUD_DEVOPS: 'Cloud & DevOps',
  DESIGN: 'Design',
  DEVELOPMENT: 'Development',
  DOCS_WRITING: 'Docs & Writing',
  FRONTEND: 'Frontend',
  MARKETING: 'Marketing',
  PRODUCTIVITY: 'Productivity',
  SECURITY: 'Security',
  TESTING_REVIEW: 'Testing & Review',
} as const;

interface SkillfulStats {
  githubStars?: number;
  primaryLanguage?: string;
  lastCommitDate?: string;
}

interface SkillfulItem {
  _id: string;
  slug: string;
  name: string;
  type: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  repositoryUrl?: string;
  packageName?: string;
  packageRegistry?: string;
  homepage?: string;
  stats?: SkillfulStats;
  createdAt?: string;
  updatedAt?: string;
  firstPublishedAt?: string;
}

interface SkillfulPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SkillfulResponse {
  items: SkillfulItem[];
  pagination: SkillfulPagination;
}

interface RepositoryParts {
  owner?: string;
  repoName?: string;
}

interface ImportConfig {
  startPage: number;
  importLimit: number;
  resetSkillful: boolean;
  sort: SkillfulSort;
}

function loadEnvFile(): void {
  const envText = readFileSync('.env', 'utf8');

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  const databaseUrl = new URL(process.env.DATABASE_URL);
  databaseUrl.searchParams.set('connection_limit', '1');
  databaseUrl.searchParams.set('pool_timeout', '30');
  process.env.DATABASE_URL = databaseUrl.toString();
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }

  return parsed;
}

function parseSkillfulSort(value: string | undefined): SkillfulSort {
  if (!value) return SKILLFUL_SORT.NEWEST;

  const normalized = value.trim().toLowerCase();
  const allowedSorts = Object.values(SKILLFUL_SORT);

  if (!allowedSorts.includes(normalized as SkillfulSort)) {
    throw new Error(`Expected SKILLFUL_DB_IMPORT_SORT to be one of: ${allowedSorts.join(', ')}`);
  }

  return normalized as SkillfulSort;
}

function getImportConfig(): ImportConfig {
  return {
    startPage: parsePositiveInteger(process.env.SKILLFUL_DB_IMPORT_START_PAGE, 1),
    importLimit: parsePositiveInteger(process.env.SKILLFUL_DB_IMPORT_LIMIT, DEFAULT_IMPORT_LIMIT),
    resetSkillful: process.env.SKILLFUL_DB_IMPORT_RESET === 'true',
    sort: parseSkillfulSort(process.env.SKILLFUL_DB_IMPORT_SORT),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function withDatabaseRetry<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_DATABASE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === MAX_DATABASE_RETRY_ATTEMPTS) {
        throw error;
      }

      const retryDelayMs = DATABASE_RETRY_DELAY_MS * attempt;
      console.warn(
        `${operationName} failed. Retry ${attempt}/${MAX_DATABASE_RETRY_ATTEMPTS} in ${retryDelayMs}ms... ${getErrorMessage(error)}`,
      );
      await sleep(retryDelayMs);
    }
  }

  throw new Error(`${operationName} failed after ${MAX_DATABASE_RETRY_ATTEMPTS} attempts`);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function compactTags(values: string[]): string[] {
  return unique(
    values
      .map((value) => value.toLowerCase().trim())
      .map((value) => value.replace(/[^a-z0-9+#.-]+/g, '-'))
      .filter((value) => value.length > 1),
  ).slice(0, 12);
}

function normalizeRepositoryUrl(repositoryUrl?: string, homepage?: string): string {
  const fallbackUrl = homepage?.startsWith('http') ? homepage : 'https://skillful.sh/';
  const rawUrl = repositoryUrl?.replace(/^git\+/, '') ?? fallbackUrl;

  try {
    const parsedUrl = new URL(rawUrl);

    if (parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'www.github.com') {
      parsedUrl.protocol = 'https:';
      parsedUrl.hostname = 'github.com';
      parsedUrl.pathname = parsedUrl.pathname.replace(/\.git$/, '');
      parsedUrl.search = '';
      parsedUrl.hash = '';
      return parsedUrl.toString().replace(/\/$/, '');
    }

    return parsedUrl.toString();
  } catch {
    return fallbackUrl;
  }
}

function extractGitHubRepository(repositoryUrl: string): RepositoryParts {
  try {
    const parsedUrl = new URL(repositoryUrl);

    if (parsedUrl.hostname !== 'github.com' && parsedUrl.hostname !== 'www.github.com') {
      return {};
    }

    const [owner, repoName] = parsedUrl.pathname.split('/').filter(Boolean);

    return {
      owner,
      repoName: repoName?.replace(/\.git$/, ''),
    };
  } catch {
    return {};
  }
}

function normalizeCategory(item: SkillfulItem): string {
  const haystack = `${item.category ?? ''} ${item.name} ${item.description ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();

  if (/ui|ux|design|figma|visual|frontend|component|react|vue|svelte|tailwind|css|html/.test(haystack)) return CATEGORY.FRONTEND;
  if (/cloud|devops|deploy|docker|kubernetes|aws|azure|gcp|vercel|supabase|postgres|database|infra/.test(haystack)) return CATEGORY.CLOUD_DEVOPS;
  if (/security|auth|oauth|secret|vulnerability|compliance|permission|audit/.test(haystack)) return CATEGORY.SECURITY;
  if (/test|testing|qa|debug|benchmark|quality|lint|eslint|review|verification/.test(haystack)) return CATEGORY.TESTING_REVIEW;
  if (/docs|documentation|writing|markdown|readme|content|pdf|text|nlp/.test(haystack)) return CATEGORY.DOCS_WRITING;
  if (/marketing|seo|sales|crm|campaign|copywriting|growth|analytics/.test(haystack)) return CATEGORY.MARKETING;
  if (/workflow|automation|agent|ai|llm|mcp|n8n|bot|chatbot|tool/.test(haystack)) return CATEGORY.AI_AUTOMATION;
  if (/productivity|calendar|task|notes|email|slack|notion/.test(haystack)) return CATEGORY.PRODUCTIVITY;
  if (/design|brand|creative|image|video|audio/.test(haystack)) return CATEGORY.DESIGN;

  return CATEGORY.DEVELOPMENT;
}

function inferAgents(item: SkillfulItem, repository: RepositoryParts): string[] {
  const haystack = `${item.name} ${item.description ?? ''} ${item.packageName ?? ''} ${repository.owner ?? ''} ${repository.repoName ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();

  if (/github|copilot/.test(haystack)) return ['github-copilot', 'codex', 'claude-code'];
  if (/anthropic|claude/.test(haystack)) return ['claude-code', 'codex', 'cursor'];
  if (/cursor/.test(haystack)) return ['cursor', 'codex', 'claude-code'];
  if (/windsurf/.test(haystack)) return ['windsurf', 'codex', 'claude-code'];
  if (/gemini|google/.test(haystack)) return ['gemini-cli', 'codex', 'claude-code'];
  if (/opencode/.test(haystack)) return ['opencode', 'codex', 'claude-code'];

  return ['claude-code', 'codex', 'cursor'];
}

function buildDescription(item: SkillfulItem, category: string): string {
  const description = item.description?.trim();

  if (description && description.length >= 24) {
    return description;
  }

  const packageHint = item.packageName ? ` Package: ${item.packageName}.` : '';
  const starHint = item.stats?.githubStars ? ` GitHub stars: ${item.stats.githubStars}.` : '';

  return `${item.name} is a ${category.toLowerCase()} skill indexed by Skillful.sh.${packageHint}${starHint}`;
}

function buildSkillfulUrl(item: SkillfulItem): string {
  return `https://skillful.sh/items/${item.slug}`;
}

function buildInstallCommand(item: SkillfulItem, repository: RepositoryParts): string | null {
  if (repository.owner && repository.repoName) {
    return `npx skills add ${repository.owner}/${repository.repoName}/${item.name}`;
  }

  if (item.packageName && item.packageRegistry === 'npm') {
    return `npm view ${item.packageName}`;
  }

  return null;
}

function toDate(value: string | undefined, fallback: string): Date {
  const candidate = new Date(value ?? fallback);
  if (Number.isNaN(candidate.getTime())) {
    return new Date(fallback);
  }

  return candidate;
}

function normalizeSkill(item: SkillfulItem, authorId: string): Prisma.SkillCreateManyInput {
  const repositoryUrl = normalizeRepositoryUrl(item.repositoryUrl, item.homepage);
  const repository = extractGitHubRepository(repositoryUrl);
  const category = normalizeCategory(item);
  const itemIdentity = slugify(item._id || item.slug || item.name);
  const sourceTags = [
    'imported',
    SOURCE_NAME,
    category,
    item.category ?? '',
    item.packageRegistry ?? '',
    item.stats?.primaryLanguage ?? '',
    ...(item.tags ?? []),
  ];
  const createdAt = toDate(item.firstPublishedAt ?? item.createdAt, '2026-04-01T00:00:00.000Z');
  const updatedAt = toDate(item.updatedAt ?? item.stats?.lastCommitDate, createdAt.toISOString());

  return {
    id: `skillful-${itemIdentity || item._id}`,
    name: item.name,
    description: buildDescription(item, category),
    repositoryUrl,
    documentationUrl: buildSkillfulUrl(item),
    category,
    tags: compactTags(sourceTags),
    agents: inferAgents(item, repository),
    owner: repository.owner ?? item.author ?? null,
    repoName: repository.repoName ?? item.packageName ?? item.slug,
    installCommand: buildInstallCommand(item, repository),
    authorId,
    createdAt,
    updatedAt,
  };
}

async function fetchSkillsPage(page: number, sort: SkillfulSort): Promise<SkillfulResponse> {
  const params = new URLSearchParams({
    type: 'skill',
    sort,
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
  });

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetch(`${SKILLFUL_API_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Universal-Skills-Hub/1.0',
      },
    });

    if (response.ok) {
      return response.json() as Promise<SkillfulResponse>;
    }

    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Skillful DB import failed on page ${page}: ${response.status} ${response.statusText}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const retryDelayMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : REQUEST_DELAY_MS * attempt * attempt;

    console.warn(`Skillful page ${page} returned ${response.status}. Retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${retryDelayMs}ms...`);
    await sleep(retryDelayMs);
  }

  throw new Error(`Skillful DB import failed on page ${page} after ${MAX_RETRY_ATTEMPTS} attempts`);
}

async function getImportUserId(prisma: PrismaClient): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: IMPORT_USER_EMAIL },
    update: {},
    create: {
      name: 'Demo User',
      email: IMPORT_USER_EMAIL,
      githubUsername: 'demo',
      image: 'https://github.com/ghost.png',
    },
  });

  return user.id;
}

async function importSkillfulToDatabase(): Promise<void> {
  loadEnvFile();

  const config = getImportConfig();
  const prisma = new PrismaClient();
  const startedAt = Date.now();
  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let remoteTotal = 0;

  try {
    const authorId = await getImportUserId(prisma);

    if (config.resetSkillful) {
      const result = await prisma.skill.deleteMany({
        where: { tags: { has: SOURCE_NAME } },
      });
      console.log(`Reset Skillful catalog: deleted ${result.count.toLocaleString()} existing records`);
    }

    let page = config.startPage;

    while (processed < config.importLimit) {
      const data = await fetchSkillsPage(page, config.sort);
      remoteTotal = data.pagination.total;

      if (data.items.length === 0) break;

      const remaining = config.importLimit - processed;
      const pageItems = data.items.slice(0, remaining);
      const skills = pageItems.map((item) => normalizeSkill(item, authorId));
      const result = await withDatabaseRetry(`Skillful page ${page} createMany`, () =>
        prisma.skill.createMany({
          data: skills,
          skipDuplicates: true,
        }),
      );

      processed += pageItems.length;
      inserted += result.count;
      skipped += skills.length - result.count;

      console.log(
        [
          `page=${page}/${data.pagination.totalPages}`,
          `sort=${config.sort}`,
          `processed=${processed.toLocaleString()}`,
          `inserted=${inserted.toLocaleString()}`,
          `skipped=${skipped.toLocaleString()}`,
          `remote=${remoteTotal.toLocaleString()}`,
        ].join(' '),
      );

      if (page >= data.pagination.totalPages || processed >= config.importLimit) break;

      page += 1;
      await sleep(REQUEST_DELAY_MS);
    }

    const totalSkillful = await prisma.skill.count({ where: { tags: { has: SOURCE_NAME } } });
    const totalSkills = await prisma.skill.count();
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);

    console.log(
      JSON.stringify(
        {
          processed,
          inserted,
          skipped,
          remoteTotal,
          totalSkillful,
          totalSkills,
          durationSeconds,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

importSkillfulToDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
