import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { X, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useIdentityContext } from '../hooks/useIdentityContext';
import api from '../lib/api';
import { toast } from 'sonner';

const SubscriptionStatusBanner = () => {
  const navigate = useNavigate();
  const { context, subscription, isOnTrial } = useIdentityContext();
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionDetails();
    
    // Check if banner was dismissed
    const dismissedKey = `subscription_banner_dismissed_${subscription?.status || 'none'}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    if (wasDismissed) {
      setDismissed(true);
    }
  }, [subscription]);

  const loadSubscriptionDetails = async () => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await api.get('/billing/subscription');
      setSubscriptionDetails(response.data);
    } catch (error) {
      // Only handle error if it's not a 401/403 (expected when not authenticated)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        // Optionally surface a toast here if needed
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    const dismissedKey = `subscription_banner_dismissed_${subscription?.status || 'none'}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  const getDaysRemaining = () => {
    const sub = subscriptionDetails?.subscription;
    if (!sub) return null;

    // Prefer backend-computed days_remaining for consistency across UI
    if (sub.days_remaining != null && typeof sub.days_remaining === 'number') {
      return sub.days_remaining;
    }

    const endStr = sub.trial_end_date;
    if (!endStr) return null;

    try {
      const end = new Date(typeof endStr === 'string' ? endStr.replace('Z', '') : endStr);
      if (Number.isNaN(end.getTime())) return null;
      const now = new Date();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    } catch {
      return null;
    }
  };

  if (loading || dismissed || !subscription) {
    return null;
  }

  const status = subscription.status;
  const daysRemaining = getDaysRemaining();

  // Show banner for trial (3 days or less remaining) or expired
  if (status === 'expired') {
    return (
      <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950/50">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
          Subscription Expired
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
          <div className="flex items-center justify-between">
            <span>
              Your subscription has expired. Please select a plan to continue using OdinRing.
            </span>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate('/billing/choose-plan')}
              >
                Choose Plan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'trial' && daysRemaining !== null && daysRemaining <= 3) {
    return (
      <Alert className={`mb-4 ${daysRemaining <= 1 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'}`}>
        <Clock className={`h-4 w-4 ${daysRemaining <= 1 ? 'text-orange-500' : 'text-blue-500'}`} />
        <AlertTitle className={`${daysRemaining <= 1 ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'} font-semibold`}>
          Trial Ending Soon
        </AlertTitle>
        <AlertDescription className={`${daysRemaining <= 1 ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'} mt-2`}>
          <div className="flex items-center justify-between">
            <span>
              Your trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
              Select a plan to continue after your trial ends.
            </span>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate('/billing/choose-plan')}
              >
                View Plans
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'trial' && daysRemaining !== null && daysRemaining > 3 && daysRemaining <= 7) {
    return (
      <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950/50">
        <Clock className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-800 dark:text-blue-200 font-semibold">
          Trial Active
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300 mt-2">
          <div className="flex items-center justify-between">
            <span>
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your trial.
            </span>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/billing/choose-plan')}
              >
                View Plans
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SubscriptionStatusBanner;

