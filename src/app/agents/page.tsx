import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { AGENTS } from '@/data/agents';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: "AI Coding Agents Guide - Install Claude Code, OpenCode, Cursor, Codex",
  description: "Step-by-step installation guides for Claude Code, OpenCode, Cursor, Windsurf, GitHub Copilot, Codex, Gemini CLI, Cline, Continue. Learn how to install and configure each AI coding agent.",
  keywords: ["install Claude Code", "setup OpenCode", "Cursor installation", "Windsurf setup", "Codex guide", "MCP installation", "AI coding agents", "Claude Code setup", "AI agent guide"],
  openGraph: {
    title: "AI Coding Agents Guide - Install Claude Code, OpenCode, Cursor, Codex",
    description: "Step-by-step installation guides for Claude Code, OpenCode, Cursor, Windsurf, GitHub Copilot, Codex, Gemini CLI, Cline, Continue.",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/agents`,
  },
};

export default function AgentsPage() {
  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <section className="glass-panel rounded-[2rem] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Help center</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Agent installation guides</h1>
          <p className="mt-4 max-w-3xl text-[var(--text-secondary)] leading-7">
            Learn how each agent handles setup, reusable instructions, and skill-like workflows. Do not install random instruction packs blindly: inspect repositories, understand permissions, and validate the first run.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            Concepts first. Tools second. Verification always.
          </div>
        </section>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="card-hover surface-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{agent.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{agent.vendor}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 text-[var(--accent-cyan)]">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{agent.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-cyan)]">
                Read guide <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
