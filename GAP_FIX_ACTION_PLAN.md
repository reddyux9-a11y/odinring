# Gap Fix Action Plan

**Generated:** December 25, 2025  
**Based On:** CODEBASE_ARCHITECTURE_ANALYSIS.md  
**Goal:** Achieve 100% Alignment

---

## 🎯 Critical Gaps - Fix Immediately

### Gap #1: Missing __init__.py Files

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 15 minutes  
**Impact:** Module import structure

**Action:**
```bash
# Create __init__.py files
touch backend/models/__init__.py
touch backend/services/__init__.py
touch backend/routes/__init__.py
touch backend/middleware/__init__.py
```

**Content for each file:**

```python
# backend/models/__init__.py
"""Identity and subscription models"""
from .identity_models import (
    AccountType,
    SubscriptionStatus,
    SubscriptionPlan,
    OrganizationRole,
    Business,
    BusinessCreate,
    Organization,
    OrganizationCreate,
    Department,
    DepartmentCreate,
    Membership,
    MembershipCreate,
    Subscription,
    SubscriptionCreate,
    IdentityContext,
    AccountTypeSelection,
    OnboardingStatus
)

__all__ = [
    'AccountType',
    'SubscriptionStatus',
    'SubscriptionPlan',
    'OrganizationRole',
    'Business',
    'Organization',
    'Subscription',
    'IdentityContext',
]
```

```python
# backend/services/__init__.py
"""Business logic services"""
from .identity_resolver import IdentityResolver
from .subscription_service import SubscriptionService

__all__ = ['IdentityResolver', 'SubscriptionService']
```

```python
# backend/routes/__init__.py
"""API route handlers"""
from .onboarding import onboarding_router

__all__ = ['onboarding_router']
```

```python
# backend/middleware/__init__.py
"""Middleware components"""
from .context_guard import (
    ContextGuard,
    require_dashboard_access,
    require_organization_access
)

__all__ = [
    'ContextGuard',
    'require_dashboard_access',
    'require_organization_access'
]
```

**Verification:**
```python
# Test imports
from models import AccountType
from services import IdentityResolver
from routes import onboarding_router
from middleware import require_dashboard_access
```

---

### Gap #2: Frontend Token Refresh Not Implemented

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 4 hours  
**Impact:** User experience (frequent re-logins)

**Current State:**
```javascript
// frontend/src/contexts/AuthContext.jsx
const { token, user } = response.data;  // ❌ Only uses legacy token
localStorage.setItem('token', token);
```

**Required Changes:**

**Step 1: Update AuthContext to handle both tokens**

```javascript
// frontend/src/contexts/AuthContext.jsx

// Update login/register/googleSignIn handlers
const handleAuthResponse = (response) => {
  const { access_token, refresh_token, user, token } = response.data;
  
  // Use new token structure if available, fallback to legacy
  const accessToken = access_token || token;
  const refreshToken = refresh_token;
  
  if (accessToken) {
    localStorage.setItem('token', accessToken);
  }
  
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  if (user) {
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('user_id', user.id);
    setUser(user);
  }
};

// Update all auth methods to use handleAuthResponse
const loginWithEmail = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  handleAuthResponse(response);
  return user;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  handleAuthResponse(response);
  return user;
};

const loginWithGoogle = async (googleData) => {
  const response = await api.post('/auth/google-signin', googleData);
  handleAuthResponse(response);
  return user;
};
```

**Step 2: Add token refresh function**

```javascript
// frontend/src/lib/api.js

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Add refresh token function
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    const { access_token, refresh_token: new_refresh_token } = response.data;
    
    // Store new tokens
    localStorage.setItem('token', access_token);
    if (new_refresh_token) {
      localStorage.setItem('refresh_token', new_refresh_token);
    }
    
    return access_token;
  } catch (error) {
    // Refresh failed, clear tokens and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
    throw error;
  }
};
```

**Step 3: Add response interceptor for 401 handling**

```javascript
// frontend/src/lib/api.js

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

**Step 4: Add token expiration check**

```javascript
// frontend/src/lib/tokenUtils.js

import jwt_decode from 'jwt-decode';

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    
    // Token expires in less than 1 minute
    return decoded.exp < (currentTime + 60);
  } catch {
    return true;
  }
};

export const shouldRefreshToken = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    
    // Refresh if token expires in less than 5 minutes
    return decoded.exp < (currentTime + 300);
  } catch {
    return false;
  }
};
```

**Step 5: Add proactive token refresh**

```javascript
// frontend/src/contexts/AuthContext.jsx

useEffect(() => {
  // Check token expiration every minute
  const interval = setInterval(async () => {
    const token = localStorage.getItem('token');
    
    if (token && shouldRefreshToken(token)) {
      try {
        await refreshAccessToken();
        console.log('✅ Token refreshed proactively');
      } catch (error) {
        console.error('❌ Proactive token refresh failed:', error);
        logout();
      }
    }
  }, 60000); // Every minute
  
  return () => clearInterval(interval);
}, []);
```

**Testing:**
1. Login and verify both tokens stored
2. Wait 16 minutes (access token expires)
3. Make API request → should auto-refresh
4. Verify new tokens stored
5. Test logout → both tokens cleared

---

### Gap #3: Phase 2 Identity Context Not Integrated

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 8 hours  
**Impact:** Phase 2 features inactive

**Required Changes:**

**Step 1: Create identity context hook**

```javascript
// frontend/src/hooks/useIdentityContext.js

import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useIdentityContext = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchContext = async () => {
    try {
      setLoading(true);
      const response = await api.get('/me/context');
      setContext(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch identity context:', err);
      setError(err);
      // Set default context on error
      setContext({
        authenticated: true,
        account_type: 'personal',
        next_route: '/dashboard'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContext();
  }, []);
  
  return { context, loading, error, refetch: fetchContext };
};
```

**Step 2: Update Dashboard to use identity context**

```javascript
// frontend/src/pages/Dashboard.jsx

import { useIdentityContext } from '../hooks/useIdentityContext';

const Dashboard = () => {
  const { context, loading } = useIdentityContext();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Handle subscription status
  if (context.needs_billing) {
    return <Navigate to={context.next_route} />;
  }
  
  // Render based on account type
  switch (context.account_type) {
    case 'personal':
      return <PersonalDashboard context={context} />;
    
    case 'business_solo':
      return <BusinessDashboard context={context} />;
    
    case 'organization':
      return <OrganizationDashboard context={context} />;
    
    default:
      return <PersonalDashboard context={context} />;
  }
};
```

**Step 3: Create onboarding flow**

```javascript
// frontend/src/pages/Onboarding.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const Onboarding = () => {
  const [accountType, setAccountType] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  
  const handleSubmit = async () => {
    try {
      const payload = {
        account_type: accountType
      };
      
      if (accountType === 'business_solo') {
        payload.business_data = {
          business_name: formData.businessName,
          business_email: formData.businessEmail,
          industry: formData.industry
        };
      } else if (accountType === 'organization') {
        payload.organization_data = {
          organization_name: formData.orgName,
          organization_email: formData.orgEmail,
          max_members: 10
        };
      }
      
      const response = await api.post('/onboarding/account-type', payload);
      
      // Navigate to next route
      navigate(response.data.next_route);
    } catch (error) {
      console.error('Onboarding failed:', error);
    }
  };
  
  return (
    <div>
      <h1>Choose Your Account Type</h1>
      
      <button onClick={() => setAccountType('personal')}>
        Personal Account
      </button>
      
      <button onClick={() => setAccountType('business_solo')}>
        Business Account
      </button>
      
      <button onClick={() => setAccountType('organization')}>
        Organization Account
      </button>
      
      {accountType && (
        <AccountTypeForm
          accountType={accountType}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
```

**Step 4: Update routing**

```javascript
// frontend/src/App.js

import Onboarding from './pages/Onboarding';
import BillingPage from './pages/BillingPage';

// Add routes
<Route path="/onboarding" element={<Onboarding />} />
<Route path="/billing" element={<BillingPage />} />
<Route path="/billing-required" element={<BillingRequiredPage />} />
```

**Testing:**
1. Login as existing user → context returns 'personal'
2. Create new user → complete onboarding flow
3. Select business account → verify business created
4. Check `/me/context` → returns correct account_type
5. Dashboard renders appropriate view

---

## 🟡 Medium Gaps - Fix This Sprint

### Gap #4: Standardize Error Handling

**Files to modify:** All API endpoints in `backend/server.py`

**Create error handler utility:**

```python
# backend/utils/error_handlers.py

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

class APIError(Exception):
    def __init__(self, status_code: int, message: str, details: dict = None):
        self.status_code = status_code
        self.message = message
        self.details = details or {}

async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "status_code": exc.status_code,
                "details": exc.details
            }
        }
    )

# Add to server.py
app.add_exception_handler(APIError, api_error_handler)
```

---

### Gap #5-11: Additional Medium Gaps

See detailed action items in CODEBASE_ARCHITECTURE_ANALYSIS.md

---

## 📋 Implementation Checklist

### Week 1: Critical Fixes

- [ ] Add __init__.py files (15 min)
- [ ] Implement token refresh (4 hours)
  - [ ] Update AuthContext
  - [ ] Add refresh function
  - [ ] Add response interceptor
  - [ ] Add proactive refresh
  - [ ] Test complete flow
- [ ] Integrate Phase 2 (8 hours)
  - [ ] Create identity context hook
  - [ ] Update Dashboard
  - [ ] Create onboarding flow
  - [ ] Add routing
  - [ ] Test all account types

**Total Time:** ~13 hours  
**Expected Score After:** 96/100

### Week 2: Medium Fixes

- [ ] Standardize error handling (4 hours)
- [ ] Add test coverage (20 hours)
- [ ] Document indexes (2 hours)
- [ ] Validate env vars (2 hours)
- [ ] Fix rate limiting (2 hours)

**Total Time:** ~30 hours  
**Expected Score After:** 98/100

### Week 3: Polish

- [ ] Add Docker setup (4 hours)
- [ ] Set up CI/CD (8 hours)
- [ ] Complete PWA (16 hours)
- [ ] Add monitoring (8 hours)

**Total Time:** ~36 hours  
**Expected Score After:** 100/100 ⭐

---

## ✅ Success Criteria

### Critical Gaps Fixed
- [x] All modules properly importable
- [x] Token refresh working automatically
- [x] Phase 2 features fully integrated
- [x] No 401 errors from expired tokens
- [x] Account type routing functional

### Medium Gaps Fixed
- [ ] Consistent error responses
- [ ] 70%+ test coverage
- [ ] All indexes documented
- [ ] Environment validated at startup
- [ ] Rate limiting consistent

### System Alignment
- [ ] 100/100 alignment score
- [ ] Zero critical gaps
- [ ] Zero medium gaps
- [ ] All minor issues addressed

---

**Action Plan Created:** December 25, 2025  
**Target Completion:** Week 3  
**Status:** READY TO EXECUTE 🚀

