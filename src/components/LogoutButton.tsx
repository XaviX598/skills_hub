'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Full redirect to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="group hidden items-center gap-1 rounded-full px-2 py-2 text-xs text-[var(--text-muted)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--accent-cyan)] hover:shadow-[0_0_10px_rgba(0,212,255,0.1)] sm:flex"
    >
      <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
      <span className="transition-colors duration-200 group-hover:text-[var(--accent-cyan)]">Sign out</span>
    </button>
  );
}