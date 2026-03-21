# Vercel 404 Error - Quick Fix Guide

**Error:** `404: NOT_FOUND` when accessing Vercel deployment

---

## Immediate Actions

### Step 1: Check Vercel Deployment Logs

1. Go to: https://vercel.com/dashboard
2. Select your backend project
3. Click on the latest deployment
4. Check **"Function Logs"** tab
5. Look for error messages

**Common errors you might see:**
- `Firebase initialization failed`
- `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON`
- `Environment variable FIREBASE_PROJECT_ID not found`
- `Module not found: ...`

---

### Step 2: Verify Environment Variables

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

**Required Variables:**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # Full JSON as single-line string
JWT_SECRET=your-secure-jwt-secret-min-32-chars
CORS_ORIGINS=https://your-frontend.vercel.app
ENV=production
LOG_LEVEL=INFO
```

**Critical:** `FIREBASE_SERVICE_ACCOUNT_JSON` must be:
- Complete JSON object
- Single-line (no newlines)
- Properly escaped quotes
- Example: `{"type":"service_account","project_id":"my-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}`

---

### Step 3: Fix vercel.json Configuration

The current `vercel.json` might need adjustment. Update it:

**File:** `backend/vercel.json`

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

---

### Step 4: Add Root Route (if missing)

Ensure `server.py` has a root route. Check if this exists:

```python
@app.get("/")
async def root():
    return {
        "message": "OdinRing API",
        "status": "healthy",
        "version": "1.4.0"
    }
```

If missing, add it before `app.include_router(api_router)`.

---

### Step 5: Test Endpoints

After redeploying, test these URLs:

```bash
# Root endpoint
curl https://your-backend.vercel.app/

# API status
curl https://your-backend.vercel.app/api/status

# API root
curl https://your-backend.vercel.app/api/
```

**Expected:** JSON responses, not 404

---

## Most Common Issues & Solutions

### Issue 1: Firebase Service Account JSON Format

**Error in logs:** `Invalid JSON` or `Firebase initialization failed`

**Solution:**
1. Download your Firebase service account JSON file
2. Convert to single-line string:
   ```bash
   cat firebase-service-account.json | jq -c . | tr -d '\n'
   ```
3. Copy the entire output
4. Paste as `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel environment variables
5. Redeploy

### Issue 2: Missing Environment Variables

**Error in logs:** `Environment variable not found`

**Solution:**
1. Check Vercel logs for which variable is missing
2. Add it in Vercel Dashboard → Settings → Environment Variables
3. Make sure it's set for **Production** environment
4. Redeploy

### Issue 3: Import Errors

**Error in logs:** `ModuleNotFoundError` or `ImportError`

**Solution:**
1. Check `backend/requirements.txt` includes all dependencies
2. Verify all imports in `server.py` are available
3. Check Vercel build logs for missing packages

### Issue 4: Routing Not Working

**Error:** 404 on all endpoints

**Solution:**
1. Update `vercel.json` as shown in Step 3
2. Ensure routes are properly configured
3. Check that `app.include_router(api_router)` is called

---

## Diagnostic Checklist

Run through this checklist:

- [ ] Checked Vercel deployment logs
- [ ] Verified all environment variables are set
- [ ] Confirmed `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON string
- [ ] Updated `vercel.json` if needed
- [ ] Verified root route exists in `server.py`
- [ ] Tested endpoints after redeploy
- [ ] Checked build logs for errors
- [ ] Verified Python version (3.11)

---

## Quick Fix Commands

```bash
# 1. Check current deployment
npx vercel ls

# 2. View logs
npx vercel logs [deployment-url]

# 3. Redeploy
cd backend
npx vercel --prod

# 4. Test locally first
python3 -m uvicorn server:app --reload --port 8000
curl http://localhost:8000/api/status
```

---

## Next Steps

1. **Check Vercel logs** - This will tell you the exact error
2. **Verify environment variables** - Most common cause
3. **Test endpoints** - After fixing, verify they work
4. **Share error logs** - If still failing, share the specific error from Vercel logs

---

**Priority Actions:**
1. ⚠️ Check Vercel Function Logs (most important)
2. ⚠️ Verify `FIREBASE_SERVICE_ACCOUNT_JSON` format
3. ⚠️ Ensure all required env vars are set
4. ⚠️ Redeploy after fixing

---

**Last Updated:** January 2025  
**Status:** Diagnostic & Fix Guide
