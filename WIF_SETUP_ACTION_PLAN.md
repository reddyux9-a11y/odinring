# Workload Identity Federation Setup - Action Plan

## ✅ What's Been Done

1. **Workflow Fixed** - `.github/workflows/backup.yml` updated to use WIF
2. **Setup Scripts Created** - Automated GCP setup scripts
3. **Documentation Created** - Complete guides and references
4. **Security Hardened** - Fork protection and minimal permissions

## 🎯 What You Need to Do

Follow these steps in order:

### Step 1: Set Up WIF in GCP (5-10 minutes)

Run the automated setup script:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./scripts/setup_wif.sh
```

**What it does:**
- Creates Workload Identity Pool
- Creates OIDC Provider
- Creates Service Account
- Grants IAM permissions
- Binds WIF to service account
- Saves configuration to `.wif_config.txt`

**You'll need:**
- GCP Project ID
- GitHub repository owner (e.g., `reddyux9-a11y`)
- GitHub repository name (e.g., `odin_ring_io`)

### Step 2: Verify GCP Setup (2 minutes)

```bash
./scripts/test_wif_setup.sh
```

This verifies all GCP resources are correctly configured.

### Step 3: Add GitHub Secrets (5 minutes)

#### Option A: Using GitHub CLI (Fastest)

```bash
# Read values from config file
WIF_PROVIDER=$(sed -n '1p' .wif_config.txt)
WIF_SERVICE_ACCOUNT=$(sed -n '2p' .wif_config.txt)
PROJECT_ID=$(sed -n '3p' .wif_config.txt)

# Add secrets
gh secret set WIF_PROVIDER --body "$WIF_PROVIDER"
gh secret set WIF_SERVICE_ACCOUNT --body "$WIF_SERVICE_ACCOUNT"
gh secret set FIREBASE_PROJECT_ID --body "$PROJECT_ID"
gh secret set BACKUP_BUCKET_NAME --body "${PROJECT_ID}-firestore-backups"
```

#### Option B: Using GitHub Web UI

1. Go to: `https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions`
2. Click **"New repository secret"** for each:

   - **WIF_PROVIDER**: Get from `.wif_config.txt` (line 1)
   - **WIF_SERVICE_ACCOUNT**: Get from `.wif_config.txt` (line 2)
   - **FIREBASE_PROJECT_ID**: Your project ID
   - **BACKUP_BUCKET_NAME**: `{PROJECT_ID}-firestore-backups` (optional)

See `GITHUB_SECRETS_QUICK_REFERENCE.md` for detailed instructions.

### Step 4: Test the Workflow (2 minutes)

1. Go to GitHub: `https://github.com/reddyux9-a11y/odin_ring_io/actions`
2. Select **"Automated Firestore Backup"**
3. Click **"Run workflow"**
4. Select branch (usually `main`)
5. Click **"Run workflow"**

**What to check:**
- ✅ Workflow completes successfully
- ✅ "Authenticate to Google Cloud" step succeeds
- ✅ "Run backup script" step succeeds
- ✅ No authentication errors

### Step 5: Remove Old Credentials (2 minutes)

**Only after confirming WIF works!**

#### Remove Service Account Keys

```bash
./scripts/remove_old_credentials.sh
```

#### Remove GitHub Secret

1. Go to: `https://github.com/reddyux9-a11y/odin_ring_io/settings/secrets/actions`
2. Find **GCP_SA_KEY**
3. Click on it → **Delete** → Confirm

## 📋 Quick Checklist

- [ ] Run `./scripts/setup_wif.sh`
- [ ] Run `./scripts/test_wif_setup.sh` (verify all checks pass)
- [ ] Add `WIF_PROVIDER` secret to GitHub
- [ ] Add `WIF_SERVICE_ACCOUNT` secret to GitHub
- [ ] Add/verify `FIREBASE_PROJECT_ID` secret
- [ ] Add `BACKUP_BUCKET_NAME` secret (optional)
- [ ] Test workflow manually in GitHub Actions
- [ ] Verify backup appears in GCS bucket
- [ ] Remove old `GCP_SA_KEY` secret (after confirming WIF works)
- [ ] Remove old service account keys from GCP

## 📚 Documentation Reference

- **Complete Setup Guide:** `.github/workflows/WIF_SETUP_COMPLETE_GUIDE.md`
- **Quick Secrets Reference:** `.github/workflows/GITHUB_SECRETS_QUICK_REFERENCE.md`
- **Detailed Setup:** `.github/workflows/BACKUP_AUTH_SETUP.md`
- **Security Checklist:** `.github/workflows/BACKUP_AUTH_SECURITY_CHECKLIST.md`
- **Fix Summary:** `.github/workflows/BACKUP_AUTH_FIX_SUMMARY.md`

## 🔧 Scripts Available

- **`./scripts/setup_wif.sh`** - Automated GCP WIF setup
- **`./scripts/test_wif_setup.sh`** - Verify GCP configuration
- **`./scripts/remove_old_credentials.sh`** - Clean up old credentials

## ⚠️ Important Notes

1. **Don't remove `GCP_SA_KEY` until WIF is confirmed working**
2. **Keep `.wif_config.txt` for reference** (contains your WIF provider name)
3. **Repository name must match exactly** in WIF binding
4. **Project number (not project ID) is used in WIF provider path**

## 🆘 Troubleshooting

If something goes wrong:

1. **Check GCP setup:**
   ```bash
   ./scripts/test_wif_setup.sh
   ```

2. **Check GitHub secrets:**
   ```bash
   gh secret list
   ```

3. **Review workflow logs** in GitHub Actions

4. **See detailed troubleshooting** in `WIF_SETUP_COMPLETE_GUIDE.md`

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Workflow runs without authentication errors
- ✅ "Authenticate to Google Cloud" step shows success
- ✅ Backup script executes successfully
- ✅ Backup appears in GCS bucket: `gs://PROJECT_ID-firestore-backups/backups/`

## Next Steps After Setup

1. Monitor the first few scheduled runs (daily at 2 AM UTC)
2. Set up backup monitoring/alerting (optional)
3. Review security checklist quarterly
4. Document setup for your team

---

**Ready to start?** Run: `./scripts/setup_wif.sh`
