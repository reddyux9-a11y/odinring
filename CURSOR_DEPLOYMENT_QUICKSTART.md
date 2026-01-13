# 🚀 OdinRing Deployment Quick Start with Cursor

**Goal:** Deploy OdinRing to production in the most automated way possible using Cursor.

---

## 📋 Quick Decision Matrix

**Choose your deployment option based on priorities:**

| Priority | Recommended Option | Setup Time |
|----------|-------------------|------------|
| **Fastest MVP** | Vercel + Railway | 2-4 hours |
| **Cost Optimized** | Vercel + Render | 2-3 hours |
| **Enterprise** | Vercel + Cloud Run | 4-6 hours |
| **Full Control** | VPS (DigitalOcean) | 6-8 hours |

**👉 For most cases, start with: Vercel + Railway**

---

## 🎯 Step-by-Step: Vercel + Railway (Recommended)

### Phase 1: Setup Accounts (15 minutes)

#### 1.1 Vercel Account
```bash
# In Cursor terminal or browser:
# 1. Go to https://vercel.com/signup
# 2. Sign up with GitHub (recommended)
# 3. Authorize Vercel to access your GitHub repos
```

#### 1.2 Railway Account
```bash
# In Cursor terminal or browser:
# 1. Go to https://railway.app/signup
# 2. Sign up with GitHub (recommended)
# 3. Authorize Railway to access your GitHub repos
```

#### 1.3 Get Required Tokens
```bash
# Vercel Token:
# 1. Go to Vercel → Settings → Tokens
# 2. Create new token
# 3. Copy token (save securely)

# Railway Token:
# 1. Go to Railway → Account → Tokens
# 2. Create new token
# 3. Copy token (save securely)

# Firebase Token:
# Run in Cursor terminal:
firebase login:ci
# Copy the token that's displayed
```

---

### Phase 2: Configure GitHub Secrets (10 minutes)

#### 2.1 Add Secrets to GitHub

**In Cursor, you can use the terminal or guide the user:**

1. Go to: `https://github.com/YOUR_USERNAME/odinring-main-2/settings/secrets/actions`
2. Click **"New repository secret"**
3. Add each secret:

**Required Secrets:**
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_FRONTEND_PROJECT_ID=<will-get-after-vercel-setup>
VERCEL_PROJECT_DOMAIN=<will-get-after-vercel-setup>
RAILWAY_TOKEN=<your-railway-token>
FIREBASE_TOKEN=<your-firebase-token>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
JWT_SECRET=<your-jwt-secret-min-32-chars>
REACT_APP_BACKEND_URL=<will-update-after-railway-deploy>
REACT_APP_FIREBASE_API_KEY=<your-firebase-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<your-firebase-project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
REACT_APP_FIREBASE_APP_ID=<your-app-id>
```

**Note:** Some values will be filled after initial deployment.

---

### Phase 3: Deploy Frontend to Vercel (20 minutes)

#### 3.1 Create Vercel Project

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install --legacy-peer-deps`
4. Add environment variables (see Phase 2.1)
5. Click **"Deploy"**

**Option B: Via Vercel CLI (In Cursor Terminal)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name? odinring-frontend
# - Directory? ./
# - Override settings? No
```

#### 3.2 Get Vercel Project Details

After deployment:
1. Go to Vercel Dashboard → Your Project → Settings
2. Copy:
   - **Project ID** → Use for `VERCEL_FRONTEND_PROJECT_ID`
   - **Domain** → Use for `VERCEL_PROJECT_DOMAIN`
3. Update GitHub secrets with these values

---

### Phase 4: Deploy Backend to Railway (30 minutes)

#### 4.1 Create Railway Project

**Option A: Via Railway Dashboard (Recommended)**
1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect the backend
5. Configure:
   - **Root Directory:** `backend`
   - **Dockerfile:** Auto-detected
6. Add environment variables (see below)
7. Railway will auto-deploy

**Option B: Via Railway CLI (In Cursor Terminal)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Link to existing service or create new
railway up
```

#### 4.2 Configure Railway Environment Variables

In Railway Dashboard → Your Service → Variables, add:

```bash
ENV=production
LOG_LEVEL=INFO
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_SERVICE_ACCOUNT_JSON=<full-json-as-string>
JWT_SECRET=<your-jwt-secret>
CORS_ORIGINS=https://your-app.vercel.app
REDIS_URL=<optional-if-using-redis>
SENTRY_DSN=<optional>
```

**Important:** For `FIREBASE_SERVICE_ACCOUNT_JSON`:
1. Download service account JSON from Firebase Console
2. Convert to single-line string (remove newlines)
3. Paste entire JSON as value

#### 4.3 Get Railway URL

After deployment:
1. Go to Railway Dashboard → Your Service → Settings → Networking
2. Copy the generated domain (e.g., `odinring-backend.railway.app`)
3. Update:
   - `REACT_APP_BACKEND_URL` in Vercel environment variables
   - `REACT_APP_BACKEND_URL` in GitHub secrets
   - `CORS_ORIGINS` in Railway (add your Vercel URL)

---

### Phase 5: Update GitHub Actions Workflow (5 minutes)

The workflow file is already created at `.github/workflows/deploy-production.yml`.

**Just verify it exists and is correct:**
```bash
# In Cursor, check the file exists
cat .github/workflows/deploy-production.yml
```

If you need to update it, the file is ready with:
- ✅ Test phase
- ✅ Frontend deployment (Vercel)
- ✅ Backend deployment (Railway)
- ✅ Firestore indexes deployment
- ✅ Health checks
- ✅ Deployment summary

---

### Phase 6: Test Deployment (10 minutes)

#### 6.1 Trigger Deployment

**Option A: Push to main branch**
```bash
# In Cursor terminal:
git add .
git commit -m "chore: setup production deployment"
git push origin main
```

**Option B: Manual trigger**
1. Go to GitHub → Actions
2. Select "Deploy to Production" workflow
3. Click "Run workflow"

#### 6.2 Monitor Deployment

1. Go to GitHub → Actions
2. Watch the workflow run
3. Check each job:
   - ✅ Test
   - ✅ Deploy Frontend
   - ✅ Deploy Backend
   - ✅ Deploy Indexes
   - ✅ Health Checks

#### 6.3 Verify Deployment

```bash
# Test frontend
curl https://your-app.vercel.app

# Test backend health
curl https://your-backend.railway.app/api/status

# Should return: {"status":"healthy","timestamp":"..."}
```

---

## 🔧 Using Cursor to Execute Deployment

### Quick Commands in Cursor Terminal

```bash
# 1. Check current status
git status
git log --oneline -5

# 2. Verify environment files exist
ls -la backend/.env.example
ls -la frontend/.env.example

# 3. Test locally before deploying
cd backend && python3 -m uvicorn server:app --reload &
cd frontend && npm start &

# 4. Deploy Firestore indexes manually (if needed)
firebase deploy --only firestore:indexes

# 5. Check deployment workflow
cat .github/workflows/deploy-production.yml

# 6. View recent deployments
gh run list --workflow=deploy-production.yml
```

### Cursor AI Assistance

You can ask Cursor to:
- "Help me set up the GitHub secrets"
- "Check if the deployment workflow is correct"
- "Verify environment variables are configured"
- "Test the deployment locally"
- "Troubleshoot deployment errors"

---

## 📊 Deployment Checklist

Use this checklist in Cursor to track progress:

```markdown
## Pre-Deployment
- [ ] Vercel account created
- [ ] Railway account created
- [ ] Firebase project configured
- [ ] GitHub secrets configured
- [ ] Environment variables documented

## Deployment
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Environment variables set in both platforms
- [ ] CORS configured correctly
- [ ] GitHub Actions workflow updated

## Post-Deployment
- [ ] Frontend accessible
- [ ] Backend health check passes
- [ ] Firestore indexes deployed
- [ ] Authentication works
- [ ] Monitoring configured
- [ ] Custom domain configured (optional)
```

---

## 🚨 Troubleshooting with Cursor

### Issue: Deployment fails

**Ask Cursor:**
```
"Check the GitHub Actions logs and identify why the deployment failed"
```

**Or manually:**
```bash
# View recent workflow runs
gh run list

# View logs for latest run
gh run view --log
```

### Issue: Environment variables not working

**Ask Cursor:**
```
"Verify all environment variables are set correctly in Vercel and Railway"
```

**Or check manually:**
```bash
# Check what env vars are needed
grep -r "process.env" frontend/src
grep -r "os.getenv\|settings\." backend/
```

### Issue: Backend can't connect to Firebase

**Ask Cursor:**
```
"Verify Firebase service account JSON is correctly formatted in Railway"
```

**Or check:**
```bash
# Test Firebase connection locally
cd backend
python3 -c "from firebase_admin import credentials; print('Firebase import works')"
```

---

## 🎯 Next Steps After Deployment

1. **Set up monitoring:**
   - UptimeRobot (free tier)
   - Sentry (already integrated)
   - Vercel Analytics
   - Railway Metrics

2. **Configure custom domain:**
   - Add domain in Vercel
   - Update DNS records
   - Update CORS in Railway

3. **Set up staging environment:**
   - Create `develop` branch workflow
   - Deploy to staging URLs
   - Test before production

4. **Documentation:**
   - Update README with production URLs
   - Document deployment process
   - Create runbook for operations

---

## 📚 Additional Resources

- **Deployment Strategy:** See `DEPLOYMENT_STRATEGY.md`
- **Implementation Guide:** See `DEPLOYMENT_IMPLEMENTATION_GUIDE.md`
- **Troubleshooting:** Check GitHub Actions logs
- **Support:** Railway Discord, Vercel Community

---

**Last Updated:** January 2025  
**Status:** ✅ Ready to Execute  
**Estimated Total Time:** 2-4 hours
