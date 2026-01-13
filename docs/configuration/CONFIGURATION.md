# Configuration Guide

Complete configuration reference for OdinRing v1.4.0.

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Firebase Configuration](#firebase-configuration)
- [Security Configuration](#security-configuration)
- [Advanced Configuration](#advanced-configuration)

## Environment Variables

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```env
# ============================================
# REQUIRED - Firebase Configuration
# ============================================
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ============================================
# REQUIRED - JWT Authentication
# ============================================
JWT_SECRET=your-secret-key-minimum-32-characters-long-for-security
JWT_ALGORITHM=HS256
JWT_EXPIRATION=168  # Hours (default: 168 = 7 days)

# ============================================
# REQUIRED - Application
# ============================================
ENV=development  # development | production | test
API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ============================================
# OPTIONAL - NFC Security
# ============================================
NFC_SECRET_KEY=your-nfc-secret-key  # Generate a secure random key

# ============================================
# OPTIONAL - Privacy & GDPR
# ============================================
DATA_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=180
AUDIT_LOG_IMMUTABLE=true

# ============================================
# OPTIONAL - Caching (Redis)
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ============================================
# OPTIONAL - Monitoring
# ============================================
SENTRY_DSN=your-sentry-dsn  # For error tracking
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```env
# ============================================
# REQUIRED - API Configuration
# ============================================
REACT_APP_API_URL=http://localhost:8000

# ============================================
# REQUIRED - Firebase Web Config
# ============================================
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# ============================================
# OPTIONAL - Environment
# ============================================
REACT_APP_ENV=development
NODE_ENV=development

# ============================================
# OPTIONAL - Feature Flags
# ============================================
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true
```

## Backend Configuration

### Configuration File Location

Backend configuration is managed through:
- `backend/config.py` - Python settings with validation
- `backend/.env` - Environment variables

### Key Configuration Sections

#### Firebase Configuration

```python
# In config.py
FIREBASE_PROJECT_ID: str
FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None
```

#### JWT Configuration

```python
JWT_SECRET: str  # Minimum 32 characters
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRATION: int = 168  # Hours
```

#### Rate Limiting

Configured in `server.py`:
- Auth endpoints: 5-10 requests/minute
- General endpoints: 100 requests/minute
- Public endpoints: 60 requests/minute

#### CORS Configuration

```python
# Configured in server.py
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-production-domain.com"
]
```

## Frontend Configuration

### Configuration File Location

Frontend configuration:
- `frontend/.env` - Environment variables
- `frontend/src/lib/api.js` - API client configuration

### API Client Configuration

```javascript
// In src/lib/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

### Firebase Configuration

```javascript
// In src/lib/firebase.js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

## Firebase Configuration

### Firestore Security Rules

Located in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Add more rules...
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Firestore Indexes

Located in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Security Configuration

### JWT Secret Generation

Generate a secure JWT secret:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### NFC Secret Key Generation

Generate NFC secret key:

```bash
# Same methods as JWT secret
openssl rand -hex 32
```

### Password Requirements

Configured in frontend validation:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Advanced Configuration

### Redis Caching (Optional)

1. Install Redis:
```bash
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server
```

2. Start Redis:
```bash
redis-server
```

3. Configure in `.env`:
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=  # Optional
```

### Sentry Error Tracking (Optional)

1. Create Sentry project
2. Get DSN from Sentry dashboard
3. Add to `.env`:
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Rate Limiting Customization

Modify in `backend/server.py`:

```python
# Per-endpoint rate limiting
@limiter.limit("5/minute")
async def register():
    pass

# Global rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
```

### Data Retention Configuration

Configure GDPR data retention:

```env
DATA_RETENTION_DAYS=90  # Analytics data retention
AUDIT_LOG_RETENTION_DAYS=180  # Audit log retention
```

## Production Configuration

### Environment Variables

For production, set:
```env
ENV=production
API_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

### Security Checklist

- [ ] JWT_SECRET is at least 32 characters
- [ ] NFC_SECRET_KEY is set (if using NFC)
- [ ] Service account key is secure and not in Git
- [ ] CORS_ORIGINS only includes production domains
- [ ] Firestore security rules are deployed
- [ ] All indexes are deployed
- [ ] SSL/TLS is enabled
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled

## Configuration Validation

### Backend Validation

Backend configuration is validated on startup. Check logs for:
```
✅ Configuration validated successfully
```

### Frontend Validation

Frontend validates configuration at build time. Check console for missing variables.

## Troubleshooting

### Configuration Issues

**Issue**: Backend won't start
- **Solution**: Check `.env` file exists and all required variables are set

**Issue**: Frontend can't connect to backend
- **Solution**: Verify `REACT_APP_API_URL` matches backend URL

**Issue**: Firebase connection fails
- **Solution**: Verify `FIREBASE_PROJECT_ID` and service account path

## Next Steps

- [API Documentation](api/API_OVERVIEW.md)
- [Security Configuration](security/SECURITY_OVERVIEW.md)
- [Deployment Guide](deployment/DEPLOYMENT.md)

---

**Configuration complete!** Continue to [Development Guide](development/DEVELOPMENT.md).


