import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, Terminal } from 'lucide-react';
import { getAgentById, resolveAgentAlias } from '@/data/agents';
import { SITE_URL } from '@/lib/site-url';

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { id } = await params;
  // Resolve alias (e.g., "claude" -> "claude-code")
  const resolvedId = resolveAgentAlias(id);
  const agent = getAgentById(resolvedId);

  if (!agent) {
    return {
      title: "Agent Not Found",
      description: "The requested AI coding agent could not be found.",
    };
  }

  const installKeywords = `install ${agent.name}, setup ${agent.name}, how to use ${agent.name}, ${agent.name} skills, ${agent.name} configuration`;
  const competitiveKeywords = getCompetitiveKeywords(agent.name);

  return {
    title: `${agent.name} Installation Guide - How to Install and Use ${agent.name}`,
    description: `Learn how to install and use ${agent.name}. Step-by-step guide: ${agent.installSummary}. ${agent.vendor} provides AI coding capabilities.`,
    keywords: [installKeywords, competitiveKeywords, 'AI coding agent', 'developer tools', 'code assistant'],
    openGraph: {
      title: `${agent.name} Installation Guide - Setup ${agent.name}`,
      description: `Complete guide to install and configure ${agent.name}. Learn how to add skills and use AI coding capabilities.`,
      type: "website",
    },
    alternates: {
      canonical: `${SITE_URL}/agents/${id}`,
    },
  };
}

function getCompetitiveKeywords(agentName: string): string {
  const keywords: Record<string, string> = {
    'claude-code': 'Claude Code, Anthropic Claude, Claude AI',
    'opencode': 'OpenCode AI, Cursor alternative, Windsurf alternative',
    'cursor': 'Cursor AI, Copilot alternative, code completion',
    'windsurf': 'Windsurf AI, Codeium Windsurf, AI coding',
    'github-copilot': 'GitHub Copilot, Copilot, Microsoft Copilot',
    'codex': 'OpenAI Codex, Codex CLI, AI CLI',
    'gemini-cli': 'Google Gemini CLI, Gemini AI, Bard CLI',
    'cline': 'Cline, Cline AI, VS Code AI',
    'continue': 'Continue AI, Continue GPT',
    'mcp': 'MCP, Model Context Protocol, Anthropic MCP',
  };
  return keywords[agentName.toLowerCase()] || '';
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  // Resolve alias (e.g., "claude" -> "claude-code")
  const resolvedId = resolveAgentAlias(id);
  const agent = getAgentById(resolvedId);

  if (!agent) {
    notFound();
  }

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <Link href="/agents" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">
          <ArrowLeft className="h-4 w-4" />
          Back to help center
        </Link>

        <section className="glass-panel rounded-[2rem] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">{agent.vendor}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Install and use {agent.name}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--text-secondary)]">{agent.description}</p>

          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-[var(--accent-cyan)]">
              <Terminal className="h-4 w-4" />
              Quick summary
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{agent.installSummary}</p>
          </div>

          <h2 className="mt-8 text-2xl font-bold">Setup steps</h2>
          <ol className="mt-4 space-y-3">
            {agent.installSteps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="font-mono text-sm font-bold text-[var(--accent-cyan)]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-sm leading-6 text-[var(--text-secondary)]">{step}</span>
              </li>
            ))}
          </ol>

          {agent.skillLocation && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-bold">Where skills live</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{agent.skillLocation}</p>
            </div>
          )}

          {agent.skillNotes && agent.skillNotes.length > 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-bold">Notes</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
                {agent.skillNotes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <a href={agent.docsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Official docs <ExternalLink className="h-4 w-4" />
            </a>
            {agent.websiteUrl && (
              <a href={agent.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Website <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Link href={`/skills?agents=${agent.id}`} className="btn-secondary">
              Skills for {agent.name}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

