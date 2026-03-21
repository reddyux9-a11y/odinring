# Firestore 403 Permissions Fix Guide

## Problem
You're seeing: `Database error: PermissionDenied: 403 Missing or insufficient permissions`

This happens when the Firebase service account doesn't have the required IAM roles to access Firestore.

## Solution

### Step 1: Grant IAM Roles to Service Account

1. Go to [Google Cloud Console - IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Select your project: `studio-7743041576-fc16f`
3. Find your service account: `firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com`
4. Click the pencil icon (Edit) next to it
5. Click "ADD ANOTHER ROLE"
6. Add one of these roles:
   - **`Cloud Datastore User`** (`roles/datastore.user`) - Recommended for read/write access
   - **`Cloud Datastore Owner`** (`roles/datastore.owner`) - Full access (use only if needed)
7. Click "SAVE"

### Step 2: Wait for Propagation
IAM changes can take 1-5 minutes to propagate. Wait a few minutes after making changes.

### Step 3: Verify Firestore API is Enabled

1. Go to [Firestore API](https://console.cloud.google.com/apis/library/firestore.googleapis.com)
2. Ensure the API is enabled for your project

### Step 4: Test the Connection

Run the test script:
```bash
cd backend
python3 test_firebase_connection.py
```

## Alternative: Use Firebase Admin SDK Default Database

The code has been updated to use the default Firestore database instead of a custom `odinringdb` database. If you need a custom database:

1. Create it in Firebase Console
2. Ensure the service account has permissions to access it
3. Update `firebase_config.py` to use your custom database name

## Quick Fix Script

You can also use the Firebase CLI to grant permissions:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login
firebase login

# Grant permissions (replace with your service account email)
gcloud projects add-iam-policy-binding studio-7743041576-fc16f \
  --member="serviceAccount:firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## Verify It's Working

After granting permissions, restart your backend server:
```bash
# Stop the server
lsof -ti:8000 | xargs kill -9

# Start it again
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The 403 errors should disappear from the logs.
