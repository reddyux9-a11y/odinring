# 🚀 OdinRing Deployment Implementation Guide
## Step-by-Step Automated Deployment Setup

**Recommended Approach:** Vercel (Frontend) + Railway (Backend)  
**Estimated Time:** 2-4 hours  
**Automation Level:** Fully Automated

---

## 📋 Prerequisites

- [ ] GitHub repository with code
- [ ] Vercel account (free tier works)
- [ ] Railway account (free tier works)
- [ ] Firebase project configured
- [ ] Environment variables documented

---

## 🎯 Phase 1: Frontend Deployment (Vercel)

### Step 1.1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect React app

### Step 1.2: Configure Build Settings

**Project Settings:**
- **Framework Preset:** Create React App
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install --legacy-peer-deps`

### Step 1.3: Configure Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Backend API URL (will be set after Railway deployment)
REACT_APP_BACKEND_URL=https://your-backend.railway.app

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Note:** Set these for **Production**, **Preview**, and **Development** environments.

### Step 1.4: Deploy

Click **"Deploy"** - Vercel will:
1. Install dependencies
2. Build the app
3. Deploy to production
4. Provide a URL (e.g., `odinring.vercel.app`)

**✅ Frontend is now live!**

---

## 🎯 Phase 2: Backend Deployment (Railway)

### Step 2.1: Connect Repository to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect the backend

### Step 2.2: Configure Service

**Service Settings:**
- **Root Directory:** `backend`
- **Dockerfile:** `backend/Dockerfile` (auto-detected)
- **Port:** `8000` (or use `$PORT` env var)

### Step 2.3: Configure Environment Variables

Add these in Railway Dashboard → Variables:

```bash
# Environment
ENV=production
LOG_LEVEL=INFO

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # Full JSON as string

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
ACCESS_TOKEN_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7

# CORS (use your Vercel frontend URL)
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Redis (optional, for caching)
REDIS_URL=redis://default:password@host:port  # If using Railway Redis addon

# Sentry (optional, for error tracking)
SENTRY_DSN=your-sentry-dsn

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
```

**Important:** For `FIREBASE_SERVICE_ACCOUNT_JSON`:
1. Download service account JSON from Firebase Console
2. Convert entire JSON to single-line string
3. Paste as environment variable in Railway

### Step 2.4: Deploy

Railway will:
1. Build Docker image
2. Deploy container
3. Provide a URL (e.g., `odinring-backend.railway.app`)

**✅ Backend is now live!**

### Step 2.5: Update Frontend Backend URL

1. Go back to Vercel
2. Update `REACT_APP_BACKEND_URL` with Railway URL
3. Redeploy frontend (automatic on env var change)

---

## 🎯 Phase 3: CI/CD Automation (GitHub Actions)

### Step 3.1: Update Deployment Workflow

Create/update `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: pip install -r requirements.txt
      
      - name: Run backend tests
        working-directory: ./backend
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: pytest -v
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci --legacy-peer-deps
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test -- --watchAll=false

  deploy-frontend:
    name: Deploy Frontend to Vercel
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_FRONTEND_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'

  deploy-backend:
    name: Deploy Backend to Railway
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v0.2.2
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
          detach: false

  deploy-indexes:
    name: Deploy Firestore Indexes
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Authenticate Firebase
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: firebase login:ci --token $FIREBASE_TOKEN
      
      - name: Deploy Firestore indexes
        run: firebase deploy --only firestore:indexes --project ${{ secrets.FIREBASE_PROJECT_ID }}

  notify:
    name: Deployment Status
    needs: [deploy-frontend, deploy-backend, deploy-indexes]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify
        run: |
          echo "✅ Frontend: ${{ needs.deploy-frontend.result }}"
          echo "✅ Backend: ${{ needs.deploy-backend.result }}"
          echo "✅ Indexes: ${{ needs.deploy-indexes.result }}"
```

### Step 3.2: Configure GitHub Secrets

Go to GitHub → Settings → Secrets and variables → Actions:

**Required Secrets:**
- `VERCEL_TOKEN` - Get from Vercel → Settings → Tokens
- `VERCEL_ORG_ID` - Get from Vercel → Settings → General
- `VERCEL_FRONTEND_PROJECT_ID` - Get from Vercel project settings
- `RAILWAY_TOKEN` - Get from Railway → Account → Tokens
- `FIREBASE_TOKEN` - Get via `firebase login:ci`
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `JWT_SECRET` - Your JWT secret key

**✅ CI/CD is now automated!**

---

## 🎯 Phase 4: Health Checks & Monitoring

### Step 4.1: Add Health Check Endpoint

Verify backend has health check (should already exist at `/api/status`):

```python
# backend/server.py (should already exist)
@api_router.get("/api/status")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
```

### Step 4.2: Set Up Uptime Monitoring

1. Go to [UptimeRobot](https://uptimerobot.com) (free tier)
2. Add monitor for:
   - Frontend: `https://your-app.vercel.app`
   - Backend: `https://your-backend.railway.app/api/status`
3. Set up email alerts

### Step 4.3: Configure Sentry (Already Integrated)

Verify Sentry is configured:
- Frontend: Check `frontend/src/lib/sentry.js`
- Backend: Check `backend/server.py` for Sentry init

Add `SENTRY_DSN` to both Vercel and Railway environment variables.

---

## 🎯 Phase 5: Custom Domain (Optional)

### Step 5.1: Frontend Domain (Vercel)

1. Go to Vercel → Project → Settings → Domains
2. Add your domain (e.g., `odinring.com`)
3. Follow DNS instructions
4. SSL is automatic

### Step 5.2: Backend Domain (Railway)

1. Go to Railway → Service → Settings → Networking
2. Generate domain or add custom domain
3. Update `CORS_ORIGINS` in Railway env vars
4. Update `REACT_APP_BACKEND_URL` in Vercel

---

## 🎯 Phase 6: Database Setup

### Step 6.1: Deploy Firestore Indexes

**Manual (One-time):**
```bash
firebase deploy --only firestore:indexes --project your-project-id
```

**Automated (via GitHub Actions):**
Already configured in workflow above.

### Step 6.2: Verify Firestore Rules

Check `firestore.rules` is deployed:
```bash
firebase deploy --only firestore:rules --project your-project-id
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check works: `https://backend.railway.app/api/status`
- [ ] Frontend can connect to backend (check browser console)
- [ ] Authentication works (Google Sign-In, Email/Password)
- [ ] Firestore indexes are deployed (check Firebase Console)
- [ ] Environment variables are set correctly
- [ ] CORS is configured (no CORS errors in console)
- [ ] SSL certificates are active (HTTPS works)
- [ ] GitHub Actions workflow runs successfully
- [ ] Monitoring is set up (UptimeRobot, Sentry)
- [ ] Error tracking works (test by triggering an error)

---

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:**
1. Check `REACT_APP_BACKEND_URL` in Vercel
2. Verify backend is running (check Railway logs)
3. Check CORS configuration in backend
4. Verify backend URL is accessible (curl test)

### Issue: Backend deployment fails

**Solution:**
1. Check Railway logs for errors
2. Verify Dockerfile is correct
3. Check environment variables are set
4. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON string

### Issue: Environment variables not working

**Solution:**
1. Verify variables are set in correct environment (Production)
2. Redeploy after adding variables
3. Check variable names match code exactly
4. Verify no typos in variable values

### Issue: Firestore indexes not deploying

**Solution:**
1. Check `firestore.indexes.json` syntax
2. Verify Firebase token is valid
3. Check Firebase project ID is correct
4. Manually deploy indexes as fallback

---

## 📊 Post-Deployment Monitoring

### Daily Checks (First Week)

1. Check UptimeRobot for uptime
2. Review Sentry for errors
3. Check Railway/Vercel logs
4. Monitor API response times

### Weekly Checks

1. Review error rates
2. Check database performance
3. Review deployment frequency
4. Check cost usage (Railway/Vercel dashboards)

---

## 🚀 Quick Deploy Commands

### Manual Frontend Deploy
```bash
cd frontend
vercel --prod
```

### Manual Backend Deploy
```bash
# Railway auto-deploys on git push
# Or use Railway CLI:
railway up
```

### Manual Index Deploy
```bash
firebase deploy --only firestore:indexes
```

---

## 📝 Maintenance

### Monthly Tasks

1. Review and update dependencies
2. Check security advisories
3. Review cost usage
4. Update documentation
5. Review and optimize environment variables

### Quarterly Tasks

1. Review deployment strategy
2. Evaluate scaling needs
3. Review monitoring and alerts
4. Update runbooks
5. Security audit

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Implementation  
**Estimated Setup Time:** 2-4 hours
