import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Check, X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentityContext } from '../hooks/useIdentityContext';
import api from '../lib/api';
import { toast } from 'sonner';

const BillingChoosePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { context: identityContext, refetch: refetchContext } = useIdentityContext();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [startingTrial, setStartingTrial] = useState(null);
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  useEffect(() => {
    loadPlans();
    loadSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/billing/plans');
      const plansData = Object.values(response.data.plans || {});
      
      // For now, show all available plans (including paid "dummy" plans)
      // regardless of account type so Stripe checkout can be tested easily.
      setPlans(plansData);
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
    } catch (error) {
    }
  };

  const handleActivatePlan = async (planId) => {
    setSubscribingPlan(planId);
    try {
      const response = await api.post('/billing/checkout-session', {
        plan_id: planId,
        billing_cycle: 'yearly',
      });

      const checkoutUrl = response.data?.checkout_url;
      if (!checkoutUrl) {
        toast.error('Failed to start checkout. Please try again.');
        setSubscribingPlan(null);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        'Failed to start checkout. Please try again.';
      toast.error(message);
      setSubscribingPlan(null);
    }
  };

  const handleStartTrial = async (planId) => {
    setStartingTrial(planId);
    try {
      const response = await api.post('/billing/trial/start', {
        plan_id: planId
      });
      
      if (response.data.success) {
        toast.success('🎉 Free trial started! Enjoy 14 days of premium features.');
        // Refresh subscription data
        await loadSubscription();
        await refetchContext();
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to start free trial. Please try again.';
      toast.error(errorMessage);
    } finally {
      setStartingTrial(null);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.subscription?.trial_end_date) return null;
    const endDate = new Date(subscription.subscription.trial_end_date);
    const now = new Date();
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select the subscription plan that best fits your needs
          </p>
        </div>

        {/* Subscription Status Alert */}
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

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isFree = plan.price.yearly === 0;
            const isRecommended = plan.id === 'solo_standard' || plan.id === 'org';

            return (
              <Card
                key={plan.id}
                className={`relative ${isRecommended ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Recommended
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.price.yearly)}
                      </span>
                      <span className="text-muted-foreground ml-2">/year</span>
                    </div>
                    {!isFree && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(plan.price.yearly / 12)}/month billed annually
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {Object.entries(plan.features).map(([key, value]) => {
                      if (typeof value === 'boolean') {
                        return (
                          <li key={key} className="flex items-center">
                            {value ? (
                              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-sm capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={key} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">
                            <span className="capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="font-medium">{value}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Free Trial Badge */}
                  {!isFree && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">
                        🎁 14-Day Free Trial
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 text-center mt-1">
                        Try all features risk-free
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!isFree && (
                      <Button
                        className="w-full"
                        variant="default"
                        disabled={startingTrial === plan.id || subscribingPlan === plan.id}
                        onClick={() => handleStartTrial(plan.id)}
                      >
                        {startingTrial === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Starting Trial...
                          </>
                        ) : (
                          'Start Free Trial'
                        )}
                      </Button>
                    )}
                    
                    <Button
                      className="w-full"
                      variant={isFree ? 'outline' : 'outline'}
                      disabled={isFree || startingTrial === plan.id || subscribingPlan === plan.id}
                      onClick={() => handleActivatePlan(plan.id)}
                    >
                      {isFree ? (
                        'Current Plan'
                      ) : (
                        subscribingPlan === plan.id ? 'Redirecting to Stripe...' : 'Subscribe Now'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default BillingChoosePlan;

