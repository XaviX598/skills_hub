import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getPrisma } from '@/lib/prisma';
import { createPairingCode, PAIRING_TOKEN_TTL_MINUTES } from '@/lib/device-pairing';

export async function POST() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  const { plainText, hashedValue, expiresAt } = createPairingCode();

  await prisma.$transaction([
    prisma.authorizationCode.deleteMany({
      where: {
        userId: session.user.id,
        used: false,
      },
    }),
    prisma.authorizationCode.create({
      data: {
        code: hashedValue,
        userId: session.user.id,
        deviceName: 'Desktop pairing token',
        expiresAt,
      },
    }),
  ]);

  return NextResponse.json({
    token: plainText,
    expiresAt: expiresAt.toISOString(),
    expiresInMinutes: PAIRING_TOKEN_TTL_MINUTES,
  });
}
