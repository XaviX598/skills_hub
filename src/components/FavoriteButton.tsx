'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  skillId: string;
  isFavorited: boolean;
  redirectTo?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  favoriteCount?: number;
}

export function FavoriteButton({
  skillId,
  isFavorited: initialFavorited,
  redirectTo = '/skills',
  size = 'md',
  showLabel = true,
  favoriteCount = 0,
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();

  const sizes = {
    sm: { button: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-xs', padding: 'px-3 py-2' },
    md: { button: 'h-12 w-12', icon: 'h-5 w-5', text: 'text-sm', padding: 'px-4 py-2' },
    lg: { button: 'h-14 w-14', icon: 'h-6 w-6', text: 'text-base', padding: 'px-5 py-3' },
  };

  const s = sizes[size];

  async function handleSubmit() {
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    setToastMessage(newFavorited ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    setShowToast(true);

    const formData = new FormData();
    formData.set('skillId', skillId);
    formData.set('redirectTo', redirectTo);

    startTransition(async () => {
      try {
        const response = await fetch('/api/favorite', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          setIsFavorited(!newFavorited);
        }
        router.refresh();
      } catch {
        setIsFavorited(!newFavorited);
      }
    });

    setTimeout(() => setShowToast(false), 2500);
  }

  return (
    <>
      {size === 'sm' ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`grid ${s.button} shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:border-rose-300/30 hover:bg-rose-400/10 active:scale-75 disabled:opacity-50`}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`${s.icon} transition-all duration-300 ${
              isFavorited
                ? 'fill-[var(--accent-crimson)] text-[var(--accent-crimson)] scale-110'
                : 'text-[var(--text-muted)]'
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all duration-300 hover:border-rose-300/30 hover:text-[var(--accent-crimson)] active:scale-95 disabled:opacity-50`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-300 ${
              isFavorited
                ? 'fill-[var(--accent-crimson)] text-[var(--accent-crimson)] scale-110'
                : ''
            }`}
          />
          {isFavorited ? 'Saved' : 'Save'} {favoriteCount}
        </button>
      )}

      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
          <div className="glass-panel rounded-full border border-rose-300/30 bg-rose-300/20 px-6 py-3 shadow-lg backdrop-blur-xl">
            <p className="text-sm font-semibold text-rose-100">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </>
  );
}