/**
 * Global navigation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { getOptionalSession } from '@/lib/session';
import { LogIn, LogOut, Plus, Sparkles, User, Search, BookOpen } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const navItems = [
  { href: '/skills', label: 'Directory', icon: Search },
  { href: '/agents', label: 'Agent installation guides', icon: BookOpen },
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
