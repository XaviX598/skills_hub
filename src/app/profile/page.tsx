/**
 * User profile page.
 */

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getPrisma } from '@/lib/prisma';
import { toSkill } from '@/lib/skills';
import { SkillCard } from '@/components/SkillCard';
import { User } from 'lucide-react';
import { BillingPortalButton } from '@/components/BillingPortalButton';

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  const userId = session.user.id;
  const prisma = getPrisma();

  const [user, submittedSkills, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isPremium: true, premiumExpiresAt: true },
    }),
    prisma.skill.findMany({
      where: { authorId: userId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        favorites: { where: { userId }, select: { id: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: {
        skill: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            favorites: { where: { userId }, select: { id: true } },
            _count: { select: { favorites: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) {
    redirect('/login?callbackUrl=/profile');
  }

  const submitted = submittedSkills.map((skill) => toSkill(skill, userId));
  const favorited = favorites.map((favorite) => toSkill(favorite.skill, userId));
  const hasPremium = Boolean(user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > new Date());

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <section className="glass-panel mb-8 rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt={user.name || 'Profile'} width={72} height={72} unoptimized className="rounded-3xl" />
            ) : (
              <div className="grid h-[72px] w-[72px] place-items-center rounded-3xl bg-white/10">
                <User className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
            )}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-cyan)]">Profile</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{user.name || 'Anonymous User'}</h1>
              <p className="text-[var(--text-secondary)]">{user.email}</p>
              {hasPremium && (
                <span className="mt-1 inline-block rounded-full bg-[var(--accent-violet)]/20 px-3 py-1 text-xs font-bold text-[var(--accent-violet)]">
                  Premium
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--text-secondary)]">
              <span className="font-mono text-2xl font-black text-[var(--text-primary)]">{submitted.length}</span>
              <div className="mt-1 uppercase tracking-[0.16em] text-[var(--text-muted)]">Submitted skills</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--text-secondary)]">
              <span className="font-mono text-2xl font-black text-[var(--text-primary)]">{favorited.length}</span>
              <div className="mt-1 uppercase tracking-[0.16em] text-[var(--text-muted)]">Saved favorites</div>
            </div>
          </div>

          {hasPremium && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="mb-3 text-sm text-[var(--text-secondary)]">
                Manage your subscription, payment method, and invoices from Stripe Customer Portal.
              </div>
              <BillingPortalButton />
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold">My submitted skills</h2>
          {submitted.length === 0 ? (
            <div className="surface-card rounded-3xl p-6 text-[var(--text-secondary)]">You have not submitted any skills yet.</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {submitted.map((skill) => <SkillCard key={skill.id} skill={skill} redirectTo="/profile" />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">My favorites</h2>
          {favorited.length === 0 ? (
            <div className="surface-card rounded-3xl p-6 text-[var(--text-secondary)]">You have not saved any skills yet.</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {favorited.map((skill) => <SkillCard key={skill.id} skill={skill} isFavorited redirectTo="/profile" />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
