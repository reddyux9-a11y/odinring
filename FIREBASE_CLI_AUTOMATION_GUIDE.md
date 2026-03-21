# 🔥 Firebase CLI Automation Guide

**Purpose:** Automate Firebase setup, deployment, and configuration using Firebase CLI

---

## 🚀 **Quick Start**

Run the automation script:

```bash
./scripts/setup-firebase-automated.sh
```

This script will:
1. ✅ Install Firebase CLI (if needed)
2. ✅ Log you in to Firebase
3. ✅ Link your project
4. ✅ Deploy Firestore rules
5. ✅ Deploy Firestore indexes
6. ✅ Extract Firebase configuration
7. ✅ Display environment variables

---

## 📋 **What the Script Does**

### **Step 1: Install Firebase CLI**
- Checks if Firebase CLI is installed
- Installs via `npm install -g firebase-tools` if missing

### **Step 2: Authenticate**
- Checks if you're logged in
- Opens browser for authentication if needed

### **Step 3: Link Project**
- Verifies `.firebaserc` exists
- Links to project: `studio-7743041576-fc16f`

### **Step 4: Deploy Firestore Rules**
- Deploys `firestore.rules` to Firebase
- Updates security rules in production

### **Step 5: Deploy Firestore Indexes**
- Deploys `firestore.indexes.json` to Firebase
- Creates required indexes for queries

### **Step 6: Extract Configuration**
- Extracts Firebase web app config
- Saves to `firebase-config-extracted.json`

### **Step 7: Display Environment Variables**
- Shows all required frontend env vars
- Ready to copy to Vercel

---

## 🔧 **Manual Firebase CLI Commands**

### **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

### **Login:**
```bash
firebase login
```

### **List Projects:**
```bash
firebase projects:list
```

### **Use Project:**
```bash
firebase use studio-7743041576-fc16f
```

### **Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

### **Deploy Firestore Indexes:**
```bash
firebase deploy --only firestore:indexes
```

### **Deploy Everything:**
```bash
firebase deploy
```

### **Get Web App Config:**
```bash
firebase apps:sdkconfig web
```

### **Open Firebase Console:**
```bash
firebase open
```

---

## 📝 **Environment Variables**

After running the script, set these in Vercel frontend:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948
REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529
```

---

## 🔍 **Verify Setup**

### **Check Project:**
```bash
firebase use
```

### **Check Rules:**
```bash
firebase firestore:rules:get
```

### **Check Indexes:**
```bash
firebase firestore:indexes
```

### **Test Connection:**
```bash
firebase projects:list
```

---

## 🛠️ **Troubleshooting**

### **Error: "Not logged in"**
```bash
firebase login
```

### **Error: "Project not found"**
```bash
firebase projects:list
firebase use <project-id>
```

### **Error: "Permission denied"**
- Verify you have access to the project
- Check Firebase Console → Project Settings → Users and permissions

### **Error: "Rules deployment failed"**
- Check `firestore.rules` syntax
- Verify rules file exists
- Check Firebase Console for errors

---

## 📚 **Useful Commands**

### **View Current Project:**
```bash
firebase use
```

### **Switch Projects:**
```bash
firebase use <project-id>
```

### **View Deployment History:**
```bash
firebase deploy:list
```

### **Rollback Deployment:**
```bash
firebase deploy:rollback
```

### **View Logs:**
```bash
firebase functions:log
```

---

## ✅ **Checklist**

After running the script:

- [ ] Firebase CLI installed
- [ ] Logged in to Firebase
- [ ] Project linked correctly
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Configuration extracted
- [ ] Environment variables set in Vercel
- [ ] Frontend can connect to Firebase

---

## 🎯 **Next Steps**

1. **Run the automation script:**
   ```bash
   ./scripts/setup-firebase-automated.sh
   ```

2. **Set environment variables in Vercel:**
   - Go to Vercel Dashboard
   - Frontend project → Settings → Environment Variables
   - Add all `REACT_APP_FIREBASE_*` variables

3. **Test frontend connection:**
   - Deploy frontend
   - Check browser console for Firebase errors
   - Test login functionality

---

**Status:** Ready to run  
**Script:** `./scripts/setup-firebase-automated.sh`
