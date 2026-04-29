'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, ExternalLink, LogIn, Shield } from 'lucide-react';

interface AuthorizePageProps {
  searchParams: Promise<{ code?: string; device?: string }>;
}

export default function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const [status, setStatus] = useState<'loading' | 'needs-login' | 'authorized'>('loading');
  const [code, setCode] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>('desktop app');

  useEffect(() => {
    async function checkAuth() {
      const params = await searchParams;
      const authCode = params.code;
      const device = params.device || 'desktop app';
      
      setDeviceName(device);
      
      if (!authCode) {
        setStatus('needs-login');
        return;
      }
      
      setCode(authCode);
      
      // Check if user is logged in
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        
        if (session?.user?.id) {
          setStatus('authorized');
        } else {
          setStatus('needs-login');
        }
      } catch {
        setStatus('needs-login');
      }
    }
    
    checkAuth();
  }, [searchParams]);

  async function handleAuthorize() {
    if (!code) return;
    
    try {
      // Mark the code as used
      await fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      // Open the app via custom protocol
      window.location.href = `skills-hub://auth?code=${code}`;
    } catch (error) {
      console.error('Authorization failed:', error);
    }
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="glass-panel rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-[var(--text-secondary)]">Checking authorization...</p>
        </div>
      </main>
    );
  }

  if (status === 'needs-login') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
        <section className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
            <LogIn className="h-8 w-8 text-[var(--accent-amber)]" />
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            You need to sign in to authorize the {deviceName}.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link 
              href={`/login?callbackUrl=${encodeURIComponent(window.location.href)}`}
              className="btn-primary"
            >
              Sign in
            </Link>
            <Link href="/" className="btn-secondary">
              Go to homepage
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Authorized - show authorize button
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <section className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
          <Shield className="h-8 w-8 text-[var(--accent-emerald)]" />
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Authorize {deviceName}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Your account is connected. Click below to authorize access.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={handleAuthorize} className="btn-primary inline-flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Authorize
          </button>
          <p className="text-xs text-[var(--text-muted)]">
            This will redirect you back to the app
          </p>
        </div>
      </section>
    </main>
  );
}