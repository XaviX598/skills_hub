/**
 * API Route: Create Stripe checkout session
 */

import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getPrisma } from '@/lib/prisma';
import { createPremiumCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe';
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
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.email) {
    return NextResponse.json({ error: 'User email is required to create checkout.' }, { status: 400 });
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

  const checkoutSession = await createPremiumCheckoutSession({
    customerId,
    userId: user.id,
    successUrl: `${SITE_URL}/app?success=true`,
    cancelUrl: `${SITE_URL}/app?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
