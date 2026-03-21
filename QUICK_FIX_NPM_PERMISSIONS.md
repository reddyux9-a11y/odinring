# 🔧 Quick Fix: npm Permission Error

You're getting `EACCES: permission denied` when trying to install Vercel CLI globally. Here are **3 quick solutions**:

---

## ✅ **Solution 1: Use npx (EASIEST - No Installation Needed)**

**No global installation required!** Use npx to run Vercel CLI directly:

```bash
# Login to Vercel
npx vercel@latest login

# Set environment variables
npx vercel@latest env add FIREBASE_PROJECT_ID production

# Or use the updated script
./scripts/setup-vercel-env-npx.sh
```

**All Vercel commands work with npx:**
```bash
npx vercel@latest env ls production
npx vercel@latest --prod
npx vercel@latest logs
```

---

## ✅ **Solution 2: Fix npm Permissions (Recommended for Long-term)**

Run the fix script:

```bash
./scripts/fix-npm-permissions.sh
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

Now install Vercel CLI:
```bash
npm install -g vercel
```

---

## ✅ **Solution 3: Use Vercel Dashboard (No CLI Needed)**

You don't need the CLI at all! Use the web interface:

1. Go to [vercel.com](https://vercel.com)
2. Sign in → Your Project → **Settings** → **Environment Variables**
3. Click **"Add New"** for each variable
4. See `VERCEL_ENV_SETUP_GUIDE.md` for the complete list

---

## 🚀 **Recommended Approach**

**For immediate setup:** Use **Solution 1 (npx)** or **Solution 3 (Dashboard)**

**For long-term:** Use **Solution 2** to fix npm permissions properly

---

## 📋 **Quick Reference: Using npx**

Instead of:
```bash
vercel login
vercel env add VARIABLE production
vercel --prod
```

Use:
```bash
npx vercel@latest login
npx vercel@latest env add VARIABLE production
npx vercel@latest --prod
```

The `@latest` ensures you always use the newest version!

---

**The setup script has been updated to automatically use npx if vercel CLI is not found globally.**
