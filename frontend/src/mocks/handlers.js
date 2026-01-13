import { http, HttpResponse } from 'msw';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  http.post(`${BACKEND_URL}/api/auth/register`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token-register',
      user: {
        id: 'test-user-id-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        bio: 'Test bio',
        avatar: '',
        theme: 'light'
      }
    }, { status: 201 });
  }),
  
  http.post(`${BACKEND_URL}/api/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token-login',
      user: {
        id: 'test-user-id-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User'
      }
    });
  }),
  
  http.post(`${BACKEND_URL}/api/auth/google-signin`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token-google',
      user: {
        id: 'test-user-id-google',
        email: 'test@gmail.com',
        username: 'googleuser',
        name: 'Google User'
      }
    });
  }),
  
  // User endpoints
  http.get(`${BACKEND_URL}/api/me`, () => {
    return HttpResponse.json({
      id: 'test-user-id-1',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: '',
      theme: 'light',
      accent_color: '#000000',
      background_color: '#ffffff'
    });
  }),
  
  http.put(`${BACKEND_URL}/api/me`, () => {
    return HttpResponse.json({
      message: 'User updated successfully'
    });
  }),
  
  // Links endpoints
  http.get(`${BACKEND_URL}/api/links`, () => {
    return HttpResponse.json([
      {
        id: 'link-1',
        user_id: 'test-user-id-1',
        title: 'Test Link 1',
        url: 'https://example.com',
        order: 0,
        clicks: 10,
        active: true,
        icon: 'Globe',
        category: 'general'
      },
      {
        id: 'link-2',
        user_id: 'test-user-id-1',
        title: 'Test Link 2',
        url: 'https://example.org',
        order: 1,
        clicks: 5,
        active: true,
        icon: 'Link',
        category: 'social'
      }
    ]);
  }),
  
  http.post(`${BACKEND_URL}/api/links`, () => {
    return HttpResponse.json({
      id: 'new-link-id',
      user_id: 'test-user-id-1',
      title: 'New Link',
      url: 'https://newlink.com',
      order: 2,
      clicks: 0,
      active: true
    }, { status: 201 });
  }),
  
  http.put(`${BACKEND_URL}/api/links/:linkId`, () => {
    return HttpResponse.json({
      message: 'Link updated successfully'
    });
  }),
  
  http.delete(`${BACKEND_URL}/api/links/:linkId`, () => {
    return HttpResponse.json({
      message: 'Link deleted successfully'
    });
  }),
  
  // Analytics endpoints
  http.get(`${BACKEND_URL}/api/analytics`, () => {
    return HttpResponse.json({
      profile_views: 150,
      total_clicks: 75,
      active_links: 2,
      top_link: {
        title: 'Test Link 1',
        clicks: 10
      },
      weekly_stats: [],
      link_performance: []
    });
  }),
  
  // Public profile
  http.get(`${BACKEND_URL}/api/profile/:username`, () => {
    return HttpResponse.json({
      name: 'Test User',
      username: 'testuser',
      bio: 'Test bio',
      avatar: '',
      theme: 'light',
      accent_color: '#000000',
      background_color: '#ffffff',
      links: [
        {
          id: 'link-1',
          title: 'Test Link',
          url: 'https://example.com',
          icon: 'Globe',
          active: true
        }
      ],
      profile_views: 150,
      total_clicks: 75
    });
  }),
];


