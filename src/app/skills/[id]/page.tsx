/**
 * Skill detail page.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, PackageCheck } from 'lucide-react';
import { getOptionalSession } from '@/lib/session';
import { getSkillById } from '@/lib/skills';
import { CompatibilityMatrix } from '@/components/CompatibilityMatrix';
import { InstallButton } from '@/components/InstallButton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getAgentName } from '@/data/agents';
import type { AgentId } from '@/types';
import { SITE_URL } from '@/lib/site-url';

interface SkillPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const { id } = await params;
  const skill = await getSkillById(id);

  if (!skill) {
    return {
      title: 'Skill Not Found',
      description: 'The requested skill could not be found in the directory.',
    };
  }

  const agentList = skill.agents || [];
  const supportedAgents = agentList.map((agentId: AgentId) => getAgentName(agentId) || agentId).join(', ') || 'Multiple AI Agents';
  const category = skill.category || 'AI Agent Skills';

  return {
    title: `${skill.name} - AI Agent Skill for ${supportedAgents}`,
    description: skill.description || `${skill.name} - AI agent skill compatible with ${supportedAgents}. ${skill.category ? `Category: ${skill.category}.` : ''} Install and use this skill in your AI coding agent.`,
    keywords: [skill.name, category, 'AI agent skill', supportedAgents, 'Claude Code skill', 'OpenCode skill', 'MCP skill'],
    openGraph: {
      title: `${skill.name} - AI Agent Skill`,
      description: skill.description || `${skill.name} compatible with ${supportedAgents}`,
      type: 'article',
      tags: [skill.category || 'AI Skills'],
    },
    alternates: {
      canonical: `${SITE_URL}/skills/${id}`,
    },
  };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { id } = await params;
  const session = await getOptionalSession();
  const skill = await getSkillById(id, session?.user?.id);

  if (!skill) {
    notFound();
  }

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Link href="/skills" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="h-4 w-4" />
          Back to directory
        </Link>

        <section className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {skill.category && <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">{skill.category}</span>}
                {skill.owner && <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[var(--text-muted)]">{skill.owner}/{skill.repoName}</span>}
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">{skill.name}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">{skill.description}</p>
            </div>

<FavoriteButton
              skillId={skill.id}
              isFavorited={skill.isFavorited ?? false}
              redirectTo={`/skills/${skill.id}`}
              favoriteCount={skill.favoriteCount ?? 0}
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {skill.agents.map((agent) => (
              <Link key={agent} href={`/skills?agents=${agent}`} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-cyan-300/30 hover:text-[var(--accent-cyan)]">
                {getAgentName(agent)}
              </Link>
            ))}
          </div>

          {skill.installCommand && (
            <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-black/30 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)]">
                <Copy className="h-4 w-4" />
                Suggested install command
              </div>
              <code className="block overflow-x-auto rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-[var(--text-primary)]">{skill.installCommand}</code>
              <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                Always inspect the linked repository and skill instructions before running commands. Skills are instructions; permissions and execution still matter.
              </p>
            </div>
          )}

<div className="mt-7 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
            <InstallButton installCommand={skill.installCommand} owner={skill.owner} repoName={skill.repoName} agents={skill.agents} />
            <Link href="/submit" className="btn-secondary">
              <PackageCheck className="h-4 w-4" />
              Submit a related skill
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <CompatibilityMatrix skill={skill} />
        </section>
      </div>
    </main>
  );
}
