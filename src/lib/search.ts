import type { Skill } from '@/types';

const SYNONYMS: Record<string, string[]> = {
  diseño: ['design', 'ui', 'ux', 'frontend', 'interfaces', 'visual'],
  diseno: ['design', 'ui', 'ux', 'frontend', 'interfaces', 'visual'],
  design: ['diseño', 'ui', 'ux', 'frontend', 'interfaces', 'visual'],
  frontend: ['react', 'nextjs', 'ui', 'component', 'design'],
  pruebas: ['testing', 'tests', 'tdd', 'quality', 'verification'],
  tests: ['testing', 'tdd', 'quality', 'verification', 'pruebas'],
  testing: ['tests', 'tdd', 'quality', 'verification', 'pruebas'],
  desplegar: ['deploy', 'deployment', 'vercel', 'production', 'devops'],
  deploy: ['desplegar', 'deployment', 'vercel', 'production', 'devops'],
  seguridad: ['security', 'auth', 'vulnerability', 'secrets'],
  security: ['seguridad', 'auth', 'vulnerability', 'secrets'],
  documentacion: ['docs', 'documentation', 'readme', 'tutorial', 'ayuda'],
  documentación: ['docs', 'documentation', 'readme', 'tutorial', 'ayuda'],
  ayuda: ['docs', 'documentation', 'tutorial', 'guide'],
  agente: ['agent', 'ai', 'assistant'],
  agentes: ['agent', 'ai', 'assistant'],
};

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandNaturalQuery(query: string): string[] {
  const normalized = normalizeText(query);
  const terms = normalized.split(' ').filter(Boolean);
  const expanded = new Set(terms);

  for (const term of terms) {
    for (const synonym of SYNONYMS[term] ?? []) {
      expanded.add(normalizeText(synonym));
    }
  }

  return [...expanded];
}

export function skillSearchText(skill: Skill): string {
  return normalizeText([
    skill.name,
    skill.description,
    skill.category,
    skill.owner,
    skill.repoName,
    skill.repositoryUrl,
    skill.documentationUrl,
    skill.installCommand,
    ...skill.tags,
    ...skill.agents,
  ].filter(Boolean).join(' '));
}

export function scoreSkillForQuery(skill: Skill, query: string): number {
  const terms = expandNaturalQuery(query);
  if (terms.length === 0) return 1;

  const text = skillSearchText(skill);
  let score = 0;

  for (const term of terms) {
    if (text.includes(term)) score += 1;
    if (normalizeText(skill.name).includes(term)) score += 2;
    if (skill.tags.some((tag) => normalizeText(tag).includes(term))) score += 1.5;
    if (normalizeText(skill.category ?? '').includes(term)) score += 1.5;
  }

  return score;
}

export function filterSkills(skills: Skill[], options: { query?: string; agents?: string[]; category?: string }) {
  const selectedAgents = options.agents?.filter(Boolean) ?? [];
  const normalizedCategory = normalizeText(options.category ?? '');

  return skills
    .map((skill) => ({
      skill,
      score: options.query ? scoreSkillForQuery(skill, options.query) : 1,
    }))
    .filter(({ skill, score }) => {
      const agentMatch = selectedAgents.length === 0 || selectedAgents.some((agent) => skill.agents.includes(agent));
      const categoryMatch = !normalizedCategory || normalizeText(skill.category ?? '') === normalizedCategory;
      const queryMatch = !options.query || score > 0;
      return agentMatch && categoryMatch && queryMatch;
    })
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .map(({ skill }) => skill);
}
