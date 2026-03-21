# 🔐 How to Generate JWT_SECRET

A step-by-step guide to generate a secure JWT_SECRET for OdinRing.

---

## 🚀 **METHOD 1: Using the Script (Easiest)**

Run the provided script:

```bash
./scripts/generate-jwt-secret.sh
```

This will:
- ✅ Generate a secure 64-character hex string
- ✅ Show you the value to copy
- ✅ Copy it to your clipboard (on macOS)
- ✅ Verify it meets the 32-character minimum requirement

---

## 🚀 **METHOD 2: Using OpenSSL (Command Line)**

### **Step 1: Open Terminal**

On macOS:
- Press `Cmd + Space`
- Type "Terminal"
- Press Enter

### **Step 2: Run the Command**

```bash
openssl rand -hex 32
```

### **Step 3: Copy the Output**

You'll see something like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Copy this entire string** - this is your JWT_SECRET!

### **Step 4: Verify Length**

The output should be **64 characters** (32 bytes in hexadecimal = 64 hex characters).

---

## 🚀 **METHOD 3: Using Python**

If you don't have OpenSSL:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

This generates a URL-safe random string (44 characters).

---

## 🚀 **METHOD 4: Using Node.js**

If you have Node.js installed:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This generates a 64-character hex string (same as OpenSSL).

---

## 📋 **What You'll Get**

### **Example Output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### **Characteristics:**
- ✅ **Length:** 64 characters (hexadecimal representation of 32 bytes)
- ✅ **Format:** Lowercase letters (a-f) and numbers (0-9)
- ✅ **Security:** Cryptographically secure random
- ✅ **Minimum:** Exceeds the 32-character requirement

---

## ✅ **How to Use in Vercel**

1. **Generate the secret** using any method above
2. **Copy the entire string**
3. **Go to Vercel Dashboard:**
   - Your Project → Settings → Environment Variables
   - Click "Add New"
   - **Name:** `JWT_SECRET`
   - **Value:** Paste your generated secret
   - **Environments:** Select Production, Preview, Development
   - Click "Save"

---

## 🔒 **Security Best Practices**

1. **✅ Generate a unique secret for each environment:**
   - Different secret for development
   - Different secret for production
   - Never reuse secrets

2. **✅ Never commit secrets to git:**
   - Keep them in environment variables only
   - Use `.gitignore` to exclude any local files with secrets

3. **✅ Store securely:**
   - Use Vercel environment variables (encrypted)
   - Don't share via email or chat
   - Use a password manager for backup

4. **✅ Rotate periodically:**
   - Change secrets every 90 days (recommended)
   - Rotate immediately if compromised

---

## 🧪 **Verification**

After setting in Vercel, verify it's working:

```bash
# Test the deployment
npx vercel@latest --prod

# Check environment variables (sanitized)
curl https://your-backend-url.vercel.app/api/debug/env
```

You should see:
```json
{
  "has_jwt_secret": true,
  "JWT_SECRET": "SET"
}
```

---

## ❓ **Troubleshooting**

### **Issue: "openssl: command not found"**

**Solution:** Install OpenSSL:
```bash
# macOS
brew install openssl

# Or use Python/Node.js methods instead
```

### **Issue: "JWT_SECRET must be at least 32 characters"**

**Solution:** 
- Make sure you copied the entire output
- The hex output should be 64 characters
- If using Python's `token_urlsafe`, it's 44 characters (also valid)

### **Issue: "Invalid secret format"**

**Solution:**
- Use hex format (letters a-f and numbers 0-9)
- No spaces or special characters
- Lowercase is fine

---

## 📝 **Quick Reference**

| Method | Command | Output Length | Format |
|--------|---------|---------------|--------|
| OpenSSL | `openssl rand -hex 32` | 64 chars | Hex |
| Python | `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` | 44 chars | URL-safe |
| Node.js | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 64 chars | Hex |
| Script | `./scripts/generate-jwt-secret.sh` | 64 chars | Hex |

---

**All methods generate cryptographically secure random strings suitable for JWT signing!**
