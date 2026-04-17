/**
 * Skills Directory API client
 * Documentation: https://www.skillsdirectory.com/api-docs
 */

import type { Skill } from '@/types';

const API_BASE_URL = 'https://skillsdirectory.com/api/v1';
const DEFAULT_API_KEY = process.env.SKILLS_DIRECTORY_API_KEY;

// Interface for Skills Directory API response
interface SkillsDirectoryResponse {
  data: SkillsDirectorySkill[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    requestsRemaining: number;
    tier: string;
  };
}

interface SkillsDirectorySkill {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  repo: string;
  author: {
    name: string;
    image: string;
    username: string;
  };
  stars: number;
  securityGrade?: string;
  securityScore?: number;
}

interface FetchOptions {
  query?: string;
  category?: string;
  sort?: 'recent' | 'votes' | 'stars';
  limit?: number;
  offset?: number;
  apiKey?: string;
}

/**
 * Fetch skills from Skills Directory API
 */
export async function fetchSkillsDirectorySkills(options: FetchOptions = {}): Promise<{
  skills: Skill[];
  total: number;
  source: string;
}> {
  const { query, category, sort = 'stars', limit = 50, offset = 0, apiKey = DEFAULT_API_KEY } = options;

  // Build query params
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  params.set('sort', sort);
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  
  // Default to security grade A (verified safe)
  params.set('securityGrade', 'all');

  const url = `${API_BASE_URL}/skills?${params.toString()}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, { headers, next: { revalidate: 300 } });

    // If 401, the API requires authentication - return gracefully without throwing
    if (response.status === 401) {
      console.warn('Skills Directory API requires authentication');
      return {
        skills: [],
        total: 0,
        source: 'api-auth-required',
      };
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: SkillsDirectoryResponse = await response.json();

    // Transform Skills Directory format to our Skill format
    const skills: Skill[] = data.data.map((sdSkill) => ({
      id: `sd-${sdSkill.slug}`,
      name: sdSkill.name,
      description: sdSkill.description,
      repositoryUrl: sdSkill.repo,
      documentationUrl: sdSkill.repo,
      category: sdSkill.category,
      tags: sdSkill.tags,
      agents: [], // Skills Directory doesn't provide agent compatibility
      owner: sdSkill.author.username,
      repoName: sdSkill.slug,
      authorName: sdSkill.author.name,
      createdAt: new Date().toISOString(), // Not provided by API
      updatedAt: new Date().toISOString(),
      favoriteCount: sdSkill.stars,
    }));

    return {
      skills,
      total: data.pagination.totalCount,
      source: 'skills-directory',
    };
  } catch (error) {
    console.error('Error fetching from Skills Directory API:', error);
    return {
      skills: [],
      total: 0,
      source: 'api-error',
    };
  }
}

/**
 * Fetch skills by category
 */
export async function fetchSkillsByCategory(category: string, limit = 20): Promise<Skill[]> {
  const result = await fetchSkillsDirectorySkills({ category, limit });
  return result.skills;
}

/**
 * Search skills by query
 */
export async function searchSkillsDirectory(query: string, limit = 20): Promise<Skill[]> {
  const result = await fetchSkillsDirectorySkills({ query, limit });
  return result.skills;
}

/**
 * Get categories from API
 */
export async function fetchSkillsDirectoryCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((cat: { slug: string; name: string }) => cat.name);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Combine local skills with Skills Directory skills
 */
export async function getCombinedSkills(options: {
  localSkills?: Skill[];
  query?: string;
  category?: string;
  limit?: number;
  currentUserId?: string;
} = {}): Promise<{ skills: Skill[]; sources: string[] }> {
  const { localSkills = [], query, category, limit = 50 } = options;
  
  const sources: string[] = [];
  let allSkills: Skill[] = [...localSkills];

  // Add local skills first
  if (localSkills.length > 0) {
    sources.push('local');
  }

  // Try to fetch from Skills Directory API
  try {
    const apiResult = await fetchSkillsDirectorySkills({
      query,
      category,
      limit: limit - localSkills.length,
    });

    if (apiResult.skills.length > 0) {
      // Filter out duplicates (by repo URL)
      const localUrls = new Set(localSkills.map(s => s.repositoryUrl));
      const newFromApi = apiResult.skills.filter(s => !localUrls.has(s.repositoryUrl));
      
      allSkills = [...allSkills, ...newFromApi];
      sources.push('skills-directory');
    }
  } catch (error) {
    console.warn('Could not fetch from Skills Directory API:', error);
  }

  // Apply limit
  if (limit && allSkills.length > limit) {
    allSkills = allSkills.slice(0, limit);
  }

  return { skills: allSkills, sources };
}
