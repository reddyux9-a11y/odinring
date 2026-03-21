# Security Checklist: Firestore Backup Authentication

## Pre-Deployment Checklist

### ✅ Authentication Configuration

- [ ] **Workload Identity Federation (WIF) is configured**
  - [ ] Workload Identity Pool created in GCP
  - [ ] OIDC Provider created and linked to GitHub
  - [ ] Service account created with minimal permissions
  - [ ] WIF binding configured (principalSet with repository attribute)

- [ ] **GitHub Secrets are configured**
  - [ ] `WIF_PROVIDER` secret exists and is correctly formatted
  - [ ] `WIF_SERVICE_ACCOUNT` secret exists and matches service account email
  - [ ] `FIREBASE_PROJECT_ID` secret exists
  - [ ] `BACKUP_BUCKET_NAME` secret exists (or will use default)
  - [ ] `JWT_SECRET` secret exists

- [ ] **Old credentials removed**
  - [ ] `GCP_SA_KEY` secret removed from GitHub (if it existed)
  - [ ] Service account keys deleted from GCP (if they existed)

### ✅ IAM Permissions

- [ ] **Service account has minimal required roles:**
  - [ ] `roles/datastore.importExportAdmin` (for Firestore export/import)
  - [ ] `roles/storage.admin` (for GCS bucket operations)
  - [ ] `roles/iam.workloadIdentityUser` (bound to WIF pool, not directly on SA)

- [ ] **No excessive permissions:**
  - [ ] Service account does NOT have `roles/owner`
  - [ ] Service account does NOT have `roles/editor`
  - [ ] Service account does NOT have `roles/viewer` (not needed)

### ✅ Workflow Security

- [ ] **Workflow permissions are minimal:**
  - [ ] `contents: read` (to checkout code)
  - [ ] `id-token: write` (for OIDC token generation)
  - [ ] No `secrets: write` or other unnecessary permissions

- [ ] **Workflow execution is restricted:**
  - [ ] Workflow prevents execution from forks (secrets not available)
  - [ ] Workflow can be manually triggered (for testing)
  - [ ] Scheduled execution is enabled (daily at 2 AM UTC)

### ✅ Repository Configuration

- [ ] **Repository attribute matches:**
  - [ ] WIF principalSet uses format: `attribute.repository/<OWNER>/<REPO>`
  - [ ] Repository owner matches GitHub username/organization
  - [ ] Repository name matches exactly

- [ ] **Secrets are repository-scoped:**
  - [ ] Secrets are NOT organization-level (unless intentional)
  - [ ] Secrets are NOT environment-specific (unless needed)

## Post-Deployment Verification

### ✅ Test Workflow Execution

- [ ] **Manual trigger succeeds:**
  1. Go to GitHub Actions → "Automated Firestore Backup"
  2. Click "Run workflow"
  3. Verify all steps complete successfully
  4. Check logs for authentication success

- [ ] **Backup operation succeeds:**
  - [ ] Backup script runs without errors
  - [ ] Backup appears in GCS bucket
  - [ ] Backup timestamp is correct

### ✅ Security Audit

- [ ] **Review IAM bindings:**
  ```bash
  gcloud projects get-iam-policy $PROJECT_ID \
      --flatten="bindings[].members" \
      --filter="bindings.members:serviceAccount:firestore-backup@*"
  ```

- [ ] **Review WIF bindings:**
  ```bash
  gcloud iam service-accounts get-iam-policy \
      firestore-backup@$PROJECT_ID.iam.gserviceaccount.com \
      --project=$PROJECT_ID
  ```

- [ ] **Verify no service account keys exist:**
  ```bash
  gcloud iam service-accounts keys list \
      --iam-account=firestore-backup@$PROJECT_ID.iam.gserviceaccount.com \
      --project=$PROJECT_ID
  ```
  Should return empty or no keys.

## Ongoing Maintenance

### ✅ Quarterly Reviews

- [ ] Review service account permissions (remove unused roles)
- [ ] Review WIF provider configuration
- [ ] Audit backup access logs
- [ ] Verify backup retention policy is working
- [ ] Check for any new service account keys (should be none)

### ✅ Incident Response

- [ ] **If authentication fails:**
  1. Check GitHub Actions logs
  2. Verify secrets are still configured
  3. Verify WIF provider is active in GCP
  4. Verify service account still exists
  5. Check IAM bindings haven't changed

- [ ] **If backup fails:**
  1. Check service account permissions
  2. Verify GCS bucket exists and is accessible
  3. Check Firestore database name is correct
  4. Review backup script logs

## Regression Prevention

### ✅ Code Review Checklist

When modifying `.github/workflows/backup.yml`:

- [ ] **Authentication method is correct:**
  - [ ] Uses `workload_identity_provider` (NOT `credentials_json`)
  - [ ] Only ONE authentication method is specified
  - [ ] No hardcoded credentials or secrets

- [ ] **Permissions are minimal:**
  - [ ] Workflow permissions are scoped to minimum required
  - [ ] Service account roles are minimal
  - [ ] No unnecessary GCP API access

- [ ] **Security controls are in place:**
  - [ ] Fork execution is prevented
  - [ ] Secrets are properly referenced (not hardcoded)
  - [ ] Comments explain security choices

### ✅ Automated Checks (Future Enhancement)

Consider adding:

- [ ] Pre-commit hook to validate workflow YAML
- [ ] GitHub Actions workflow to validate workflow files
- [ ] Automated IAM policy review
- [ ] Secret scanning in CI/CD

## Common Mistakes to Avoid

❌ **DO NOT:**
- Use both `workload_identity_provider` and `credentials_json` simultaneously
- Store service account keys in GitHub Secrets (use WIF instead)
- Grant excessive permissions (owner, editor roles)
- Allow workflow execution from forks
- Hardcode project IDs or other configuration
- Skip the `id-token: write` permission
- Use organization-level secrets without justification

✅ **DO:**
- Use Workload Identity Federation (WIF)
- Grant minimal required permissions
- Restrict workflow execution to trusted sources
- Use repository-scoped secrets
- Document authentication choices
- Review IAM bindings regularly
- Test authentication changes before merging

## Emergency Rollback

If WIF fails and you need to temporarily use service account keys:

1. **Create service account key (temporary only):**
   ```bash
   gcloud iam service-accounts keys create key.json \
       --iam-account=firestore-backup@$PROJECT_ID.iam.gserviceaccount.com \
       --project=$PROJECT_ID
   ```

2. **Add to GitHub Secrets:**
   - Secret name: `GCP_SA_KEY`
   - Value: Contents of `key.json`

3. **Update workflow temporarily:**
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v1
     with:
       credentials_json: ${{ secrets.GCP_SA_KEY }}
       project_id: ${{ secrets.FIREBASE_PROJECT_ID }}
   ```

4. **⚠️ IMPORTANT:** Rotate back to WIF as soon as possible and delete the key!

## References

- [Workload Identity Federation Best Practices](https://cloud.google.com/iam/docs/best-practices-for-workload-identity-federation)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [GCP IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)
