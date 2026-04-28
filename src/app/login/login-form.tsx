'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/app' }: LoginFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.error) {
        if (data.error.startsWith('VERIFY_REQUIRED:')) {
          const userEmail = data.error.replace('VERIFY_REQUIRED:', '');
          router.push(`/verify?email=${encodeURIComponent(userEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch (err) {
      console.error('[LOGIN] Error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {error && (
        <div className="rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="input-shell w-full rounded-2xl px-4 py-3 text-sm"
        />
      </div>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="input-shell w-full rounded-2xl px-4 py-3 pr-12 text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="btn-secondary w-full justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </div>
  );
}
