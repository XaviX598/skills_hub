'use client';

import { useState, type MouseEvent } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import Link from 'next/link';

interface InstallButtonProps {
  installCommand?: string;
  owner?: string;
  repoName?: string;
  agents: string[];
  size?: 'sm' | 'md';
}

export function InstallButton({ installCommand, owner, repoName, agents, size = 'md' }: InstallButtonProps) {
  const [copied, setCopied] = useState(false);

  const command = installCommand ?? (owner && repoName ? `npx skills add ${owner}/${repoName}` : null);

  if (!command) {
    return null;
  }

  const handleCopyOnly = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/app"
        className={`btn-secondary inline-flex items-center gap-1.5 ${padding} ${textSize}`}
        title="Instalar con la app de escritorio en 1 click"
      >
        <Download className={iconSize} />
        <span>Instala en 1 click</span>
      </Link>

      <button
        onClick={handleCopyOnly}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 text-[var(--text-muted)] transition-all hover:border-white/20 hover:text-[var(--text-secondary)] ${padding} ${textSize}`}
        title="Copiar comando de instalacion"
      >
        {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
      </button>
    </div>
  );
}
