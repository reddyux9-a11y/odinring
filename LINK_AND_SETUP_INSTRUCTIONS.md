# 🔗 Link Projects & Set Environment Variables - Step by Step

Since the API has permission restrictions, here's the manual process:

---

## **STEP 1: Link Backend Project**

```bash
cd backend
npx vercel@latest link --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
```

**When prompted:**
1. Select: **"Create new project"** (option 1)
2. Project name: **`odinring-backend`**
3. Press Enter for all other defaults

**Expected output:**
```
✅ Linked to odinring-backend
```

---

## **STEP 2: Link Frontend Project**

```bash
cd ../frontend
npx vercel@latest link --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
```

**When prompted:**
1. Select: **"Create new project"** (option 1)
2. Project name: **`odinring-frontend`**
3. Press Enter for all other defaults

**Expected output:**
```
✅ Linked to odinring-frontend
```

---

## **STEP 3: Set Environment Variables**

Run the automated script:

```bash
cd ..
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
./scripts/setup-env-vars.sh
```

This will set:
- ✅ `FIREBASE_PROJECT_ID` = `studio-7743041576-fc16f`
- ✅ `FIREBASE_SERVICE_ACCOUNT_JSON` = (from your screenshot)
- ✅ `JWT_SECRET` = (auto-generated)
- ✅ `ENV` = `production`
- ✅ `LOG_LEVEL` = `INFO`

**Note:** `CORS_ORIGINS`, `FRONTEND_URL`, and `BACKEND_URL` will be set after first deployment.

---

## **STEP 4: Deploy to Get URLs**

### Deploy Backend:
```bash
cd backend
npx vercel@latest --prod --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
```

**Note the URL** (e.g., `https://odinring-backend-xxx.vercel.app`)

### Deploy Frontend:
```bash
cd ../frontend
npx vercel@latest --prod --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
```

**Note the URL** (e.g., `https://odinring-frontend-xxx.vercel.app`)

---

## **STEP 5: Set Remaining Environment Variables**

After getting the URLs, set these in the backend project:

```bash
cd backend

# Set CORS_ORIGINS (use your frontend URL)
echo "https://your-frontend-url.vercel.app" | npx vercel@latest env add CORS_ORIGINS production --token "CytdA0p8Mj0pVsK1Pa1D28jQ" --yes

# Set FRONTEND_URL
echo "https://your-frontend-url.vercel.app" | npx vercel@latest env add FRONTEND_URL production --token "CytdA0p8Mj0pVsK1Pa1D28jQ" --yes

# Set BACKEND_URL
echo "https://your-backend-url.vercel.app" | npx vercel@latest env add BACKEND_URL production --token "CytdA0p8Mj0pVsK1Pa1D28jQ" --yes
```

---

## **STEP 6: Redeploy**

Redeploy both projects to apply the new environment variables:

```bash
# Backend
cd backend
npx vercel@latest --prod --token "CytdA0p8Mj0pVsK1Pa1D28jQ"

# Frontend
cd ../frontend
npx vercel@latest --prod --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
```

---

## **STEP 7: Verify**

Test the health endpoint:

```bash
curl https://your-backend-url.vercel.app/api/health
```

**Expected:** JSON response (not 404)

---

## **Quick Reference**

**All commands in one place:**

```bash
# 1. Link backend
cd backend
npx vercel@latest link --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
# Choose: Create new project → odinring-backend

# 2. Link frontend
cd ../frontend
npx vercel@latest link --token "CytdA0p8Mj0pVsK1Pa1D28jQ"
# Choose: Create new project → odinring-frontend

# 3. Set env vars
cd ..
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
./scripts/setup-env-vars.sh

# 4. Deploy
cd backend && npx vercel@latest --prod --token "$VERCEL_TOKEN"
cd ../frontend && npx vercel@latest --prod --token "$VERCEL_TOKEN"

# 5. Set remaining vars (after getting URLs)
# (See Step 5 above)

# 6. Redeploy
# (See Step 6 above)
```

---

**Status:** Ready to execute  
**Time:** ~15 minutes total
