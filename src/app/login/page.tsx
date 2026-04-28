import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { signIn } from '@/lib/auth';
import { getCurrentSession } from '@/lib/session';
import { LoginForm } from './login-form';
import { RegisterForm } from '../download/register-form';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; registered?: string; register?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  const { callbackUrl = '/app', registered, register } = await searchParams;

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  const isRegisterMode = register === 'true';

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 text-[var(--text-primary)]">
      <section className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Authentication</p>

        {isRegisterMode ? (
          <>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Create your account</h1>
            <p className="mb-8 mt-3 leading-6 text-[var(--text-secondary)]">
              Sign up to save favorites, submit skills, and access premium features.
            </p>

            <RegisterForm callbackUrl={callbackUrl} />

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[var(--accent-cyan)] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="mb-8 mt-3 leading-6 text-[var(--text-secondary)]">
              Sign in to save favorites, submit skills, and access premium features.
            </p>

            <form
              action={async () => {
                'use server';
                await signIn('github', { redirectTo: callbackUrl });
              }}
            >
              <button type="submit" className="btn-secondary w-full">
                <GitHubIcon className="h-5 w-5" />
                Continue with GitHub
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-xs text-[var(--text-muted)]">or</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <LoginForm callbackUrl={callbackUrl} />

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Don't have an account?{' '}
              <Link href={`/login?register=true&callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[var(--accent-cyan)] hover:underline">
                Create one
              </Link>
            </p>

            {registered === 'true' && (
              <p className="mt-4 text-sm text-[var(--accent-emerald)]">
                Account created! Please sign in.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
