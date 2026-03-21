# GitHub Secrets Setup Guide

**Repository:** https://github.com/reddyux9-a11y/odin_ring_io  
**Secrets URL:** https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions

---

## Quick Setup Steps

1. Go to: https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions
2. Click **"New repository secret"** for each secret below
3. Copy the values from the sections below

---

## Generated Secrets

### ✅ JWT_SECRET (Already Generated)

```
xVZm1eqwmDOuwaitWtzkKl9z+mGpQH3/iPYJEOgncuU=
```

**Action:** Add this as `JWT_SECRET` in GitHub Secrets

---

## Step-by-Step Secret Configuration

### 1. Vercel Secrets

#### Get Vercel Token
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it: `GitHub Actions - OdinRing`
4. Copy the token (only shown once!)

**Secret Name:** `VERCEL_TOKEN`  
**Value:** [Paste token from Vercel]

#### Get Vercel Org ID
1. Go to: https://vercel.com/account
2. Look for **Team ID** or **Organization ID**
3. Copy it

**Secret Name:** `VERCEL_ORG_ID`  
**Value:** [Your Vercel org/team ID]

#### Vercel Project IDs
**Note:** These will be available after creating Vercel projects (Phase 3)

**Secret Name:** `VERCEL_FRONTEND_PROJECT_ID`  
**Value:** [Will get after creating frontend project]

**Secret Name:** `VERCEL_BACKEND_PROJECT_ID`  
**Value:** [Will get after creating backend project]

**Secret Name:** `VERCEL_PROJECT_DOMAIN`  
**Value:** [Will get after deploying frontend, e.g., `odinring-frontend.vercel.app`]

---

### 2. Firebase Secrets

#### Get Firebase Token

Run in terminal:
```bash
npm install -g firebase-tools
firebase login:ci
```

Copy the token that appears.

**Secret Name:** `FIREBASE_TOKEN`  
**Value:** [Token from `firebase login:ci`]

#### Get Firebase Project ID

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to **Project Settings** → **General**
4. Copy **Project ID**

**Secret Name:** `FIREBASE_PROJECT_ID`  
**Value:** [Your Firebase project ID]

---

### 3. Application Secrets

#### JWT Secret (Already Generated)

**Secret Name:** `JWT_SECRET`  
**Value:** `xVZm1eqwmDOuwaitWtzkKl9z+mGpQH3/iPYJEOgncuU=`

#### Backend URL

**Secret Name:** `REACT_APP_BACKEND_URL`  
**Value:** `https://your-backend.vercel.app`  
**Note:** Update this after deploying backend (Phase 3)

#### Firebase Configuration

Get these from Firebase Console → Project Settings → General → Your apps:

**Secret Name:** `REACT_APP_FIREBASE_API_KEY`  
**Value:** [From Firebase Console]

**Secret Name:** `REACT_APP_FIREBASE_AUTH_DOMAIN`  
**Value:** [From Firebase Console, e.g., `your-project.firebaseapp.com`]

**Secret Name:** `REACT_APP_FIREBASE_PROJECT_ID`  
**Value:** [Same as FIREBASE_PROJECT_ID above]

**Secret Name:** `REACT_APP_FIREBASE_STORAGE_BUCKET`  
**Value:** [From Firebase Console, e.g., `your-project.appspot.com`]

**Secret Name:** `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`  
**Value:** [From Firebase Console]

**Secret Name:** `REACT_APP_FIREBASE_APP_ID`  
**Value:** [From Firebase Console]

---

## Complete Secrets Checklist

### Vercel Secrets (5 total)
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_FRONTEND_PROJECT_ID` (after creating project)
- [ ] `VERCEL_BACKEND_PROJECT_ID` (after creating project)
- [ ] `VERCEL_PROJECT_DOMAIN` (after deploying)

### Firebase Secrets (2 total)
- [ ] `FIREBASE_TOKEN`
- [ ] `FIREBASE_PROJECT_ID`

### Application Secrets (8 total)
- [x] `JWT_SECRET` ✅ (Already generated)
- [ ] `REACT_APP_BACKEND_URL` (after backend deploy)
- [ ] `REACT_APP_FIREBASE_API_KEY`
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
- [ ] `REACT_APP_FIREBASE_PROJECT_ID`
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `REACT_APP_FIREBASE_APP_ID`

**Total:** 15 secrets (7 can be set now, 8 need to wait for Vercel deployment)

---

## How to Add Secrets in GitHub

1. Go to: https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter **Name** (exactly as shown above)
4. Enter **Secret** (the value)
5. Click **"Add secret"**
6. Repeat for each secret

---

## Security Reminders

⚠️ **IMPORTANT:**
- Never commit these secrets to code
- Never share these secrets publicly
- Use GitHub Secrets only
- Rotate secrets periodically
- Use different secrets for staging/production

---

## Next Steps

After setting up secrets you can configure now:
1. ✅ JWT_SECRET (ready)
2. ⏳ Vercel secrets (need Vercel account setup)
3. ⏳ Firebase secrets (need Firebase token)
4. ⏳ Application secrets (need Firebase config)

**Continue to Phase 3:** Deploy to Vercel (see COMPLETE_DEPLOYMENT_ROADMAP.md)

---

**Last Updated:** January 2025  
**Status:** Ready for Configuration
