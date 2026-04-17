/**
 * Skill detail page.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Heart, PackageCheck } from 'lucide-react';
import { getOptionalSession } from '@/lib/session';
import { getSkillById } from '@/lib/skills';
import { toggleFavorite } from '@/app/actions/favorite';
import { CompatibilityMatrix } from '@/components/CompatibilityMatrix';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { getAgentName } from '@/data/agents';

interface SkillPageProps {
  params: Promise<{ id: string }>;
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
                {skill.category && (
                  <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                    {skill.category}
                  </span>
                )}
                {skill.owner && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[var(--text-muted)]">
                    {skill.owner}/{skill.repoName}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">{skill.name}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">{skill.description}</p>
            </div>

            <form action={toggleFavorite}>
              <input type="hidden" name="skillId" value={skill.id} />
              <input type="hidden" name="redirectTo" value={`/skills/${skill.id}`} />
              <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-rose-300/30 hover:text-[var(--accent-crimson)]">
                <Heart className={`h-4 w-4 ${skill.isFavorited ? 'fill-[var(--accent-crimson)] text-[var(--accent-crimson)]' : ''}`} />
                {skill.isFavorited ? 'Saved' : 'Save'} · {skill.favoriteCount ?? 0}
              </button>
            </form>
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
            {skill.repositoryUrl && (
              <a href={skill.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <GitHubIcon className="h-4 w-4" />
                Repository
              </a>
            )}
            {skill.documentationUrl && (
              <a href={skill.documentationUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <ExternalLink className="h-4 w-4" />
                Source page
              </a>
            )}
            <Link href="/submit" className="btn-primary">
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
