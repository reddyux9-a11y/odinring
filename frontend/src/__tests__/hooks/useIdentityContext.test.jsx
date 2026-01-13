/**
 * Unit tests for useIdentityContext hook
 * Tests identity context fetching and state management
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../contexts/AuthContext';
import useIdentityContext from '../../hooks/useIdentityContext';
import api from '../../lib/api';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/api');

describe('useIdentityContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch identity context when user is authenticated', async () => {
    // Mock authenticated user
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
      authChecked: true
    });

    // Mock API response
    const mockIdentityContext = {
      authenticated: true,
      account_type: 'personal',
      profile_id: 'user_123',
      business_id: null,
      organization_id: null,
      subscription: {
        status: 'trial',
        plan: 'personal'
      },
      next_route: '/dashboard/personal'
    };
    api.get.mockResolvedValue({ data: mockIdentityContext });

    const { result } = renderHook(() => useIdentityContext());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.identityContext).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify identity context was fetched
    expect(api.get).toHaveBeenCalledWith('/me/context');
    expect(result.current.identityContext).toEqual(mockIdentityContext);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch when user is not authenticated', async () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      authChecked: true
    });

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify no API call was made
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.identityContext).toBeNull();
  });

  it('should handle fetch error gracefully', async () => {
    // Mock authenticated user
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
      authChecked: true
    });

    // Mock API error
    const mockError = new Error('Network error');
    api.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.identityContext).toBeNull();
  });

  it('should refetch identity context when refetchIdentityContext is called', async () => {
    // Mock authenticated user
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
      authChecked: true
    });

    const mockIdentityContext = {
      authenticated: true,
      account_type: 'personal',
      profile_id: 'user_123'
    };
    api.get.mockResolvedValue({ data: mockIdentityContext });

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock and call refetch
    api.get.mockClear();
    const updatedContext = { ...mockIdentityContext, account_type: 'business_solo' };
    api.get.mockResolvedValue({ data: updatedContext });

    // Call refetch
    result.current.refetchIdentityContext();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.identityContext.account_type).toBe('business_solo');
    });
  });

  it('should not fetch when authChecked is false', () => {
    // Mock auth still loading
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'test@example.com' },
      loading: true,
      authChecked: false
    });

    const { result } = renderHook(() => useIdentityContext());

    // Verify no API call was made
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it('should handle business_solo account type', async () => {
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'business@example.com' },
      loading: false,
      authChecked: true
    });

    const mockIdentityContext = {
      authenticated: true,
      account_type: 'business_solo',
      profile_id: 'user_123',
      business_id: 'business_456',
      organization_id: null,
      subscription: {
        status: 'active',
        plan: 'solo'
      },
      next_route: '/dashboard/business'
    };
    api.get.mockResolvedValue({ data: mockIdentityContext });

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.identityContext.account_type).toBe('business_solo');
    expect(result.current.identityContext.business_id).toBe('business_456');
    expect(result.current.identityContext.next_route).toBe('/dashboard/business');
  });

  it('should handle organization account type', async () => {
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'org@example.com' },
      loading: false,
      authChecked: true
    });

    const mockIdentityContext = {
      authenticated: true,
      account_type: 'organization',
      profile_id: 'user_123',
      business_id: null,
      organization_id: 'org_789',
      subscription: {
        status: 'active',
        plan: 'org'
      },
      next_route: '/dashboard/organization'
    };
    api.get.mockResolvedValue({ data: mockIdentityContext });

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.identityContext.account_type).toBe('organization');
    expect(result.current.identityContext.organization_id).toBe('org_789');
  });

  it('should handle expired subscription', async () => {
    useAuth.mockReturnValue({
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
      authChecked: true
    });

    const mockIdentityContext = {
      authenticated: true,
      account_type: 'personal',
      profile_id: 'user_123',
      subscription: {
        status: 'expired',
        plan: 'personal'
      },
      next_route: '/billing'
    };
    api.get.mockResolvedValue({ data: mockIdentityContext });

    const { result } = renderHook(() => useIdentityContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.identityContext.subscription.status).toBe('expired');
    expect(result.current.identityContext.next_route).toBe('/billing');
  });
});
