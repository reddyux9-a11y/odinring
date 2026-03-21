# Firebase Service Account Key Rotation Guide

## ⚠️ CRITICAL SECURITY ACTION REQUIRED

**If the `firebase-service-account.json` file was ever committed to git history (even if later removed), you MUST rotate the Firebase service account keys immediately to prevent unauthorized access.**

This guide explains **WHEN** key rotation is required, **HOW** to rotate keys manually, **HOW** to revoke old keys, and **HOW** to update Vercel environment variables safely.

---

## 📋 Table of Contents

1. [When is Key Rotation Required?](#when-is-key-rotation-required)
2. [How to Verify if Keys Were Exposed](#how-to-verify-if-keys-were-exposed)
3. [Step-by-Step Rotation Process](#step-by-step-rotation-process)
4. [How to Revoke Old Keys](#how-to-revoke-old-keys)
5. [How to Update Vercel Environment Variables](#how-to-update-vercel-environment-variables)
6. [Verification Steps](#verification-steps)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚨 When is Key Rotation Required?

Key rotation is **MANDATORY** if ANY of the following conditions are true:

1. ✅ **The key file was ever committed to git history** (even if later removed)
2. ✅ **The repository was ever public** (GitHub, GitLab, etc.)
3. ✅ **The key was shared with third parties** (contractors, vendors, etc.)
4. ✅ **The key was accidentally exposed** (email, Slack, pastebin, etc.)
5. ✅ **A team member with key access has left** (recommended practice)
6. ✅ **Suspected unauthorized access** (unusual activity detected)

**Important:** Even if the file was removed from the latest commit, if it exists anywhere in git history, the keys are still compromised. Git history can be cloned, forked, or backed up, making old commits accessible.

---

## 🔍 How to Verify if Keys Were Exposed

---

### Step 1: Check Git History

Run this command to check if the file was ever committed:
```bash
git log --all --full-history --oneline -- "firebase-service-account.json" "backend/firebase-service-account.json"
```

**If this command returns ANY commits, the keys have been exposed and MUST be rotated.**

### Step 2: Check if Repository Was Ever Public

If your repository was ever public (even temporarily), assume keys are compromised if the file existed at that time.

### Step 3: Review Access Logs

Check Firebase Console → IAM & Admin → Audit Logs for any suspicious activity or unauthorized access.

---

## 🔄 Step-by-Step Rotation Process

Follow these steps **in order** to rotate Firebase service account keys safely:

### Step 1: Generate New Service Account Key in Firebase Console

**⚠️ IMPORTANT:** Generate the new key BEFORE deleting the old one to avoid service interruption.

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `studio-7743041576-fc16f` (or your project ID)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `studio-7743041576-fc16f` (or your project ID)

2. **Navigate to Service Accounts:**
   - Click on the **⚙️ Settings (gear icon)** in the left sidebar
   - Select **Project settings**
   - Go to the **Service accounts** tab

3. **Generate New Key:**
   - Click **Generate new private key** button
   - A dialog will appear warning you about key security
   - Click **Generate key** to confirm
   - A JSON file will be downloaded (this is your new service account key)

4. **Save the New Key:**
   - **IMPORTANT:** Store this key securely (NOT in git)
   - For Vercel deployment: Copy the entire JSON content to use as `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
   - For local development: Save as `backend/firebase-service-account.json` (make sure it's in `.gitignore`)

---

## 📄 JSON Format Structure

The Firebase service account JSON file has the following structure:

### File Format (Pretty-Printed for Local Development):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "unique-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "numeric-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
```

### Single-Line Format (For Vercel Environment Variable):

For Vercel's `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable, you need to convert the JSON to a **single-line string**:

```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"unique-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"numeric-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}
```

### Converting JSON to Single-Line Format:

**Using Python:**
```python
import json

# Read the pretty-printed JSON file
with open('firebase-service-account.json', 'r') as f:
    data = json.load(f)

# Convert to single-line string
single_line = json.dumps(data, separators=(',', ':'))
print(single_line)
```

**Using Node.js:**
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
const singleLine = JSON.stringify(data);
console.log(singleLine);
```

**Using jq (Command Line):**
```bash
jq -c . firebase-service-account.json
```

### Important Notes:

- ✅ **Required Fields:** All fields shown above are required for the JSON to work
- ✅ **Private Key:** The `private_key` field contains newlines (`\n`) - these must be preserved in the JSON string
- ✅ **No Trailing Commas:** Ensure no trailing commas in the JSON
- ✅ **Valid JSON:** The entire string must be valid JSON when parsed
- ⚠️ **For Vercel:** Remove all line breaks and extra spaces, but keep `\n` inside the `private_key` string value

---

### Step 2: Update Vercel Environment Variables (Production)

**⚠️ CRITICAL:** Do this BEFORE deleting the old key to prevent service interruption.

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables:**
   - Go to **Settings** → **Environment Variables**

3. **Update the Variable:**
   - Find `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Click **Edit** or **Delete and Re-add**
   - Paste the entire JSON content as a **single-line string** (see [JSON Format](#-json-format-structure) below)
   - Select **Production** (and **Preview** if needed)
   - Click **Save**

4. **Redeploy Application:**
   - After saving, trigger a new deployment
   - Go to **Deployments** tab → **Redeploy** (or push a new commit)
   - Monitor deployment logs for errors

5. **Verify Deployment:**
   - Check application logs for Firebase connection errors
   - Test critical functions (authentication, database access)
   - Ensure no service interruption

### Step 3: Update Local Development Environment

1. **Update Local Key File:**
   - Save the new key as `backend/firebase-service-account.json`
   - Verify `.gitignore` includes `*.json` and `firebase-service-account.json`

2. **Verify Git Ignore:**
   ```bash
   git check-ignore backend/firebase-service-account.json
   ```
   This should output the file path (confirming it's ignored).

3. **Test Locally:**
   ```bash
   cd backend
   python3 -c "from firebase_config import initialize_firebase; db = initialize_firebase(); print('✅ Firebase connection successful')"
   ```

4. **DO NOT commit this file to git** - Always use environment variables in production.

---

## 🔒 How to Revoke Old Keys

**⚠️ CRITICAL:** Only revoke old keys **AFTER** the new key is deployed, verified, and working in production.

### Option 1: Delete Individual Key (Recommended)

If Firebase Console shows individual keys:

1. **Go to Firebase Console:**
   - Firebase Console → **⚙️ Settings** → **Project settings** → **Service accounts** tab
   
2. **Find the Service Account:**
   - Locate the service account email (e.g., `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`)
   
3. **Delete the Old Key:**
   - Click **...** (three dots) next to the service account
   - Select **Manage keys** or **Manage service account keys**
   - Find the old key (by key ID or creation date)
   - Click **Delete** → Confirm deletion

**Note:** Firebase may not always show individual keys in the UI. If you cannot see them, use Option 2.

### Option 2: Create New Service Account (More Secure)

If individual keys are not visible or you want maximum security:

1. **Create New Service Account:**
   - Firebase Console → **IAM & Admin** → **Service Accounts**
   - Click **+ Create Service Account**
   - Give it a descriptive name (e.g., `odinring-production-2025`)
   - Grant required IAM roles (Firebase Admin SDK Administrator Service Agent)
   
2. **Generate Key for New Service Account:**
   - Follow Step 1 of the rotation process
   - Use this new service account's key instead
   
3. **Update Application:**
   - Update `FIREBASE_SERVICE_ACCOUNT_JSON` with new service account key
   - Redeploy and verify
   
4. **Delete Old Service Account:**
   - After new service account is working, delete the old one
   - This automatically revokes all keys associated with it

**Important:** This approach is more secure but requires verifying IAM permissions match the old service account.

---

## ✅ Verification Steps

After rotating keys, verify everything works:

1. **✅ Local Verification:**
   ```bash
   cd backend
   python3 -c "from firebase_config import initialize_firebase; db = initialize_firebase(); print('✅ Firebase connection successful')"
   ```

2. **✅ Production Verification:**
   - Check Vercel deployment logs for errors
   - Test user authentication (login/register)
   - Test database operations (CRUD operations)
   - Monitor for 24 hours for any issues

3. **✅ Access Audit:**
   - Review Firebase Console → IAM & Admin → Audit Logs
   - Check for any unauthorized access attempts
   - Verify only expected service accounts are active

---

## 🧹 Clean Up Git History (If Applicable)

**⚠️ WARNING:** These commands rewrite git history. Coordinate with your team before proceeding.

After rotating keys, remove the old key file from git history to prevent future exposure:

### Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove the file from git history
git filter-repo --path firebase-service-account.json --invert-paths
git filter-repo --path backend/firebase-service-account.json --invert-paths

# Force push (coordinate with team first!)
git push origin --force --all
git push origin --force --tags
```

### Using BFG Repo-Cleaner (Alternative)

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files firebase-service-account.json
java -jar bfg.jar --delete-files backend/firebase-service-account.json
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**Important:**
- Only run on a clean working directory
- Coordinate with your team before force-pushing
- Ensure all team members understand they need to re-clone the repository

After rotating keys, you should also remove the old key file from git history:

```bash
# Using git filter-repo (recommended - requires installation)
pip install git-filter-repo
git filter-repo --path firebase-service-account.json --invert-paths
git filter-repo --path backend/firebase-service-account.json --invert-paths

# OR using BFG Repo-Cleaner (alternative)
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files firebase-service-account.json
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

⚠️ **WARNING:** These commands rewrite git history. Only run on a clean working directory, and coordinate with your team before force-pushing.

---

## 🔐 Security Best Practices

### Going Forward:

1. **Never Commit Keys:**
   - Always use `.gitignore` to exclude credential files
   - Use environment variables in production (Vercel, etc.)
   - Use `.env` files locally (already in `.gitignore`)

2. **Key Rotation Schedule:**
   - Rotate keys immediately if exposed
   - Consider rotating keys annually as a security practice
   - Rotate keys when team members leave

3. **Monitor Access:**
   - Review Firebase Audit Logs for unauthorized access
   - Set up alerts for unusual activity
   - Monitor service account usage

4. **Limit Permissions:**
   - Use service accounts with minimum required permissions
   - Avoid using admin/owner service accounts for application code
   - Use separate service accounts for different environments (dev/staging/prod)

---

## 📋 Checklist

- [ ] Checked git history for exposed keys
- [ ] Generated new Firebase service account key
- [ ] Updated `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel (production)
- [ ] Updated local `firebase-service-account.json` (development)
- [ ] Verified new key works locally
- [ ] Deployed to production and verified
- [ ] Deleted old key from Firebase (optional but recommended)
- [ ] Reviewed Firebase Audit Logs for unauthorized access
- [ ] Removed old key from git history (if applicable)
- [ ] Updated team about key rotation

---

## 🆘 Troubleshooting

### Error: "Failed to initialize Firebase"
- Verify the JSON content is correctly formatted
- Check that environment variable is set (not empty)
- Ensure no extra spaces or line breaks in the JSON string (for Vercel)

### Error: "Permission denied" or "Insufficient permissions"
- Verify the service account has required IAM roles
- Check Firestore security rules allow the service account
- Ensure the service account is enabled in Firebase Console

### Error: "Service account key not found"
- Verify the file path is correct
- Check `.gitignore` isn't accidentally excluding the file in development
- For production, verify environment variable is set correctly

---

## 📚 Additional Resources

- [Firebase Service Accounts Documentation](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Git Filter Repo Documentation](https://github.com/newren/git-filter-repo)
- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/best-practices)

---

## ⚠️ CRITICAL REMINDER

**If keys were exposed in git history:**
- Keys may have been cloned by others
- Keys may be visible in public repositories (if repo was ever public)
- Keys may be in backups or archives
- **Rotation is the ONLY way to invalidate old keys**

**Do not skip key rotation if the file was ever committed to git!**
