# GitHub Secrets Quick Reference

## Required Secrets for Firestore Backup Workflow

After running `./scripts/setup_wif.sh`, you'll need to add these secrets to GitHub.

## Secret Values

The setup script saves values to `.wif_config.txt`. Use these values:

```bash
# Read values from config file
cat .wif_config.txt
```

Or get them from the setup script output.

## Secret 1: WIF_PROVIDER

**Name:** `WIF_PROVIDER`

**Value Format:**
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
```

**Example:**
```
projects/123456789012/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
```

**How to Get:**
- From `.wif_config.txt` (line 1)
- From `setup_wif.sh` output
- Or run:
  ```bash
  gcloud iam workload-identity-pools providers describe github-provider \
      --project=PROJECT_ID \
      --location="global" \
      --workload-identity-pool=github-actions-pool \
      --format="value(name)"
  ```

## Secret 2: WIF_SERVICE_ACCOUNT

**Name:** `WIF_SERVICE_ACCOUNT`

**Value Format:**
```
firestore-backup@PROJECT_ID.iam.gserviceaccount.com
```

**Example:**
```
firestore-backup@my-firebase-project.iam.gserviceaccount.com
```

**How to Get:**
- From `.wif_config.txt` (line 2)
- From `setup_wif.sh` output
- Or construct: `firestore-backup@YOUR_PROJECT_ID.iam.gserviceaccount.com`

## Secret 3: FIREBASE_PROJECT_ID

**Name:** `FIREBASE_PROJECT_ID`

**Value:** Your Firebase/GCP Project ID

**Example:**
```
my-firebase-project
```

**Note:** This may already exist. Check before adding.

## Secret 4: BACKUP_BUCKET_NAME (Optional)

**Name:** `BACKUP_BUCKET_NAME`

**Value Format:**
```
PROJECT_ID-firestore-backups
```

**Example:**
```
my-firebase-project-firestore-backups
```

**Note:** Optional - workflow will use default if not set.

## Secret 5: JWT_SECRET

**Name:** `JWT_SECRET`

**Value:** Your existing JWT secret (at least 32 characters)

**Note:** This may already exist. Check before adding.

## Adding Secrets via GitHub CLI

If you have `gh` CLI installed:

```bash
# Read values from config
WIF_PROVIDER=$(sed -n '1p' .wif_config.txt)
WIF_SERVICE_ACCOUNT=$(sed -n '2p' .wif_config.txt)
PROJECT_ID=$(sed -n '3p' .wif_config.txt)

# Add secrets
gh secret set WIF_PROVIDER --body "$WIF_PROVIDER"
gh secret set WIF_SERVICE_ACCOUNT --body "$WIF_SERVICE_ACCOUNT"
gh secret set FIREBASE_PROJECT_ID --body "$PROJECT_ID"
gh secret set BACKUP_BUCKET_NAME --body "${PROJECT_ID}-firestore-backups"
```

## Adding Secrets via GitHub Web UI

1. Go to: `https://github.com/OWNER/REPO/settings/secrets/actions`
2. Click **"New repository secret"**
3. Enter the secret name and value
4. Click **"Add secret"**
5. Repeat for each secret

## Verifying Secrets

### Using GitHub CLI

```bash
gh secret list
```

### Using GitHub Web UI

Go to: **Settings** → **Secrets and variables** → **Actions**

You should see:
- ✅ WIF_PROVIDER
- ✅ WIF_SERVICE_ACCOUNT
- ✅ FIREBASE_PROJECT_ID
- ✅ BACKUP_BUCKET_NAME (optional)
- ✅ JWT_SECRET (if not already set)

## Removing Old Secret

After verifying WIF works, remove the old secret:

**Name to Remove:** `GCP_SA_KEY`

**How to Remove:**
1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find `GCP_SA_KEY`
3. Click on it
4. Click **"Delete"**
5. Confirm deletion

**⚠️ Warning:** Only remove after confirming WIF authentication works!

## Troubleshooting

### Secret Not Found Error

- Verify secret name is exactly as shown (case-sensitive)
- Check you're in the correct repository
- Ensure you have admin access to the repository

### Wrong Value Error

- Double-check the value matches the format
- Verify no extra spaces or newlines
- For `WIF_PROVIDER`, ensure it includes the full path with project number

### Permission Denied

- Verify you have admin access to the repository
- Check organization settings if it's an org repository
- Ensure secrets are repository-scoped (not environment-scoped)
