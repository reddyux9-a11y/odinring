import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

// Test component to access auth context
function TestComponent() {
  const { user, loading, authChecked } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!authChecked) return <div>Checking auth...</div>;
  if (user) return <div>Logged in as: {user.email}</div>;
  return <div>Not logged in</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText(/loading|checking auth/i)).toBeInTheDocument();
  });

  test('shows not logged in when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/not logged in/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('restores user from localStorage', async () => {
    // Mock user data in localStorage
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User'
    };
    
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify(mockUser));
    localStorage.setItem('user_id', mockUser.id);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/logged in as: test@example.com/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});


