# ⚡ Quick Fix: Vercel API Permissions

**Problem:** `{"error":{"code":"forbidden","message":"You don't have permission to create the project."}}`

---

## 🎯 **Immediate Solution (Use CLI)**

Your current token works with CLI, just not API. Use this:

```bash
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'

# Step 1: Link Backend
cd backend
npx vercel@latest link --token "$VERCEL_TOKEN"
# Choose: "Create new project" → name: odinring-backend

# Step 2: Link Frontend  
cd ../frontend
npx vercel@latest link --token "$VERCEL_TOKEN"
# Choose: "Create new project" → name: odinring-frontend

# Step 3: Set Environment Variables
cd ..
./scripts/setup-env-vars.sh

# Step 4: Deploy
./scripts/quick-deploy.sh both
```

---

## 🔧 **Long-term Fix (Get New Token)**

1. **Go to:** https://vercel.com/account/tokens
2. **Click:** "Create Token"
3. **Name:** `OdinRing Full Access`
4. **Scope:** Select **"Full Account"** (not "Read Only")
5. **Copy the new token**

Then update:

```bash
# Update token in scripts
./scripts/update-vercel-token.sh vck_YOUR_NEW_TOKEN_HERE

# Or manually set
export VERCEL_TOKEN='vck_YOUR_NEW_TOKEN_HERE'
```

---

## ✅ **Why This Happens**

- **Current token:** Read-only or limited scope
- **Needed:** Full Account scope for project creation
- **CLI works:** Because it uses different authentication flow
- **API fails:** Because it requires explicit project creation permission

---

**Recommendation:** Use CLI method now (works immediately), upgrade token later for automation.
