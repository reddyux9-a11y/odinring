# Vercel Environment Variables Setup Guide

## 🔐 Setting Up Firebase Service Account in Vercel

This guide helps you update the `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIREBASE_PROJECT_ID` environment variables in Vercel.

---

## 📋 Required Environment Variables

### 1. FIREBASE_SERVICE_ACCOUNT_JSON
- **Type:** String (entire JSON as single line)
- **Required:** Yes (for production)
- **Format:** Complete JSON object as a single-line string

### 2. FIREBASE_PROJECT_ID
- **Type:** String
- **Required:** Yes
- **Value:** `studio-7743041576-fc16f` (from your service account file)

---

## 🔄 Step-by-Step: Update Environment Variables in Vercel

### Step 1: Access Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Log in to your account
   - Select your OdinRing project

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** tab (in the top navigation)
   - Click on **Environment Variables** in the left sidebar

---

### Step 2: Prepare JSON Content

The `FIREBASE_SERVICE_ACCOUNT_JSON` must be formatted as a **single-line JSON string**.

**Your service account file contains:**
- Project ID: `studio-7743041576-fc16f`
- Client Email: `firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com`

**To format the JSON for Vercel:**

1. **Open the file:** `backend/firebase-service-account.json`
2. **Copy the entire content** (all lines, including the entire JSON object)
3. **Minify/Format as single line:**
   - Remove all line breaks
   - Remove extra whitespace
   - Ensure it's valid JSON

**Or use this command to generate the single-line JSON:**
```bash
cd backend
python3 -c "import json; f=open('firebase-service-account.json'); data=json.load(f); print(json.dumps(data))"
```

This will output the JSON as a single line, ready to paste into Vercel.

---

### Step 3: Update FIREBASE_PROJECT_ID

1. **In Vercel Environment Variables:**
   - Look for existing `FIREBASE_PROJECT_ID` variable
   - If it exists: Click **Edit** (pencil icon) or click on the value
   - If it doesn't exist: Use the **Key** and **Value** input fields to add it

2. **Set the Value:**
   - **Key:** `FIREBASE_PROJECT_ID`
   - **Value:** `studio-7743041576-fc16f`

3. **Select Environments:**
   - Select: **Production**, **Preview**, and **Development**
   - Or at minimum: **Production**

4. **Save:**
   - Click **Save** button

---

### Step 4: Update FIREBASE_SERVICE_ACCOUNT_JSON

1. **Find or Add the Variable:**
   - Look for existing `FIREBASE_SERVICE_ACCOUNT_JSON` variable
   - If it exists: Click **Edit** (pencil icon) or click on the value
   - If it doesn't exist: Use the **Key** and **Value** input fields to add it

2. **Set the Value:**
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the entire JSON content as a single line
     - Use the output from the command above
     - Or manually remove line breaks from the JSON file
     - Ensure it starts with `{` and ends with `}`

3. **Select Environments:**
   - Select: **Production**, **Preview**, and **Development**
   - Or at minimum: **Production**

4. **Enable Sensitive (Recommended):**
   - Toggle **Sensitive** switch to **ON**
   - This prevents the value from being readable after creation

5. **Save:**
   - Click **Save** button

---

### Step 5: Verify Environment Variables

1. **Check Both Variables Are Set:**
   - `FIREBASE_PROJECT_ID`: Should show `studio-7743041576-fc16f`
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: Should show value (or masked if sensitive is enabled)

2. **Verify Environment Selection:**
   - Ensure both variables are enabled for **Production** environment
   - Preview and Development are optional but recommended

---

### Step 6: Redeploy Application

1. **Trigger Redeployment:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a commit to trigger automatic deployment

2. **Monitor Deployment:**
   - Watch the build logs for any errors
   - Look for Firebase initialization messages
   - Check for any environment variable errors

3. **Check Runtime Logs:**
   - After deployment, go to **Deployments** → Select deployment → **Functions**
   - Review logs for Firebase connection status
   - Verify no Firebase authentication errors

---

## 🔍 Verification Checklist

- [ ] `FIREBASE_PROJECT_ID` is set to `studio-7743041576-fc16f`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` contains the complete JSON (as single line)
- [ ] Both variables are enabled for **Production** environment
- [ ] Sensitive toggle is enabled for `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended)
- [ ] Application redeployed successfully
- [ ] No Firebase errors in deployment logs
- [ ] No Firebase errors in runtime logs
- [ ] API endpoints responding correctly

---

## ⚠️ Important Notes

### JSON Format Requirements:

1. **Must be Single Line:**
   - Remove all line breaks (`\n`)
   - Remove extra whitespace
   - Ensure valid JSON format

2. **Must Include Entire JSON:**
   - Start with `{`
   - End with `}`
   - Include all fields: `type`, `project_id`, `private_key`, `client_email`, etc.

3. **Special Characters:**
   - Private key contains `\n` characters (newlines)
   - These should remain in the JSON string (as escaped characters)
   - Vercel will handle them correctly

### Security Best Practices:

1. **Enable Sensitive Toggle:**
   - Prevents reading the value after creation
   - Protects credentials from accidental exposure

2. **Don't Share the Value:**
   - Never copy/paste the JSON value into chat or documentation
   - Keep it secure

3. **Rotate Keys Regularly:**
   - Rotate keys if exposed
   - Consider annual rotation as security practice

---

## 🚨 Troubleshooting

### Error: "Invalid JSON format"

**Solution:**
- Ensure the JSON is valid (starts with `{` and ends with `}`)
- Remove any extra characters
- Use the command above to generate proper single-line JSON

### Error: "Environment variable not found"

**Solution:**
- Verify the variable name is exactly: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Check that it's enabled for the correct environment (Production)
- Redeploy after adding/updating variables

### Error: "Firebase initialization failed"

**Solution:**
- Verify JSON content is complete (all fields present)
- Check that `FIREBASE_PROJECT_ID` matches the project ID in the JSON
- Ensure private key is properly formatted (with `\n` escape sequences)

### Error: "Permission denied" in production

**Solution:**
- Verify service account has required IAM roles
- Check Firestore security rules
- Ensure service account is enabled in Firebase Console

---

## 📝 Quick Reference

### Environment Variables Summary:

| Variable | Value | Required | Environments |
|----------|-------|----------|--------------|
| `FIREBASE_PROJECT_ID` | `studio-7743041576-fc16f` | Yes | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Complete JSON as single line | Yes | Production, Preview, Development |

### Generate Single-Line JSON Command:

```bash
cd backend
python3 -c "import json; f=open('firebase-service-account.json'); data=json.load(f); print(json.dumps(data))"
```

---

## 🔗 Related Documents

- `FIREBASE_KEY_ROTATION_GUIDE.md` - How to rotate keys
- `FIREBASE_TESTING_GUIDE.md` - How to test the connection
- `FIREBASE_ACCESS_AUDIT_GUIDE.md` - How to audit access logs
- `backend/DEPLOYMENT_PLATFORM.md` - Deployment platform documentation

---

**Last Updated:** January 2025
