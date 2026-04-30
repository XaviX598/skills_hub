'use client';

import { useMemo, useState } from 'react';
import { Copy, KeyRound, Laptop, Loader2, ShieldX } from 'lucide-react';

interface ProfileDesktopAccessCardProps {
  activeDevice: {
    name: string;
    createdAt: string;
    expiresAt: string;
  } | null;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function ProfileDesktopAccessCard({ activeDevice }: ProfileDesktopAccessCardProps) {
  const [pairingToken, setPairingToken] = useState<{
    token: string;
    expiresAt: string;
    expiresInMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState<'generate' | 'revoke' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const expiryLabel = useMemo(() => {
    if (!pairingToken?.expiresAt) return null;
    return formatDate(pairingToken.expiresAt);
  }, [pairingToken?.expiresAt]);

  async function generateToken() {
    setLoading('generate');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/desktop/pairing-token', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not generate token');
      }

      setPairingToken(data);
      setSuccess('Desktop token generated. Paste it into the desktop app before it expires.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate token');
    } finally {
      setLoading(null);
    }
  }

  async function revokeDevice() {
    setLoading('revoke');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/desktop/session', { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not revoke device');
      }

      setSuccess('Desktop device disconnected. You can now link another computer.');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke device');
    } finally {
      setLoading(null);
    }
  }

  async function copyToken() {
    if (!pairingToken?.token) return;
    await navigator.clipboard.writeText(pairingToken.token);
    setSuccess('Token copied. Open the desktop app and paste it there.');
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold">Desktop app access</h2>
      <div className="glass-panel rounded-[2rem] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-[var(--accent-cyan)]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">One-time desktop token</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Generate a one-time token in the web profile, paste it into the desktop app, and the app will link this account automatically.
                  Creating a new desktop session disconnects the previous computer.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={generateToken} disabled={loading !== null} className="btn-secondary">
                {loading === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Generate token
              </button>
              {pairingToken?.token && (
                <button onClick={copyToken} className="btn-secondary">
                  <Copy className="h-4 w-4" />
                  Copy token
                </button>
              )}
            </div>

            {pairingToken?.token && (
              <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-100">Token</p>
                <p className="mt-2 break-all font-mono text-2xl font-black tracking-[0.14em] text-white">{pairingToken.token}</p>
                <p className="mt-3 text-sm text-emerald-100/90">
                  Expires in {pairingToken.expiresInMinutes} minutes{expiryLabel ? ` · ${expiryLabel}` : ''}.
                </p>
              </div>
            )}

            {(error || success) && (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? 'border-red-300/30 bg-red-300/10 text-red-100'
                  : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
              }`}>
                {error ?? success}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--text-primary)]">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Current linked computer</h3>
                {activeDevice ? (
                  <>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">{activeDevice.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Linked on {formatDate(activeDevice.createdAt)}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Session valid until {formatDate(activeDevice.expiresAt)}</p>
                    <button onClick={revokeDevice} disabled={loading !== null} className="btn-secondary mt-4">
                      {loading === 'revoke' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                      Disconnect this computer
                    </button>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    No computer linked yet. Generate a one-time token and paste it into the desktop app.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
