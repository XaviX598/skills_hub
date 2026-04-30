/**
 * Landing page.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Download, Search, Sparkles, Star } from 'lucide-react';
import { getOptionalSession } from '@/lib/session';
import { getDirectorySkills } from '@/lib/skills';
import { fetchSkillsDirectorySkills } from '@/lib/skills-directory';
import { AGENTS } from '@/data/agents';
import { SkillCard } from '@/components/SkillCard';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { TypewriterTitle } from '@/components/TypewriterTitle';

export const metadata: Metadata = {
  title: "Universal Skills Hub | Install AI Agent Skills for Claude Code, Codex, Cursor & OpenCode",
  description: "Discover and install reusable AI agent skills for Claude Code, Codex, Cursor, OpenCode, MCP, and more. Search workflows, compare tools, and download setup-ready skills in one click.",
  keywords: [
    "AI agent skills", "Claude Code skills", "claude code", "claude id", "claude skills",
    "OpenCode skills", "open code", "opencode", "openclaw",
    "Cursor skills", "Windsurf skills", "Codex skills", 
    "MCP skills", "mcp", "Cline skills", "Continue skills",
    "skills ia", "skills", "AI coding agents", "developer skills", "install skills", "one click skills"
  ],
  openGraph: {
    title: "Universal Skills Hub | Install AI Agent Skills in One Click",
    description: "Discover and install reusable AI agent skills for Claude Code, Codex, Cursor, OpenCode, MCP, and more.",
    type: "website",
  },
};

// Filter agents for carousel (exclude continue)
const CAROUSEL_AGENTS = AGENTS.filter(a => a.id !== 'continue');

// Helper to get stars from GitHub
async function getGitHubStars(repoUrl?: string): Promise<number | null> {
  if (!repoUrl) return null;
  
  try {
    // Parse GitHub URL to get owner/repo
    const url = new URL(repoUrl);
    const path = url.pathname.replace('/', '').replace('.git', '');
    const [owner, repo] = path.split('/');
    
    if (!owner || !repo) return null;
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'Universal-Skills-Hub',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.stargazers_count || null;
  } catch {
    return null;
  }
}

// Fetch stars for skills (server component, parallel)
async function getSkillsWithStars(skills: Awaited<ReturnType<typeof getDirectorySkills>>['skills']) {
  const skillsWithStars = await Promise.all(
    skills.slice(0, 6).map(async (skill) => {
      const stars = await getGitHubStars(skill.repositoryUrl);
      return { ...skill, githubStars: stars };
    })
  );
  return skillsWithStars;
}

export default async function Home() {
  const session = await getOptionalSession();
  const { skills: allSkills, total } = await getDirectorySkills({ currentUserId: session?.user?.id, limit: 6 });
  
  // Only try Skills Directory API if we have an API key configured
  const apiKey = process.env.SKILLS_DIRECTORY_API_KEY;
  let totalSkills = total;
  
  if (apiKey) {
    const apiSkills = await fetchSkillsDirectorySkills({ limit: 1 });
    // Use API total if it's substantial (>1000), otherwise use local
    if (apiSkills.total > 1000) {
      totalSkills = apiSkills.total;
    }
  }
  
  // Get skills with GitHub stars
  const skills = await getSkillsWithStars(allSkills);
  
  // Duplicate for carousel
  const duplicatedSkills = [...skills, ...skills, ...skills];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are Claude Code skills?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Claude Code skills are reusable instruction packs and workflows that extend Claude Code with focused capabilities like testing, security reviews, frontend design, deployment, and documentation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is MCP in this directory?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MCP stands for Model Context Protocol. This directory helps developers discover MCP-compatible skills, prompts, and workflows that can be installed or adapted for AI coding agents.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I install skills in one click?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Universal Skills Hub focuses on setup-ready skills with install commands, compatibility details, and quick links so you can move from discovery to installation with minimal friction.',
        },
      },
    ],
  };

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* Hero Section - With Agents Carousel on right */}
      <section className="relative overflow-hidden bg-[#0B0B0B]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center">
            
            {/* Left side - Content */}
            <div className="md:pr-8">
              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-[var(--accent-cyan)]">
                <Sparkles className="h-3.5 w-3.5" />
                {totalSkills > 1000 ? `${totalSkills.toLocaleString()}+ skills available` : 'AI Agent Skills Directory'}
              </div>

              {/* Title - Typewriter animation */}
              <TypewriterTitle />

              {/* Subtitle */}
              <p className="mt-3 max-w-xl text-base text-[var(--text-secondary)] md:text-lg">
                Find and install reusable AI agent skills for Claude Code, Codex, Cursor, OpenCode, MCP, and more.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
                Search by workflow, compare compatibility, and copy setup-ready commands without digging through random repos.
              </p>

              {/* Search */}
              <form action="/skills" className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="hero-query">Search skills</label>
                <input
                  id="hero-query"
                  name="query"
                  className="input-shell min-h-11 flex-1 rounded-xl px-4 text-sm"
                  placeholder="Try: React, testing, security..."
                />
                <button className="btn-search" type="submit">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </form>

              {/* CTA */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/skills" className="btn-secondary">
                  Browse skills <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/app" className="btn-secondary">
                  Get desktop app <Download className="h-4 w-4" />
                </Link>
                <Link href="/submit" className="btn-secondary">
                  Submit skill <GitHubIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right side - Agents Carousel (images only, clickable) */}
            <div className="hidden md:flex items-center justify-end">
              <div className="relative overflow-hidden w-full max-w-[500px]">
                <div className="flex animate-infinite-scroll gap-6" style={{ animationDuration: '20s' }}>
                  {[...CAROUSEL_AGENTS, ...CAROUSEL_AGENTS, ...CAROUSEL_AGENTS].map((agent, index) => (
                    <Link 
                      key={`${agent.id}-${index}`}
                      href={`/agents/${agent.id}`}
                      className="shrink-0 flex items-center justify-center p-3"
                    >
                      {agent.imagePath ? (
                        <Image 
                          src={agent.imagePath} 
                          alt={agent.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">{agent.name}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Compact */}
      <section className="border-b border-white/10 bg-[#111111]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <h2 className="font-semibold text-lg">Search by intent</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Find skills by what they do, not by repository name.
              </p>
            </div>
            <div className="text-white">
              <h2 className="font-semibold text-lg">One-click install paths</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Move from discovery to installation fast with setup-ready commands and desktop linking.
              </p>
            </div>
            <div className="text-white">
              <h2 className="font-semibold text-lg">Multiple agents</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Works with Claude Code, Codex, Cursor, OpenCode, MCP workflows, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Carousel - Infinite Scroll (clickable, with GitHub stars) */}
      <section className="border-b border-white/10 bg-[#111111] py-6 overflow-hidden">
        <div className="mb-4 px-4 md:px-6">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--text-muted)]">Popular skills</p>
        </div>
        
        {/* Infinite scrolling carousel */}
        <div className="relative w-full overflow-hidden">
          <div className="flex animate-infinite-scroll gap-6" style={{ animationDuration: '25s' }}>
            {duplicatedSkills.map((skill, index) => (
              <Link 
                key={`${skill.id}-${index}`}
                href={`/skills/${skill.id}`}
                className="flex shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-[#151515] px-4 py-3 min-w-[180px] hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-white">{skill.githubStars ? (skill.githubStars > 1000 ? `${(skill.githubStars / 1000).toFixed(1)}k` : skill.githubStars.toLocaleString()) : '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="whitespace-nowrap text-sm font-medium text-[var(--accent-cyan)]">{skill.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{skill.owner ? `@${skill.owner}` : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Skills - Compact */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Popular skills</h2>
          <Link href="/skills" className="text-sm text-[var(--accent-cyan)] hover:underline">
            View all <ArrowRight className="h-4 w-4 inline" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {skills.slice(0, 3).map((skill) => (
            <SkillCard key={skill.id} skill={skill} redirectTo="/" />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0F0F0F]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Why developers search this</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Claude skills, MCP skills, OpenCode workflows, and real install paths</h2>
            <p className="mt-4 leading-7 text-[var(--text-secondary)]">
              Developers searching for terms like <strong>claude skills</strong>, <strong>mcp</strong>, <strong>open code</strong>, or <strong>skills IA</strong> usually want one thing: a trustworthy place to find reusable agent workflows and install them fast. Universal Skills Hub is built to answer that directly.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-lg font-bold text-white">What are Claude Code skills?</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Reusable instruction packs for Claude Code that help with testing, design systems, security, deployment, documentation, and other coding workflows.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-lg font-bold text-white">What is MCP?</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                MCP means Model Context Protocol. It is used to connect AI agents with structured tools, context, and workflows, and this directory helps you find compatible skills faster.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-lg font-bold text-white">Why use the directory?</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Instead of browsing random repositories, you can search by intent, compare agent compatibility, and copy install commands from one focused place.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
