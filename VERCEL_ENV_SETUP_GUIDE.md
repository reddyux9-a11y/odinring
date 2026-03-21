# 🔐 Vercel Environment Variables Setup Guide

**Complete guide for configuring OdinRing environment variables in Vercel**

---

## 📋 QUICK REFERENCE

### **Required Variables (MUST SET):**
```
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
JWT_SECRET
CORS_ORIGINS
ENV
LOG_LEVEL
FRONTEND_URL
BACKEND_URL
```

### **Optional Variables (Set if using features):**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
SENTRY_DSN
```

---

## 🚀 METHOD 1: Vercel Dashboard (Recommended)

### **Step-by-Step Instructions:**

1. **Navigate to Your Project:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in to your account
   - Select your OdinRing project

2. **Open Settings:**
   - Click on **"Settings"** tab
   - Click on **"Environment Variables"** in the left sidebar

3. **Add Each Variable:**
   - Click **"Add New"** button
   - Enter variable name and value
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **"Save"**

4. **Repeat for All Variables:**
   - Add each variable from the list below
   - **Important:** For `FIREBASE_SERVICE_ACCOUNT_JSON`, paste the entire JSON as a single-line string

---

## 🔧 METHOD 2: Vercel CLI (Alternative)

### **Install Vercel CLI:**
```bash
npm i -g vercel
```

### **Login:**
```bash
vercel login
```

### **Link Your Project:**
```bash
cd /path/to/odinring-main-2
vercel link
```

### **Set Environment Variables:**
```bash
# Required variables
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
vercel env add JWT_SECRET production
vercel env add CORS_ORIGINS production
vercel env add ENV production
vercel env add LOG_LEVEL production
vercel env add FRONTEND_URL production
vercel env add BACKEND_URL production

# Optional variables (if using features)
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add SENTRY_DSN production
```

---

## 📝 DETAILED VARIABLE DESCRIPTIONS

### **1. FIREBASE_PROJECT_ID** (REQUIRED)
```
Variable Name: FIREBASE_PROJECT_ID
Value: your-firebase-project-id
Example: odinring-production
Description: Your Firebase project ID from Firebase Console
Where to find: Firebase Console → Project Settings → General
```

### **2. FIREBASE_SERVICE_ACCOUNT_JSON** (REQUIRED)
```
Variable Name: FIREBASE_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
Description: Complete Firebase service account JSON as a single-line string
Where to find: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
Important: Paste the ENTIRE JSON object as one line (no line breaks)
```

**How to format the JSON:**
1. Download the service account JSON file from Firebase
2. Open it in a text editor
3. Remove all line breaks and spaces (or use a JSON minifier)
4. Paste the entire string as the value

**Example:**
```json
{"type":"service_account","project_id":"odinring-production","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@odinring-production.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

### **3. JWT_SECRET** (REQUIRED)
```
Variable Name: JWT_SECRET
Value: [minimum 32 characters, random secure string]
Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Description: Secret key for signing JWT tokens (MUST be at least 32 characters)
How to generate: Use a secure random string generator
```

**Generate a secure JWT_SECRET:**
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **4. CORS_ORIGINS** (REQUIRED)
```
Variable Name: CORS_ORIGINS
Value: https://your-frontend-domain.vercel.app,https://www.yourdomain.com
Example: https://odinring.vercel.app,https://www.odinring.com
Description: Comma-separated list of allowed CORS origins
Format: No spaces, comma-separated URLs
```

**Important:**
- Include your Vercel frontend URL
- Include your custom domain (if using one)
- Use `https://` protocol
- No trailing slashes

### **5. ENV** (REQUIRED)
```
Variable Name: ENV
Value: production
Description: Environment identifier (must be "production" for production deployment)
Valid values: production, staging, development, test
```

### **6. LOG_LEVEL** (REQUIRED)
```
Variable Name: LOG_LEVEL
Value: INFO
Description: Logging level (MUST be INFO or higher in production)
Valid values: DEBUG, INFO, WARNING, ERROR, CRITICAL
Security: DEBUG is NOT allowed in production
```

### **7. FRONTEND_URL** (REQUIRED)
```
Variable Name: FRONTEND_URL
Value: https://your-frontend-domain.vercel.app
Example: https://odinring.vercel.app
Description: Your frontend application URL
```

### **8. BACKEND_URL** (REQUIRED)
```
Variable Name: BACKEND_URL
Value: https://your-backend-domain.vercel.app
Example: https://odinring-api.vercel.app
Description: Your backend API URL
Note: This might be the same as FRONTEND_URL if using monorepo deployment
```

---

## 🔑 OPTIONAL VARIABLES

### **Stripe (If Billing Enabled):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **AI Services (If AI Features Enabled):**
```
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

### **Error Tracking (Recommended):**
```
SENTRY_DSN=https://...@sentry.io/...
```

---

## ✅ VERIFICATION CHECKLIST

After setting all variables, verify they are set correctly:

### **1. Check in Vercel Dashboard:**
- [ ] All required variables are present
- [ ] Values are correct (no typos)
- [ ] Environment is set to "Production" for all
- [ ] `LOG_LEVEL` is set to "INFO" or higher (NOT "DEBUG")

### **2. Test Deployment:**
```bash
# Deploy to preview
vercel

# Check deployment logs for errors
vercel logs
```

### **3. Test Health Endpoint:**
After deployment, test:
```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### **4. Test Environment Endpoint:**
```bash
curl https://your-backend-url.vercel.app/api/debug/env
```

Expected response (sanitized):
```json
{
  "FIREBASE_PROJECT_ID": "your-project-id",
  "FIREBASE_SERVICE_ACCOUNT_JSON": "SET",
  "JWT_SECRET": "SET",
  "CORS_ORIGINS": "SET",
  "has_firebase_project_id": true,
  "has_firebase_service_account": true,
  "has_jwt_secret": true
}
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### **Issue 1: FIREBASE_SERVICE_ACCOUNT_JSON Format Error**
**Error:** `FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON`

**Solution:**
- Ensure the JSON is on a single line
- Remove all line breaks
- Escape quotes properly
- Use a JSON minifier tool

### **Issue 2: JWT_SECRET Too Short**
**Error:** `JWT_SECRET must be at least 32 characters`

**Solution:**
- Generate a new secret with at least 32 characters
- Use the generation commands above

### **Issue 3: CORS Errors**
**Error:** CORS policy blocking requests

**Solution:**
- Verify `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slashes
- Use `https://` protocol
- Check for typos in URLs

### **Issue 4: LOG_LEVEL DEBUG in Production**
**Error:** `LOG_LEVEL must be INFO or higher in production`

**Solution:**
- Change `LOG_LEVEL` to "INFO", "WARNING", "ERROR", or "CRITICAL"
- Never use "DEBUG" in production

### **Issue 5: Missing Environment Variables**
**Error:** Application fails to start

**Solution:**
- Verify all required variables are set
- Check variable names for typos
- Ensure variables are set for "Production" environment
- Redeploy after adding variables

---

## 📋 COMPLETE VARIABLE TEMPLATE

Copy this template and fill in your values:

```bash
# === REQUIRED VARIABLES ===
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
JWT_SECRET=your-32-char-minimum-secret-key
CORS_ORIGINS=https://your-frontend.vercel.app
ENV=production
LOG_LEVEL=INFO
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.vercel.app

# === OPTIONAL VARIABLES (if using features) ===
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# SENTRY_DSN=https://...@sentry.io/...
```

---

## 🔍 VERIFICATION SCRIPT

Create a file `verify-vercel-env.sh`:

```bash
#!/bin/bash
echo "🔍 Verifying Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Install with: npm i -g vercel"
    exit 1
fi

# List all environment variables
echo "📋 Current Environment Variables:"
vercel env ls production

echo ""
echo "✅ Verification complete!"
echo "💡 If any required variables are missing, add them using:"
echo "   vercel env add VARIABLE_NAME production"
```

---

## 🎯 QUICK SETUP COMMANDS

### **One-Line Setup (Copy and modify values):**
```bash
# Set all required variables at once
vercel env add FIREBASE_PROJECT_ID production <<< "your-project-id"
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production <<< '{"type":"service_account",...}'
vercel env add JWT_SECRET production <<< "your-32-char-secret"
vercel env add CORS_ORIGINS production <<< "https://your-frontend.vercel.app"
vercel env add ENV production <<< "production"
vercel env add LOG_LEVEL production <<< "INFO"
vercel env add FRONTEND_URL production <<< "https://your-frontend.vercel.app"
vercel env add BACKEND_URL production <<< "https://your-backend.vercel.app"
```

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Vercel Deployment Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → View Function Logs

2. **Test Locally First:**
   ```bash
   # Set variables locally
   export FIREBASE_PROJECT_ID=...
   export FIREBASE_SERVICE_ACCOUNT_JSON=...
   # ... etc
   
   # Test server startup
   cd backend
   python server.py
   ```

3. **Verify Firebase Connection:**
   ```bash
   python backend/test_firebase_connection.py
   ```

---

**Last Updated:** 2026-01-17  
**For:** OdinRing Production Deployment
