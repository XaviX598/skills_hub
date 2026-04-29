import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }
    
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const prisma = getPrisma();
    
    // Mark the authorization code as used
    await prisma.authorizationCode.updateMany({
      where: {
        code,
        userId: session.user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
    
    // Store session token for the device
    // In production, you'd generate a device-specific token
    await prisma.deviceSession.create({
      data: {
        userId: session.user.id,
        deviceName: 'Desktop App',
        deviceToken: code, // In production, generate a proper token
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTHORIZE] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}