/**
 * Core domain types for Universal Skills Hub.
 *
 * Important architectural decision: agent identifiers are strings, not a
 * database enum. New AI coding agents appear constantly, so the database must
 * accept unknown future agents without a migration.
 */

import type { StaticImageData } from 'next/image';

export type AgentId = string;

export interface AgentDefinition {
  id: AgentId;
  name: string;
  vendor: string;
  description: string;
  installSummary: string;
  docsUrl: string;
  websiteUrl?: string;
  installSteps: string[];
  skillLocation?: string;
  skillNotes?: string[];
  imagePath?: string | StaticImageData;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  category?: string;
  tags: string[];
  agents: AgentId[];
  owner?: string;
  repoName?: string;
  installCommand?: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  favoriteCount?: number;
  isFavorited?: boolean;
  source?: string;
}

export interface SkillDetail extends Skill {
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername?: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  skillsCount: number;
  favoritesCount: number;
}

export interface SkillsResponse {
  skills: Skill[];
  total: number;
}

export interface SkillResponse {
  skill: SkillDetail;
}

export interface ApiError {
  error: string;
}

export interface SkillFilters {
  agents: AgentId[];
  query?: string;
  category?: string;
}

export interface SkillSubmission {
  name: string;
  description: string;
  repositoryUrl: string;
  documentationUrl?: string;
  category?: string;
  tags: string[];
  agents: AgentId[];
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  repositoryUrl?: string;
  category?: string;
  tags: string[];
  stars?: number;
  author?: string;
}

