/**
 * Skill card.
 */

import Link from 'next/link';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { getAgentName } from '@/data/agents';
import { InstallButton } from '@/components/InstallButton';
import { FavoriteButton } from './FavoriteButton';
import type { Skill } from '@/types';

interface SkillCardProps {
  skill: Skill;
  isFavorited?: boolean;
  showFavorite?: boolean;
  redirectTo?: string;
}

export function SkillCard({ skill, isFavorited = skill.isFavorited ?? false, showFavorite = true, redirectTo = '/skills' }: SkillCardProps) {
  const visibleAgents = skill.agents.slice(0, 4);
  const hiddenAgents = Math.max(skill.agents.length - visibleAgents.length, 0);
  const visibleTags = skill.tags.filter((tag) => tag !== 'imported').slice(0, 5);

  return (
    <article suppressHydrationWarning className="card-hover surface-card group relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl p-5">
      <div suppressHydrationWarning className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-60" />

      <div suppressHydrationWarning className="flex items-start justify-between gap-4">
        <div suppressHydrationWarning className="min-w-0 flex-1">
          <div suppressHydrationWarning className="mb-3 flex flex-wrap items-center gap-2">
            {skill.category && <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-cyan)]">{skill.category}</span>}
            {skill.owner && <span className="truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">{skill.owner}/{skill.repoName}</span>}
          </div>

          <Link href={`/skills/${skill.id}`} className="group/title inline-flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-cyan)]">
            <span className="line-clamp-1">{skill.name}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
          </Link>

          <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--text-secondary)]">{skill.description}</p>
        </div>

{showFavorite && (
          <FavoriteButton
            skillId={skill.id}
            isFavorited={isFavorited}
            redirectTo={redirectTo}
            size="sm"
            showLabel={false}
          />
        )}
      </div>

      <div suppressHydrationWarning className="mt-5 flex flex-wrap gap-2">
        {visibleAgents.map((agent) => (
          <Link key={agent} href={`/skills?agents=${encodeURIComponent(agent)}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-cyan-300/30 hover:text-[var(--accent-cyan)]">
            {getAgentName(agent)}
          </Link>
        ))}
        {hiddenAgents > 0 && <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[var(--text-muted)]">+{hiddenAgents} more</span>}
      </div>

      {visibleTags.length > 0 && (
        <div suppressHydrationWarning className="mt-4 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => <span key={tag} className="text-[11px] text-[var(--text-muted)]">#{tag}</span>)}
        </div>
      )}

      <div suppressHydrationWarning className="mt-auto border-t border-white/10 pt-4">
        <div suppressHydrationWarning className="mb-3 flex items-center justify-between gap-3">
          <div suppressHydrationWarning className="inline-flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
            <Terminal className="h-3.5 w-3.5" />
            {skill.favoriteCount ?? 0} {(skill.favoriteCount ?? 0) === 1 ? 'save' : 'saves'}
          </div>
<div suppressHydrationWarning className="flex items-center gap-3">
          </div>
        </div>

        <InstallButton
          installCommand={skill.installCommand}
          owner={skill.owner}
          repoName={skill.repoName}
          agents={skill.agents}
          size="sm"
        />
      </div>
    </article>
  );
}
