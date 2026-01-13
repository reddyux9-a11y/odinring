# OdinRing Setup Guide

Complete setup instructions for local development.

## Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- Firebase account
- Git

## Quick Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd odinring-main-2
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Authentication → Google Sign-In
4. Enable Firestore Database (Native mode)
5. Create Web App and get configuration

#### Get Service Account Key
1. Project Settings → Service Accounts
2. Generate new private key
3. Save as `backend/firebase-service-account.json`

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'ENVFILE'
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
JWT_SECRET=your-secret-key-change-this
CORS_ORIGINS=http://localhost:3000
ENVFILE

# Start server
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env file
cat > .env << 'ENVFILE'
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
ENVFILE

# Verify Firebase config
node verify-firebase-config.js

# Start development server
npm start
```

### 5. Firestore Setup

```bash
cd backend

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Seed database (optional)
python3 seed_firestore.py
```

## Verify Setup

### Backend Running
- Open: http://localhost:8000
- Should see: API docs

### Frontend Running
- Open: http://localhost:3000
- Should see: Landing page

### Test Authentication
1. Go to: http://localhost:3000/auth
2. Sign in with Google
3. Should redirect to dashboard

## Common Issues

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Firebase Configuration Error
```bash
# Verify config
cd frontend
node verify-firebase-config.js
```

### Authentication Fails
1. Check Firebase Console → Authentication → Settings → Authorized domains
2. Ensure `localhost` is whitelisted
3. Clear browser data and try again

## Helper Scripts

### Start Development Servers
```bash
./start-dev.sh
```

### Stop Development Servers
```bash
./stop-dev.sh
```

### Restart Servers
```bash
./restart-dev.sh
```

### Check Environment Variables
```bash
./check-env.sh
```

## Next Steps

- [Authentication Guide](AUTHENTICATION.md)
- [Development Guide](../guides/DEVELOPMENT.md)
- [Deployment Guide](../guides/DEPLOYMENT.md)

---

**Need Help?** See [Troubleshooting Guide](../guides/TROUBLESHOOTING.md)



