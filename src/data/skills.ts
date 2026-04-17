import type { Skill } from '@/types';
import { IMPORTED_SKILLS } from './imported-skills';

const CURATED_SKILLS: Skill[] = [
  {
    id: 'curated-frontend-design',
    name: 'frontend-design',
    description: 'Design high-quality, production-ready frontend interfaces with strong layout, visual hierarchy, accessibility, and component taste.',
    repositoryUrl: 'https://github.com/anthropics/skills',
    documentationUrl: 'https://github.com/anthropics/skills',
    category: 'Design',
    tags: ['design', 'ui', 'ux', 'frontend', 'interfaces', 'accessibility'],
    agents: ['claude-code', 'codex', 'cursor', 'windsurf'],
    owner: 'anthropics',
    repoName: 'skills',
    installCommand: 'npx skills add anthropics/skills/frontend-design',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    favoriteCount: 0,
  },
  {
    id: 'curated-vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    description: 'Review React and Next.js components for accessibility, performance, hooks usage, server/client boundaries, and TypeScript quality.',
    repositoryUrl: 'https://github.com/vercel-labs/agent-skills',
    documentationUrl: 'https://github.com/vercel-labs/agent-skills',
    category: 'Frontend',
    tags: ['react', 'nextjs', 'review', 'typescript', 'frontend', 'accessibility'],
    agents: ['codex', 'claude-code', 'cursor', 'windsurf', 'github-copilot'],
    owner: 'vercel-labs',
    repoName: 'agent-skills',
    installCommand: 'npx skills add vercel-labs/agent-skills/vercel-react-best-practices',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    favoriteCount: 0,
  },
  {
    id: 'curated-test-driven-development',
    name: 'test-driven-development',
    description: 'Guide agents through test-first implementation, red-green-refactor loops, regression coverage, and verification discipline.',
    repositoryUrl: 'https://github.com/obra/superpowers',
    documentationUrl: 'https://github.com/obra/superpowers',
    category: 'Testing & Review',
    tags: ['testing', 'tdd', 'quality', 'verification', 'tests'],
    agents: ['claude-code', 'codex', 'opencode', 'cursor'],
    owner: 'obra',
    repoName: 'superpowers',
    installCommand: 'npx skills add obra/superpowers/test-driven-development',
    createdAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
    favoriteCount: 0,
  },
  {
    id: 'curated-deploy-to-vercel',
    name: 'deploy-to-vercel',
    description: 'Deploy modern web apps to Vercel with environment variables, preview deployments, production promotion, and rollback guidance.',
    repositoryUrl: 'https://github.com/vercel-labs/agent-skills',
    documentationUrl: 'https://vercel.com/docs',
    category: 'Cloud & DevOps',
    tags: ['deploy', 'vercel', 'ci', 'production', 'devops'],
    agents: ['codex', 'claude-code', 'cursor', 'github-copilot'],
    owner: 'vercel-labs',
    repoName: 'agent-skills',
    installCommand: 'npx skills add vercel-labs/agent-skills/deploy-to-vercel',
    createdAt: '2026-03-04T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z',
    favoriteCount: 0,
  },
  {
    id: 'curated-security-review',
    name: 'security-review',
    description: 'Inspect code changes for common vulnerabilities, unsafe secrets, dependency risk, authorization mistakes, and supply-chain concerns.',
    repositoryUrl: 'https://github.com/example/security-review-skill',
    category: 'Security',
    tags: ['security', 'auth', 'vulnerability', 'secrets', 'review'],
    agents: ['claude-code', 'codex', 'opencode', 'github-copilot'],
    owner: 'example',
    repoName: 'security-review-skill',
    installCommand: 'npx skills add example/security-review-skill',
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
    favoriteCount: 0,
  },
  {
    id: 'curated-doc-coauthoring',
    name: 'doc-coauthoring',
    description: 'Create and refine documentation, tutorials, READMEs, changelogs, migration guides, and help-center articles with an agent.',
    repositoryUrl: 'https://github.com/anthropics/skills',
    documentationUrl: 'https://github.com/anthropics/skills',
    category: 'Docs & Writing',
    tags: ['docs', 'tutorial', 'readme', 'writing', 'documentation'],
    agents: ['claude-code', 'codex', 'cursor', 'windsurf', 'gemini-cli'],
    owner: 'anthropics',
    repoName: 'skills',
    installCommand: 'npx skills add anthropics/skills/doc-coauthoring',
    createdAt: '2026-03-06T00:00:00.000Z',
    updatedAt: '2026-03-06T00:00:00.000Z',
    favoriteCount: 0,
  },
];

const curatedKeys = new Set(
  CURATED_SKILLS.map((skill) => `${skill.repositoryUrl}::${skill.name.toLowerCase()}`),
);
const importedWithoutCuratedDuplicates = IMPORTED_SKILLS.filter(
  (skill) => !curatedKeys.has(`${skill.repositoryUrl}::${skill.name.toLowerCase()}`),
);

export const FEATURED_SKILLS: Skill[] = [...CURATED_SKILLS, ...importedWithoutCuratedDuplicates];

export const CATEGORIES = Array.from(
  new Set(FEATURED_SKILLS.map((skill) => skill.category).filter(Boolean)),
).sort() as string[];

