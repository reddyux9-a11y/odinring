# Installation Guide

Complete installation instructions for OdinRing v1.4.0.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Backend Installation](#backend-installation)
- [Frontend Installation](#frontend-installation)
- [Firebase Setup](#firebase-setup)
- [Database Setup](#database-setup)
- [Verification](#verification)

## System Requirements

### Minimum Requirements

- **Operating System**: macOS, Linux, or Windows (WSL recommended)
- **Node.js**: Version 16.0.0 or higher
- **Python**: Version 3.9 or higher
- **npm**: Version 6.0.0 or higher (or yarn)
- **Firebase Account**: Free tier is sufficient
- **Memory**: 4GB RAM minimum
- **Disk Space**: 500MB free space

### Recommended Requirements

- **Node.js**: Version 18.0.0 or higher
- **Python**: Version 3.11 or higher
- **Memory**: 8GB RAM
- **Disk Space**: 1GB free space

## Backend Installation

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip3 install -r requirements.txt
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env  # If example exists
# Or create manually
```

Required environment variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/service-account-key.json

# JWT Configuration
JWT_SECRET=your-secret-key-minimum-32-characters-long-for-security
JWT_ALGORITHM=HS256

# Application
ENV=development
API_URL=http://localhost:8000

# CORS (for development)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Optional environment variables:

```env
# NFC Security
NFC_SECRET_KEY=your-nfc-secret-key

# Privacy & GDPR
DATA_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=180
AUDIT_LOG_IMMUTABLE=true

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

### Step 5: Start Backend Server

```bash
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- API: `http://localhost:8000/api`
- Documentation: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Frontend Installation

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is required for some dependency compatibility.

### Step 3: Set Up Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Step 4: Start Frontend Development Server

```bash
npm start
```

The frontend will automatically open at `http://localhost:3000`

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "odinring")
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode" (we'll add rules later)
4. Choose a location close to your users
5. Enable Firestore

### Step 3: Create Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON key file
4. Save it securely (never commit to Git!)
5. Update `FIREBASE_SERVICE_ACCOUNT_PATH` in backend `.env`

### Step 4: Get Firebase Web Config

1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Click Web icon (`</>`) to add web app
4. Register app (name: "OdinRing Frontend")
5. Copy the `firebaseConfig` object
6. Update frontend `.env` with these values

### Step 5: Enable Authentication

1. Go to Authentication → Sign-in method
2. Enable "Email/Password"
3. Enable "Google" (if using Google Sign-In)
4. Configure authorized domains

## Database Setup

### Step 1: Deploy Firestore Security Rules

```bash
cd backend
firebase deploy --only firestore:rules
```

Or manually copy rules from `firestore.rules` to Firebase Console.

### Step 2: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

Or manually deploy from `firestore.indexes.json`.

### Step 3: Initialize Collections

Collections will be created automatically when first used. To pre-create:

```bash
cd backend
python3 scripts/init_firestore_collections.py
```

### Required Collections

The following collections are automatically created:
- `users`
- `links`
- `media`
- `items`
- `sessions`
- `refresh_tokens`
- `rings`
- `qr_scans`
- `appointments`
- `admin_users`
- `audit_logs`
- `subscriptions`

## Verification

### Backend Verification

1. **Check API Documentation**:
   ```bash
   curl http://localhost:8000/api/docs
   ```
   Should return HTML or visit in browser.

2. **Health Check**:
   ```bash
   curl http://localhost:8000/api/health
   ```
   Should return: `{"status": "healthy"}`

3. **Test Registration**:
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","username":"testuser","name":"Test User"}'
   ```

### Frontend Verification

1. **Open Browser**: Visit `http://localhost:3000`
2. **Check Console**: No critical errors in browser console
3. **Test Registration**: Try creating an account
4. **Test Login**: Log in with created account

### Database Verification

1. **Check Firestore Console**: Verify collections exist
2. **Check Data**: After registration, verify user document in `users` collection
3. **Check Indexes**: Verify indexes are deployed

## Troubleshooting

### Common Issues

#### Backend won't start

- **Check Python version**: `python3 --version` (should be 3.9+)
- **Check dependencies**: `pip3 list` (verify all packages installed)
- **Check environment variables**: Verify `.env` file exists and is configured
- **Check port**: Ensure port 8000 is not in use: `lsof -i :8000`

#### Frontend won't start

- **Check Node version**: `node --version` (should be 16+)
- **Clear cache**: `rm -rf node_modules package-lock.json && npm install`
- **Check environment variables**: Verify `.env` file exists

#### Firebase connection issues

- **Verify service account path**: Check `FIREBASE_SERVICE_ACCOUNT_PATH` is correct
- **Verify project ID**: Check `FIREBASE_PROJECT_ID` matches Firebase Console
- **Check credentials**: Verify service account key file is valid JSON

#### Database connection issues

- **Verify Firestore is enabled**: Check Firebase Console
- **Check security rules**: Ensure rules allow initial setup
- **Verify indexes**: Check `firestore.indexes.json` is valid

### Getting Help

If you encounter issues:

1. Check [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md)
2. Review error messages carefully
3. Check Firebase Console for database errors
4. Review logs in terminal/console

## Next Steps

After successful installation:

1. **[Configure Your Environment](configuration/CONFIGURATION.md)** - Detailed configuration
2. **[Read Development Guide](development/DEVELOPMENT.md)** - Development workflow
3. **[Review API Documentation](api/API_OVERVIEW.md)** - API endpoints
4. **[Security Setup](security/SECURITY_OVERVIEW.md)** - Security configuration

---

**Installation complete!** Continue to the [Configuration Guide](../configuration/CONFIGURATION.md).


