# Vercel 404 NOT_FOUND Error - Diagnosis & Fix

## Error Details
```
404: NOT_FOUND
Code: NOT_FOUND
ID: fra1::cpdqp-1768337292307-0d18c4eb27ca
```

## Common Causes

### 1. Missing vercel.json Configuration
The frontend needs a `vercel.json` file to handle React Router client-side routing.

### 2. Incorrect Project Settings
Vercel project settings may have wrong:
- Root directory
- Build command
- Output directory

### 3. Build Failures
The build might be failing silently.

### 4. React Router Not Configured
SPA routing needs rewrites to serve `index.html` for all routes.

---

## Diagnosis Steps

### Step 1: Check Vercel Project Settings

1. Go to Vercel Dashboard → Your Frontend Project → Settings
2. Verify:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` or `npm install --legacy-peer-deps && npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install --legacy-peer-deps`

### Step 2: Check Build Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check **Build Logs** for errors

**Look for:**
- Build failures
- Missing dependencies
- Environment variable errors

### Step 3: Verify Build Output

Check if `build` folder exists after build:
- Vercel should create `build/` folder
- Should contain `index.html` and static assets

---

## Solutions

### Solution 1: Add vercel.json to Frontend ⭐ REQUIRED

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Solution 2: Update Vercel Project Settings

In Vercel Dashboard → Settings → General:

**Framework Preset:** Create React App  
**Root Directory:** `frontend`  
**Build Command:** `npm run build`  
**Output Directory:** `build`  
**Install Command:** `npm install --legacy-peer-deps`

### Solution 3: Check Environment Variables

Ensure all required environment variables are set:
- `REACT_APP_BACKEND_URL`
- `REACT_APP_FIREBASE_*` (all Firebase config)

---

## Quick Fix Commands

### Create vercel.json for Frontend

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF
```

### Commit and Redeploy

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
git add frontend/vercel.json
git commit -m "fix: add vercel.json for frontend SPA routing"
git push origin main
```

---

## Testing After Fix

1. Wait for Vercel to redeploy (automatic on push)
2. Check deployment status in Vercel Dashboard
3. Visit your Vercel URL
4. Test navigation (should not show 404)

---

## Backend 404 Issues

If backend is showing 404:

### Check Backend vercel.json

The backend `vercel.json` should route `/api/*` correctly:

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
    }
  ]
}
```

### Test Backend Health

```bash
curl https://your-backend.vercel.app/api/status
```

Should return: `{"status":"healthy","timestamp":"..."}`

---

## Common Issues & Fixes

### Issue: Build Fails

**Symptoms:**
- Deployment shows "Build Failed"
- Error in build logs

**Fix:**
- Check build logs for specific errors
- Verify all dependencies in `package.json`
- Ensure Node.js version is compatible (18.x)

### Issue: Blank Page

**Symptoms:**
- Page loads but shows blank
- Console shows errors

**Fix:**
- Check browser console for errors
- Verify environment variables are set
- Check if `REACT_APP_BACKEND_URL` is correct

### Issue: 404 on Navigation

**Symptoms:**
- Homepage works
- Navigating to other routes shows 404

**Fix:**
- Add `vercel.json` with rewrites (Solution 1)
- Ensure React Router is configured correctly

---

## Verification Checklist

After applying fixes:

- [ ] `frontend/vercel.json` exists with rewrites
- [ ] Vercel project settings are correct
- [ ] Build completes successfully
- [ ] Homepage loads correctly
- [ ] Navigation works (no 404)
- [ ] Environment variables are set
- [ ] Backend API is accessible

---

**Last Updated:** January 2025  
**Status:** Diagnostic Guide
