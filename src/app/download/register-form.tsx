'use client';

import { useState } from 'react';
import { registerUser } from '@/app/actions/register';
import { Eye, EyeOff, Loader2, Info } from 'lucide-react';

interface RegisterFormProps {
  callbackUrl?: string;
}

const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character (!@#$%)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function RegisterForm({ callbackUrl = '/app' }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const result = await registerUser(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.requiresVerification) {
        window.location.href = `/verify?email=${encodeURIComponent(result.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm text-red-100">
          {error}
        </div>
      )}
      
      <div>
        <input type="text" name="name" placeholder="Your name" required minLength={2} className="input-shell w-full rounded-2xl px-4 py-3 text-sm" />
      </div>
      
      <div>
        <input type="email" name="email" placeholder="your@email.com" required className="input-shell w-full rounded-2xl px-4 py-3 text-sm" />
      </div>
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-shell w-full rounded-2xl px-4 py-3 pr-20 text-sm"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowRequirements(true)}
              onMouseLeave={() => setShowRequirements(false)}
              className="cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              <Info className="h-4 w-4" />
            </button>
            {showRequirements && (
              <div
                className="absolute right-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[var(--bg-primary)] p-3 shadow-lg"
                onMouseEnter={() => setShowRequirements(true)}
                onMouseLeave={() => setShowRequirements(false)}
              >
                <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Password requirements:</p>
                <ul className="flex flex-col gap-1">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const met = req.test(password);
                    return (
                      <li key={req.key} className={`flex items-center gap-2 text-xs ${met ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${met ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--text-muted)]'}`} />
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <input type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm password" required minLength={8} className="input-shell w-full rounded-2xl px-4 py-3 text-sm" />
      </div>

      <button type="submit" disabled={loading} className="btn-secondary inline-flex w-full items-center justify-center gap-2 py-3">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create free account'
        )}
      </button>
    </form>
  );
}
