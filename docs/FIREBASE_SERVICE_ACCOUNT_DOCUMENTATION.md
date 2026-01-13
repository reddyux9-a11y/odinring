# Firebase Service Account File Documentation

**Date:** January 4, 2025  
**Status:** ✅ **ACTIVE**  
**Severity:** LOW (Informational)

---

## 📋 Active Service Account File

### Current Configuration

**Active File:** `backend/firebase-service-account.json`

**Configuration:**
- **Default Path:** `firebase-service-account.json` (relative to `backend/` directory)
- **Config Location:** `backend/config.py` (line 22)
- **Usage:** `backend/firebase_config.py` (line 95)

**File Details:**
- **Size:** ~2,413 bytes
- **Key ID:** `bfbee198e111b9c78f12ca8e36b7f545a0a19895`
- **Project ID:** `studio-7743041576-fc16f`
- **Service Account:** `firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com`

---

## ✅ Current Status

### Files in Repository

**Active File:**
- ✅ `backend/firebase-service-account.json` - **ACTIVE** (in use)

**Old Files (Removed):**
- ❌ `backend/studio-7743041576-fc16f-firebase-adminsdk-fbsvc-18d0fa3a78.json` - **REMOVED**
- ❌ `backend/studio-7743041576-fc16f-firebase-adminsdk-fbsvc-1ecec80abc.json` - **REMOVED**

**Status:** ✅ **CLEAN** - Only one service account file exists

---

## 🔧 Configuration

### Backend Configuration

**File:** `backend/config.py`

```python
FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
```

**Environment Variable Override:**
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

### Firebase Initialization

**File:** `backend/firebase_config.py`

```python
# Get service account path from environment or use default
service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
full_path = ROOT_DIR / service_account_path
```

---

## 🔒 Security

### File Protection

**`.gitignore` Patterns:**
```gitignore
# Firebase Service Account Files (CRITICAL: Contains private keys)
firebase-service-account.json
*firebase-adminsdk*.json
studio-*.json
*-firebase-adminsdk-*.json
```

**Status:** ✅ All Firebase service account files are excluded from git

### Key Rotation

**Current Key:**
- **Key ID:** `bfbee198e111b9c78f12ca8e36b7f545a0a19895`
- **Created:** January 4, 2025
- **Status:** ✅ Active

**Old Keys (Deleted):**
- `18d0fa3a786ab64aa105d553d074019e17538dd3` - Deleted
- `1ecec80abc...` - Deleted

---

## 📝 Usage

### How It's Used

1. **Backend Initialization:**
   - `backend/firebase_config.py` reads the service account file
   - Initializes Firebase Admin SDK
   - Creates Firestore client connection

2. **Configuration:**
   - Default path: `backend/firebase-service-account.json`
   - Can be overridden with `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable

3. **Validation:**
   - `backend/config.py` validates file exists on startup
   - Raises error if file is missing

---

## 🔄 Change Process

### If Service Account File Needs to be Updated:

1. **Download new key** from Firebase Console
2. **Replace** `backend/firebase-service-account.json` with new file
3. **Verify** key ID in new file
4. **Test** application initialization
5. **Delete old key** in Firebase Console
6. **Update this documentation** with new key ID

### If File Path Needs to Change:

1. **Update** `backend/config.py` - `FIREBASE_SERVICE_ACCOUNT_PATH`
2. **Or set** `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable
3. **Update** this documentation
4. **Test** application initialization

---

## ✅ Verification

### Check Active File

```bash
# Verify file exists
ls -la backend/firebase-service-account.json

# Check file contents (key ID)
python3 -c "import json; print(json.load(open('backend/firebase-service-account.json'))['private_key_id'])"
```

### Test Firebase Initialization

```bash
cd backend
python3 -c "from firebase_config import initialize_firebase; initialize_firebase(); print('✅ Firebase initialized')"
```

---

## 📊 Summary

**Current State:**
- ✅ **Single active file:** `backend/firebase-service-account.json`
- ✅ **Old duplicates removed:** No duplicate files exist
- ✅ **Configuration documented:** Clear which file is active
- ✅ **Security:** File is excluded from git

**Status:** ✅ **CLEAN** - No action required

---

**Last Updated:** January 4, 2025  
**Status:** ✅ **ACTIVE**



