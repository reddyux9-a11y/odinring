# Firebase Access Log Audit Guide

## 🔍 Security Audit: Check for Unauthorized Access

This guide helps you audit Firebase access logs to detect any unauthorized access, particularly if Firebase service account credentials were ever exposed in git history or shared insecurely.

---

## 📋 Audit Checklist

- [ ] Review Firebase Admin SDK usage logs
- [ ] Check Cloud IAM audit logs
- [ ] Review Firestore access patterns
- [ ] Check for unusual API calls
- [ ] Verify service account activity
- [ ] Review authentication/authorization events
- [ ] Check for data access anomalies
- [ ] Review billing/usage spikes
- [ ] Document findings
- [ ] Take action if unauthorized access detected

---

## 🔐 Step 1: Access Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `studio-7743041576-fc16f` (or your project ID)

2. **Navigate to Logs:**
   - Click on the **⚙️ Settings (gear icon)** in the left sidebar
   - Select **Project settings**
   - Look for **Usage and billing** or **Activity** sections

---

## 📊 Step 2: Review Cloud Logging (Google Cloud Console)

### Access Cloud Logging:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your Firebase project

2. **Navigate to Logging:**
   - Go to **Logging** → **Logs Explorer** (or **Logs** → **Logs Explorer**)
   - This is the most comprehensive place to review all Firebase activity

### Key Log Queries to Run:

#### 1. Service Account Activity
```
resource.type="service_account"
protoPayload.serviceName="firebase.googleapis.com"
```

#### 2. Admin SDK API Calls
```
resource.type="firebase_project"
protoPayload.serviceName="firestore.googleapis.com"
protoPayload.methodName="google.firestore.v1.Firestore.RunQuery"
```

#### 3. Authentication Events
```
resource.type="firebase_project"
protoPayload.serviceName="identitytoolkit.googleapis.com"
```

#### 4. All Firebase Admin Operations
```
resource.type="firebase_project"
protoPayload.authenticationInfo.principalEmail=~"serviceAccount"
```

#### 5. Unusual Activity (Last 30 Days)
```
resource.type="firebase_project"
timestamp>="2024-12-01T00:00:00Z"
severity!="DEBUG"
```

---

## 🔍 Step 3: Check IAM Audit Logs

### Access IAM & Admin:

1. **In Google Cloud Console:**
   - Go to **IAM & Admin** → **Audit Logs**
   - Select your project

2. **Review Admin Activity:**
   - Check **Admin Activity** logs
   - Look for service account usage
   - Review API calls made by service accounts

3. **Check Data Access:**
   - Review **Data Access** logs (if enabled)
   - Check Firestore read/write operations
   - Look for unusual data access patterns

---

## 🔐 Step 4: Review Service Account Keys

1. **In Firebase Console:**
   - Go to **Project settings** → **Service accounts**
   - Review all service accounts
   - Check key creation dates
   - Verify no unexpected keys exist

2. **In Google Cloud Console:**
   - Go to **IAM & Admin** → **Service Accounts**
   - Review all service accounts
   - Check permissions granted
   - Verify no unexpected accounts

---

## 📈 Step 5: Check Usage & Billing

1. **In Firebase Console:**
   - Go to **Usage and billing**
   - Review usage trends
   - Check for unexpected spikes
   - Review API call counts

2. **Look for Anomalies:**
   - Unusual increase in Firestore reads/writes
   - Spikes in authentication requests
   - Unexpected storage usage
   - Unusual API call patterns

---

## 🔍 Step 6: Review Firestore Access Patterns

1. **In Firebase Console:**
   - Go to **Firestore Database** → **Usage**
   - Review read/write patterns
   - Check for unusual access times
   - Review collection access

2. **Check Data Changes:**
   - Review recent document changes
   - Check for unexpected modifications
   - Look for bulk operations
   - Verify no data tampering

---

## 🚨 Step 7: Identify Unauthorized Access Indicators

### Red Flags to Look For:

1. **Unusual API Calls:**
   - Service account activity from unexpected locations
   - API calls at unusual times
   - Unfamiliar IP addresses
   - Unusual API call volumes

2. **Suspicious Operations:**
   - Unexpected data modifications
   - Unauthorized collection access
   - Unusual authentication patterns
   - Unexpected user creation

3. **Service Account Anomalies:**
   - Service account keys created unexpectedly
   - Unfamiliar service accounts
   - Unusual permissions granted
   - Multiple key generations

4. **Data Access Anomalies:**
   - Unusual read/write patterns
   - Access to sensitive collections
   - Unexpected data exports
   - Unauthorized queries

---

## 📝 Step 8: Document Findings

Create an audit report with:

1. **Date Range Audited:**
   - Start date
   - End date
   - Total logs reviewed

2. **Findings:**
   - Any suspicious activity detected
   - Unusual patterns identified
   - Service account activity
   - Data access patterns

3. **Recommendations:**
   - Actions taken
   - Preventive measures
   - Security improvements

---

## ⚠️ Step 9: If Unauthorized Access Detected

### Immediate Actions:

1. **Rotate Keys Immediately:**
   - Generate new service account keys
   - Revoke old keys
   - Update all environments
   - See `FIREBASE_KEY_ROTATION_GUIDE.md`

2. **Review Data:**
   - Check for data tampering
   - Review all changes made
   - Restore from backups if necessary

3. **Secure Access:**
   - Review IAM permissions
   - Limit service account permissions
   - Implement least privilege principle
   - Enable audit logging

4. **Notify Team:**
   - Inform security team
   - Document incident
   - Review security practices
   - Update procedures

---

## 🔐 Step 10: Enable Enhanced Logging (Prevention)

### Enable Audit Logging:

1. **In Google Cloud Console:**
   - Go to **IAM & Admin** → **Audit Logs**
   - Enable audit logging for:
     - Admin Activity (usually enabled by default)
     - Data Access (recommended for security)
     - System Event (recommended)

2. **Configure Log Retention:**
   - Set appropriate retention period (30-90 days recommended)
   - Enable log export if needed
   - Set up log alerts

### Set Up Alerts:

1. **Create Log-Based Metrics:**
   - Define metrics for suspicious activity
   - Set up alerts for anomalies
   - Configure notification channels

2. **Monitor Service Account Usage:**
   - Set up alerts for unusual service account activity
   - Monitor API call patterns
   - Track authentication events

---

## 📊 Useful Log Queries

### Check Service Account Usage (Last 7 Days):
```
resource.type="service_account"
timestamp>="2025-01-01T00:00:00Z"
protoPayload.authenticationInfo.principalEmail!=""
```

### Find Unusual Firestore Operations:
```
resource.type="firebase_project"
protoPayload.serviceName="firestore.googleapis.com"
protoPayload.status.code!=0
```

### Review All Admin SDK Calls:
```
resource.type="firebase_project"
protoPayload.authenticationInfo.principalEmail=~"@.*\.iam\.gserviceaccount\.com"
```

### Check Authentication Events:
```
resource.type="firebase_project"
protoPayload.serviceName="identitytoolkit.googleapis.com"
timestamp>="2025-01-01T00:00:00Z"
```

---

## 🔍 Advanced Auditing: Export Logs

### Export Logs for Analysis:

1. **Using Cloud Logging:**
   - Filter logs with queries above
   - Export to BigQuery for analysis
   - Export to Cloud Storage for backup

2. **Using gcloud CLI:**
   ```bash
   gcloud logging read "resource.type=firebase_project" \
     --limit=1000 \
     --format=json \
     --project=YOUR_PROJECT_ID \
     > firebase_audit_logs.json
   ```

3. **Using Firebase CLI:**
   ```bash
   firebase projects:list
   firebase functions:log
   ```

---

## 📚 Additional Resources

- [Google Cloud Audit Logs Documentation](https://cloud.google.com/logging/docs/audit)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)
- [Service Account Security](https://cloud.google.com/iam/docs/service-accounts)

---

## ✅ Audit Completion Checklist

- [ ] Reviewed Cloud Logging for service account activity
- [ ] Checked IAM audit logs
- [ ] Reviewed service account keys and permissions
- [ ] Analyzed usage and billing patterns
- [ ] Reviewed Firestore access patterns
- [ ] Identified any suspicious activity
- [ ] Documented findings
- [ ] Taken action if unauthorized access detected
- [ ] Enabled enhanced logging (if not already enabled)
- [ ] Set up alerts for future monitoring

---

## 🚨 Security Reminders

1. **Regular Audits:**
   - Conduct monthly security audits
   - Review logs quarterly
   - Check service accounts weekly

2. **Key Rotation:**
   - Rotate keys annually
   - Rotate immediately if exposed
   - Document all key rotations

3. **Access Control:**
   - Follow least privilege principle
   - Review permissions regularly
   - Remove unused service accounts

4. **Monitoring:**
   - Set up alerts for suspicious activity
   - Monitor usage patterns
   - Review anomalies promptly

---

## 📞 Support

If you detect unauthorized access:
1. Immediately rotate all service account keys
2. Review and restore data if necessary
3. Review IAM permissions
4. Document the incident
5. Consider engaging security team

---

**Last Updated:** January 2025  
**Related Documents:**
- `FIREBASE_KEY_ROTATION_GUIDE.md` - How to rotate keys
- `END_TO_END_SYSTEM_DIAGNOSTIC_REPORT.md` - Security audit report
