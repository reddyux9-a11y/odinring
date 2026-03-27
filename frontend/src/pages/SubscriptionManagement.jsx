import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Crown,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  LifeBuoy,
  FileText,
  PlayCircle,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentityContext } from '../hooks/useIdentityContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';
import SubscriptionBadge from '../components/SubscriptionBadge';

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { context: identityContext, refetch: refetchContext } = useIdentityContext();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadSubscription();
  }, [identityContext]);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/billing/subscription');
      setSubscription(response.data?.subscription || null);
    } catch (error) {
      // Use identity context subscription if API fails
      if (identityContext?.subscription) {
        setSubscription(identityContext.subscription);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleUpgrade = () => {
    navigate('/billing/choose-plan');
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features when your current period ends.')) {
      return;
    }

    setLoading(true);
    try {
      if (subscription?.id) {
        await api.post(`/billing/subscriptions/${subscription.id}/cancel`);
        toast.success('Subscription cancelled successfully');
        await refetchContext();
        await loadSubscription();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subscriptionStatus = subscription?.status || identityContext?.subscription?.status;
  const subscriptionPlan = subscription?.plan || identityContext?.subscription?.plan;
  const daysRemaining = subscription?.days_remaining || 
    (subscription?.trial_end_date ? getDaysRemaining(subscription.trial_end_date) : null) ||
    (subscription?.current_period_end ? getDaysRemaining(subscription.current_period_end) : null);

  const getStatusIcon = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'trial':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'trial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const planNames = {
    'personal': 'Personal',
    'solo': 'Business Solo - Standard',
    'solo_enterprise': 'Business Solo - Enterprise',
    'org': 'Organization'
  };

  const planPrices = {
    'solo': 24,
    'solo_enterprise': 36,
    'org': 68
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Subscription Management</h1>
              <p className="text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
            {subscriptionStatus && (
              <SubscriptionBadge 
                subscription={identityContext?.subscription || subscription} 
                size="large"
              />
            )}
          </div>
        </motion.div>

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="support">Customer Support</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-6">
            {/* Current Subscription Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {getStatusIcon()}
                        Current Subscription
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {planNames[subscriptionPlan] || subscriptionPlan || 'No active subscription'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor()}>
                      {subscriptionStatus?.toUpperCase() || 'NONE'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Subscription Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-semibold flex items-center gap-2">
                        {subscriptionPlan === 'solo' && <Crown className="w-4 h-4 text-yellow-500" />}
                        {planNames[subscriptionPlan] || subscriptionPlan || 'None'}
                      </p>
                    </div>

                    {planPrices[subscriptionPlan] && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">
                          {formatPrice(planPrices[subscriptionPlan])}/year
                        </p>
                      </div>
                    )}

                    {subscriptionStatus === 'trial' && subscription?.trial_end_date && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Trial Ends</p>
                          <p className="font-semibold">{formatDate(subscription.trial_end_date)}</p>
                        </div>
                        {daysRemaining !== null && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Days Remaining</p>
                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {subscriptionStatus === 'active' && subscription?.current_period_end && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Renews On</p>
                          <p className="font-semibold">{formatDate(subscription.current_period_end)}</p>
                        </div>
                        {daysRemaining !== null && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Days Until Renewal</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {subscription?.billing_cycle && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Billing Cycle</p>
                        <p className="font-semibold capitalize">{subscription.billing_cycle}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {subscriptionStatus === 'expired' || subscriptionStatus === 'none' ? (
                      <Button
                        onClick={handleUpgrade}
                        className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Choose a Plan
                      </Button>
                    ) : subscriptionStatus === 'trial' ? (
                      <Button
                        onClick={handleUpgrade}
                        className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleUpgrade}
                          variant="outline"
                          className="flex-1"
                        >
                          Change Plan
                        </Button>
                        {subscriptionStatus === 'active' && (
                          <Button
                            onClick={handleCancel}
                            variant="destructive"
                            disabled={loading}
                            className="flex-1"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              'Cancel Subscription'
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Information */}
            {subscription?.transaction_id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {subscription.transaction_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Transaction ID</span>
                          <span className="font-mono text-xs">{subscription.transaction_id}</span>
                        </div>
                      )}
                      {subscription.checkout_details?.payment_method && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Payment Method</span>
                          <span className="font-semibold capitalize">
                            {subscription.checkout_details.payment_method}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Trial Period:</strong> All new subscriptions start with a 14-day free trial.
                      </p>
                      <p>
                        <strong className="text-foreground">Cancellation:</strong> You can cancel your subscription at any time.
                        You'll continue to have access until the end of your current billing period.
                      </p>
                      <p>
                        <strong className="text-foreground">Renewal:</strong> Subscriptions automatically renew unless cancelled.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5" />
                  Customer Support
                </CardTitle>
                <CardDescription>
                  Get onboarding help, activation guidance, and branding best practices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 mt-0.5 text-primary" />
                        <div className="space-y-2">
                          <p className="font-semibold">Application Usage Guide</p>
                          <p className="text-sm text-muted-foreground">
                            Printable support document covering setup, activation, subscriptions,
                            and personal branding/business use cases.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/support/application-usage-guide.html', '_blank')}
                          >
                            Open Guide
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <PlayCircle className="w-5 h-5 mt-0.5 text-primary" />
                        <div className="space-y-2">
                          <p className="font-semibold">Demo Video Script</p>
                          <p className="text-sm text-muted-foreground">
                            Ready-to-record storyboard for: How to use, activate subscription,
                            subscribe, and grow branding/business.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/support/demo-video-script.md', '_blank')}
                          >
                            Open Script
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Need direct assistance? Contact support at <strong className="text-foreground">support@odinring.com</strong>
                        </p>
                        <p>
                          Include your account email, issue summary, and screenshot for faster resolution.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubscriptionManagement;







