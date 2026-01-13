/**
 * Tests for ProfilePreview Component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePreview from '../../components/ProfilePreview';

describe('ProfilePreview', () => {
  const mockProfile = {
    id: 'user_123',
    username: 'testuser',
    name: 'Test User',
    bio: 'Test bio',
    profile_image_url: 'https://example.com/image.jpg',
    avatar: 'https://example.com/image.jpg'
  };

  const mockLinks = [
    {
      id: '1',
      title: 'Test Link',
      url: 'https://example.com',
      active: true
    }
  ];

  it('renders user profile correctly', () => {
    render(
      <BrowserRouter>
        <ProfilePreview profile={mockProfile} links={mockLinks} username="testuser" />
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
  });

  it('renders links correctly', () => {
    render(
      <BrowserRouter>
        <ProfilePreview profile={mockProfile} links={mockLinks} username="testuser" />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('handles missing profile gracefully', () => {
    render(
      <BrowserRouter>
        <ProfilePreview profile={null} links={[]} username="testuser" />
      </BrowserRouter>
    );

    // Should render without crashing
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });
});

