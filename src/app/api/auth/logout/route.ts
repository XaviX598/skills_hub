import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signOut } from '@/lib/auth';

export async function POST() {
  try {
    const session = await auth();
    if (session) {
      await signOut();
    }
  } catch (error) {
    console.log('[LOGOUT] SignOut error (possibly no session):', error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
