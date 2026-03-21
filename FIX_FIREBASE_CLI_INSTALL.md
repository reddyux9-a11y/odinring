# Fix Firebase CLI Installation - Permission Error

## Problem
`npm install -g firebase-tools` failed with permission error:
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules/firebase-tools'
```

## Solutions (Choose One)

### Solution 1: Use npx (No Installation Required) ⭐ RECOMMENDED

You can use Firebase CLI without installing it globally:

```bash
# Get Firebase token using npx (no installation needed)
npx firebase-tools login:ci
```

This will:
- Download firebase-tools temporarily
- Run the login command
- Give you the token
- No permission issues!

**Use this method to get your FIREBASE_TOKEN for GitHub Secrets.**

---

### Solution 2: Fix npm Permissions (Permanent Fix)

Fix npm's directory permissions so you can install globally without sudo:

```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc or ~/.bashrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc

# Reload your shell
source ~/.zshrc

# Now install firebase-tools
npm install -g firebase-tools
```

---

### Solution 3: Use sudo (Quick but not recommended)

```bash
sudo npm install -g firebase-tools
```

Then run:
```bash
firebase login:ci
```

**Note:** Using sudo with npm can cause permission issues later. Use Solution 1 or 2 instead.

---

### Solution 4: Install Locally in Project

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm install firebase-tools --save-dev

# Then run using npx
npx firebase login:ci
```

---

## Recommended: Use npx (Solution 1)

**Run this command to get your Firebase token:**

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npx firebase-tools login:ci
```

**Steps:**
1. It will open a browser window
2. Log in with your Google account
3. Authorize Firebase CLI
4. Copy the token that appears in terminal
5. Add it as `FIREBASE_TOKEN` in GitHub Secrets

---

## After Getting Firebase Token

1. Go to: https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions
2. Click "New repository secret"
3. Name: `FIREBASE_TOKEN`
4. Value: [Paste the token from `npx firebase-tools login:ci`]
5. Click "Add secret"

---

## Quick Command Reference

```bash
# Get Firebase token (no installation needed)
npx firebase-tools login:ci

# Deploy Firestore indexes (when needed)
npx firebase-tools deploy --only firestore:indexes --project YOUR_PROJECT_ID

# Deploy Firestore rules (when needed)
npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
```

---

**Last Updated:** January 2025  
**Status:** Ready to Execute
