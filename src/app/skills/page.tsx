/**
 * Skills browse page.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Database, Search } from 'lucide-react';
import { getOptionalSession } from '@/lib/session';
import { getDirectorySkills, parseCsvParam, parsePositiveIntegerParam } from '@/lib/skills';
import { SITE_URL } from '@/lib/site-url';
import { PlatformFilter } from '@/components/PlatformFilter';
import { SkillCard } from '@/components/SkillCard';

interface SkillsPageProps {
  searchParams: Promise<{ agents?: string; platforms?: string; query?: string; search?: string; category?: string; page?: string }>;
}

const SKILLS_PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Browse AI Agent Skills - Claude Code, OpenCode, MCP Skills Directory",
  description: "Search and filter reusable skills for Claude Code, OpenCode, Cursor, GitHub Copilot, Windsurf, Codex, MCP, Cline, and Continue. Find skills by category, agent, and functionality.",
  keywords: ["AI agent skills", "browse skills", "Claude Code skills", "OpenCode skills", "Cursor skills", "MCP skills", "Windsurf skills", "Codex skills", "search skills", "developer skills"],
  openGraph: {
    title: "Browse AI Agent Skills - Claude Code, OpenCode, MCP Skills Directory",
    description: "Search and filter reusable skills for Claude Code, OpenCode, Cursor, GitHub Copilot, Windsurf, Codex, MCP, Cline, and Continue.",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/skills`,
  },
};

function buildPageHref(params: {
  agents: string[];
  query: string;
  category: string;
  page: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set('query', params.query);
  if (params.agents.length > 0) searchParams.set('agents', params.agents.join(','));
  if (params.category) searchParams.set('category', params.category);
  if (params.page > 1) searchParams.set('page', String(params.page));

  const queryString = searchParams.toString();
  return queryString ? `/skills?${queryString}` : '/skills';
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function PaginationControls({
  page,
  totalPages,
  agents,
  query,
  category,
}: {
  page: number;
  totalPages: number;
  agents: string[];
  query: string;
  category: string;
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);
  const baseClass = 'inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors';
  const idleClass = 'border-white/10 bg-white/[0.04] text-[var(--text-secondary)] hover:border-cyan-300/35 hover:text-[var(--accent-cyan)]';
  const activeClass = 'border-cyan-300/45 bg-cyan-300/12 text-[var(--accent-cyan)]';
  const disabledClass = 'pointer-events-none border-white/5 bg-white/[0.02] text-[var(--text-muted)] opacity-45';

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Skills pagination">
      <Link
        href={buildPageHref({ agents, query, category, page: Math.max(page - 1, 1) })}
        aria-disabled={page === 1}
        className={`${baseClass} ${page === 1 ? disabledClass : idleClass}`}
      >
        Previous
      </Link>

      {visiblePages[0] > 1 && (
        <>
          <Link href={buildPageHref({ agents, query, category, page: 1 })} className={`${baseClass} ${idleClass}`}>
            1
          </Link>
          {visiblePages[0] > 2 && <span className="px-2 text-sm text-[var(--text-muted)]">…</span>}
        </>
      )}

      {visiblePages.map((visiblePage) => (
        <Link
          key={visiblePage}
          href={buildPageHref({ agents, query, category, page: visiblePage })}
          aria-current={visiblePage === page ? 'page' : undefined}
          className={`${baseClass} ${visiblePage === page ? activeClass : idleClass}`}
        >
          {visiblePage}
        </Link>
      ))}

      {visiblePages.at(-1)! < totalPages && (
        <>
          {visiblePages.at(-1)! < totalPages - 1 && <span className="px-2 text-sm text-[var(--text-muted)]">…</span>}
          <Link href={buildPageHref({ agents, query, category, page: totalPages })} className={`${baseClass} ${idleClass}`}>
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={buildPageHref({ agents, query, category, page: Math.min(page + 1, totalPages) })}
        aria-disabled={page === totalPages}
        className={`${baseClass} ${page === totalPages ? disabledClass : idleClass}`}
      >
        Next
      </Link>
    </nav>
  );
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const params = await searchParams;
  const selectedAgents = parseCsvParam(params.agents ?? params.platforms);
  const query = params.query ?? params.search ?? '';
  const category = params.category ?? '';
  const requestedPage = parsePositiveIntegerParam(params.page);
  const session = await getOptionalSession();
  const { skills, total, page, pageSize, totalPages, source } = await getDirectorySkills({
    agents: selectedAgents,
    query,
    category,
    page: requestedPage,
    pageSize: SKILLS_PAGE_SIZE,
    currentUserId: session?.user?.id,
  });
  const firstVisibleSkill = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleSkill = Math.min(page * pageSize, total);

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <section className="glass-panel mb-8 overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Directory</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Browse agent skills</h1>
              <p className="mt-4 max-w-3xl text-[var(--text-secondary)] leading-7">
                Search by intent: design systems, testing, deployment, security, documentation, Azure, Supabase, React, or any workflow you want an agent to perform better.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 font-mono text-2xl font-black">
                <Database className="h-5 w-5 text-[var(--accent-cyan)]" />
                {total.toLocaleString()}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">matching skills</div>
            </div>
          </div>

          {source === 'fallback' && (
            <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Showing the committed fallback catalog because the database is not available. Configure DATABASE_URL to enable live submissions and favorites.
            </p>
          )}
        </section>

        <form action="/skills" className="glass-panel mb-8 grid gap-3 rounded-3xl p-3 md:grid-cols-[1fr_auto]">
          <label className="sr-only" htmlFor="query">Search skills</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="query"
              name="query"
              defaultValue={query}
              className="input-shell min-h-12 w-full rounded-2xl pl-11 pr-4 text-sm placeholder:text-[var(--text-muted)]"
              placeholder="Search: UI review, React, Azure cost, browser automation, docs..."
            />
          </div>
          {selectedAgents.length > 0 && <input type="hidden" name="agents" value={selectedAgents.join(',')} />}
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-80">
            <div className="glass-panel sticky top-24 rounded-3xl p-5">
              <Suspense fallback={<div className="text-sm text-[var(--text-muted)]">Loading filters...</div>}>
                <PlatformFilter />
              </Suspense>
            </div>
          </aside>

          <section className="flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Showing {firstVisibleSkill.toLocaleString()}–{lastVisibleSkill.toLocaleString()} of {total.toLocaleString()} {total === 1 ? 'skill' : 'skills'}
                {category ? ` in ${category}` : ''}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Page {page.toLocaleString()} of {totalPages.toLocaleString()} · loading {pageSize} at a time
              </p>
            </div>

            {skills.length === 0 ? (
              <div className="surface-card rounded-3xl border-dashed py-16 text-center">
                <p className="text-[var(--text-secondary)]">No skills found. Try “design”, “testing”, “deploy”, “docs”, “Azure”, or clear your filters.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} redirectTo="/skills" />
                ))}
              </div>
            )}

            <PaginationControls
              page={page}
              totalPages={totalPages}
              agents={selectedAgents}
              query={query}
              category={category}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
