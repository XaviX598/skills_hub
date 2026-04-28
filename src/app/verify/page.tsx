import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPrisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { VerifyForm } from './verify-form';

interface VerifyPageProps {
  searchParams: Promise<{ email: string; callbackUrl?: string; error?: string; message?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const session = await getCurrentSession();
  const { email, callbackUrl = '/app', error } = await searchParams;

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isVerified: true, verificationCodeExpires: true },
  });

  if (!user) {
    redirect(`/login?register=true&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (user.isVerified) {
    redirect(`/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const isExpired = Boolean(user.verificationCodeExpires && user.verificationCodeExpires < new Date());

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 text-[var(--text-primary)]">
      <section className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Verification</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Check your email</h1>
        <p className="mb-8 mt-3 leading-6 text-[var(--text-secondary)]">
          We sent a 6-digit code to <span className="font-medium text-[var(--text-primary)]">{email}</span>
        </p>

        {error && <div className="mb-6 rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</div>}
        {isExpired && <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Your verification code has expired. Please request a new one.</div>}

        <VerifyForm email={email} callbackUrl={callbackUrl} />

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <p className="text-[var(--text-muted)]">Didn't receive the code?</p>
          <form
            action={async () => {
              'use server';
              await resendCode(email, callbackUrl);
            }}
          >
            <button type="submit" className="cursor-pointer text-[var(--accent-cyan)] hover:underline">
              Resend code
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[var(--accent-cyan)] hover:underline">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}

async function resendCode(email: string, callbackUrl: string) {
  'use server';

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      isVerified: true,
      verificationCodeSentAt: true,
      verificationCodeAttempts: true,
      name: true,
    },
  });

  if (!user || user.isVerified) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Progressive rate limit: 1min -> 3min -> 5min -> 15min
  const attemptCount = user.verificationCodeAttempts || 0;
  const cooldownPeriods = [60000, 180000, 300000, 900000]; // 1, 3, 5, 15 minutes in ms
  const cooldownIndex = Math.min(attemptCount, cooldownPeriods.length - 1);
  const cooldownMs = cooldownPeriods[cooldownIndex];

  if (user.verificationCodeSentAt) {
    const timeSinceLastSent = Date.now() - user.verificationCodeSentAt.getTime();
    if (timeSinceLastSent < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
      redirect(`/verify?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}&error=${encodeURIComponent(`Please wait ${waitSeconds} seconds before requesting a new code (attempt ${attemptCount + 1})`)}`);
    }
  }

  const { generateVerificationCode, getCodeExpiration, sendVerificationEmail } = await import('@/lib/email');
  const verificationCode = generateVerificationCode();
  const codeExpiration = getCodeExpiration();

  await prisma.user.update({
    where: { email },
    data: {
      verificationCode,
      verificationCodeExpires: codeExpiration,
      verificationCodeSentAt: new Date(),
      verificationCodeAttempts: attemptCount + 1,
    },
  });

  await sendVerificationEmail({
    to: email,
    name: user.name || 'User',
    code: verificationCode,
  });

  redirect(`/verify?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}&message=${encodeURIComponent('Code sent successfully')}`);
}
