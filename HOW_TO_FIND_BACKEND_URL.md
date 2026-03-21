# 🔍 How to Find Your BACKEND_URL

A guide to locating your backend URL for Vercel deployment.

---

## 🚀 **METHOD 1: After Deploying to Vercel (Easiest)**

### **Step 1: Deploy Your Backend**

1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Click **"Add New"** → **"Project"**
4. Import your repository (or select existing project)
5. Configure:
   - **Root Directory:** `backend` (if backend is in a subfolder)
   - **Framework Preset:** Other
   - **Build Command:** (leave empty or use: `pip install -r requirements.txt`)
   - **Output Directory:** (leave empty for serverless)
6. Click **"Deploy"**

### **Step 2: Find Your Deployment URL**

After deployment completes:

1. Go to your **Project Dashboard** in Vercel
2. Look at the **"Domains"** section
3. You'll see something like:
   ```
   ✅ odinring-backend.vercel.app
   ✅ odinring-backend-git-main-yourusername.vercel.app
   ```

**Your BACKEND_URL is:**
```
https://odinring-backend.vercel.app
```

Or if you have a custom domain:
```
https://api.yourdomain.com
```

---

## 🚀 **METHOD 2: Check Existing Deployments**

If you've already deployed:

1. Go to [vercel.com](https://vercel.com)
2. Click on your **project**
3. Look at the **"Deployments"** tab
4. Click on the latest deployment
5. You'll see the **URL** at the top:
   ```
   https://your-project-name.vercel.app
   ```

**This is your BACKEND_URL!**

---

## 🚀 **METHOD 3: Check Project Settings**

1. Go to your Vercel project
2. Click **"Settings"** tab
3. Click **"Domains"** in the left sidebar
4. You'll see all domains associated with your project:
   - Production domain
   - Preview domains
   - Custom domains (if configured)

**Use the production domain as your BACKEND_URL**

---

## 📋 **Understanding Your Deployment Structure**

### **Option A: Separate Frontend & Backend Projects**

If you have **two separate Vercel projects**:

**Backend Project:**
- URL: `https://odinring-api.vercel.app`
- **BACKEND_URL:** `https://odinring-api.vercel.app`

**Frontend Project:**
- URL: `https://odinring.vercel.app`
- **FRONTEND_URL:** `https://odinring.vercel.app`

### **Option B: Monorepo (Single Project)**

If frontend and backend are in the **same Vercel project**:

- Project URL: `https://odinring.vercel.app`
- Backend API routes: `https://odinring.vercel.app/api/*`
- **BACKEND_URL:** `https://odinring.vercel.app`
- **FRONTEND_URL:** `https://odinring.vercel.app`

---

## 🔍 **How to Determine Your Setup**

### **Check Your Vercel Configuration:**

Look at your project structure:

1. **If you have `backend/vercel.json`:**
   - Backend is likely deployed separately
   - BACKEND_URL = your backend project's Vercel URL

2. **If you have root `vercel.json` only:**
   - Likely a monorepo deployment
   - BACKEND_URL = same as FRONTEND_URL

3. **Check Vercel Dashboard:**
   - Count your projects
   - If you see 2 projects → separate deployments
   - If you see 1 project → monorepo

---

## ✅ **Quick Checklist**

After finding your BACKEND_URL:

- [ ] **Format:** Starts with `https://`
- [ ] **No trailing slash:** `https://api.example.com` (not `https://api.example.com/`)
- [ ] **Accessible:** You can visit it in a browser
- [ ] **API works:** `https://your-backend-url/api/health` returns JSON

---

## 🧪 **Test Your BACKEND_URL**

Once you have the URL, test it:

```bash
# Test health endpoint
curl https://your-backend-url.vercel.app/api/health

# Should return:
# {"status":"healthy","database":"connected",...}
```

If this works, you have the correct BACKEND_URL!

---

## 📝 **Example Values**

### **Separate Deployments:**
```
BACKEND_URL=https://odinring-api.vercel.app
FRONTEND_URL=https://odinring.vercel.app
```

### **Monorepo (Same Project):**
```
BACKEND_URL=https://odinring.vercel.app
FRONTEND_URL=https://odinring.vercel.app
```

### **With Custom Domain:**
```
BACKEND_URL=https://api.odinring.com
FRONTEND_URL=https://odinring.com
```

---

## 🚨 **Common Issues**

### **Issue: "I don't see a deployment"**

**Solution:**
1. Make sure you've deployed the project
2. Check if you're looking at the right Vercel account
3. Verify the repository is connected

### **Issue: "I have multiple URLs"**

**Solution:**
- Use the **production** URL (not preview URLs)
- Production URL usually looks like: `project-name.vercel.app`
- Preview URLs have extra segments like: `project-name-git-branch-username.vercel.app`

### **Issue: "Backend and Frontend have same URL"**

**Solution:**
- This is fine if using a monorepo!
- Set both BACKEND_URL and FRONTEND_URL to the same value
- API routes will be at `/api/*`

---

## 💡 **Pro Tip**

**After your first deployment:**
1. Copy the deployment URL from Vercel
2. Set it as BACKEND_URL in environment variables
3. Redeploy to pick up the new environment variable
4. Test the connection

---

## 📋 **Summary**

**To find your BACKEND_URL:**

1. ✅ Deploy your backend to Vercel (if not already)
2. ✅ Go to Vercel Dashboard → Your Project
3. ✅ Check the **"Domains"** section or **"Deployments"** tab
4. ✅ Copy the production URL (starts with `https://`)
5. ✅ Use it as your BACKEND_URL value

**Format:** `https://your-project-name.vercel.app`

---

**Need help?** Check your Vercel project dashboard - the URL is always visible there!
