'use client';

import { useState } from 'react';
import { CreditCard, Loader2, ArrowRight } from 'lucide-react';

export function PremiumButton() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error creating checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Premium - $9.99/mo
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      
      <p className="text-xs text-[var(--text-muted)]">
        Secure payment with Stripe. Cancel anytime.
      </p>
    </div>
  );
}