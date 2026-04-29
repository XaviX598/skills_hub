import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, ChevronRight, Clock, Crown, Download, ExternalLink, Lock, Monitor, ShieldCheck, Sparkles, Terminal, Zap } from 'lucide-react';
import { getCurrentSession } from '@/lib/session';
import { getDirectorySkills } from '@/lib/skills';
import { getPrisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/site-url';
import { SkillCard } from '@/components/SkillCard';

const DESKTOP_RELEASE_URL = 'https://github.com/XaviX598/skills_hub/releases/latest/download/Universal-Skills-Hub.exe';
const DESKTOP_SOURCE_URL = 'https://github.com/XaviX598/skills_hub/tree/main/desktop-app';

export const metadata: Metadata = {
  title: 'Desktop App for AI Agent Skills - Skills Hub - Claude Code, OpenCode, MCP',
  description: 'Download the Skills Hub desktop app for Windows. Browse the synced catalog, install Claude Code skills, OpenCode skills, MCP skills, and more in 1 click.',
  keywords: [
    'desktop app for AI skills', 'Windows app for Claude Code skills', 'claude code', 'claude skills',
    'OpenCode skills desktop', 'opencode', 'open code',
    'MCP skills desktop app', 'mcp',
    'Codex skills desktop app', 'Cursor skills', 'Windsurf skills',
    'AI agent skills installer', 'Skills Hub desktop'
  ],
  openGraph: {
    title: 'Skills Hub Desktop App for Windows',
    description: 'Browse the synced Skills Hub catalog and install AI agent skills in 1 click from the desktop app.',
    url: `${SITE_URL}/app`,
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/app`,
  },
};

interface AppPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

const appHighlights = [
  {
    icon: Terminal,
    title: 'Detects installed agents',
    description: 'The app scans your environment and finds Claude Code, Cursor, OpenCode, Windsurf and more.',
  },
  {
    icon: Zap,
    title: '1-click installation',
    description: 'Select a skill and the app runs the commands for you without copy-pasting.',
  },
  {
    icon: ShieldCheck,
    title: 'Centralized catalog',
    description: 'Uses the same directory as the site so premium gets a consistent experience.',
  },
];

const appSteps = [
  'Open the desktop app.',
  'The app detects which agents you have available.',
  'Pick a skill from the catalog and install it in seconds.',
];

function AccessPanel({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
  isPremium?: boolean;
}) {
if (!isLoggedIn) {
    return (
      <div className="glass-panel rounded-[2rem] p-6 md:p-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          <Lock className="h-3.5 w-3.5" />
          Access blocked
        </div>
        <h2 className="text-2xl font-black tracking-tight">Sign in to download</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          You can see what the app does, but to download it you need to sign in with your account.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login?callbackUrl=/app" className="btn-secondary">
            Sign in
          </Link>
          <Link href="/skills" className="btn-secondary">
            Browse skills
          </Link>
        </div>
      </div>
    );
  }

// User is logged in - but download is coming soon
  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-7">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-amber)]">
        <Clock className="h-3.5 w-3.5" />
        Coming Soon
      </div>
      <h2 className="text-2xl font-black tracking-tight">App in development</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        The desktop app is currently in development. Sign up to get early access when it's available.
      </p>
<div className="mt-6 flex flex-col gap-3">
        <button disabled className="btn-disabled inline-flex items-center justify-center gap-2 text-base cursor-not-allowed opacity-50">
          <Download className="h-5 w-5" />
          Download for Windows
        </button>
        <p className="text-xs text-center text-[var(--text-muted)]">Available soon</p>
      </div>
    </div>
  );
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await getCurrentSession();
  
  // Require authentication for desktop app access (for future premium control)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/app');
  }
  
  const params = await searchParams;
  const prisma = getPrisma();

  const currentUserId = session?.user?.id;
  const premiumUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { isPremium: true, premiumExpiresAt: true },
      })
    : null;

  const isPremium = Boolean(
    premiumUser?.isPremium && premiumUser.premiumExpiresAt && premiumUser.premiumExpiresAt > new Date(),
  );

  const { skills } = await getDirectorySkills({ currentUserId, limit: 6 });
  const showSuccess = params.success === 'true';
  const showCanceled = params.canceled === 'true';
  const isLoggedIn = Boolean(session?.user?.id);
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Skills Hub Desktop App',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows',
    description: 'Windows desktop app to browse the synced Skills Hub catalog and install AI agent skills in 1 click.',
    downloadUrl: DESKTOP_RELEASE_URL,
    isAccessibleForFree: false,
    url: `${SITE_URL}/app`,
    offers: {
      '@type': 'Offer',
      category: 'subscription',
      price: '9.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/app`,
    },
  };

  return (
    <main className="flex-1 text-[var(--text-primary)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.16),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-semibold text-[var(--accent-violet)]">
                <Sparkles className="h-4 w-4" />
                Skills Hub Desktop App
              </div>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Install AI agent skills from a{' '}
                <span className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-violet)] bg-clip-text text-transparent">
                  desktop app
                </span>
              </h1>

<p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)] md:text-xl">
                The web helps you discover the catalog; the app handles the operational part: detecting agents, choosing skills, and installing them in 1 click.
              </p>

<div className="mt-8 flex flex-wrap gap-3">
                <Link href="/skills" className="btn-secondary">
                  View full catalog
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <AccessPanel
                isLoggedIn={isLoggedIn}
                isPremium={isPremium}
              />

<div className="glass-panel rounded-[2rem] p-6 md:p-7">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--accent-cyan)]">
                  <Monitor className="h-4 w-4" />
                  Usage flow
                </div>
                <ol className="space-y-4">
                  {appSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-bold text-[var(--accent-cyan)]">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-[var(--text-secondary)]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Why it matters</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Same visual language, better operational experience</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              The idea is not just to have an app. The idea is to close the loop: you discover on the web, manage access via premium, and execute installation from desktop.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {appHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="glass-panel rounded-[2rem] p-7">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    <Icon className="h-5 w-5 text-[var(--accent-cyan)]" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-[2rem] p-7">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Access logic</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Access logic explained</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="font-semibold text-white">No session</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">See app description and a CTA to sign in.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="font-semibold text-white">Session, no premium</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">See the premium pitch and purchase button.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="font-semibold text-white">Session with premium</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">See direct .exe download and source code access.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-7">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Release</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Release status</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              The page points to a GitHub release and the desktop-app folder in the repo. The intent is well structured, but remember to manually validate the final .exe asset whenever you publish a new version.
            </p>
<div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={DESKTOP_RELEASE_URL} className="btn-secondary inline-flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Open release
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-cyan)]">Preview</p>
              <h2 className="mt-2 text-3xl font-bold">Skills que la app puede mostrar</h2>
            </div>
            <Link href="/skills" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]">
              View all on the web
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} redirectTo="/app" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
