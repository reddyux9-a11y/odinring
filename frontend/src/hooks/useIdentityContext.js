/**
 * useIdentityContext Hook
 * Fetches and manages user's identity context including account type, subscription, and routing
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

/**
 * Hook to fetch and manage identity context
 * @returns {Object} Identity context state and methods
 */
export const useIdentityContext = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch identity context from backend
   */
  const fetchContext = useCallback(async () => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('ℹ️  useIdentityContext: No token found, skipping context fetch');
        setLoading(false);
        setError(null);
        return null;
      }
      
      setLoading(true);
      setError(null);
      
      console.log('🔍 useIdentityContext: Fetching identity context...');
      const response = await api.get('/me/context');
      
      console.log('✅ useIdentityContext: Context received:', response.data);
      setContext(response.data);
      
      return response.data;
    } catch (err) {
      // Only log error if it's not a 401/403 (expected when not authenticated)
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        console.error('❌ useIdentityContext: Failed to fetch context:', err);
      } else {
        console.log('ℹ️  useIdentityContext: Not authenticated, skipping context fetch');
      }
      setError(err);
      
      // Set default context on error (backward compatibility)
      const defaultContext = {
        authenticated: false,
        account_type: 'personal',
        profile_id: null,
        business_id: null,
        organization_id: null,
        subscription: {
          status: 'none',
          plan: 'personal'
        },
        next_route: '/dashboard'
      };
      
      setContext(defaultContext);
      
      return defaultContext;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch context on mount
   */
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  /**
   * Check if user needs billing (subscription expired)
   */
  const needsBilling = context?.subscription?.status === 'expired' && 
                       (context?.next_route === '/billing' || context?.next_route === '/billing/choose-plan' || context?.needs_billing === true);

  /**
   * Check if user is on trial
   */
  const isOnTrial = context?.subscription?.status === 'trial';

  /**
   * Check if user has active subscription
   */
  const hasActiveSubscription = context?.subscription?.status === 'active';

  /**
   * Get dashboard route based on account type
   */
  const getDashboardRoute = () => {
    if (!context) return '/dashboard';
    
    switch (context.account_type) {
      case 'business_solo':
        return '/dashboard/business';
      case 'organization':
        return '/dashboard/organization';
      case 'personal':
      default:
        return '/dashboard';
    }
  };

  return {
    context,
    loading,
    error,
    refetch: fetchContext,
    needsBilling,
    isOnTrial,
    hasActiveSubscription,
    getDashboardRoute,
    // Convenience properties
    accountType: context?.account_type,
    subscription: context?.subscription,
    nextRoute: context?.next_route,
  };
};

export default useIdentityContext;

