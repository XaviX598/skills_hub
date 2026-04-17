import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Terminal } from 'lucide-react';
import { getAgentById } from '@/data/agents';

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const agent = getAgentById(id);

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
            <Link href={`/skills?agents=${agent.id}`} className="btn-primary">
              Skills for {agent.name}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
