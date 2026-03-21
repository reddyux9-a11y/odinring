# Complete WIF Setup Guide - Step by Step

This guide walks you through setting up Workload Identity Federation for the Firestore backup workflow.

## Prerequisites

- ✅ Google Cloud SDK (`gcloud`) installed and authenticated
- ✅ Access to your GCP project with IAM admin permissions
- ✅ Access to your GitHub repository with admin permissions
- ✅ Firebase/GCP Project ID

## Step 1: Set Up Workload Identity Federation in GCP

### Option A: Automated Setup (Recommended)

Run the automated setup script:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./scripts/setup_wif.sh
```

The script will:
1. Prompt for your GCP Project ID
2. Prompt for GitHub repository owner and name
3. Create Workload Identity Pool
4. Create OIDC Provider
5. Create Service Account
6. Grant required IAM permissions
7. Bind WIF to the service account
8. Display the GitHub secrets you need to add

**Note:** The script will save configuration to `.wif_config.txt` for later use.

### Option B: Manual Setup

If you prefer manual setup, follow the instructions in `BACKUP_AUTH_SETUP.md`.

## Step 2: Verify GCP Setup

After running the setup script, verify everything is configured correctly:

```bash
./scripts/test_wif_setup.sh
```

This will check:
- ✅ Workload Identity Pool exists
- ✅ OIDC Provider exists
- ✅ Service Account exists
- ✅ IAM roles are granted
- ✅ WIF binding is configured

## Step 3: Add GitHub Secrets

### Quick Method: Using GitHub CLI

If you have `gh` CLI installed:

```bash
# Get the values from .wif_config.txt (created by setup script)
WIF_PROVIDER=$(sed -n '1p' .wif_config.txt)
WIF_SERVICE_ACCOUNT=$(sed -n '2p' .wif_config.txt)
PROJECT_ID=$(sed -n '3p' .wif_config.txt)

# Add secrets
gh secret set WIF_PROVIDER --body "$WIF_PROVIDER"
gh secret set WIF_SERVICE_ACCOUNT --body "$WIF_SERVICE_ACCOUNT"
gh secret set FIREBASE_PROJECT_ID --body "$PROJECT_ID"
gh secret set BACKUP_BUCKET_NAME --body "${PROJECT_ID}-firestore-backups"
```

### Manual Method: Using GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret:

#### Secret 1: WIF_PROVIDER
- **Name:** `WIF_PROVIDER`
- **Value:** Get from `.wif_config.txt` (line 1) or from setup script output
- **Format:** `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider`

#### Secret 2: WIF_SERVICE_ACCOUNT
- **Name:** `WIF_SERVICE_ACCOUNT`
- **Value:** Get from `.wif_config.txt` (line 2) or from setup script output
- **Format:** `firestore-backup@PROJECT_ID.iam.gserviceaccount.com`

#### Secret 3: FIREBASE_PROJECT_ID
- **Name:** `FIREBASE_PROJECT_ID`
- **Value:** Your Firebase/GCP Project ID
- **Note:** May already exist, check first

#### Secret 4: BACKUP_BUCKET_NAME (Optional)
- **Name:** `BACKUP_BUCKET_NAME`
- **Value:** `{PROJECT_ID}-firestore-backups` (or your custom bucket name)
- **Note:** Optional - workflow will use default if not set

#### Secret 5: JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** Your existing JWT secret (if not already set)
- **Note:** Check if this already exists

### Verify Secrets Are Set

You can verify secrets are set using GitHub CLI:

```bash
gh secret list
```

Or check in the GitHub web UI: **Settings** → **Secrets and variables** → **Actions**

## Step 4: Test the Workflow

### Method 1: Manual Trigger (Recommended for First Test)

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select **"Automated Firestore Backup"** from the workflow list
4. Click **"Run workflow"** button (top right)
5. Select the branch (usually `main` or `master`)
6. Click **"Run workflow"**

### Method 2: Wait for Scheduled Run

The workflow runs automatically daily at 2 AM UTC. You can wait for the next scheduled run.

### What to Check

After triggering the workflow:

1. **Check workflow status:**
   - Should show green checkmark ✅
   - All steps should complete successfully

2. **Check authentication step:**
   - Look for "Authenticate to Google Cloud" step
   - Should complete without errors
   - Should not show "must specify exactly one of..." error

3. **Check backup step:**
   - Look for "Run backup script" step
   - Should complete successfully
   - Should show backup initiated message

4. **Verify backup in GCS:**
   ```bash
   gsutil ls gs://${PROJECT_ID}-firestore-backups/backups/
   ```

## Step 5: Remove Old Credentials

After verifying the workflow works with WIF:

### Remove Service Account Keys from GCP

Run the cleanup script:

```bash
./scripts/remove_old_credentials.sh
```

Or manually:

```bash
# List keys
gcloud iam service-accounts keys list \
    --iam-account=firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com \
    --project=${PROJECT_ID}

# Delete each key (replace KEY_ID with actual key ID)
gcloud iam service-accounts keys delete KEY_ID \
    --iam-account=firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com \
    --project=${PROJECT_ID}
```

### Remove GitHub Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find the secret named: **GCP_SA_KEY**
3. Click on it
4. Click **"Delete"**
5. Confirm deletion

**⚠️ Important:** Only remove `GCP_SA_KEY` after confirming WIF works!

## Troubleshooting

### Error: "Workload Identity Provider not found"

**Solution:**
- Verify `WIF_PROVIDER` secret is correctly formatted
- Check that it matches the output from `setup_wif.sh`
- Ensure project number (not project ID) is in the path

### Error: "Permission denied"

**Solution:**
- Run `./scripts/test_wif_setup.sh` to verify IAM roles
- Check service account has `roles/datastore.importExportAdmin` and `roles/storage.admin`
- Verify WIF binding exists

### Error: "Service account not found"

**Solution:**
- Verify `WIF_SERVICE_ACCOUNT` secret matches the service account email
- Check service account exists: `gcloud iam service-accounts describe firestore-backup@PROJECT_ID.iam.gserviceaccount.com`

### Error: "Repository attribute mismatch"

**Solution:**
- Verify repository owner/name in WIF binding matches your GitHub repo
- Format should be: `owner/repo-name` (e.g., `reddyux9-a11y/odin_ring_io`)
- Re-run setup if repository name changed

### Workflow Still Fails

1. Check workflow logs for specific error messages
2. Verify all GitHub secrets are set correctly
3. Run `./scripts/test_wif_setup.sh` to verify GCP setup
4. Check that `id-token: write` permission is in workflow (already added)

## Quick Reference

### Get WIF Provider Name

```bash
gcloud iam workload-identity-pools providers describe github-provider \
    --project=PROJECT_ID \
    --location="global" \
    --workload-identity-pool=github-actions-pool \
    --format="value(name)"
```

### Get Service Account Email

```bash
echo "firestore-backup@PROJECT_ID.iam.gserviceaccount.com"
```

### Verify IAM Roles

```bash
gcloud projects get-iam-policy PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:firestore-backup@PROJECT_ID.iam.gserviceaccount.com"
```

### Verify WIF Binding

```bash
gcloud iam service-accounts get-iam-policy \
    firestore-backup@PROJECT_ID.iam.gserviceaccount.com \
    --project=PROJECT_ID
```

## Next Steps

After successful setup:

1. ✅ Monitor the first few scheduled runs
2. ✅ Set up backup monitoring/alerting (optional)
3. ✅ Document the setup for your team
4. ✅ Review security checklist in `BACKUP_AUTH_SECURITY_CHECKLIST.md`

## Support

If you encounter issues:

1. Review `BACKUP_AUTH_SETUP.md` for detailed troubleshooting
2. Check `BACKUP_AUTH_SECURITY_CHECKLIST.md` for validation steps
3. Verify all steps in this guide were completed
4. Check GitHub Actions logs for specific error messages

---

**Status:** Ready for setup! 🚀
