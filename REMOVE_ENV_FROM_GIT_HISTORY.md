# Remove .env Files from Git History

## ⚠️ SECURITY: Remove Committed Environment Files

If `.env` files were **ever committed** to git history (even if later removed), you **MUST** remove them from git history to prevent credential exposure.

---

## 🔍 Step 1: Verify .env Files Were Committed

Check if .env files exist in git history:

```bash
# Check git history for .env files
git log --all --full-history --oneline -- "*.env" ".env" "*/.env" "*/.env.*"

# List all .env files that were ever committed
git log --all --pretty=format: --name-only --diff-filter=A | grep -E "\.env$|\.env\." | sort -u

# Check specific files
git log --all --full-history --oneline -- ".env" "backend/.env" "frontend/.env"
```

**If these commands return results, .env files were committed and must be removed from history.**

---

## 🗑️ Step 2: Remove .env Files from Git History

### Option 1: Using git filter-repo (Recommended)

**Install git-filter-repo:**
```bash
# macOS
brew install git-filter-repo

# Linux
pip install git-filter-repo

# Or via pip
pip install git-filter-repo
```

**Remove .env files:**
```bash
# Navigate to repository
cd /Users/sankarreddy/Desktop/odinring-main-2

# Remove all .env files from history
git filter-repo --path-glob '*.env' --invert-paths
git filter-repo --path-glob '*.env.*' --invert-paths
git filter-repo --path '.env' --invert-paths
git filter-repo --path 'backend/.env' --invert-paths
git filter-repo --path 'frontend/.env' --invert-paths
git filter-repo --path 'FIREBASE_SERVICE_ACCOUNT_JSON.env' --invert-paths

# Or combine into single command (removes all patterns at once)
git filter-repo \
  --path-glob '*.env' \
  --path-glob '*.env.*' \
  --path '.env' \
  --path 'backend/.env' \
  --path 'frontend/.env' \
  --invert-paths
```

### Option 2: Using BFG Repo-Cleaner (Alternative)

**Install BFG:**
```bash
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Or via Homebrew (macOS)
brew install bfg
```

**Remove .env files:**
```bash
# Clone a fresh copy of your repo (BFG needs a bare repository)
cd /tmp
git clone --mirror /Users/sankarreddy/Desktop/odinring-main-2 odinring-main-2.git

# Remove .env files
java -jar bfg.jar --delete-files '*.env' odinring-main-2.git
java -jar bfg.jar --delete-files '.env' odinring-main-2.git
java -jar bfg.jar --delete-files 'backend/.env' odinring-main-2.git
java -jar bfg.jar --delete-files 'frontend/.env' odinring-main-2.git

# Clean up and update
cd odinring-main-2.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push changes back
cd /Users/sankarreddy/Desktop/odinring-main-2
git remote set-url origin /tmp/odinring-main-2.git
git push --force --all
```

### Option 3: Using git filter-branch (Legacy - Not Recommended)

**⚠️ WARNING:** `git filter-branch` is slower and less reliable than `git filter-repo`. Use only if other options are unavailable.

```bash
# Remove all .env files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch '*.env' '*.env.*' '.env' 'backend/.env' 'frontend/.env'" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## ✅ Step 3: Verify Removal

After removing .env files from history:

```bash
# Verify .env files are no longer in history
git log --all --full-history --oneline -- "*.env" ".env" "*/.env"

# Should return no results

# Verify .gitignore includes .env patterns
grep -E "\.env|\.env\." .gitignore

# Should show: *.env and *.env.*
```

---

## 🔄 Step 4: Force Push to Remote (If Needed)

**⚠️ WARNING:** Force pushing rewrites remote history. Coordinate with your team first!

```bash
# Check remote status
git remote -v

# Force push to remote (DANGEROUS - rewrites history)
git push --force --all
git push --force --tags
```

**⚠️ CRITICAL:** After force pushing:
- All team members must re-clone the repository
- Any forks or clones will have stale history
- Consider creating a backup before force pushing

---

## 🔐 Step 5: Rotate All Credentials

After removing .env files from git history, **IMMEDIATELY rotate all secrets** that may have been exposed:

1. **Firebase Service Account Keys**
   - See: `FIREBASE_KEY_ROTATION_GUIDE.md`
   - Generate new keys in Firebase Console
   - Update `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel

2. **JWT Secrets**
   - Generate new `JWT_SECRET` (minimum 32 characters)
   - Update in Vercel environment variables
   - All existing tokens will be invalidated

3. **Database Credentials**
   - If database passwords were in .env files, rotate them
   - Update connection strings in environment variables

4. **API Keys**
   - Rotate any API keys (OpenAI, Stripe, etc.)
   - Update in Vercel environment variables

5. **Third-Party Service Secrets**
   - Rotate all secrets for external services
   - Review access logs for unauthorized access

---

## 📋 Checklist

- [ ] Verified .env files were committed to git history
- [ ] Chose removal method (git-filter-repo recommended)
- [ ] Removed .env files from git history
- [ ] Verified removal (no .env files in history)
- [ ] Verified .gitignore includes .env patterns
- [ ] Coordinated with team before force push (if needed)
- [ ] Force pushed to remote (if needed)
- [ ] Team members re-cloned repository
- [ ] Rotated all Firebase service account keys
- [ ] Rotated JWT secrets
- [ ] Rotated database credentials
- [ ] Rotated API keys
- [ ] Rotated third-party service secrets
- [ ] Reviewed access logs for unauthorized access
- [ ] Updated environment variables in Vercel/production

---

## 🆘 Troubleshooting

### Error: "git filter-repo: command not found"
- Install git-filter-repo: `pip install git-filter-repo` or `brew install git-filter-repo`

### Error: "refs/original exists"
- Remove backup refs: `rm -rf .git/refs/original/`
- Or use `git filter-repo` which handles this automatically

### Error: "fatal: refusing to merge unrelated histories"
- After force push, team members must: `git fetch origin && git reset --hard origin/main`

### Error: "Updates were rejected because the tip of your current branch is behind"
- This is expected after history rewrite. Use: `git push --force` (after coordinating with team)

---

## 📚 Additional Resources

- [Git Filter Repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter Branch Documentation](https://git-scm.com/docs/git-filter-branch)
- [FIREBASE_KEY_ROTATION_GUIDE.md](./FIREBASE_KEY_ROTATION_GUIDE.md)

---

## ⚠️ CRITICAL REMINDER

**After removing .env files from git history:**
- Secrets may have been cloned by others
- Secrets may be visible in public repositories (if repo was ever public)
- Secrets may be in backups or archives
- **Rotation is the ONLY way to invalidate old secrets**

**Do not skip credential rotation after removing .env files from git history!**

---

**Last Updated:** January 2025  
**Status:** ✅ No .env files found in git history (verified January 2025)
