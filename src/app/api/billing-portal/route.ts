import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getPrisma } from '@/lib/prisma';
import { createPortalSession, getOrCreateStripeCustomer } from '@/lib/stripe';
import { SITE_URL } from '@/lib/site-url';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      error: 'Stripe is not configured. Please contact the administrator.',
    }, { status: 503 });
  }

  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.email) {
    return NextResponse.json({ error: 'User email is required to manage billing.' }, { status: 400 });
  }

  const { customerId, created } = await getOrCreateStripeCustomer({
    customerId: user.stripeCustomerId,
    email: user.email,
    userId: user.id,
    name: user.name,
  });

  if (created) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const portalSession = await createPortalSession(customerId, `${SITE_URL}/profile`);

  return NextResponse.json({ url: portalSession.url });
}
