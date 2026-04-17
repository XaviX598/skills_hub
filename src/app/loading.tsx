/**
 * Loading state.
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center text-[var(--text-primary)]">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-[2rem] p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-cyan)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}
