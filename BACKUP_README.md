# Firestore Backup System

## Overview

Automated daily backups of the Firestore database to Google Cloud Storage with 30-day retention.

## Setup

### 1. Create Backup Bucket

```bash
cd backend/scripts
python backup_firestore.py --setup
```

This creates a Cloud Storage bucket with:
- Name: `{project-id}-firestore-backups`
- Location: `us-central1` (configurable via `BACKUP_REGION`)
- Lifecycle: Automatic deletion after 30 days

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

- `GCP_SA_KEY`: Service account JSON key with permissions:
  - `roles/datastore.importExportAdmin`
  - `roles/storage.admin`
- `BACKUP_BUCKET_NAME`: Optional, defaults to `{project-id}-firestore-backups`

### 3. Test Manual Backup

```bash
cd backend/scripts
python backup_firestore.py --backup
```

### 4. List Recent Backups

```bash
cd backend/scripts
python backup_firestore.py --list
```

## Automated Backups

The GitHub Action `.github/workflows/backup.yml` runs daily at 2 AM UTC.

You can also trigger it manually:
1. Go to Actions tab in GitHub
2. Select "Automated Firestore Backup"
3. Click "Run workflow"

## Restore from Backup

### 1. List Available Backups

```bash
gsutil ls gs://{project-id}-firestore-backups/backups/
```

### 2. Restore

```bash
cd backend/scripts
python restore_firestore.py gs://{bucket}/backups/{timestamp}
```

**⚠️ WARNING:** This will overwrite existing data. You'll be prompted to confirm.

### 3. Track Restore Progress

```bash
gcloud operations list --filter="type:IMPORT_DOCUMENTS"
gcloud operations describe [OPERATION_ID]
```

## Manual Backup (via gcloud)

```bash
gcloud firestore export gs://{bucket}/backups/manual_$(date +%Y%m%d_%H%M%S) \
  --project={project-id} \
  --database=odinringdb
```

## Backup Monitoring

### Check Last Backup

```bash
gsutil ls -l gs://{bucket}/backups/ | tail -1
```

### Verify Backup Size

```bash
gsutil du -sh gs://{bucket}/backups/{timestamp}
```

## Retention Policy

- **Automatic deletion**: 30 days
- **Manual backups**: Not automatically deleted
- **Total backups**: ~30 backups at any time

To change retention, edit the lifecycle policy:

```bash
gsutil lifecycle set lifecycle.json gs://{bucket}/
```

## Costs

Approximate monthly costs (based on 10GB database):
- **Storage**: $0.20/month (30 days × 10GB × $0.020/GB)
- **Export**: $0.10/day × 30 = $3.00/month
- **Total**: ~$3.20/month

Actual costs depend on database size and change rate.

## Troubleshooting

### Backup Fails with "Permission Denied"

Ensure service account has these IAM roles:
```bash
gcloud projects add-iam-policy-binding {project-id} \
  --member="serviceAccount:{sa-email}" \
  --role="roles/datastore.importExportAdmin"

gcloud projects add-iam-policy-binding {project-id} \
  --member="serviceAccount:{sa-email}" \
  --role="roles/storage.admin"
```

### Backup Takes Too Long

For large databases (>100GB), consider:
- Splitting into multiple exports by collection
- Running during low-traffic hours
- Increasing timeout in GitHub Action

### Restore Fails

Common issues:
- Incorrect backup path
- Insufficient permissions
- Database not empty (some operations require empty database)

## Best Practices

1. **Test restores regularly** - Verify backups are valid
2. **Monitor backup size** - Alert on unexpected growth
3. **Keep manual backups** - Before major migrations
4. **Document restore procedures** - For incident response
5. **Encrypt sensitive backups** - Use customer-managed encryption keys

## Emergency Restore Procedure

1. **Stop application** to prevent new writes
2. **Verify backup timestamp** matches desired restore point
3. **Run restore script**
4. **Monitor operation** until complete
5. **Verify data integrity**
6. **Restart application**

## References

- [Firestore Export/Import](https://cloud.google.com/firestore/docs/manage-data/export-import)
- [Cloud Storage Lifecycle](https://cloud.google.com/storage/docs/lifecycle)
- [Backup Best Practices](https://cloud.google.com/firestore/docs/backups)


