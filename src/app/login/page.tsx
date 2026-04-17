import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { GitHubIcon } from '@/components/icons/GitHubIcon';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { callbackUrl = '/skills' } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 text-[var(--text-primary)]">
      <section className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Authentication</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Sign in with GitHub</h1>
        <p className="mb-8 mt-3 leading-6 text-[var(--text-secondary)]">
          GitHub is only required when you want to publish skills or save favorites. The directory and help center stay public.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="btn-primary w-full">
            <GitHubIcon className="h-5 w-5" />
            Continue with GitHub
          </button>
        </form>
      </section>
    </main>
  );
}
