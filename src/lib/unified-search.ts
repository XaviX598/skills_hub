/**
 * Unified skills search - combines local, Skills Directory API, and skills.sh ecosystem
 * Uses find-skills methodology: check local first, then external sources
 */

import type { Skill } from '@/types';
import { filterSkills } from './search';
import { fetchSkillsDirectorySkills } from './skills-directory';
import { fetchEcosystemSkills } from './skills-ecosystem';

export interface UnifiedSearchOptions {
  query: string;
  localSkills: Skill[];
  agents?: string[];
  category?: string;
  limit?: number;
}

export interface UnifiedSearchResult {
  skills: Skill[];
  sources: {
    local: number;
    directory: number;
    ecosystem: number;
  };
  total: number;
}

/**
 * Main unified search function
 * Combines: 1) Local DB skills, 2) Skills Directory API, 3) skills.sh ecosystem
 */
export async function unifiedSkillSearch(options: UnifiedSearchOptions): Promise<UnifiedSearchResult> {
  const { query, localSkills, agents, category, limit = 50 } = options;
  
  const sources = {
    local: 0,
    directory: 0,
    ecosystem: 0,
  };
  
  // Step 1: Search local skills first (fastest, most relevant)
  let localResults = filterSkills(localSkills, {
    query,
    agents,
    category,
    // No limit here - we'll limit at the end
  });
  sources.local = localResults.length;
  
  // Step 2: If we need more results or have a query, try Skills Directory API
  let directorySkills: Skill[] = [];
  if (localResults.length < limit && query) {
    try {
      const dirResult = await fetchSkillsDirectorySkills({
        query,
        category,
        limit: limit - localResults.length,
      });
      
      if (dirResult.skills.length > 0) {
        // Filter out duplicates from local
        const localUrls = new Set(localResults.map(s => s.repositoryUrl));
        directorySkills = dirResult.skills.filter(s => !localUrls.has(s.repositoryUrl));
        sources.directory = directorySkills.length;
      }
    } catch (error) {
      console.warn('Skills Directory API failed:', error);
    }
  }
  
  // Step 3: If still need more, try skills.sh ecosystem
  let ecosystemSkills: Skill[] = [];
  if ((localResults.length + directorySkills.length) < limit && query && query.length >= 2) {
    try {
      const ecoResult = await fetchEcosystemSkills({
        query,
        limit: limit - localResults.length - directorySkills.length,
      });
      
      if (ecoResult.skills.length > 0) {
        // Filter out duplicates
        const existingUrls = new Set([
          ...localResults.map(s => s.repositoryUrl),
          ...directorySkills.map(s => s.repositoryUrl),
        ]);
        ecosystemSkills = ecoResult.skills.filter(s => !existingUrls.has(s.repositoryUrl));
        sources.ecosystem = ecosystemSkills.length;
      }
    } catch (error) {
      console.warn('Skills ecosystem search failed:', error);
    }
  }
  
  // Combine all results and apply final limit
  const allSkills = [
    ...localResults,
    ...directorySkills,
    ...ecosystemSkills,
  ].slice(0, limit);
  
  return {
    skills: allSkills,
    sources,
    total: allSkills.length,
  };
}

/**
 * Simple search for server components
 * Uses parallel fetching for external sources
 */
export async function searchSkills(options: {
  query?: string;
  localSkills: Skill[];
  agents?: string[];
  category?: string;
  limit?: number;
}): Promise<Skill[]> {
  const { query, localSkills, agents, category, limit = 50 } = options;
  
  // If no query, just return filtered local skills
  if (!query || query.length < 2) {
    return filterSkills(localSkills, { agents, category }).slice(0, limit);
  }
  
  // Use unified search
  const result = await unifiedSkillSearch({
    query,
    localSkills,
    agents,
    category,
    limit,
  });
  
  return result.skills;
}

/**
 * Get skills from all sources for discovery/browsing
 */
export async function getAllSkills(options: {
  localSkills: Skill[];
  limit?: number;
  category?: string;
}): Promise<{
  local: Skill[];
  directory: Skill[];
  ecosystem: Skill[];
}> {
  const { localSkills, limit = 50, category } = options;
  
  // Fetch directory and ecosystem in parallel
  const [dirResult, ecoResult] = await Promise.all([
    fetchSkillsDirectorySkills({ category, limit }).catch(() => ({ skills: [], total: 0 })),
    fetchEcosystemSkills({ limit }).catch(() => ({ skills: [], total: 0 })),
  ]);
  
  return {
    local: localSkills.slice(0, limit),
    directory: dirResult.skills.slice(0, limit),
    ecosystem: ecoResult.skills.slice(0, limit),
  };
}