/**
 * Stripe configuration and utilities
 */

import Stripe from 'stripe';
import { SITE_URL } from '@/lib/site-url';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
    appInfo: {
      name: 'Universal Skills Hub',
      version: '0.1.0',
      url: SITE_URL,
    },
  });
}

export const stripe = {
  get checkout() { return getStripeClient().checkout; },
  get billingPortal() { return getStripeClient().billingPortal; },
  get subscriptions() { return getStripeClient().subscriptions; },
  get customers() { return getStripeClient().customers; },
  get webhooks() { return getStripeClient().webhooks; },
};

export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly';

export const PREMIUM_PLAN_NAME = 'Skills Hub Premium';

export function isPremiumSubscriptionStatus(status: Stripe.Subscription.Status | null | undefined): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

export async function getOrCreateStripeCustomer(params: {
  customerId?: string | null;
  email: string;
  userId: string;
  name?: string | null;
}) {
  const s = getStripeClient();
  if (params.customerId) {
    return { customerId: params.customerId, created: false };
  }

  const customer = await s.customers.create({
    email: params.email,
    name: params.name ?? undefined,
    metadata: {
      userId: params.userId,
    },
  });

  return { customerId: customer.id, created: true };
}

export async function createPremiumCheckoutSession(params: {
  customerId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const s = getStripeClient();
  return s.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    client_reference_id: params.userId,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
    subscription_data: {
      metadata: {
        userId: params.userId,
        plan: PREMIUM_PLAN_NAME,
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const s = getStripeClient();
  return s.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getSubscriptionStatus(subscriptionId: string) {
  const s = getStripeClient();
  const subscription = await s.subscriptions.retrieve(subscriptionId) as unknown as { status: string; current_period_end: number };
  return {
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };
}
