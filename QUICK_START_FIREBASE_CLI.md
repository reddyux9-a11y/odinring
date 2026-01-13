# 🔥 Quick Start: Install Firebase CLI

**IMPORTANT:** These commands MUST be run in YOUR terminal, not in the sandbox environment.

---

## 🚀 One-Line Installation

Copy and paste this command in your terminal:

```bash
sudo npm install -g firebase-tools && firebase --version
```

This will:
1. Install Firebase CLI globally
2. Show the installed version

---

## ✅ Complete Steps

### 1. Install Firebase CLI

```bash
sudo npm install -g firebase-tools
```

You'll be prompted for your password (it won't show as you type).

### 2. Verify Installation

```bash
firebase --version
```

Expected output: `12.x.x` or similar

### 3. Login to Firebase

```bash
firebase login
```

This opens a browser window for authentication.

### 4. Deploy Indexes

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
firebase deploy --only firestore:indexes
```

---

## 📋 Or Use the Script

After installing Firebase CLI, run:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./DEPLOY_FIRESTORE_INDEXES.sh
```

---

## 🔗 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore/indexes
- **Project:** studio-7743041576-fc16f

---

**Note:** The sandbox environment cannot execute sudo commands. Please run these in your terminal.



