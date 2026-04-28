/**
 * Skills.sh / Vercel Skills ecosystem client
 * Uses npx skills find to search for skills in the open ecosystem
 * Reference: https://github.com/vercel-labs/skills
 */

import type { Skill } from '@/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Parse skills from npx skills find output
 */
function parseSkillsFindOutput(output: string): string[] {
  // The output format from npx skills find is typically package names
  // Format: owner/repo or owner/repo@skill
  const lines = output.split('\n').filter(Boolean);
  
  // Extract package names (lines that look like npm packages)
  const packages: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Match patterns like: vercel-labs/agent-skills, anthropics/skills, etc.
    if (/^[\w-]+\/[\w-]+(@[\w-]+)?$/.test(trimmed)) {
      packages.push(trimmed);
    }
  }
  
  return packages;
}

/**
 * Convert a package name to a Skill object
 */
async function packageToSkill(pkg: string): Promise<Skill | null> {
  const [ownerRepo, skillName] = pkg.split('@');
  const [owner, repo] = ownerRepo.split('/');
  
  if (!owner || !repo) return null;
  
  // For now, create a basic skill entry
  // In a full implementation, we'd fetch more details from GitHub
  return {
    id: `ecosystem-${owner}-${repo}${skillName ? `-${skillName}` : ''}`,
    name: skillName ? `${repo} (${skillName})` : repo,
    description: `Skill from ${owner}/${repo}. Install with: npx skills add ${pkg}`,
    repositoryUrl: `https://github.com/${ownerRepo}`,
    documentationUrl: `https://skills.sh/${ownerRepo}${skillName ? `/${skillName}` : ''}`,
    category: 'agent-skill',
    tags: ['ecosystem', 'ai-agent', 'skill'],
    agents: [], // Would need to parse from skill metadata
    owner,
    repoName: skillName || repo,
    authorName: owner,
    installCommand: `npx skills add ${pkg}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favoriteCount: 0,
    source: 'ecosystem',
  };
}

/**
 * Search skills in the skills.sh ecosystem using npx skills find
 */
export async function fetchEcosystemSkills(options: {
  query?: string;
  limit?: number;
} = {}): Promise<{
  skills: Skill[];
  total: number;
  source: string;
}> {
  const { query, limit = 30 } = options;
  
  if (!query || query.length < 2) {
    return { skills: [], total: 0, source: 'ecosystem' };
  }
  
  try {
    // Run npx skills find with the query
    // Use --json flag if available, otherwise parse text output
    const { stdout, stderr } = await execAsync(
      `npx -y skills find "${query}" --limit ${limit}`,
      { timeout: 30000 } // 30 second timeout
    );
    
    const output = stdout || stderr;
    const packages = parseSkillsFindOutput(output);
    
    // Convert packages to skills
    const skills: Skill[] = [];
    for (const pkg of packages.slice(0, limit)) {
      const skill = await packageToSkill(pkg);
      if (skill) {
        skills.push(skill);
      }
    }
    
    return {
      skills,
      total: skills.length,
      source: 'ecosystem',
    };
  } catch (error) {
    // If npx skills is not available or fails, return empty
    // This is not an error - just means the tool isn't installed
    console.warn('Could not fetch from skills.sh ecosystem:', error);
    return {
      skills: [],
      total: 0,
      source: 'ecosystem',
    };
  }
}

/**
 * Get popular/trending skills from the ecosystem
 */
export async function fetchPopularEcosystemSkills(limit = 20): Promise<Skill[]> {
  // Common popular skills from the ecosystem
  const popularPackages = [
    'vercel-labs/agent-skills',
    'anthropics/skills',
    'ComposioHQ/awesome-claude-skills',
    'microsoft/semantic-kernel',
  ];
  
  const skills: Skill[] = [];
  for (const pkg of popularPackages.slice(0, limit)) {
    const skill = await packageToSkill(pkg);
    if (skill) {
      skills.push(skill);
    }
  }
  
  return skills;
}

/**
 * Integrate ecosystem skills into combined search
 */
export async function addEcosystemSkillsToResults(
  existingSkills: Skill[],
  options: {
    query?: string;
    limit?: number;
  } = {}
): Promise<{ skills: Skill[]; sources: string[] }> {
  const { query, limit = 50 } = options;
  const sources: string[] = ['local'];
  let allSkills = [...existingSkills];
  
  // If there's a query, try to find more from ecosystem
  if (query && query.length >= 2) {
    try {
      const ecosystemResult = await fetchEcosystemSkills({ query, limit: 10 });
      
      if (ecosystemResult.skills.length > 0) {
        // Filter out duplicates
        const existingUrls = new Set(allSkills.map(s => s.repositoryUrl));
        const newFromEcosystem = ecosystemResult.skills.filter(
          s => !existingUrls.has(s.repositoryUrl)
        );
        
        allSkills = [...allSkills, ...newFromEcosystem];
        sources.push('ecosystem');
      }
    } catch (error) {
      // Silently fail - ecosystem is optional
      console.warn('Ecosystem search failed:', error);
    }
  }
  
  // Apply limit
  if (limit && allSkills.length > limit) {
    allSkills = allSkills.slice(0, limit);
  }
  
  return { skills: allSkills, sources };
}