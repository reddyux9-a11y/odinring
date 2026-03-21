# Firebase Connection Testing Guide

## 🧪 Testing After Updating Firebase Service Account JSON

This guide helps you verify that your Firebase connection is working correctly after updating the service account credentials.

---

## 📋 Testing Checklist

- [ ] Test local Firebase connection
- [ ] Verify service account file is valid
- [ ] Test Firestore read/write operations
- [ ] Verify production deployment (Vercel)
- [ ] Check application logs
- [ ] Test critical Firebase-dependent features

---

## 🔧 Step 1: Test Local Connection

### Option A: Using the Test Script

Run the provided test script:

```bash
cd backend
python3 test_firebase_connection.py
```

**Expected Output:**
```
============================================================
Firebase Connection Test
============================================================
✅ Service account file found: backend/firebase-service-account.json
📋 Environment Check:
   FIREBASE_PROJECT_ID: ✅ Set
      Value: studio-7743041576-fc16f
   FIREBASE_SERVICE_ACCOUNT_JSON: ⚠️  Not set (will use file if available)
🔄 Initializing Firebase...
✅ Firebase initialized successfully!
🔄 Testing Firestore connection...
   Attempting to read from 'users' collection...
✅ Firestore connection successful!
============================================================
✅ ALL TESTS PASSED - Firebase connection is working!
============================================================
```

### Option B: Manual Python Test

```bash
cd backend
python3 -c "from firebase_config import initialize_firebase; db = initialize_firebase(); print('✅ Firebase connection successful')"
```

### Option C: Test with Server Startup

```bash
cd backend
python3 -c "import server; print('✅ Server imports successfully')"
```

---

## 🔍 Step 2: Verify Service Account File

### Check File Exists and is Valid JSON:

```bash
cd backend
python3 -c "import json; f=open('firebase-service-account.json'); data=json.load(f); print('✅ Valid JSON'); print(f'Project ID: {data.get(\"project_id\")}'); print(f'Client Email: {data.get(\"client_email\")}')"
```

**Expected Output:**
```
✅ Valid JSON
Project ID: studio-7743041576-fc16f
Client Email: firebase-adminsdk-xxx@studio-7743041576-fc16f.iam.gserviceaccount.com
```

---

## 🧪 Step 3: Test Firestore Operations

### Test Read Operation:

```bash
cd backend
python3 << EOF
from firebase_config import initialize_firebase
from firestore_db import FirestoreDB

db = initialize_firebase()
firestore_db = FirestoreDB()

# Test collection reference
users_ref = firestore_db.db.collection('users')
print('✅ Firestore connection successful!')
EOF
```

### Test Write Operation (Optional - Creates Test Data):

```bash
cd backend
python3 << EOF
from firebase_config import initialize_firebase
from firestore_db import FirestoreDB
import asyncio

async def test_write():
    db = initialize_firebase()
    firestore_db = FirestoreDB()
    
    # Test write to a test collection
    test_data = {
        'test': True,
        'timestamp': '2025-01-06T00:00:00Z'
    }
    
    result = await firestore_db.insert_one('test_connection', test_data)
    print(f'✅ Write test successful! Document ID: {result.get("inserted_id")}')
    
    # Clean up
    await firestore_db.delete_one('test_connection', {'test': True})
    print('✅ Cleanup successful!')

asyncio.run(test_write())
EOF
```

---

## 🚀 Step 4: Test Production Deployment (Vercel)

### 4.1 Verify Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**
   - Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set
   - Check that it's enabled for **Production** environment

### 4.2 Trigger a Deployment

1. **Redeploy Application:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a commit to trigger automatic deployment

2. **Monitor Deployment Logs:**
   - Watch the build logs for any Firebase-related errors
   - Look for: "Firebase initialized successfully" or similar messages

### 4.3 Check Application Logs

1. **View Runtime Logs:**
   - Go to **Deployments** → Select deployment → **Functions** tab
   - Check for any Firebase connection errors
   - Look for successful initialization messages

2. **Test API Endpoints:**
   - Test endpoints that use Firebase:
     - User authentication (`/api/auth/login`)
     - User registration (`/api/auth/register`)
     - Data retrieval endpoints

---

## ✅ Step 5: Test Critical Features

### 5.1 Test User Authentication

```bash
# Test login endpoint
curl -X POST https://your-vercel-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'
```

**Expected:** Should return JWT token or appropriate error (not Firebase connection error)

### 5.2 Test User Registration

```bash
# Test registration endpoint
curl -X POST https://your-vercel-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"securepassword","username":"newuser","name":"New User"}'
```

**Expected:** Should create user in Firestore or return validation error (not Firebase connection error)

### 5.3 Test Data Retrieval

```bash
# Test data endpoint (requires authentication)
curl -X GET https://your-vercel-app.vercel.app/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Step 6: Verify in Firebase Console

1. **Check Firestore Database:**
   - Go to Firebase Console → **Firestore Database**
   - Verify data is being written correctly
   - Check for new documents after testing

2. **Check Authentication:**
   - Go to Firebase Console → **Authentication**
   - Verify users are being created (if using Firebase Auth)

3. **Check Usage:**
   - Go to Firebase Console → **Usage and billing**
   - Verify API calls are being made
   - Check for any unusual patterns

---

## 🚨 Troubleshooting

### Error: "Permission denied" or "Insufficient permissions"

**Solution:**
- Verify service account has required IAM roles in Google Cloud Console
- Check Firestore security rules allow the service account
- Ensure service account is enabled in Firebase Console

### Error: "Failed to initialize Firebase"

**Solution:**
- Verify JSON content is correctly formatted (valid JSON)
- Check that environment variable is set (not empty)
- Ensure no extra spaces or line breaks in JSON string (for Vercel)
- Verify `FIREBASE_PROJECT_ID` matches the project ID in the service account JSON

### Error: "Service account key not found"

**Solution:**
- Verify file path is correct: `backend/firebase-service-account.json`
- Check `.gitignore` isn't accidentally excluding the file
- For production, verify environment variable is set correctly in Vercel

### Error: "Invalid credentials"

**Solution:**
- Verify the service account key is valid and not expired
- Check that the key hasn't been deleted in Firebase Console
- Ensure you're using the correct project's service account key

### Error: "Network timeout" or "Connection refused"

**Solution:**
- Check network connectivity
- Verify firewall settings allow Firebase API access
- Check if you're behind a proxy that blocks Firebase

---

## 📊 Success Indicators

### ✅ Local Testing Success:
- Firebase initializes without errors
- Firestore connection established
- Can read/write to collections
- No permission errors

### ✅ Production Testing Success:
- Deployment completes successfully
- No Firebase errors in logs
- API endpoints respond correctly
- Data operations work as expected
- No authentication failures due to Firebase

---

## 🔄 Next Steps After Successful Test

1. **Monitor for 24-48 hours:**
   - Watch for any errors in production logs
   - Monitor Firebase usage patterns
   - Check for any authentication issues

2. **Delete Old Keys (if rotated):**
   - Only after confirming new keys work
   - See `FIREBASE_KEY_ROTATION_GUIDE.md` for details

3. **Update Documentation:**
   - Document the key rotation date
   - Update any team documentation
   - Note any changes in access patterns

---

## 📚 Related Documents

- `FIREBASE_KEY_ROTATION_GUIDE.md` - How to rotate keys
- `FIREBASE_ACCESS_AUDIT_GUIDE.md` - How to audit access logs
- `backend/test_firebase_connection.py` - Test script

---

## ✅ Quick Test Command

Run this single command to test everything:

```bash
cd backend && python3 test_firebase_connection.py && echo "✅ All tests passed!"
```

---

**Last Updated:** January 2025
