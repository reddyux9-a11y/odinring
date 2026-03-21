# 🚀 Deploy Free Trial Feature - Quick Guide

## ✅ **What Was Changed**

1. **Backend:** New endpoint `POST /api/billing/trial/start` in `backend/routes/billing.py`
2. **Frontend:** Updated plan selection page with trial buttons in `frontend/src/pages/BillingChoosePlan.jsx`

---

## 🚀 **Easiest Way: Git Push (Automatic Deployment)**

If your Vercel projects are connected to GitHub, just push:

```bash
# Stage changes
git add backend/routes/billing.py frontend/src/pages/BillingChoosePlan.jsx

# Commit
git commit -m "Add 14-day free trial feature for all plans"

# Push to trigger automatic deployment
git push origin main
```

Vercel will automatically deploy both backend and frontend! ✅

---

## 🔧 **Manual Deployment via Vercel Dashboard**

### **Backend:**
1. Go to https://vercel.com/dashboard
2. Find **odinring-backend** project
3. Click **"Deployments"** tab
4. Click **"Redeploy"** on latest deployment
5. Select **"Use existing Build Cache"** (optional)
6. Click **"Redeploy"**

### **Frontend:**
1. Go to https://vercel.com/dashboard
2. Find **odinring-frontend** project
3. Click **"Deployments"** tab
4. Click **"Redeploy"** on latest deployment
5. Select **"Use existing Build Cache"** (optional)
6. Click **"Redeploy"**

---

## 📋 **Manual Deployment via CLI**

### **Prerequisites:**
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel
# Or use npx (no install needed)
```

### **Deploy Backend:**
```bash
cd backend
npx vercel@latest --prod --yes --token CytdA0p8Mj0pVsK1Pa1D28jQ
```

### **Deploy Frontend:**
```bash
cd frontend
npx vercel@latest --prod --yes --token CytdA0p8Mj0pVsK1Pa1D28jQ
```

---

## ✅ **Verify Deployment**

After deployment completes:

1. **Test Backend:**
   - Go to: `https://odinring-backend.vercel.app/api/health`
   - Should return 200 OK

2. **Test Frontend:**
   - Go to: `https://odinring-frontend.vercel.app/billing/choose-plan`
   - Should see:
     - ✅ "14-Day Free Trial" badge on each plan
     - ✅ "Start Free Trial" button
     - ✅ "Subscribe Now" button

3. **Test Trial Creation:**
   - Click "Start Free Trial" on any plan
   - Should see success message
   - Should redirect to dashboard

---

## 🎯 **Quick Status Check**

**Files Changed:**
- ✅ `backend/routes/billing.py` - New trial endpoint
- ✅ `frontend/src/pages/BillingChoosePlan.jsx` - Trial UI

**No Breaking Changes** - Safe to deploy! ✅

---

**Recommended:** Use **Git Push** method (easiest and most reliable)
