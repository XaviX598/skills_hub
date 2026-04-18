import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

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
