import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import {
  createDeviceSessionToken,
  getBearerToken,
  hashDeviceSecret,
} from '@/lib/device-pairing';

function getPresentedToken(request: NextRequest) {
  return (
    getBearerToken(request.headers.get('authorization')) ??
    request.headers.get('x-device-token')?.trim() ??
    null
  );
}

export async function GET(request: NextRequest) {
  const presentedToken = getPresentedToken(request);

  if (!presentedToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const prisma = getPrisma();
  const session = await prisma.deviceSession.findFirst({
    where: {
      deviceToken: hashDeviceSecret(presentedToken),
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
    device: {
      id: session.id,
      name: session.deviceName,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { token, deviceName } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const prisma = getPrisma();
    const tokenHash = hashDeviceSecret(token);
    const now = new Date();

    const pairingToken = await prisma.authorizationCode.findFirst({
      where: {
        code: tokenHash,
        used: false,
        expiresAt: { gt: now },
      },
    });

    if (!pairingToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const deviceSession = createDeviceSessionToken();
    const resolvedDeviceName =
      typeof deviceName === 'string' && deviceName.trim()
        ? deviceName.trim().slice(0, 120)
        : 'Desktop app';

    await prisma.$transaction([
      prisma.authorizationCode.update({
        where: { id: pairingToken.id },
        data: {
          used: true,
          usedAt: now,
        },
      }),
      prisma.authorizationCode.deleteMany({
        where: {
          userId: pairingToken.userId,
          used: false,
        },
      }),
      prisma.deviceSession.deleteMany({
        where: { userId: pairingToken.userId },
      }),
      prisma.deviceSession.create({
        data: {
          userId: pairingToken.userId,
          deviceName: resolvedDeviceName,
          deviceToken: deviceSession.hashedValue,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: pairingToken.userId },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({
      ok: true,
      sessionToken: deviceSession.plainText,
      user,
      deviceName: resolvedDeviceName,
    });
  } catch (error) {
    console.error('[DESKTOP SESSION] Link error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma();
  const presentedToken = getPresentedToken(request);

  if (presentedToken) {
    await prisma.deviceSession.deleteMany({
      where: {
        deviceToken: hashDeviceSecret(presentedToken),
      },
    });

    return NextResponse.json({ ok: true });
  }

  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.deviceSession.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
