import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { verifyToken } from './jwt';

export interface AppSession {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image?: string | null;
  };
  isPremium?: boolean;
}

export async function getOptionalSession() {
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has('authjs.session-token') ||
    cookieStore.has('__Secure-authjs.session-token') ||
    cookieStore.has('next-auth.session-token') ||
    cookieStore.has('__Secure-next-auth.session-token');

  if (!hasSessionCookie) {
    return null;
  }

  try {
    return await auth();
  } catch (error) {
    console.warn('Auth session unavailable:', error);
    return null;
  }
}

/**
 * Get session from custom JWT cookie (auth-token)
 * Used by /api/auth/login route
 */
export async function getSessionFromCookie(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }
  
  return {
    user: {
      id: payload.userId,
      email: payload.email ?? null,
      name: payload.name ?? null,
    },
    isPremium: payload.isPremium,
  };
}

export async function getCurrentSession(): Promise<AppSession | null> {
  const authSession = await getOptionalSession();

  if (authSession?.user?.id) {
    return {
      user: {
        id: authSession.user.id,
        email: authSession.user.email ?? null,
        name: authSession.user.name ?? null,
        image: authSession.user.image ?? null,
      },
    };
  }

  return getSessionFromCookie();
}
