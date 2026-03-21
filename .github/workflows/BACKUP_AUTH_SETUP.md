# Firestore Backup Authentication Setup Guide

## Root Cause Analysis

**Error:** `must specify exactly one of 'workload_identity_provider' or 'credentials_json'`

**Root Cause:** The `google-github-actions/auth@v1` action requires exactly ONE authentication method:
- Either `workload_identity_provider` (Workload Identity Federation - OIDC)
- Or `credentials_json` (Service Account JSON key)

The previous configuration used `credentials_json` but the secret may have been missing or improperly configured, causing the action to fail validation.

## Solution: Workload Identity Federation (OIDC)

We've migrated to **Workload Identity Federation (WIF)** which is:
- ✅ More secure (short-lived tokens, no long-lived credentials)
- ✅ Recommended by Google Cloud
- ✅ Easier to rotate and manage
- ✅ No risk of credential leakage in logs

## Setup Instructions

### Step 1: Create Workload Identity Pool

```bash
# Set variables
export PROJECT_ID="your-firebase-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
export WIF_POOL_ID="github-actions-pool"
export WIF_PROVIDER_ID="github-provider"
export SERVICE_ACCOUNT_EMAIL="firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com"
export REPO_OWNER="your-github-username"
export REPO_NAME="odinring-main-2"

# Enable required APIs
gcloud services enable iamcredentials.googleapis.com \
    --project=$PROJECT_ID

# Create Workload Identity Pool
gcloud iam workload-identity-pools create $WIF_POOL_ID \
    --project=$PROJECT_ID \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc $WIF_PROVIDER_ID \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$WIF_POOL_ID \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
```

### Step 2: Create Service Account

```bash
# Create service account for backups
gcloud iam service-accounts create firestore-backup \
    --project=$PROJECT_ID \
    --display-name="Firestore Backup Service Account" \
    --description="Service account for automated Firestore backups"

# Grant required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/datastore.importExportAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.admin"
```

### Step 3: Bind Workload Identity Pool to Service Account

```bash
# Get the full provider resource name
export PROVIDER_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/providers/${WIF_PROVIDER_ID}"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
    --project=$PROJECT_ID \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"
```

### Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **WIF_PROVIDER** (Required)
   - Value: `projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/providers/${WIF_PROVIDER_ID}`
   - Example: `projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider`

2. **WIF_SERVICE_ACCOUNT** (Required)
   - Value: `firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com`
   - Example: `firestore-backup@your-project-id.iam.gserviceaccount.com`

3. **FIREBASE_PROJECT_ID** (Required - if not already set)
   - Value: Your Firebase/GCP project ID

4. **BACKUP_BUCKET_NAME** (Optional)
   - Value: GCS bucket name for backups
   - Defaults to: `{project-id}-firestore-backups`

5. **JWT_SECRET** (Required - if not already set)
   - Value: Your JWT secret for backend authentication

### Step 5: Verify Setup

```bash
# Get the provider resource name
gcloud iam workload-identity-pools providers describe $WIF_PROVIDER_ID \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$WIF_POOL_ID \
    --format="value(name)"

# Verify service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --format="table(bindings.role)"
```

### Step 6: Test the Workflow

1. Go to GitHub Actions tab
2. Select "Automated Firestore Backup"
3. Click "Run workflow"
4. Verify it completes successfully

## Migration from Service Account Keys

If you were previously using `GCP_SA_KEY`:

1. **Remove the old secret** from GitHub (Settings → Secrets → Actions → Delete `GCP_SA_KEY`)
2. **Delete the service account key** from GCP (if it exists):
   ```bash
   gcloud iam service-accounts keys list \
       --iam-account=$SERVICE_ACCOUNT_EMAIL \
       --project=$PROJECT_ID
   
   # Delete each key ID found above
   gcloud iam service-accounts keys delete KEY_ID \
       --iam-account=$SERVICE_ACCOUNT_EMAIL \
       --project=$PROJECT_ID
   ```
3. **Follow the setup instructions above** to configure WIF

## Troubleshooting

### Error: "Permission denied" or "Access denied"

**Check 1:** Verify the service account has required roles:
```bash
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}"
```

**Check 2:** Verify WIF binding:
```bash
gcloud iam service-accounts get-iam-policy $SERVICE_ACCOUNT_EMAIL \
    --project=$PROJECT_ID
```

**Check 3:** Verify repository attribute matches:
- GitHub repository format: `owner/repo-name`
- Must match exactly in the principalSet binding

### Error: "Workload Identity Provider not found"

- Verify `WIF_PROVIDER` secret is correctly formatted
- Check that the provider exists in GCP Console
- Ensure project number is correct (not project ID)

### Error: "Service account not found"

- Verify `WIF_SERVICE_ACCOUNT` secret matches the service account email
- Check that the service account exists in GCP Console

## Security Best Practices

1. ✅ **Use Workload Identity Federation** (implemented)
2. ✅ **Restrict to main branch** (workflow prevents fork execution)
3. ✅ **Minimal permissions** (only `datastore.importExportAdmin` and `storage.admin`)
4. ✅ **No long-lived credentials** (WIF uses short-lived tokens)
5. ✅ **Repository-scoped access** (only this repository can use the identity)
6. ✅ **Regular audit** (review IAM bindings quarterly)

## Fallback Option (Not Recommended)

If Workload Identity Federation cannot be configured, you can fall back to service account keys:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
    project_id: ${{ secrets.FIREBASE_PROJECT_ID }}
```

**⚠️ Warning:** Service account keys are less secure and should only be used if WIF is not available.

## References

- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-google-cloud-platform)
- [google-github-actions/auth](https://github.com/google-github-actions/auth)
