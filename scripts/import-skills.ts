// Import top Skillful.sh skills into the committed catalog.
// Usage:
//   npx tsx scripts/import-skills.ts
//   SKILLFUL_IMPORT_LIMIT=5000 npx tsx scripts/import-skills.ts

import { writeFileSync } from 'node:fs';

const SKILLFUL_API_URL = 'https://skillful.sh/api/v1/items';
const OUTPUT_PATH = './src/data/imported-skills.ts';
const DEFAULT_IMPORT_LIMIT = 5000;
const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 1000;
const MAX_RETRY_ATTEMPTS = 6;
const SOURCE_NAME = 'skillful';

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
  directoryCount?: number;
  githubStars?: number;
  npmWeeklyDownloads?: number;
  primaryLanguage?: string;
  lastCommitDate?: string;
}

interface SkillfulSecurityScore {
  grade?: string;
  overallScore?: number;
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
  securityScore?: SkillfulSecurityScore;
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

interface NormalizedSkill {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  documentationUrl: string;
  category: string;
  tags: string[];
  agents: string[];
  owner?: string;
  repoName?: string;
  installCommand?: string;
  createdAt: string;
  updatedAt: string;
  favoriteCount: number;
}

function getImportLimit(): number {
  const rawLimit = process.env.SKILLFUL_IMPORT_LIMIT;
  const parsedLimit = rawLimit ? Number(rawLimit) : DEFAULT_IMPORT_LIMIT;

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`SKILLFUL_IMPORT_LIMIT must be a positive integer. Received: ${rawLimit}`);
  }

  return parsedLimit;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function buildInstallCommand(item: SkillfulItem, repository: RepositoryParts): string | undefined {
  if (repository.owner && repository.repoName) {
    return `npx skills add ${repository.owner}/${repository.repoName}/${item.name}`;
  }

  if (item.packageName && item.packageRegistry === 'npm') {
    return `npm view ${item.packageName}`;
  }

  return undefined;
}

function normalizeSkill(item: SkillfulItem): NormalizedSkill {
  const repositoryUrl = normalizeRepositoryUrl(item.repositoryUrl, item.homepage);
  const repository = extractGitHubRepository(repositoryUrl);
  const category = normalizeCategory(item);
  const itemIdentity = slugify(item.slug || item._id || item.name);
  const id = `skillful-${itemIdentity || item._id}`;
  const sourceTags = [
    'imported',
    SOURCE_NAME,
    category,
    item.category ?? '',
    item.packageRegistry ?? '',
    item.stats?.primaryLanguage ?? '',
    ...(item.tags ?? []),
  ];
  const createdAt = new Date(item.firstPublishedAt ?? item.createdAt ?? '2026-04-01T00:00:00.000Z').toISOString();
  const updatedAt = new Date(item.updatedAt ?? item.stats?.lastCommitDate ?? createdAt).toISOString();

  return {
    id,
    name: item.name,
    description: buildDescription(item, category),
    repositoryUrl,
    documentationUrl: buildSkillfulUrl(item),
    category,
    tags: compactTags(sourceTags),
    agents: inferAgents(item, repository),
    owner: repository.owner ?? item.author,
    repoName: repository.repoName ?? item.packageName ?? item.slug,
    installCommand: buildInstallCommand(item, repository),
    createdAt,
    updatedAt,
    favoriteCount: item.stats?.githubStars ?? 0,
  };
}

function dedupeSkills(skills: NormalizedSkill[]): NormalizedSkill[] {
  const seen = new Set<string>();
  const deduped: NormalizedSkill[] = [];

  for (const skill of skills) {
    const key = `${skill.repositoryUrl}::${skill.name.toLowerCase()}`;

    if (seen.has(key)) continue;

    seen.add(key);
    deduped.push(skill);
  }

  return deduped;
}

async function fetchSkillsPage(page: number): Promise<SkillfulResponse> {
  const params = new URLSearchParams({
    type: 'skill',
    sort: 'stars',
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
      throw new Error(`Skillful import failed on page ${page}: ${response.status} ${response.statusText}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const retryDelayMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : REQUEST_DELAY_MS * attempt * attempt;

    console.warn(`Skillful page ${page} returned ${response.status}. Retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${retryDelayMs}ms...`);
    await sleep(retryDelayMs);
  }

  throw new Error(`Skillful import failed on page ${page} after ${MAX_RETRY_ATTEMPTS} attempts`);
}

function render(skills: NormalizedSkill[], totalAvailable: number): string {
  return `import type { Skill } from '@/types';\n\n` +
    `// Imported from Skillful.sh - ${new Date().toISOString()}\n` +
    `// Total available remotely at import time: ${totalAvailable}\n` +
    `// Imported into this catalog: ${skills.length}\n` +
    `// Regenerate with: SKILLFUL_IMPORT_LIMIT=${skills.length} npx tsx scripts/import-skills.ts\n\n` +
    `export const IMPORTED_SKILLS: Skill[] = ${JSON.stringify(skills, null, 2)};\n`;
}

async function importTopSkills(targetCount: number): Promise<void> {
  console.log(`Starting import of top ${targetCount} Skillful.sh skills...`);

  const normalizedSkills: NormalizedSkill[] = [];
  let dedupedSkills: NormalizedSkill[] = [];
  let totalAvailable = 0;
  let page = 1;

  while (dedupedSkills.length < targetCount) {
    const data = await fetchSkillsPage(page);
    totalAvailable = data.pagination.total;

    if (data.items.length === 0) break;

    const normalizedPage = data.items.map(normalizeSkill);
    normalizedSkills.push(...normalizedPage);
    dedupedSkills = dedupeSkills(normalizedSkills);

    console.log(`Page ${page}/${data.pagination.totalPages}: fetched ${data.items.length}, deduped total ${dedupedSkills.length}/${targetCount}`);

    if (page >= data.pagination.totalPages) break;

    page += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  const importedSkills = dedupedSkills.slice(0, targetCount);
  writeFileSync(OUTPUT_PATH, render(importedSkills, totalAvailable), 'utf8');

  console.log(`Imported ${importedSkills.length} skills from Skillful.sh`);
  console.log(`Remote total reported by API: ${totalAvailable}`);
  console.log(`Saved to ${OUTPUT_PATH}`);
}

importTopSkills(getImportLimit()).catch((error) => {
  console.error(error);
  process.exit(1);
});
