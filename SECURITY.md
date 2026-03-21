# Security Guidelines

**Last Updated:** January 2025  
**Status:** Production Security Hardened

---

## ⚠️ CRITICAL: DO NOT COMMIT SECRETS

**Secrets, credentials, and private keys must NEVER be committed to git.**

This repository uses pre-commit hooks and `.gitignore` rules to prevent accidental credential commits.

---

## 🔐 Credential Handling Rules

### ✅ DO:
- ✅ Use environment variables for all secrets (production)
- ✅ Store secrets in `.env` files locally (already in `.gitignore`)
- ✅ Use Vercel environment variables for production deployment
- ✅ Rotate keys immediately if they were ever committed to git

### ❌ DO NOT:
- ❌ Commit `firebase-service-account.json` or any credential files
- ❌ Commit `.env` files
- ❌ Log secrets or credentials in application logs
- ❌ Store secrets in code files (hardcode)
- ❌ Share credentials via email, Slack, or other insecure channels

---

## 🔒 Firebase Credentials

Firebase service account credentials are handled exclusively via environment variables.

### Production (Vercel):
- Use `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- Set in Vercel Dashboard → Settings → Environment Variables
- Format: Single-line JSON string (see [Firebase Key Rotation Guide](FIREBASE_KEY_ROTATION_GUIDE.md))

### Local Development:
- Use `backend/firebase-service-account.json` file (already in `.gitignore`)
- Or use `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- Never commit this file to git

### Key Rotation:
**If `firebase-service-account.json` was ever committed to git, you MUST rotate keys immediately.**

See [Firebase Key Rotation Guide](FIREBASE_KEY_ROTATION_GUIDE.md) for complete instructions.

---

## 📄 JSON Format

### Firebase Service Account JSON Structure

The Firebase service account JSON file has the following structure. **All fields shown below are required.**

#### Pretty-Printed Format (For Local Development):

Save as `backend/firebase-service-account.json` for local development:

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

**Important Notes:**
- ✅ The `private_key` field contains newlines (`\n`) - these must be preserved
- ✅ All fields are required for the JSON to work
- ✅ No trailing commas allowed
- ✅ Must be valid JSON (can be validated with `json.loads()` or online JSON validators)

#### Single-Line Format (For Vercel Environment Variable):

For Vercel's `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable, convert the JSON to a **single-line string**:

```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"unique-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"numeric-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}
```

**Important Notes:**
- ✅ Remove all line breaks and extra spaces
- ✅ Keep `\n` inside the `private_key` string value (these are literal newlines)
- ✅ Entire string must be valid JSON when parsed
- ✅ No spaces after colons or commas (minified JSON)

### Converting JSON to Single-Line Format

**Using Python:**
```python
import json

# Read the pretty-printed JSON file
with open('firebase-service-account.json', 'r') as f:
    data = json.load(f)

# Convert to single-line string
single_line = json.dumps(data, separators=(',', ':'))
print(single_line)
# Copy this output to Vercel's FIREBASE_SERVICE_ACCOUNT_JSON environment variable
```

**Using Node.js:**
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
const singleLine = JSON.stringify(data);
console.log(singleLine);
// Copy this output to Vercel's FIREBASE_SERVICE_ACCOUNT_JSON environment variable
```

**Using jq (Command Line):**
```bash
jq -c . firebase-service-account.json
# Copy this output to Vercel's FIREBASE_SERVICE_ACCOUNT_JSON environment variable
```

### Example: Setting Vercel Environment Variable

1. **Get the single-line JSON:**
   ```bash
   jq -c . backend/firebase-service-account.json
   ```

2. **Copy the entire output** (should be one long line)

3. **In Vercel Dashboard:**
   - Go to **Settings** → **Environment Variables**
   - Add or edit `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Paste the single-line JSON string
   - Select **Production** (and **Preview** if needed)
   - Click **Save**

4. **Redeploy** to apply changes

### Validating JSON Format

**Test locally before deploying:**
```bash
cd backend
python3 -c "import json, os; json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '{}')); print('✅ JSON format is valid')"
```

**Or using Python script:**
```python
import json
import os

json_str = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '{}')
try:
    data = json.loads(json_str)
    # Check required fields
    required = ['project_id', 'client_email', 'private_key']
    missing = [f for f in required if not data.get(f)]
    if missing:
        print(f"❌ Missing required fields: {missing}")
    else:
        print("✅ JSON format is valid and contains all required fields")
except json.JSONDecodeError as e:
    print(f"❌ Invalid JSON: {e}")
```

---

## 🛡️ Pre-Commit Secret Protection

This repository includes a pre-commit hook that automatically scans staged files for secrets before commits.

### Setup (One-Time):

The pre-commit hook is located at `.git/hooks/pre-commit`. To enable it:

```bash
# Make the hook executable (if not already)
chmod +x .git/hooks/pre-commit
```

**That's it!** The hook will now run automatically before every commit.

### What It Blocks:

The pre-commit hook prevents commits containing:
- `firebase-service-account.json` files
- `firebase-adminsdk*.json` files
- Private keys (`BEGIN PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`, etc.)
- Service account JSON patterns
- Credential files

### How It Works:

1. Before each commit, the hook scans all staged files
2. If secrets are detected, the commit is blocked
3. You'll see a clear error message with instructions
4. Remove secrets from staging before committing

### Bypassing (NOT RECOMMENDED):

**⚠️ WARNING:** Do not bypass the pre-commit hook. If you must (for legitimate reasons):

```bash
# Skip pre-commit hook (NOT RECOMMENDED)
git commit --no-verify -m "message"
```

**Only use this if:**
- You're committing documentation about secrets (not actual secrets)
- You're certain no secrets are in the commit
- You understand the security implications

---

## 📋 Environment Variables

### Required (Production):

| Variable | Description | Location |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | Vercel Environment Variables |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Complete service account JSON (single-line) | Vercel Environment Variables |
| `JWT_SECRET` | Secret key for JWT token signing | Vercel Environment Variables |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | Vercel Environment Variables |

### Development:

- Use `.env` files (already in `.gitignore`)
- See `env-template.txt` for required variables
- Never commit `.env` files

---

## 🔍 Security Checklist

Before committing code:

- [ ] No credential files in staging (`git status`)
- [ ] No `.env` files in staging
- [ ] No hardcoded secrets in code
- [ ] No secrets in commit messages
- [ ] Pre-commit hook is enabled (runs automatically)
- [ ] Secrets use environment variables only

---

## 📚 Security Documentation

### Guides:
- **[Firebase Key Rotation Guide](FIREBASE_KEY_ROTATION_GUIDE.md)** - When and how to rotate Firebase keys
- **[Firebase Access Audit Guide](FIREBASE_ACCESS_AUDIT_GUIDE.md)** - How to audit Firebase access logs
- **[Firebase Testing Guide](FIREBASE_TESTING_GUIDE.md)** - Testing Firebase credentials
- **[Vercel Environment Setup](VERCEL_ENV_SETUP.md)** - Setting up Vercel environment variables

### Key Security Files:
- `.gitignore` - Prevents committing credential files
- `.git/hooks/pre-commit` - Blocks commits containing secrets
- `backend/firebase_config.py` - Secure credential loading (environment variables only)

---

## 🚨 Incident Response

If secrets were accidentally committed:

1. **IMMEDIATELY** rotate affected keys (see [Firebase Key Rotation Guide](FIREBASE_KEY_ROTATION_GUIDE.md))
2. Remove secrets from git history (see rotation guide)
3. Review access logs for unauthorized access
4. Notify team members
5. Update credentials in all environments (Vercel, local, etc.)

---

## 📞 Security Contacts

For security concerns or questions:
- Review existing security documentation
- Check [Diagnostic Report](END_TO_END_SYSTEM_DIAGNOSTIC_REPORT.md) for known issues
- See [Troubleshooting Guides](docs/guides/TROUBLESHOOTING.md)

---

## ✅ Compliance Status

**Last Security Audit:** January 2025  
**Status:** ✅ All critical security vulnerabilities resolved

**Resolved Issues:**
- ✅ Firebase credentials removed from repository
- ✅ File-based credential loading eliminated
- ✅ Environment-variable-only credential loading enforced
- ✅ Pre-commit secret protection implemented
- ✅ `.gitignore` hardened (all credential patterns covered)
- ✅ Comprehensive security documentation created

**Remaining Items:**
- ⚠️ **RECOMMENDED:** Rotate Firebase keys if they were ever in git history (guide provided)
- ⚠️ **RECOMMENDED:** Review Firebase access logs for unauthorized access (guide provided)

---

**Remember: Security is everyone's responsibility. When in doubt, ask!**
