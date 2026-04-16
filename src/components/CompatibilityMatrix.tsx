/**
 * Compatibility matrix.
 */

import { Check, X } from 'lucide-react';
import { AGENTS, getAgentName } from '@/data/agents';
import type { Skill } from '@/types';

interface CompatibilityMatrixProps {
  skill: Skill;
  className?: string;
}

export function CompatibilityMatrix({ skill, className }: CompatibilityMatrixProps) {
  const knownAgentIds = new Set(AGENTS.map((agent) => agent.id));
  const extraAgents = skill.agents.filter((agent) => !knownAgentIds.has(agent));
  const allAgents = [...AGENTS.map((agent) => agent.id), ...extraAgents];

  return (
    <div className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-cyan)]">Compatibility</p>
          <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Agent support matrix</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{skill.agents.length} supported</p>
      </div>

      <div className="surface-card overflow-hidden rounded-3xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Agent
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {allAgents.map((agent) => {
              const isSupported = skill.agents.includes(agent);

              return (
                <tr key={agent} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                    {getAgentName(agent)}
                  </td>
                  <td className="px-4 py-3">
                    {isSupported ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
                        <Check className="h-3.5 w-3.5" />
                        Supported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        <X className="h-3.5 w-3.5" />
                        Not listed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
