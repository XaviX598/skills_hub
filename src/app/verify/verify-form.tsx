'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VerifyFormProps {
  email: string;
  callbackUrl?: string;
}

export function VerifyForm({ email, callbackUrl = '/app' }: VerifyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('message');
    if (msg) {
      setMessage(msg);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const code = [
      formData.get('digit1'),
      formData.get('digit2'),
      formData.get('digit3'),
      formData.get('digit4'),
      formData.get('digit5'),
      formData.get('digit6'),
    ].join('');

    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      window.location.href = `/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  function handleInput(index: number, value: string) {
    if (value.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pastedData = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedData)) {
      e.preventDefault();
      for (let i = 0; i < 6; i += 1) {
        if (inputRefs.current[i]) {
          inputRefs.current[i]!.value = pastedData[i];
        }
      }
      inputRefs.current[5]?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message && <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">{message}</div>}
      {error && <div className="rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm text-red-100">{error}</div>}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            name={`digit${i + 1}`}
            inputMode="numeric"
            maxLength={1}
            required
            onInput={(e) => handleInput(i, e.currentTarget.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="input-shell h-14 w-12 rounded-xl border border-white/80 text-center text-xl font-bold tracking-widest shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            style={{ fontFamily: 'monospace' }}
          />
        ))}
      </div>

      <button type="submit" disabled={loading} className="btn-secondary mt-4 w-full justify-center">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify email'
        )}
      </button>
    </form>
  );
}
