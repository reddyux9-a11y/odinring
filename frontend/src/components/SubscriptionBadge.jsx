/**
 * Subscription Status Badge Component
 * Displays subscription status with appropriate styling
 * Clickable to navigate to subscription selection page
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getSubscriptionDaysRemaining } from '../lib/subscriptionDisplay';

const SubscriptionBadge = ({ subscription, loading = false, size = 'default', clickable = false, onClick, title }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (clickable && onClick) {
      onClick();
    } else if (clickable) {
      navigate('/subscription');
    }
  };
  // Helper function to format plan name
  const formatPlanName = (plan) => {
    if (!plan) return '';
    const planMap = {
      'solo': 'Solo',
      'org': 'Organization',
      'personal': 'Personal'
    };
    return planMap[plan.toLowerCase()] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Get badge label based on status, plan, and trial days remaining
  const getBadgeLabel = (status, plan, sub) => {
    if (status === 'active' && plan) {
      return formatPlanName(plan);
    }
    if (status === 'trial') {
      const days = getSubscriptionDaysRemaining(sub);
      if (days != null) {
        return days === 0 ? 'Trial ends today' : `${days} day${days !== 1 ? 's' : ''} left`;
      }
      return 'Trial';
    }
    if (!status || status === 'none') {
      return 'Free plan';
    }
    if (status === 'expired') {
      return 'Expired';
    }
    return 'Trial';
  };

  if (loading) {
    return (
      <Skeleton
        className={size === 'small' ? 'h-5 w-20' : 'h-6 w-24'}
        aria-label="Loading subscription"
      />
    );
  }

  if (!subscription) {
    const defaultLabel = 'Free plan';
    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        title={title || (clickable ? 'Click to choose a plan' : undefined)}
      >
        <Clock className="w-3 h-3" />
        {defaultLabel}
      </Badge>
    );
  }

  const { status, plan } = subscription;
  const badgeLabel = getBadgeLabel(status, plan, subscription);

  const statusConfig = {
    active: {
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600 text-white',
      icon: CheckCircle
    },
    trial: {
      variant: 'secondary',
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
      icon: Clock
    },
    expired: {
      variant: 'destructive',
      className: 'bg-red-500 hover:bg-red-600 text-white',
      icon: XCircle
    },
    none: {
      variant: 'outline',
      className: 'border-gray-300',
      icon: Clock
    }
  };

  const config = statusConfig[status] || statusConfig.none;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-1.5'
  };

  // For small size, show compact version without plan text
  if (size === 'small') {
    return (
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className} ${sizeClasses[size]} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title={title || (clickable ? 'Click to upgrade or change plan' : undefined)}
        onKeyDown={clickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
          }
        } : undefined}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium text-xs">{badgeLabel}</span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1.5 ${config.className} ${sizeClasses[size]} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title={title || (clickable ? 'Click to upgrade or change plan' : undefined)}
        onKeyDown={clickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
          }
        } : undefined}
      >
        <Icon className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span className="font-medium">{badgeLabel}</span>
      </Badge>
    </div>
  );
};

export default SubscriptionBadge;


