# Security Implementation Quick Reference

## 🚀 Quick Start

### For Frontend Developers

#### 1. Login/Register Flow (Updated)

**OLD Response:**
```json
{
  "token": "jwt_token",
  "user": {...}
}
```

**NEW Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "secure_token",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {...},
  "token": "jwt_token"  // For backward compatibility
}
```

**What to do:**
1. Store both `access_token` and `refresh_token` securely (httpOnly cookies recommended)
2. Use `access_token` for API requests
3. When `access_token` expires (401 error), use `refresh_token` to get new tokens

#### 2. Token Refresh Flow (New)

```javascript
// When API returns 401 Unauthorized
async function refreshAccessToken(refreshToken) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store new tokens
    storeTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } else {
    // Refresh failed, redirect to login
    redirectToLogin();
  }
}
```

#### 3. Logout Flow (New)

```javascript
async function logout(accessToken) {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  // Clear stored tokens
  clearTokens();
  redirectToLogin();
}
```

#### 4. GDPR Data Export (New)

```javascript
async function exportUserData(accessToken) {
  const response = await fetch('/api/users/export', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    // Download as JSON file
    downloadJSON(data, 'my_data.json');
  }
}
```

---

## 🔒 For Backend Developers

### Adding Audit Logging

```python
from audit_log_utils import log_audit_event, get_client_ip, get_user_agent

@api_router.post("/some/endpoint")
async def my_endpoint(request: Request, current_user: User = Depends(get_current_user)):
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Your business logic here
    result = do_something()
    
    # Log the action
    await log_audit_event(
        actor_id=current_user.id,
        action='action_name',
        entity_type='entity_type',
        entity_id='entity_id',
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'key': 'value'},
        status='success'
    )
    
    return result
```

### Common Audit Helpers

```python
from audit_log_utils import (
    log_login, log_logout, log_profile_update,
    log_link_create, log_link_update, log_link_delete,
    log_ring_assign, log_ring_unassign, log_admin_action
)

# Login
await log_login(user_id, ip_address, user_agent, method="email")

# Logout
await log_logout(user_id, ip_address, user_agent)

# Profile update
await log_profile_update(user_id, ip_address, user_agent, fields_updated=['name', 'bio'])

# Link operations
await log_link_create(user_id, link_id, ip_address, user_agent)
await log_link_update(user_id, link_id, ip_address, user_agent, fields_updated=['url'])
await log_link_delete(user_id, link_id, ip_address, user_agent)

# Admin action
await log_admin_action(admin_id, 'user_delete', 'user', user_id, ip_address, user_agent)
```

### Session Management

```python
from session_utils import SessionManager

# Create session (during login)
session = await SessionManager.create_session(
    user_id=user.id,
    token=access_token,
    ip_address=ip_address,
    user_agent=user_agent
)

# Validate session
is_valid = await SessionManager.validate_session(session_id)

# Invalidate session (during logout)
await SessionManager.invalidate_session(session_id)

# Invalidate all user sessions
await SessionManager.invalidate_user_sessions(user_id)
```

### Refresh Token Management

```python
from refresh_token_utils import RefreshTokenManager

# Create refresh token (during login)
refresh_token, token_record = await RefreshTokenManager.create_refresh_token(
    user_id=user.id,
    session_id=session_id,
    ip_address=ip_address,
    user_agent=user_agent
)

# Validate refresh token
token_record = await RefreshTokenManager.validate_refresh_token(refresh_token)

# Rotate refresh token
rotation_result = await RefreshTokenManager.rotate_refresh_token(
    old_token=refresh_token,
    ip_address=ip_address,
    user_agent=user_agent
)

if rotation_result:
    new_token, new_record = rotation_result
```

---

## 📝 Configuration

### Environment Variables

```bash
# Token expiration settings
ACCESS_TOKEN_EXPIRY_MINUTES=15      # Short-lived access tokens
REFRESH_TOKEN_EXPIRY_DAYS=7         # Long-lived refresh tokens

# Existing required settings
JWT_SECRET=your_secret_here_minimum_32_chars
FIREBASE_PROJECT_ID=your_project_id
```

---

## 🗃️ Database Collections

### audit_logs
```javascript
{
  id: "uuid",
  actor_id: "user_id",
  action: "login|logout|profile_update|link_create|...",
  entity_type: "user|link|ring|...",
  entity_id: "entity_id",
  timestamp: Date,
  ip_address: "127.0.0.1",
  user_agent: "Mozilla/5.0...",
  metadata: {},
  status: "success|failure"
}
```

### sessions
```javascript
{
  id: "uuid",
  user_id: "user_id",
  token: "jwt_token",
  ip_address: "127.0.0.1",
  user_agent: "Mozilla/5.0...",
  created_at: Date,
  expires_at: Date,
  is_active: true,
  last_activity: Date
}
```

### refresh_tokens
```javascript
{
  id: "uuid",
  user_id: "user_id",
  session_id: "session_id",
  token_hash: "sha256_hash",
  ip_address: "127.0.0.1",
  user_agent: "Mozilla/5.0...",
  created_at: Date,
  expires_at: Date,
  is_active: true,
  is_rotated: false,
  last_used: Date
}
```

---

## 🚨 Common Issues & Solutions

### Issue: "Session expired or invalid" error

**Cause:** Access token expired or session invalidated  
**Solution:** Use refresh token to get new access token

```javascript
// Intercept 401 errors
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken(refreshToken);
      // Retry original request with new token
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Issue: Refresh token returns 401

**Cause:** Refresh token expired or invalidated  
**Solution:** User must log in again

```javascript
if (refreshResponse.status === 401) {
  // Clear tokens and redirect to login
  clearTokens();
  window.location.href = '/login';
}
```

### Issue: Getting frequent 401 errors

**Cause:** Access token expires too quickly (15 minutes)  
**Solution:** Implement automatic token refresh before expiry

```javascript
// Refresh token 1 minute before expiry
setInterval(async () => {
  const tokenAge = getTokenAge(accessToken);
  if (tokenAge > 14 * 60 * 1000) { // 14 minutes
    await refreshAccessToken(refreshToken);
  }
}, 60000); // Check every minute
```

---

## 🛡️ Security Best Practices

### DO ✅

- Store tokens in httpOnly cookies (frontend)
- Implement automatic token refresh
- Clear tokens on logout
- Handle 401 errors gracefully
- Use HTTPS in production
- Validate session on every request
- Log all security-sensitive actions

### DON'T ❌

- Store tokens in localStorage (XSS vulnerable)
- Ignore 401 errors
- Skip token refresh implementation
- Hardcode tokens in frontend
- Use HTTP in production
- Skip session validation
- Ignore audit logs

---

## 📚 API Reference

### Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login with email |
| `/api/auth/google-signin` | POST | No | Login with Google |
| `/api/auth/logout` | POST | Yes | Logout and invalidate session |
| `/api/auth/refresh` | POST | No | Refresh access token |

### User Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/export` | GET | Yes | Export user data (GDPR) |
| `/api/me` | GET | Yes | Get current user |
| `/api/me` | PUT | Yes | Update current user |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/validate` | GET | Admin | Validate data integrity |
| `/api/admin/stats` | GET | Admin | Get admin statistics |

---

## 🔍 Monitoring

### Key Metrics to Track

1. **Token refresh rate** - Should be steady
2. **Failed login attempts** - Monitor for brute force
3. **Session duration** - Understand user behavior
4. **Audit log volume** - Track activity levels
5. **GDPR exports** - Compliance tracking

### Log Patterns

```bash
# Success patterns
"Session created: session_id=..."
"Refresh token created: token_id=..."
"GDPR data export completed for user: ..."

# Warning patterns
"Refresh token has been rotated"
"Session expired or invalid"

# Error patterns
"Failed to create session"
"Invalid or expired refresh token"
```

---

## 🧪 Testing

### Run Security Smoke Tests

```bash
cd backend
python test_security_implementation.py
```

### Manual Testing

1. **Login** → Check network tab for `access_token` and `refresh_token`
2. **Wait 16 minutes** → Access token should expire
3. **Make API request** → Should get 401 error
4. **Call /auth/refresh** → Should get new tokens
5. **Make API request again** → Should work with new token
6. **Logout** → Session should be invalidated
7. **Try using old token** → Should get 401 error

---

## 📞 Support

**Questions?** Check the full documentation:
- `SECURITY_COMPLIANCE_IMPLEMENTATION.md` - Full implementation details
- `backend/audit_log_utils.py` - Audit logging API docs
- `backend/session_utils.py` - Session management API docs
- `backend/refresh_token_utils.py` - Refresh token API docs

---

**Last Updated:** December 25, 2025  
**Version:** 1.0

