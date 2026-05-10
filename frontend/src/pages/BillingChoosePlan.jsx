import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Badge } from '../shared/ui/badge';
import { Alert, AlertDescription } from '../shared/ui/alert';
import { Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentityContext } from '../hooks/useIdentityContext';
import api from '../lib/api';
import { getSubscriptionDaysRemaining } from '../lib/subscriptionDisplay';
import { toast } from 'sonner';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', priceKey: 'monthly', suffix: '/month' },
  { id: 'quarterly', label: 'Quarterly', priceKey: 'quarterly', suffix: '/3 months' },
  { id: 'yearly', label: 'Annual', priceKey: 'yearly', suffix: '/year' },
];

const extractErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => (typeof item === 'string' ? item : item?.msg || JSON.stringify(item)))
      .filter(Boolean)
      .join(', ');
    if (joined) return joined;
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  const message = error?.message;
  return typeof message === 'string' ? message : fallback;
};

const BillingChoosePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { context: identityContext, refetch: refetchContext } = useIdentityContext();
  const [proPlan, setProPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState('yearly');
  const [startingTrial, setStartingTrial] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPlans();
    loadSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/billing/plans');
      const plans = response.data.plans || {};
      setProPlan(plans.pro || null);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await api.get('/billing/subscription');
      setSubscription(response.data);
    } catch (error) {}
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await api.post('/billing/checkout-session', {
        plan_id: 'pro',
        billing_cycle: selectedCycle,
      });

      const checkoutUrl = response.data?.checkout_url;
      if (!checkoutUrl) {
        toast.error('Failed to start checkout. Please try again.');
        setSubscribing(false);
        return;
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to start checkout. Please try again.');
      toast.error(message);
      setSubscribing(false);
    }
  };

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const response = await api.post('/billing/trial/start', { plan_id: 'pro' });
      if (response.data.success) {
        toast.success('🎉 Free trial started! Enjoy 14 days of premium features.');
        await loadSubscription();
        await refetchContext();
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Failed to start free trial. Please try again.');
      toast.error(errorMessage);
    } finally {
      setStartingTrial(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subscriptionStatus = subscription?.subscription?.status;
  const daysRemaining = getSubscriptionDaysRemaining(subscription?.subscription);
  const selectedCycleInfo = BILLING_CYCLES.find((c) => c.id === selectedCycle);
  const currentPrice = proPlan?.price?.[selectedCycle] ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">One plan. All features. Pick the billing cycle that suits you.</p>
        </div>

        {/* Subscription Status Alerts */}
        {subscriptionStatus === 'expired' && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Your subscription has expired. Please select a plan to continue using OdinRing.
            </AlertDescription>
          </Alert>
        )}

        {subscriptionStatus === 'trial' && daysRemaining !== null && (
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Your trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
              Select a plan to continue after your trial ends.
            </AlertDescription>
          </Alert>
        )}

        {proPlan && (
          <Card className="border-primary border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{proPlan.name}</CardTitle>
              <CardDescription>{proPlan.description}</CardDescription>

              {/* Billing cycle selector */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {BILLING_CYCLES.map((cycle) => (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedCycle(cycle.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selectedCycle === cycle.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>

              {/* Price display */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{formatPrice(currentPrice)}</span>
                  <span className="text-muted-foreground ml-1">{selectedCycleInfo?.suffix}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {Object.entries(proPlan.features).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>

              {/* Free Trial Badge */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">
                  🎁 14-Day Free Trial
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center mt-1">
                  Try all features risk-free
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="default"
                  disabled={startingTrial || subscribing}
                  onClick={handleStartTrial}
                >
                  {startingTrial ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    'Start Free Trial'
                  )}
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  disabled={startingTrial || subscribing}
                  onClick={handleSubscribe}
                >
                  {subscribing ? 'Redirecting to Stripe...' : `Subscribe — ${formatPrice(currentPrice)}${selectedCycleInfo?.suffix}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BillingChoosePlan;
