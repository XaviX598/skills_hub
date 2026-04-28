'use client';

/**
 * Error boundary.
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 text-[var(--text-primary)]">
      <div className="glass-panel flex max-w-md flex-col items-center gap-4 rounded-[2rem] p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button onClick={() => reset()} className="btn-secondary" type="button">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

