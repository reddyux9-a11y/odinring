# OdinRing System Architecture

## Overview

OdinRing is a premium NFC ring-powered digital identity platform built with:
- **Frontend**: React (Progressive Web App)
- **Backend**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + JWT

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PWA Features  │  Auth Context  │  Theme System    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Components: Dashboard, Profile, Link Manager       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth Middleware  │  JWT Tokens  │  API Routes     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Business Logic  │  Validation  │  Error Handling  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ Firebase SDK
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Services                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Firestore DB  │  Authentication  │  Storage        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **PWA**: Service Workers, Web App Manifest

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **Authentication**: JWT + Firebase Admin SDK
- **Database ORM**: Firebase Admin SDK
- **CORS**: FastAPI CORS middleware

### Database
- **Primary**: Firebase Firestore
- **Collections**:
  - `users` - User profiles
  - `links` - User links
  - `rings` - NFC ring assignments
  - `analytics` - Click tracking
  - `admins` - Admin users

### Authentication Flow
1. **Google OAuth** (Firebase Auth)
2. **Email/Password** (Firebase Auth)
3. **JWT Tokens** (Backend)
4. **Persistent Sessions** (localStorage + Firebase)

## Key Features

### 1. Progressive Web App (PWA)
- ✅ Installable on mobile/desktop
- ✅ Offline capability
- ✅ App-like experience
- ✅ Push notifications ready

### 2. Authentication
- ✅ Google Sign-In (OAuth)
- ✅ Email/Password
- ✅ Secure JWT tokens
- ✅ Auth persistence across sessions
- ✅ onAuthStateChanged listener

### 3. Link Management
- ✅ Create/edit/delete links
- ✅ Drag-and-drop reordering
- ✅ Custom styling per link
- ✅ Scheduling (publish/unpublish dates)
- ✅ Analytics tracking

### 4. Profile Customization
- ✅ Custom themes
- ✅ Accent colors
- ✅ Custom branding
- ✅ Avatar/bio/phone

### 5. NFC Ring Integration
- ✅ Ring pairing
- ✅ Direct mode (single link)
- ✅ QR code fallback

## File Structure

```
odinring-main-2/
├── backend/
│   ├── server.py           # FastAPI app
│   ├── firebase_config.py  # Firebase initialization
│   ├── firestore_db.py     # Database helpers
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Auth & Theme contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities (api, firebase)
│   │   ├── pages/          # Page components
│   │   └── utils/          # Helper functions
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   └── icons/          # App icons
│   └── package.json
├── docs/                   # Documentation
└── README.md
```

## Environment Variables

### Frontend (`.env`)
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### Backend (`.env`)
```bash
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
JWT_SECRET=...
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-signin` - Login with Google
- `GET /api/me` - Get current user

### Links
- `GET /api/links` - Get user's links
- `POST /api/links` - Create link
- `PUT /api/links/{id}` - Update link
- `DELETE /api/links/{id}` - Delete link

### Profile
- `GET /api/users/{username}` - Get public profile
- `PUT /api/users` - Update profile

### Analytics
- `POST /api/analytics/click` - Track link click
- `GET /api/analytics` - Get user analytics

## Security

- ✅ HTTPS only in production
- ✅ JWT token expiration (7 days)
- ✅ Firebase Auth verification
- ✅ CORS protection
- ✅ Input validation
- ✅ Firestore security rules

## Performance

- ✅ Lazy loading components
- ✅ Image optimization
- ✅ Code splitting
- ✅ Cached API responses
- ✅ Indexed Firestore queries

---

**Version:** 2.0  
**Last Updated:** December 23, 2025  
**Database:** Firebase Firestore (Migrated from MongoDB)



