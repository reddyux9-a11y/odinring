# 🔥 Firebase Automation - Quick Start

**Your Firebase app exists!** Use these scripts to automate setup.

---

## 🚀 **Option 1: Full Automation (Recommended)**

Run the complete setup script:

```bash
./scripts/setup-firebase-automated.sh
```

**This will:**
- ✅ Install Firebase CLI
- ✅ Login to Firebase
- ✅ Deploy Firestore rules
- ✅ Deploy Firestore indexes
- ✅ Extract configuration
- ✅ Show environment variables

---

## 🚀 **Option 2: Set Environment Variables Only**

If you just need to set Firebase env vars in Vercel:

```bash
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
./scripts/set-firebase-env-vars.sh
```

**This will:**
- ✅ Set all `REACT_APP_FIREBASE_*` variables in Vercel
- ✅ Apply to production, preview, and development

---

## 📋 **Manual Steps (If Scripts Don't Work)**

### **1. Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

### **2. Login:**
```bash
firebase login
```

### **3. Use Your Project:**
```bash
firebase use studio-7743041576-fc16f
```

### **4. Deploy Rules:**
```bash
firebase deploy --only firestore:rules
```

### **5. Deploy Indexes:**
```bash
firebase deploy --only firestore:indexes
```

### **6. Set Environment Variables in Vercel:**

Go to: https://vercel.com/odin-rings-projects/odinring-frontend/settings/environment-variables

Add these:
```
REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948
REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529
```

---

## ✅ **Your Firebase App Details**

From Firebase Console:
- **Project ID:** `studio-7743041576-fc16f`
- **App ID:** `1:544218567948:web:59374d5038ec7051b32529`
- **API Key:** `AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs`

---

## 🔍 **Verify Setup**

### **Check Firebase CLI:**
```bash
firebase --version
```

### **Check Login:**
```bash
firebase projects:list
```

### **Check Project:**
```bash
firebase use
```

### **Test Rules:**
```bash
firebase firestore:rules:get
```

---

## 🎯 **Quick Commands**

```bash
# Deploy everything
firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# Open Firebase Console
firebase open

# Get web app config
firebase apps:sdkconfig web
```

---

## 📚 **Documentation**

- **Full Guide:** `FIREBASE_CLI_AUTOMATION_GUIDE.md`
- **IP Whitelist:** `FIREBASE_IP_WHITELIST_GUIDE.md`
- **Network Error Fix:** `FIREBASE_NETWORK_ERROR_FIX.md`

---

**Ready to automate!** Run `./scripts/setup-firebase-automated.sh` to get started.
