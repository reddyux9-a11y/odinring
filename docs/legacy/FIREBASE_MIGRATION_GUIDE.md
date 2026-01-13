# Firebase Migration Guide - MongoDB to Firestore

## Overview

This guide documents the migration from MongoDB to Firebase Firestore for the OdinRing application.

## Firebase Configuration

**Project Details:**
- Project ID: `studio-7743041576-fc16f`
- App ID: `1:544218567948:web:59374d5038ec7051b32529`
- API Key: `AIzaSyBQ5u38tm0592ekWX1DHxCDD4IN8Pqz4cs`
- Auth Domain: `studio-7743041576-fc16f.firebaseapp.com`
- Storage Bucket: `studio-7743041576-fc16f.firebasestorage.app`

## Migration Steps

### Step 1: Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `studio-7743041576-fc16f`
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Save it as `firebase-service-account.json` in the `backend/` directory

### Step 2: Install Firebase Dependencies

**Backend (Python):**
```bash
cd backend
pip3 install firebase-admin
```

**Frontend (React):**
```bash
cd frontend
npm install firebase
```

### Step 3: Update Environment Variables

**Backend `.env`:**
```
# Firebase Configuration
FIREBASE_PROJECT_ID=studio-7743041576-fc16f
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
JWT_SECRET=local-dev-secret-key-change-this-in-production-at-least-32-characters-long
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

**Frontend `.env`:**
```
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592ekWX1DHxCDD4IN8Pqz4cs
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948
REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529
```

## Database Schema Migration

### MongoDB Collections → Firestore Collections

| MongoDB Collection | Firestore Collection | Document ID Format |
|-------------------|---------------------|-------------------|
| `users` | `users` | Auto-generated or custom UUID |
| `rings` | `rings` | `RING_XXX` format |
| `admins` | `admins` | Auto-generated |
| `ring_analytics` | `ring_analytics` | Auto-generated |
| `status_checks` | `status_checks` | Auto-generated |

### Data Structure Differences

**MongoDB:**
- Uses `_id` field automatically
- Supports nested documents
- Date fields as `datetime` objects

**Firestore:**
- Uses document ID (separate from data)
- Supports nested maps and arrays
- Date fields as `Timestamp` objects

## API Changes

### No Breaking Changes

The API endpoints remain the same. All changes are internal to the backend implementation.

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Ring assignment works
- [ ] Profile updates work
- [ ] Link management works
- [ ] Analytics tracking works
- [ ] Admin authentication works
- [ ] QR code generation works

## Rollback Plan

If migration fails:
1. Keep MongoDB `.env` backup
2. Revert `server.py` changes
3. Restart with MongoDB connection

## Next Steps

1. Generate Firebase service account key
2. Run migration script to transfer data
3. Test all endpoints
4. Deploy to production

