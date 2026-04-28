/**
 * API Route: Stripe Webhook
 * Handles events from Stripe (payment success, subscription updates, etc.)
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isPremiumSubscriptionStatus, stripe } from '@/lib/stripe';
import { getPrisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const prisma = getPrisma();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Get subscription to find period end
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

      // Update user to premium
      await prisma.user.update({
        where: { stripeCustomerId: customerId },
        data: {
          isPremium: isPremiumSubscriptionStatus(subscription.status),
          premiumExpiresAt: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

      await prisma.user.update({
        where: { stripeCustomerId: customerId },
        data: {
          isPremium: isPremiumSubscriptionStatus(subscription.status),
          premiumExpiresAt: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Remove premium access
      await prisma.user.update({
        where: { stripeCustomerId: customerId },
        data: {
          isPremium: false,
          premiumExpiresAt: null,
        },
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
