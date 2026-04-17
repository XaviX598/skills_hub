'use client';

/**
 * Directory filters.
 *
 * Updates URL search params so filtered views are shareable.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, RotateCcw } from 'lucide-react';
import { AGENTS } from '@/data/agents';

const CATEGORY_OPTIONS = [
  'AI & Automation',
  'Cloud & DevOps',
  'Design',
  'Development',
  'Docs & Writing',
  'Frontend',
  'Marketing',
  'Productivity',
  'Security',
  'Testing & Review',
];

interface PlatformFilterProps {
  className?: string;
}

export function PlatformFilter({ className }: PlatformFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedAgents = searchParams.get('agents')?.split(',').filter(Boolean) || [];
  const selectedCategory = searchParams.get('category') || '';

  const pushParams = (params: URLSearchParams) => {
    const next = params.toString();
    router.push(next ? `?${next}` : '/skills', { scroll: false });
  };

  const toggleAgent = (agentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get('agents')?.split(',').filter(Boolean) || [];

    const updated = current.includes(agentId)
      ? current.filter((agent) => agent !== agentId)
      : [...current, agentId];

    if (updated.length > 0) {
      params.set('agents', updated.join(','));
    } else {
      params.delete('agents');
    }

    params.delete('page');
    pushParams(params);
  };

  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCategory === category) {
      params.delete('category');
    } else {
      params.set('category', category);
    }

    params.delete('page');
    pushParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('agents');
    params.delete('category');
    params.delete('page');
    pushParams(params);
  };

  return (
    <div suppressHydrationWarning className={className}>
      <div suppressHydrationWarning className="mb-5 flex items-center justify-between gap-3">
        <div suppressHydrationWarning>
          <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]">
            Filters
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Shareable URL state</p>
        </div>
        {(selectedAgents.length > 0 || selectedCategory) && (
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--accent-cyan)]">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div suppressHydrationWarning className="space-y-6">
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Agents</h4>
          <div suppressHydrationWarning className="space-y-2">
            {AGENTS.map((agent) => (
              <label key={agent.id} className="group flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:border-cyan-300/25 hover:bg-cyan-300/5">
                <Checkbox.Root
                  checked={selectedAgents.includes(agent.id)}
                  onCheckedChange={() => toggleAgent(agent.id)}
                  className="flex h-4 w-4 items-center justify-center rounded border border-[var(--border-active)] transition-colors data-[state=checked]:border-[var(--accent-cyan)] data-[state=checked]:bg-[var(--accent-cyan)]"
                >
                  <Checkbox.Indicator>
                    <Check className="h-3 w-3 text-black" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-cyan)]">
                  {agent.name}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Categories</h4>
          <div suppressHydrationWarning className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategory(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-cyan-300/45 bg-cyan-300/12 text-[var(--accent-cyan)]'
                      : 'border-white/10 bg-white/[0.03] text-[var(--text-secondary)] hover:border-cyan-300/30 hover:text-[var(--accent-cyan)]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
