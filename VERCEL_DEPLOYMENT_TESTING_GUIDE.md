# Vercel Deployment Testing Guide

## 🧪 How to Test the Vercel 404 Fix

This guide provides step-by-step instructions to test the deployment fix both locally and on Vercel.

---

## 📋 Table of Contents

1. [Local Testing (Before Deployment)](#local-testing)
2. [Vercel Deployment Testing](#vercel-deployment-testing)
3. [Route Testing Checklist](#route-testing-checklist)
4. [Environment Variable Verification](#environment-variable-verification)
5. [Build Verification](#build-verification)
6. [Troubleshooting](#troubleshooting)

---

## 🏠 Local Testing (Before Deployment)

### Step 1: Build the Frontend Locally

```bash
cd frontend
yarn install
yarn build
```

**Expected output:**
```
✔ Creating an optimized production build...
✔ Compiled successfully
```

**Verify build output:**
```bash
ls -la build/
# Should see:
# - index.html
# - static/
# - manifest.json
# - OdinRingLogo.png
# - etc.
```

### Step 2: Test Build with Local Server

```bash
# Option 1: Using serve (install if needed: npm install -g serve)
cd frontend
serve -s build -l 3000

# Option 2: Using Python HTTP server
cd frontend/build
python3 -m http.server 8000
```

### Step 3: Test Routes Locally

Open your browser and test these URLs:

| Route | Expected Result | Test URL |
|-------|----------------|----------|
| Homepage | Landing page loads | `http://localhost:3000/` |
| Dashboard | Redirects to /auth (if not logged in) | `http://localhost:3000/dashboard` |
| Auth Page | Auth page loads | `http://localhost:3000/auth` |
| Profile | Profile page loads | `http://localhost:3000/profile/testuser` |
| Install | Install page loads | `http://localhost:3000/install` |
| Admin Login | Admin login page loads | `http://localhost:3000/admin/login` |

**✅ Success Criteria:**
- All routes load without 404 errors
- No console errors about missing routes
- React Router navigation works

---

## 🚀 Vercel Deployment Testing

### Step 1: Push to GitHub (if not already done)

```bash
git push origin main
```

### Step 2: Monitor Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on the latest deployment
4. Watch the build logs

**Check for:**
- ✅ Build command executes: `cd frontend && yarn install --frozen-lockfile && yarn build`
- ✅ Build completes successfully
- ✅ Output directory detected: `frontend/build`
- ✅ No build errors

### Step 3: Test Routes on Vercel

After deployment completes, test these URLs:

**Replace `your-app` with your actual Vercel app name:**

| Route | Test URL | Expected Result |
|-------|----------|----------------|
| **Homepage** | `https://your-app.vercel.app/` | ✅ Landing page loads |
| **Dashboard** | `https://your-app.vercel.app/dashboard` | ✅ Dashboard or auth redirect |
| **Auth** | `https://your-app.vercel.app/auth` | ✅ Auth page loads |
| **Forgot Password** | `https://your-app.vercel.app/forgot-password` | ✅ Forgot password page |
| **Reset Password** | `https://your-app.vercel.app/reset-password` | ✅ Reset password page |
| **Profile** | `https://your-app.vercel.app/profile/testuser` | ✅ Profile page loads |
| **Ring Route** | `https://your-app.vercel.app/ring/ring123` | ✅ Profile page loads |
| **Install** | `https://your-app.vercel.app/install` | ✅ Install page loads |
| **Admin Login** | `https://your-app.vercel.app/admin/login` | ✅ Admin login page |
| **Onboarding** | `https://your-app.vercel.app/onboarding` | ✅ Redirects to auth if not logged in |
| **Subscription** | `https://your-app.vercel.app/subscription` | ✅ Redirects to auth if not logged in |
| **Billing** | `https://your-app.vercel.app/billing/choose-plan` | ✅ Redirects to auth if not logged in |
| **Checkout** | `https://your-app.vercel.app/checkout` | ✅ Redirects to auth if not logged in |
| **Payment Success** | `https://your-app.vercel.app/payment/success` | ✅ Redirects to auth if not logged in |
| **Payment Failed** | `https://your-app.vercel.app/payment/failed` | ✅ Redirects to auth if not logged in |
| **Admin Dashboard** | `https://your-app.vercel.app/admin/dashboard` | ✅ Redirects to admin login if not logged in |
| **Catch-All** | `https://your-app.vercel.app/nonexistent-route` | ✅ Redirects to homepage (`/`) |

### Step 4: Test Client-Side Navigation

1. Open browser DevTools (F12)
2. Navigate to `https://your-app.vercel.app/`
3. Test client-side navigation:
   - Click links in the app
   - Use browser back/forward buttons
   - Manually type URLs in address bar

**✅ Success Criteria:**
- All navigation works without page reload
- URL changes correctly
- No 404 errors
- No console errors

---

## ✅ Route Testing Checklist

Use this checklist to verify all routes:

```
Public Routes:
[ ] /                          - Landing page
[ ] /install                   - Install page
[ ] /profile/:username         - Public profile
[ ] /ring/:ringId              - Profile via ring ID

Auth Routes:
[ ] /auth                      - Login/Register
[ ] /forgot-password           - Password recovery
[ ] /reset-password            - Password reset
[ ] /admin/login               - Admin login

Protected User Routes (require auth):
[ ] /onboarding                - Onboarding flow
[ ] /dashboard                 - User dashboard
[ ] /subscription              - Subscription page
[ ] /billing/choose-plan       - Plan selection
[ ] /checkout                  - Checkout page
[ ] /payment/success           - Payment success
[ ] /payment/failed            - Payment failed
[ ] /subscription/manage       - Subscription management

Protected Admin Routes:
[ ] /admin/dashboard           - Admin dashboard

Error Handling:
[ ] /nonexistent-route         - Redirects to /
[ ] /random/path/here          - Redirects to /
```

---

## 🔐 Environment Variable Verification

### Check Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:

| Variable | Required | Example Value |
|----------|----------|---------------|
| `REACT_APP_BACKEND_URL` | ✅ **Required** | `https://your-backend.vercel.app` |
| `REACT_APP_SENTRY_DSN` | ⚠️ Optional | `https://xxx@sentry.io/xxx` |

### Test Environment Variables in Build

Check Vercel build logs for:
```
✓ Loaded env from .env
✓ Loaded env from .env.local
```

**If environment variables are missing:**
1. Add them in Vercel Dashboard
2. Redeploy the project
3. Verify they're accessible in build logs

---

## 🔍 Build Verification

### Check Build Output Structure

In Vercel build logs, verify:

```
✓ Build completed successfully
✓ Output directory: frontend/build
✓ Files deployed:
  - index.html
  - static/
  - manifest.json
```

### Verify vercel.json is Used

Check Vercel build logs for:
- Build command executed: `cd frontend && yarn install --frozen-lockfile && yarn build`
- Rewrites configured (should be automatic with vercel.json)
- Headers configured for static assets

---

## 🧪 Automated Testing Script

Create a test script to verify all routes:

```bash
#!/bin/bash
# test-vercel-routes.sh

APP_URL="https://your-app.vercel.app"

echo "🧪 Testing Vercel Routes..."
echo "=============================="

ROUTES=(
  "/"
  "/auth"
  "/dashboard"
  "/install"
  "/profile/testuser"
  "/admin/login"
  "/forgot-password"
)

for route in "${ROUTES[@]}"; do
  URL="${APP_URL}${route}"
  echo -n "Testing ${route}... "
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  
  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 301 ] || [ "$HTTP_CODE" -eq 302 ]; then
    echo "✅ OK ($HTTP_CODE)"
  else
    echo "❌ FAILED ($HTTP_CODE)"
  fi
done

echo "=============================="
echo "✅ Testing complete!"
```

**Run the test:**
```bash
chmod +x test-vercel-routes.sh
./test-vercel-routes.sh
```

---

## 🐛 Troubleshooting

### Issue 1: Still Getting 404 Errors

**Check:**
1. ✅ `vercel.json` is in the root directory
2. ✅ `vercel.json` contains the rewrite rule
3. ✅ Build completed successfully
4. ✅ Output directory is `frontend/build`

**Fix:**
```bash
# Verify vercel.json exists
cat vercel.json

# Check build output
cd frontend
yarn build
ls -la build/
```

### Issue 2: Static Assets Not Loading

**Check:**
1. ✅ Build completed successfully
2. ✅ `static/` directory exists in `frontend/build/`
3. ✅ Assets have correct paths (check browser Network tab)

**Fix:**
- Verify `%PUBLIC_URL%` is replaced correctly in `index.html`
- Check that static assets are in `build/static/`

### Issue 3: Routes Work on Homepage but Not on Direct Access

**Symptom:** `/dashboard` works when navigating from `/`, but 404 when accessed directly.

**Cause:** Rewrites not working correctly.

**Fix:**
1. Verify `vercel.json` is pushed to GitHub
2. Redeploy on Vercel
3. Clear browser cache and test again

### Issue 4: Build Fails on Vercel

**Check Vercel build logs for:**
- Missing dependencies
- Build command errors
- Environment variable issues

**Common fixes:**
```bash
# Ensure yarn.lock is committed
git add frontend/yarn.lock
git commit -m "Add yarn.lock"
git push origin main

# Verify package.json has correct scripts
cat frontend/package.json | grep "build"
```

### Issue 5: Environment Variables Not Working

**Check:**
1. Variables are set in Vercel Dashboard
2. Variables start with `REACT_APP_` prefix
3. Redeploy after adding variables

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy (or wait for auto-redeploy)

---

## 📊 Testing Checklist Summary

### Pre-Deployment
- [ ] Build succeeds locally (`yarn build`)
- [ ] Local server serves all routes correctly
- [ ] No console errors in browser DevTools
- [ ] `vercel.json` exists in root directory

### Post-Deployment
- [ ] Vercel build completes successfully
- [ ] Homepage loads (`/`)
- [ ] All public routes load (no 404)
- [ ] Protected routes redirect correctly
- [ ] Client-side navigation works
- [ ] Static assets load correctly
- [ ] Environment variables are accessible

### Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile device
- [ ] Test browser back/forward buttons

---

## 🎯 Success Criteria

**✅ Deployment is successful if:**

1. ✅ Homepage loads at `/`
2. ✅ All routes load without 404 errors
3. ✅ Client-side routing works (no page reloads)
4. ✅ Static assets load correctly
5. ✅ Protected routes redirect to auth when not logged in
6. ✅ No console errors in browser DevTools
7. ✅ Build completes successfully on Vercel

---

## 📞 Next Steps After Testing

If all tests pass:
- ✅ Deployment is successful!
- ✅ 404 error is fixed
- ✅ Ready for production use

If any tests fail:
1. Check the troubleshooting section above
2. Review Vercel build logs
3. Check browser console for errors
4. Verify `vercel.json` configuration
5. Test locally first to isolate issues

---

**Last Updated:** January 2025  
**Status:** Complete Testing Guide
