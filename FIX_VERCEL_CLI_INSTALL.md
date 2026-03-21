# Fix Vercel CLI Installation - Permission Error

## Problem
`npm install -g vercel` failed with permission error:
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules/vercel'
```

## Solution: Use npx (No Installation Required) ⭐ RECOMMENDED

You can use Vercel CLI without installing it globally using `npx`:

```bash
# Use Vercel CLI with npx (no installation needed)
npx vercel --version
npx vercel login
npx vercel --prod
```

This will:
- Download vercel CLI temporarily when needed
- Run commands without permission issues
- No global installation required!

---

## Quick Commands for Deployment

### Login to Vercel
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npx vercel login
```

### Deploy Backend
```bash
cd backend
npx vercel --prod
```

### Deploy Frontend
```bash
cd frontend
npx vercel --prod
```

### Check Deployment Status
```bash
npx vercel ls
```

---

## Alternative: Fix npm Permissions (Permanent Fix)

If you want to install globally later, fix npm permissions:

```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc

# Reload your shell
source ~/.zshrc

# Now you can install globally
npm install -g vercel
```

---

## Recommended Workflow

**For Phase 3 Deployment, use npx:**

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy Backend
cd backend
npx vercel --prod

# 3. Deploy Frontend  
cd ../frontend
npx vercel --prod
```

**Benefits:**
- ✅ No permission issues
- ✅ No global installation needed
- ✅ Always uses latest version
- ✅ Works immediately

---

## Getting Vercel Token for GitHub Secrets

After logging in with `npx vercel login`, get your token:

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it: `GitHub Actions - OdinRing`
4. Copy the token
5. Add as `VERCEL_TOKEN` in GitHub Secrets

---

**Last Updated:** January 2025  
**Status:** Ready to Use
