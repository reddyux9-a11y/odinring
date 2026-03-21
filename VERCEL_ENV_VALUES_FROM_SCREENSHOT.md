# 🔐 Vercel Environment Variables - From Your Screenshot

Based on your Firebase service account JSON screenshot, here are the exact values to set in Vercel:

---

## ✅ **REQUIRED VARIABLES**

### **1. FIREBASE_PROJECT_ID**
```
Variable Name: FIREBASE_PROJECT_ID
Value: studio-7743041576-fc16f
```

### **2. FIREBASE_SERVICE_ACCOUNT_JSON**
```
Variable Name: FIREBASE_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n","client_email":"YOUR_SERVICE_ACCOUNT_EMAIL","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"YOUR_CLIENT_CERT_URL","universe_domain":"googleapis.com"}
```

**⚠️ IMPORTANT:** 
- The entire JSON must be on ONE LINE (no line breaks)
- Copy the entire JSON object from your file
- Paste it exactly as shown above (all on one line)

---

## 📋 **ADDITIONAL REQUIRED VARIABLES**

You still need to set these (they're not in the screenshot):

### **3. JWT_SECRET**
```
Variable Name: JWT_SECRET
Value: [Generate with: openssl rand -hex 32]
Minimum: 32 characters
```

### **4. CORS_ORIGINS**
```
Variable Name: CORS_ORIGINS
Value: https://your-frontend-domain.vercel.app
Example: https://odinring.vercel.app
```

### **5. ENV**
```
Variable Name: ENV
Value: production
```

### **6. LOG_LEVEL**
```
Variable Name: LOG_LEVEL
Value: INFO
(Must be INFO or higher, NOT DEBUG)
```

### **7. FRONTEND_URL**
```
Variable Name: FRONTEND_URL
Value: https://your-frontend-domain.vercel.app
```

### **8. BACKEND_URL**
```
Variable Name: BACKEND_URL
Value: https://your-backend-domain.vercel.app
```

---

## 🚀 **QUICK SETUP STEPS**

1. **Go to Vercel Dashboard:**
   - [vercel.com](https://vercel.com) → Your Project → Settings → Environment Variables

2. **Add FIREBASE_PROJECT_ID:**
   - Name: `FIREBASE_PROJECT_ID`
   - Value: `studio-7743041576-fc16f`
   - Environments: Production, Preview, Development

3. **Add FIREBASE_SERVICE_ACCOUNT_JSON:**
   - Name: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: [Paste the entire JSON from above as ONE LINE]
   - Environments: Production, Preview, Development

4. **Add remaining required variables** (see list above)

---

## ✅ **VERIFICATION**

After setting variables, verify:
```bash
# Using npx (no global install needed)
npx vercel@latest env ls production

# Should show:
# FIREBASE_PROJECT_ID
# FIREBASE_SERVICE_ACCOUNT_JSON
# JWT_SECRET
# CORS_ORIGINS
# ENV
# LOG_LEVEL
# FRONTEND_URL
# BACKEND_URL
```

---

**Note:** The private key in the JSON above is a placeholder. Use your actual private key from the downloaded JSON file.
