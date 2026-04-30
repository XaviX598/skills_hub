import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session.user, isPremium: session.isPremium ?? false });
}
