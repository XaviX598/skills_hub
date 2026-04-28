import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, callbackUrl } = await request.json();

    console.log('[API/LOGIN] Attempting login for:', email);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    console.log('[API/LOGIN] Result:', JSON.stringify(result));

    if (result?.error) {
      console.log('[API/LOGIN] Error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    console.log('[API/LOGIN] Success!');
    return NextResponse.json({ ok: true, callbackUrl });
  } catch (err) {
    console.error('[API/LOGIN] Catch error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
