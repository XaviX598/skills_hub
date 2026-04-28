/**
 * Skill submission page.
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { SubmitSkillForm } from '@/components/forms/SubmitSkillForm';

export default async function SubmitPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/submit');
  }

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <section className="glass-panel mb-8 rounded-[2rem] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Contribute</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Submit a GitHub skill</h1>
          <p className="mt-4 leading-7 text-[var(--text-secondary)]">
            Add a skill that lives in a GitHub repository. GitHub login gives every submission a minimal identity trail, which keeps the catalog safer than anonymous links.
          </p>
        </section>

        <div className="surface-card rounded-[2rem] p-6">
          <SubmitSkillForm />
        </div>
      </div>
    </main>
  );
}
