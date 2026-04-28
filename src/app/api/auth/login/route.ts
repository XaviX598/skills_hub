import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { createToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('[API/LOGIN] Attempting login for:', email);

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      console.log('[API/LOGIN] User not found');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isGitHubUser = user.accounts.some((acc) => acc.provider === 'github');
    if (isGitHubUser && !user.password) {
      console.log('[API/LOGIN] GitHub user without password');
      return NextResponse.json({ error: 'Please use GitHub login' }, { status: 401 });
    }

    if (!user.password) {
      console.log('[API/LOGIN] No password set');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!isGitHubUser && !user.isVerified) {
      console.log('[API/LOGIN] User not verified');
      return NextResponse.json({ error: 'VERIFY_REQUIRED:' + user.email }, { status: 401 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      console.log('[API/LOGIN] Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'This account is missing an email address' }, { status: 400 });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
    });

    console.log('[API/LOGIN] Success for:', user.email);

    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[API/LOGIN] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
