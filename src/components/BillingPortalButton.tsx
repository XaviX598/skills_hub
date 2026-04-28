'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

interface BillingPortalButtonProps {
  className?: string;
}

export function BillingPortalButton({ className = 'btn-secondary' }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleOpenPortal() {
    setLoading(true);

    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert(data.error || 'Error opening the billing portal. Please try again.');
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Error opening the billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpenPortal}
      disabled={loading}
      className={className}
    >
      <span className="inline-flex items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {loading ? 'Opening billing...' : 'Manage billing'}
      </span>
    </button>
  );
}
