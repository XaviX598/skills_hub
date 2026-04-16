/**
 * Skill card.
 *
 * Server component: the favorite button posts directly to a Server Action, so
 * it works progressively even before client JavaScript hydrates.
 */

import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Heart, Terminal } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/favorite';
import { getAgentName } from '@/data/agents';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
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
    <article className="card-hover surface-card group relative flex min-h-[300px] flex-col overflow-hidden rounded-3xl p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-60" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {skill.category && (
              <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-cyan)]">
                {skill.category}
              </span>
            )}
            {skill.owner && (
              <span className="truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">
                {skill.owner}/{skill.repoName}
              </span>
            )}
          </div>

          <Link
            href={`/skills/${skill.id}`}
            className="group/title inline-flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-cyan)]"
          >
            <span className="line-clamp-1">{skill.name}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
          </Link>

          <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--text-secondary)]">
            {skill.description}
          </p>
        </div>

        {showFavorite && (
          <form action={toggleFavorite}>
            <input type="hidden" name="skillId" value={skill.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition-colors hover:border-rose-300/30 hover:bg-rose-400/10"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorited ? 'fill-[var(--accent-crimson)] text-[var(--accent-crimson)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>
          </form>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {visibleAgents.map((agent) => (
          <Link
            key={agent}
            href={`/skills?agents=${encodeURIComponent(agent)}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-cyan-300/30 hover:text-[var(--accent-cyan)]"
          >
            {getAgentName(agent)}
          </Link>
        ))}
        {hiddenAgents > 0 && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[var(--text-muted)]">
            +{hiddenAgents} more
          </span>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span key={tag} className="text-[11px] text-[var(--text-muted)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
          <Terminal className="h-3.5 w-3.5" />
          {skill.favoriteCount ?? 0} {(skill.favoriteCount ?? 0) === 1 ? 'save' : 'saves'}
        </div>
        <div className="flex items-center gap-3">
          {skill.repositoryUrl && (
            <a
              href={skill.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              Repo
            </a>
          )}
          {skill.documentationUrl && (
            <a
              href={skill.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
