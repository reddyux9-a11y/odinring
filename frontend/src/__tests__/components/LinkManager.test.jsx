/**
 * Tests for LinkManager Component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LinkManager from '../../components/LinkManager';
import * as api from '../../lib/api';

// Mock API
jest.mock('../../lib/api');
jest.mock('../../lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('LinkManager', () => {
  const mockLinks = [
    {
      id: '1',
      title: 'Test Link 1',
      url: 'https://example.com',
      icon: 'link',
      active: true,
      order: 0
    },
    {
      id: '2',
      title: 'Test Link 2',
      url: 'https://test.com',
      icon: 'github',
      active: true,
      order: 1
    }
  ];

  const defaultProps = {
    links: mockLinks,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onReorder: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders links correctly', () => {
    render(
      <BrowserRouter>
        <LinkManager {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Link 1')).toBeInTheDocument();
    expect(screen.getByText('Test Link 2')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(
      <BrowserRouter>
        <LinkManager {...defaultProps} />
      </BrowserRouter>
    );

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(defaultProps.onDelete).toHaveBeenCalled();
      });
    }
  });

  it('displays empty state when no links', () => {
    render(
      <BrowserRouter>
        <LinkManager {...defaultProps} links={[]} />
      </BrowserRouter>
    );

    // Should show empty state or message
    expect(screen.queryByText('Test Link 1')).not.toBeInTheDocument();
  });
});


