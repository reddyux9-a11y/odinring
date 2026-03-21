# Vercel Deployment Troubleshooting Guide

**Issue:** 404 NOT_FOUND error after deploying to Vercel

---

## Quick Diagnosis Steps

### 1. Check Vercel Function Logs

**Most Important Step!**

1. Go to: https://vercel.com/dashboard
2. Select your **backend** project
3. Click on the **latest deployment**
4. Open **"Function Logs"** tab
5. Look for error messages

**What to look for:**
- Red error messages
- Stack traces
- "Firebase initialization failed"
- "Environment variable not found"
- "Module not found"

**Share these logs** - they will tell us exactly what's wrong!

---

## Common Issues & Fixes

### Issue 1: Missing Environment Variables ⚠️ MOST COMMON

**Symptoms:**
- 404 error on all endpoints
- No errors in logs OR "Environment variable not found"

**Fix:**
1. Go to Vercel Dashboard → Backend Project → Settings → Environment Variables
2. Add these **required** variables:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
CORS_ORIGINS=https://your-frontend.vercel.app
ENV=production
LOG_LEVEL=INFO
```

3. **Important:** `FIREBASE_SERVICE_ACCOUNT_JSON` must be:
   - Complete JSON as **single-line string**
   - No newlines
   - All quotes properly escaped
   - Example: `{"type":"service_account","project_id":"my-project",...}`

4. Redeploy after adding variables

---

### Issue 2: Invalid Firebase Service Account JSON

**Symptoms:**
- Error: "Invalid JSON" or "Firebase initialization failed"
- 404 on all endpoints

**Fix:**

Convert your Firebase service account JSON to single-line:

```bash
# Method 1: Using jq (if installed)
cat firebase-service-account.json | jq -c . | tr -d '\n'

# Method 2: Using Python
python3 -c "import json; print(json.dumps(json.load(open('firebase-service-account.json')), separators=(',', ':')))"

# Method 3: Manual
# Open the JSON file, remove all newlines, ensure it's one line
```

Then paste the entire output as `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel.

---

### Issue 3: Routing Configuration

**Symptoms:**
- 404 on some endpoints but not others
- Root endpoint works but `/api/*` doesn't

**Fix:**

I've updated `backend/vercel.json` to fix routing. The new configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.py"
    },
    {
      "src": "/",
      "dest": "server.py"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.11"
  }
}
```

**Action:** Commit and redeploy:
```bash
git add backend/vercel.json
git commit -m "fix: update vercel.json routing configuration"
git push origin main
```

---

### Issue 4: FastAPI App Not Starting

**Symptoms:**
- 404 on all endpoints
- Errors in logs about imports or initialization

**Fix:**

1. Check if all dependencies are in `requirements.txt`
2. Verify Python version is 3.11
3. Check Vercel build logs for missing packages
4. Ensure `server.py` can be imported without errors

---

## Testing After Fix

### Test These Endpoints:

```bash
# 1. Root endpoint
curl https://your-backend.vercel.app/

# Expected: {"message":"OdinRing API...","status":"operational"}

# 2. API status
curl https://your-backend.vercel.app/api/status

# Expected: {"status":"healthy","timestamp":"..."}

# 3. API root
curl https://your-backend.vercel.app/api/

# Expected: {"message":"OdinRing API...","status":"operational"}
```

---

## Step-by-Step Fix Process

### Step 1: Check Logs
```bash
# View deployment logs
npx vercel logs [your-deployment-url]

# Or check in Vercel Dashboard
```

### Step 2: Verify Environment Variables
- Go to Vercel Dashboard
- Check all required variables are set
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` format

### Step 3: Update vercel.json
- I've already updated it
- Commit and push the changes
- Redeploy

### Step 4: Test Endpoints
- Use curl commands above
- Check browser console if accessing from frontend

### Step 5: Check CORS
- If frontend can't connect, verify `CORS_ORIGINS` includes frontend URL

---

## Environment Variables Checklist

**Backend Vercel Environment Variables:**

- [ ] `FIREBASE_PROJECT_ID` - Your Firebase project ID
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` - Complete JSON as single-line string
- [ ] `JWT_SECRET` - Secure secret (32+ chars)
- [ ] `CORS_ORIGINS` - Frontend URL (comma-separated if multiple)
- [ ] `ENV=production`
- [ ] `LOG_LEVEL=INFO`
- [ ] `ACCESS_TOKEN_EXPIRY_MINUTES=15` (optional)
- [ ] `REFRESH_TOKEN_EXPIRY_DAYS=7` (optional)
- [ ] `RATE_LIMIT_ENABLED=true` (optional)
- [ ] `RATE_LIMIT_PER_MINUTE=100` (optional)

---

## Quick Commands

```bash
# Check deployment status
npx vercel ls

# View logs
npx vercel logs [deployment-url]

# Redeploy
cd backend
npx vercel --prod

# Test locally first
python3 -m uvicorn server:app --reload --port 8000
curl http://localhost:8000/api/status
```

---

## What to Share for Further Help

If the issue persists, share:

1. **Vercel Function Logs** - Copy the error messages
2. **Environment Variables Status** - Which ones are set (don't share values!)
3. **Endpoint Test Results** - What curl returns
4. **Build Logs** - Any build errors

---

## Most Likely Solution

**90% of 404 errors are caused by:**

1. Missing `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
2. Invalid JSON format in `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Missing other required environment variables

**Action:**
1. Check Vercel logs first
2. Verify all environment variables
3. Ensure JSON is properly formatted
4. Redeploy

---

**Last Updated:** January 2025  
**Status:** Troubleshooting Guide
