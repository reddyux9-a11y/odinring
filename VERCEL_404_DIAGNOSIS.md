# Vercel 404 NOT_FOUND Error - Diagnosis & Fix

**Error:** `404: NOT_FOUND` when accessing deployed Vercel application

---

## Common Causes

### 1. **Missing Environment Variables** ⚠️ MOST LIKELY

FastAPI initialization fails if required environment variables are missing, causing the app to not start properly.

**Check:**
- `FIREBASE_PROJECT_ID` - Required
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Required (as JSON string, not file)
- `JWT_SECRET` - Required (min 32 chars)
- `CORS_ORIGINS` - Required

**Solution:**
1. Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables
2. Verify all required variables are set
3. Redeploy after adding variables

---

### 2. **Incorrect vercel.json Configuration**

The `vercel.json` routes might not match your FastAPI routes.

**Current Configuration:**
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.py"
    },
    {
      "src": "/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

**Issue:** FastAPI routes are prefixed with `/api`, but Vercel routing might be causing conflicts.

---

### 3. **FastAPI App Not Properly Exported for Vercel**

Vercel Python runtime needs the app to be accessible. FastAPI should work, but we need to ensure proper initialization.

---

### 4. **Firebase Initialization Failure**

If Firebase fails to initialize (missing service account JSON), the app won't start.

---

## Diagnostic Steps

### Step 1: Check Vercel Deployment Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check **Build Logs** and **Function Logs**
4. Look for errors like:
   - `Firebase initialization failed`
   - `Environment variable not found`
   - `Module not found`
   - `Import error`

### Step 2: Test Health Endpoint

Try accessing:
```
https://your-backend.vercel.app/api/status
https://your-backend.vercel.app/api/
```

### Step 3: Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables, verify:

**Required:**
- ✅ `FIREBASE_PROJECT_ID`
- ✅ `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON as string)
- ✅ `JWT_SECRET`
- ✅ `CORS_ORIGINS`

**Optional but recommended:**
- `ENV=production`
- `LOG_LEVEL=INFO`

---

## Fixes

### Fix 1: Update vercel.json for Better Routing

Update `backend/vercel.json`:

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
      "src": "/(.*)",
      "dest": "server.py"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.11"
  }
}
```

### Fix 2: Add Root Route Handler

Ensure `server.py` has a root route that works:

```python
@app.get("/")
async def root():
    return {"message": "OdinRing API", "status": "healthy"}

@app.get("/api/status")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
```

### Fix 3: Verify Firebase Service Account JSON Format

The `FIREBASE_SERVICE_ACCOUNT_JSON` must be:
- Complete JSON as a **single-line string**
- No newlines
- All quotes properly escaped
- Example format: `{"type":"service_account","project_id":"...","private_key":"..."}`

**To convert:**
```bash
# From your firebase-service-account.json file
cat firebase-service-account.json | jq -c . | tr -d '\n'
```

### Fix 4: Add Error Handling for Missing Env Vars

The app should handle missing environment variables gracefully. Check if `firebase_config.py` properly handles the JSON string format.

---

## Quick Diagnostic Commands

### Check Deployment Status
```bash
# In your terminal
npx vercel ls

# Or check in Vercel Dashboard
```

### View Function Logs
```bash
npx vercel logs [deployment-url]
```

### Test Locally First
```bash
cd backend
python3 -m uvicorn server:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/api/status
curl http://localhost:8000/api/
```

---

## Most Likely Solution

**The 404 error is most likely due to:**

1. **Missing `FIREBASE_SERVICE_ACCOUNT_JSON`** - App fails to initialize
2. **Incorrect JSON format** - Not a valid single-line string
3. **Missing other required env vars** - App crashes on startup

**Action Items:**
1. ✅ Check Vercel deployment logs for specific errors
2. ✅ Verify all environment variables are set
3. ✅ Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is properly formatted
4. ✅ Redeploy after fixing environment variables

---

## Testing After Fix

Once fixed, test these endpoints:

```bash
# Health check
curl https://your-backend.vercel.app/api/status

# Root endpoint
curl https://your-backend.vercel.app/api/

# Should return JSON responses, not 404
```

---

**Next Steps:**
1. Check Vercel logs for specific error messages
2. Verify environment variables
3. Test endpoints after redeploy
4. Share error logs if issue persists

---

**Last Updated:** January 2025  
**Status:** Diagnostic Guide
