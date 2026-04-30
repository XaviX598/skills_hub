import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Database } from 'lucide-react';
import { getOptionalSession } from '@/lib/session';
import { getDirectorySkills } from '@/lib/skills';
import { getAgentById, resolveAgentAlias } from '@/data/agents';
import { SITE_URL } from '@/lib/site-url';
import { SkillCard } from '@/components/SkillCard';

interface AgentSkillsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgentSkillsPageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedId = resolveAgentAlias(id);
  const agent = getAgentById(resolvedId);

  if (!agent) {
    return {
      title: 'Agent skills not found',
      description: 'The requested agent skills landing page could not be found.',
    };
  }

  return {
    title: `${agent.name} Skills Directory - Install Skills for ${agent.name}`,
    description: `Browse reusable ${agent.name} skills, workflows, and setup-ready instructions. Find compatible skills for ${agent.name} and install them faster.`,
    keywords: [
      `${agent.name} skills`,
      `install ${agent.name} skills`,
      `${agent.name} workflows`,
      `${agent.name} prompts`,
      'AI agent skills',
    ],
    alternates: {
      canonical: `${SITE_URL}/agents/${resolvedId}/skills`,
    },
    openGraph: {
      title: `${agent.name} Skills Directory`,
      description: `Find reusable ${agent.name} skills and setup-ready workflows.`,
      type: 'website',
      url: `${SITE_URL}/agents/${resolvedId}/skills`,
    },
  };
}

export default async function AgentSkillsPage({ params }: AgentSkillsPageProps) {
  const { id } = await params;
  const resolvedId = resolveAgentAlias(id);
  const agent = getAgentById(resolvedId);

  if (!agent) {
    notFound();
  }

  const session = await getOptionalSession();
  const { skills, total } = await getDirectorySkills({
    agents: [resolvedId],
    pageSize: 60,
    currentUserId: session?.user?.id,
  });

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <Link href={`/agents/${resolvedId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="h-4 w-4" />
          Back to {agent.name} guide
        </Link>

        <section className="glass-panel mb-8 rounded-[2rem] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">{agent.vendor}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{agent.name} skills</h1>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--text-secondary)]">
            Browse reusable skills, prompts, and workflows compatible with {agent.name}. Use this landing page when you want a focused directory for {agent.name} instead of a generic skills listing.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm">
            <Database className="h-4 w-4 text-[var(--accent-cyan)]" />
            {total.toLocaleString()} matching {total === 1 ? 'skill' : 'skills'}
          </div>
        </section>

        {skills.length === 0 ? (
          <div className="surface-card rounded-3xl p-6 text-[var(--text-secondary)]">
            No skills found for {agent.name} yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} redirectTo={`/agents/${resolvedId}/skills`} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
