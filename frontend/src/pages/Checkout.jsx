import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

const PAID_PLAN_IDS = new Set(['solo_standard', 'solo_enterprise', 'org']);

/**
 * Opens Stripe Checkout via the backend. Replaces the previous mock card form.
 * Entry points: /subscription (Choose plan), PaymentFailed retry, bookmarks.
 */
const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'solo_standard';
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!PAID_PLAN_IDS.has(planId)) {
        toast.error(
          planId === 'personal'
            ? 'This plan does not require payment.'
            : 'Invalid plan for checkout.'
        );
        setStatus('error');
        return;
      }

      try {
        const response = await api.post('/billing/checkout-session', {
          plan_id: planId,
          billing_cycle: 'yearly',
        });
        const checkoutUrl = response.data?.checkout_url;
        if (cancelled) return;
        if (!checkoutUrl) {
          toast.error('Failed to start checkout. Please try again.');
          setStatus('error');
          return;
        }
        window.location.href = checkoutUrl;
      } catch (error) {
        if (cancelled) return;
        const message =
          error.response?.data?.detail ||
          'Failed to start checkout. Please try again.';
        toast.error(message);
        setStatus('error');
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const handleBack = () => {
    navigate('/billing/choose-plan');
  };

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center gap-6 px-4">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
          <p className="text-muted-foreground text-center max-w-sm">
            Redirecting to secure checkout…
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-muted-foreground text-center max-w-md">
            We could not open the payment page. If Stripe is not configured on the
            server, set <code className="text-xs bg-muted px-1 rounded">STRIPE_SECRET_KEY</code>{' '}
            and restart the API.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to plans
            </Button>
            <Button onClick={handleRetry}>Try again</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Checkout;
