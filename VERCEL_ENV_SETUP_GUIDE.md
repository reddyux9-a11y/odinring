# Vercel Environment Variables Setup Guide

This guide walks you through setting up environment variables for both Frontend and Backend Vercel projects.

---

## Prerequisites

- Vercel account created
- Two Vercel projects created:
  - Frontend project (React app)
  - Backend project (FastAPI serverless)
- Firebase project configured
- GitHub repository connected to Vercel

---

## Step 1: Get Required Values

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **General**
4. Scroll to **Your apps** section
5. Copy the following values:
   - `apiKey` → `REACT_APP_FIREBASE_API_KEY`
   - `authDomain` → `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `REACT_APP_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID`
   - `storageBucket` → `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `REACT_APP_FIREBASE_APP_ID`

### Firebase Service Account JSON

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. **Convert to single-line string** (see instructions below)

### JWT Secret

Generate a secure JWT secret (minimum 32 characters):

```bash
openssl rand -base64 32
```

---

## Step 2: Convert Firebase Service Account to JSON String

For Vercel serverless, you need to provide the service account as a JSON string, not a file.

### Option A: Using Command Line (Recommended)

```bash
# On macOS/Linux
cat firebase-service-account.json | jq -c . | tr -d '\n' > service-account-string.txt

# Or using Python
python3 -c "import json; print(json.dumps(json.load(open('firebase-service-account.json')), separators=(',', ':')))" > service-account-string.txt
```

### Option B: Manual Conversion

1. Open `firebase-service-account.json` in a text editor
2. Remove all newlines and extra spaces
3. Ensure it's a single line
4. Copy the entire JSON string

**Example format:**
```
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

---

## Step 3: Configure Frontend Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Frontend** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Production Environment Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `REACT_APP_BACKEND_URL` | `https://your-backend-project.vercel.app` | Backend API URL (update after backend deployment) |
| `REACT_APP_FIREBASE_API_KEY` | `your-api-key` | Firebase API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Firebase storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id` | Firebase messaging sender ID |
| `REACT_APP_FIREBASE_APP_ID` | `your-app-id` | Firebase app ID |

**Important:**
- Set these for **Production**, **Preview**, and **Development** environments
- After backend is deployed, update `REACT_APP_BACKEND_URL` with the actual backend URL

---

## Step 4: Configure Backend Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Backend** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Production Environment Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `{"type":"service_account",...}` | Full service account JSON as single-line string |
| `JWT_SECRET` | `your-secure-jwt-secret-min-32-chars` | JWT secret key (min 32 characters) |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Frontend URL (comma-separated if multiple) |
| `ENV` | `production` | Environment name |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `ACCESS_TOKEN_EXPIRY_MINUTES` | `15` | Access token expiry (optional) |
| `REFRESH_TOKEN_EXPIRY_DAYS` | `7` | Refresh token expiry (optional) |
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting (optional) |
| `RATE_LIMIT_PER_MINUTE` | `100` | Rate limit per minute (optional) |
| `REDIS_URL` | `redis://...` | Redis URL (optional, for caching) |
| `SENTRY_DSN` | `https://...@sentry.io/...` | Sentry DSN (optional, for error tracking) |

**Important:**
- `FIREBASE_SERVICE_ACCOUNT_JSON` must be the **entire JSON as a single-line string**
- Set `CORS_ORIGINS` to your frontend Vercel URL
- Set these for **Production**, **Preview**, and **Development** environments

---

## Step 5: Configure GitHub Secrets

For automated deployments via GitHub Actions, add these secrets:

1. Go to GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

### Required GitHub Secrets

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `VERCEL_TOKEN` | `your-vercel-token` | Vercel → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | `your-org-id` | Vercel → Settings → General → Team ID |
| `VERCEL_FRONTEND_PROJECT_ID` | `your-frontend-project-id` | Frontend project → Settings → General → Project ID |
| `VERCEL_BACKEND_PROJECT_ID` | `your-backend-project-id` | Backend project → Settings → General → Project ID |
| `VERCEL_PROJECT_DOMAIN` | `your-frontend.vercel.app` | Frontend project domain |
| `FIREBASE_TOKEN` | `your-firebase-token` | Run `firebase login:ci` in terminal |
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase Console → Project Settings |
| `JWT_SECRET` | `your-jwt-secret` | Generated secret (min 32 chars) |
| `REACT_APP_BACKEND_URL` | `https://your-backend.vercel.app` | Backend Vercel URL (after deployment) |
| `REACT_APP_FIREBASE_API_KEY` | `your-api-key` | Firebase Console |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase Console |
| `REACT_APP_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase Console |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Firebase Console |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id` | Firebase Console |
| `REACT_APP_FIREBASE_APP_ID` | `your-app-id` | Firebase Console |

### Getting Vercel Token

1. Go to [Vercel Settings](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token (only shown once!)

### Getting Firebase Token

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login and get token
firebase login:ci

# Copy the token that's displayed
```

---

## Step 6: Verify Configuration

### Test Frontend Environment Variables

After deployment, check that frontend can access backend:

1. Open browser console on your frontend
2. Check for any CORS errors
3. Verify API calls are going to correct backend URL

### Test Backend Environment Variables

1. Deploy backend to Vercel
2. Check Vercel function logs
3. Verify Firebase initialization succeeds
4. Test health endpoint: `https://your-backend.vercel.app/api/status`

---

## Troubleshooting

### Issue: Backend can't connect to Firebase

**Symptoms:**
- Error: "Firebase service account file not found"
- Error: "Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON"

**Solutions:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is a valid single-line JSON string
2. Check that all quotes are properly escaped
3. Ensure no newlines in the JSON string
4. Verify JSON is complete (all required fields present)

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests fail with CORS policy

**Solutions:**
1. Verify `CORS_ORIGINS` in backend includes frontend URL
2. Check that frontend URL matches exactly (including https://)
3. Ensure no trailing slashes in URLs
4. Redeploy backend after updating CORS_ORIGINS

### Issue: Environment Variables Not Working

**Symptoms:**
- Variables not available in code
- Default values being used

**Solutions:**
1. Verify variables are set for correct environment (Production/Preview/Development)
2. Redeploy after adding/updating variables
3. Check variable names match exactly (case-sensitive)
4. For React: Ensure variables start with `REACT_APP_`

---

## Environment Variable Reference

### Frontend Variables (React)

All frontend variables must start with `REACT_APP_` to be accessible in the browser.

### Backend Variables (FastAPI)

Backend variables are accessed via `os.getenv()` or `settings` object.

### Priority Order

1. **Vercel Environment Variables** (highest priority)
2. **GitHub Secrets** (for CI/CD)
3. **Local .env file** (for development)

---

## Quick Setup Checklist

- [ ] Firebase project configured
- [ ] Firebase service account JSON downloaded
- [ ] Service account JSON converted to single-line string
- [ ] JWT secret generated (min 32 chars)
- [ ] Frontend Vercel project created
- [ ] Backend Vercel project created
- [ ] Frontend environment variables configured
- [ ] Backend environment variables configured
- [ ] GitHub secrets configured
- [ ] Vercel token created
- [ ] Firebase token created
- [ ] Configuration verified

---

## Next Steps

After configuring environment variables:

1. Deploy backend first to get the backend URL
2. Update `REACT_APP_BACKEND_URL` in frontend with backend URL
3. Update `CORS_ORIGINS` in backend with frontend URL
4. Deploy frontend
5. Test end-to-end functionality

---

**Last Updated:** January 2025  
**Status:** Ready for Production Deployment
