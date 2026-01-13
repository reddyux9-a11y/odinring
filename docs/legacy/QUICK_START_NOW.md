# ⚡ Quick Start - Enable Firestore & Test

## 🚨 Current Status

✅ Firebase service account key saved
✅ Backend configured for Firebase
✅ Frontend configured for Firebase
✅ Google Sign-In button integrated
⏳ **Firestore API needs to be enabled**

---

## 🎯 Do This Now (5 minutes)

### Step 1: Enable Firestore API (1 min)

**👉 Click this link and click "ENABLE":**

https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=studio-7743041576-fc16f

Wait 30 seconds after clicking.

---

### Step 2: Create Firestore Database (1 min)

**👉 Click this link:**

https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore

1. Click **"Create database"**
2. Choose **"Start in test mode"**
3. Select location: **us-central1**
4. Click **"Enable"**
5. Wait 60 seconds

---

### Step 3: Enable Google Sign-In (1 min)

**👉 Click this link:**

https://console.firebase.google.com/project/studio-7743041576-fc16f/authentication/providers

1. Click **"Google"**
2. Toggle it **ON**
3. Enter your email
4. Click **"Save"**

---

### Step 4: Test Connection (30 sec)

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 test_firebase_connection.py
```

**Expected:** ✅ All tests passed

---

### Step 5: Seed Database (30 sec)

```bash
python3 seed_firestore.py
```

**Expected:** ✅ Database seeded

---

### Step 6: Start Servers (1 min)

**Terminal 1 - Backend:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

---

### Step 7: Test Google Sign-In

1. Open http://localhost:3000
2. You should see **"Sign in with Google"** button
3. Click it
4. Select your Google account
5. ✅ Should redirect to dashboard

---

## 🎉 Done!

Your app is now running with:
- ✅ Firebase/Firestore database
- ✅ Email/password authentication
- ✅ Google Sign-In authentication
- ✅ Admin panel

---

## 📖 Full Guide

For detailed instructions and troubleshooting:
👉 See `COMPLETE_FIREBASE_SETUP.md`
