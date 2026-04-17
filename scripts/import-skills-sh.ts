import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://skills.sh/';
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/imported-skills.ts');

type ExtractedSkill = {
  href: string;
  owner: string;
  repoName: string;
  name: string;
  repoLabel: string;
  rank?: number;
  installs?: string;
};

const decodeHtml = (value: string) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&#x27;', "'")
  .replaceAll('&quot;', '"')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');

const stripHtml = (value: string) => decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

const slugify = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const humanize = (value: string) => value
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const unique = <T>(items: T[]) => [...new Set(items)];

function extractSkills(html: string): ExtractedSkill[] {
  const anchorPattern = /<a\b[^>]*href="([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const skills = new Map<string, ExtractedSkill>();
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html))) {
    const href = match[1];
    const parts = href.split('/').filter(Boolean);

    if (parts.length !== 3) continue;

    const inner = match[2];
    const h3 = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const repo = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/);

    if (!h3 || !repo) continue;

    const name = stripHtml(h3[1]);
    const repoLabel = stripHtml(repo[1]);
    const text = stripHtml(inner);
    const numbers = [...text.matchAll(/(?<![\w.])(\d+(?:\.\d+)?[KkMm]?)(?![\w.])/g)].map((numberMatch) => numberMatch[1]);
    const rank = numbers[0] && /^\d+$/.test(numbers[0]) ? Number(numbers[0]) : undefined;
    const installs = numbers.at(-1);
    const [owner, repoName] = parts;
    const key = `${owner}/${repoName}/${name}`;

    skills.set(key, { href, owner, repoName, name, repoLabel, rank, installs });
  }

  return [...skills.values()].sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999) || a.name.localeCompare(b.name));
}

function inferCategory(skill: ExtractedSkill): string {
  const haystack = `${skill.owner} ${skill.repoName} ${skill.name}`.toLowerCase();

  if (/ui|ux|design|visual|web-design|shadcn|impeccable|color|polish|delight|bolder|quieter/.test(haystack)) return 'Design';
  if (/react|next|frontend|component|remotion|vue|svelte|native|web/.test(haystack)) return 'Frontend';
  if (/azure|vercel|deploy|cloud|kubernetes|postgres|supabase|quota|cost|compute|infra|observability|migration|messaging|database/.test(haystack)) return 'Cloud & DevOps';
  if (/test|tdd|debug|quality|review|verification|critique/.test(haystack)) return 'Testing & Review';
  if (/security|auth|secret|permission|compliance/.test(haystack)) return 'Security';
  if (/marketing|seo|copywriting|campaign|brand|sales/.test(haystack)) return 'Marketing';
  if (/doc|pdf|pptx|writing|readme|plan|clarify|distill|lark/.test(haystack)) return 'Docs & Writing';
  if (/ai|foundry|agent|browser|mcp|model|copilot|llm/.test(haystack)) return 'AI & Automation';
  if (/brainstorm|workflow|productivity|skill-creator|superpower|using/.test(haystack)) return 'Productivity';

  return 'Development';
}

function inferAgents(skill: ExtractedSkill): string[] {
  const haystack = `${skill.owner} ${skill.repoName} ${skill.name}`.toLowerCase();

  if (/github-copilot/.test(haystack)) return ['github-copilot', 'codex'];
  if (/anthropic|claude/.test(haystack)) return ['claude-code', 'codex', 'cursor'];
  if (/opencode/.test(haystack)) return ['opencode', 'codex', 'claude-code'];
  if (/cursor/.test(haystack)) return ['cursor', 'codex', 'claude-code'];
  if (/windsurf/.test(haystack)) return ['windsurf', 'codex', 'claude-code'];
  if (/gemini|google/.test(haystack)) return ['gemini-cli', 'codex', 'claude-code'];
  if (/microsoft|azure/.test(haystack)) return ['github-copilot', 'codex', 'claude-code'];
  if (/vercel|next|react|shadcn|supabase|remotion/.test(haystack)) return ['codex', 'claude-code', 'cursor', 'windsurf'];

  return ['claude-code', 'codex', 'cursor'];
}

function inferTags(skill: ExtractedSkill, category: string): string[] {
  const parts = `${skill.owner} ${skill.repoName} ${skill.name}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 1 && !['the', 'and', 'for', 'with', 'skill', 'skills'].includes(part));

  const categoryTags = category.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return unique(['imported', 'skills-sh', ...categoryTags, ...parts]).slice(0, 10);
}

function buildDescription(skill: ExtractedSkill, category: string): string {
  const label = humanize(skill.name);
  const source = skill.installs ? ` The public skills.sh leaderboard lists ${skill.installs} installs for this entry.` : '';
  return `${label} is a ${category.toLowerCase()} agent skill from ${skill.owner}/${skill.repoName}. Use it as a reusable instruction pack for AI coding agents, and review the linked repository before installing.${source}`;
}

function toSkillLiteral(skill: ExtractedSkill, index: number) {
  const category = inferCategory(skill);
  const agents = inferAgents(skill);
  const tags = inferTags(skill, category);
  const createdAt = new Date(Date.UTC(2026, 1, 1, 0, index, 0)).toISOString();

  return {
    id: `skills-sh-${slugify(skill.owner)}-${slugify(skill.repoName)}-${slugify(skill.name)}`,
    name: skill.name,
    description: buildDescription(skill, category),
    repositoryUrl: `https://github.com/${skill.owner}/${skill.repoName}`,
    documentationUrl: `https://skills.sh${skill.href}`,
    category,
    tags,
    agents,
    owner: skill.owner,
    repoName: skill.repoName,
    installCommand: `npx skills add ${skill.owner}/${skill.repoName}/${skill.name}`,
    createdAt,
    updatedAt: createdAt,
    favoriteCount: 0,
  };
}

function render(skills: ReturnType<typeof toSkillLiteral>[]) {
  return `import type { Skill } from '@/types';\n\n` +
    `// Generated from the public skills.sh homepage leaderboard.\n` +
    `// Regenerate with: npm run import:skills\n` +
    `// Source: ${SOURCE_URL}\n` +
    `export const IMPORTED_SKILLS: Skill[] = ${JSON.stringify(skills, null, 2)};\n`;
}

async function main() {
  const response = await fetch(SOURCE_URL, { headers: { 'user-agent': 'UniversalSkillsHubImporter/1.0' } });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const extracted = extractSkills(html);
  const skills = extracted.map(toSkillLiteral);

  writeFileSync(OUTPUT_PATH, render(skills), 'utf8');
  console.log(`Imported ${skills.length} skills from ${SOURCE_URL}`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
