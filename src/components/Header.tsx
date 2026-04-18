/**
 * Global navigation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { getOptionalSession } from '@/lib/session';
import { AGENTS } from '@/data/agents';
import { ArrowRight, BookOpen, ChevronDown, LogIn, LogOut, Plus, Search, Sparkles, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const navItems = [
  { href: '/skills', label: 'Directory', icon: Search },
];

export async function Header({ className }: HeaderProps) {
  const session = await getOptionalSession();

  return (
    <header className={`sticky top-0 z-50 border-b border-white/10 bg-[var(--bg-primary)]/72 backdrop-blur-xl ${className ?? ''}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Universal Skills Hub home">
            <span className="grid h-9 w-9 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-[var(--accent-cyan)] shadow-[0_0_30px_rgba(0,212,255,0.2)] transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] group-hover:scale-105">
              <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            </span>
            <span className="font-mono text-sm font-black uppercase tracking-[0.22em] text-white group-hover:text-[var(--accent-cyan)] transition-colors duration-300">
              Skills<span className="text-[var(--accent-cyan)]">Hub</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--accent-cyan)]"
                >
                  <Icon className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(0,212,255,0.6)]" />
                  {item.label}
                </Link>
              );
            })}

            <div className="group/menu relative">
              <Link
                href="/agents"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--accent-cyan)] focus-visible:bg-white/5 focus-visible:text-[var(--accent-cyan)]"
              >
                <BookOpen className="h-4 w-4 transition-all duration-200 group-hover/menu:scale-110 group-hover/menu:drop-shadow-[0_0_6px_rgba(0,212,255,0.6)]" />
                Agent installation guides
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover/menu:rotate-180" />
              </Link>

              <div className="invisible absolute left-0 top-full z-50 w-[25rem] translate-y-3 pt-3 opacity-0 transition-all duration-200 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--bg-secondary)]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-cyan)]">
                      Direct installation guides
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Pick an agent and jump straight to its setup steps.
                    </p>
                  </div>

                  <div className="grid max-h-[70vh] gap-1 overflow-y-auto py-2">
                    {AGENTS.map((agent) => (
                      <Link
                        key={agent.id}
                        href={`/agents/${agent.id}`}
                        className="group/agent flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                          {agent.imagePath ? (
                            <Image src={agent.imagePath} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-[var(--accent-cyan)]" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{agent.name}</span>
                          <span className="block truncate text-xs text-[var(--text-muted)]">{agent.vendor}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-all duration-200 group-hover/agent:translate-x-0.5 group-hover/agent:text-[var(--accent-cyan)]" />
                      </Link>
                    ))}
                  </div>

                  <Link
                    href="/agents"
                    className="flex items-center justify-between rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-[var(--accent-cyan)] transition-all duration-200 hover:bg-cyan-300/15"
                  >
                    View all installation concepts
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/submit" 
            className="group hidden rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-[var(--accent-cyan)] transition-all duration-300 hover:bg-cyan-300/20 sm:inline-flex sm:items-center sm:gap-2 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)]"
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Submit
          </Link>

          {session?.user ? (
            <>
              <Link 
                href="/profile" 
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-cyan-300/30 hover:text-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Profile'}
                    width={32}
                    height={32}
                    unoptimized
                    className="rounded-full transition-transform duration-200 hover:scale-105"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition-colors duration-200 group-hover:bg-cyan-300/20">
                    <User className="h-4 w-4" />
                  </span>
                )}
                <span className="hidden max-w-28 truncate sm:inline">{session.user.name}</span>
              </Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button 
                  type="submit" 
                  className="hidden items-center gap-1 rounded-full px-2 py-2 text-xs text-[var(--text-muted)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--accent-cyan)] hover:shadow-[0_0_10px_rgba(0,212,255,0.1)] sm:flex group"
                >
                  <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                  <span className="transition-colors duration-200 group-hover:text-[var(--accent-cyan)]">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <Link 
              href="/login" 
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-cyan-300/30 hover:text-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
            >
              <LogIn className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
