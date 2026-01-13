# 🔒 How to Find and Delete Old Keys in Firebase Console

**Date:** January 4, 2025  
**Purpose:** Step-by-step guide to delete old Firebase service account keys

---

## 📋 Quick Summary

- **Old Key IDs to Delete:**
  - `18d0fa3a786ab64aa105d553d074019e17538dd3`
  - `1ecec80abc...` (check for other old keys)

- **New Key ID to Keep:**
  - `bfbee198e111b9c78f12ca8e36b7f545a0a19895`

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Firebase Console

**Direct Link:**
```
https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/serviceaccounts/adminsdk
```

**Or Navigate Manually:**
1. Go to: https://console.firebase.google.com/
2. Select your project: **studio-7743041576-fc16f**
3. Click the **⚙️ Settings** icon (gear icon) in the top left
4. Select **Project Settings**
5. Click on the **Service Accounts** tab

---

### Step 2: Locate Service Account Keys

You should see:
- **Service Account Email:** `firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com`
- **Key Management Section:** Below the service account email

**What You'll See:**
- A list of service account keys (if multiple exist)
- Or a button to "Generate New Private Key" (if only one exists)
- Each key has a unique **Key ID**

---

### Step 3: Identify Old Keys

**How to Identify Old Keys:**

1. **If you see a list of keys:**
   - Each key will have a **Key ID** (looks like: `bfbee198e111b9c78f12ca8e36b7f545a0a19895`)
   - Compare with the old key IDs listed below

2. **Old Key IDs to DELETE:**
   - ✅ DELETE: `18d0fa3a786ab64aa105d553d074019e17538dd3`
   - ✅ DELETE: `1ecec80abc...` (any key matching old private_key_ids)

3. **New Key ID to KEEP:**
   - ✅ KEEP: `bfbee198e111b9c78f12ca8e36b7f545a0a19895`

---

### Step 4: Download Current Keys List (Optional but Recommended)

**Before deleting, you may want to download the current key file as backup:**

1. Click **"Generate New Private Key"** button (if it exists)
2. Save the JSON file temporarily
3. Check the `private_key_id` in the file
4. If it matches the new key ID (`bfbee198e111b9c7...`), you're good
5. If not, this might be an old key

---

### Step 5: Delete Old Keys

**Method 1: If you see a list of keys with delete buttons:**

1. Find keys matching old key IDs:
   - `18d0fa3a786ab64aa105d553d074019e17538dd3`
   - `1ecec80abc...`

2. Click the **Delete** button (🗑️ or "Delete" link) next to each old key

3. Confirm the deletion

**Method 2: If keys are managed in Google Cloud Console:**

Firebase service accounts are also managed in Google Cloud Console. You may need to:

1. Click the link: **"Manage in Google Cloud Console"** (if available)
2. Or go directly to:
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=studio-7743041576-fc16f
   ```
3. Find the service account: `firebase-adminsdk-fbsvc@studio-7743041576-fc16f.iam.gserviceaccount.com`
4. Click on the service account
5. Go to the **"Keys"** tab
6. Find keys with old key IDs
7. Click the **Delete** icon (🗑️) next to old keys
8. Confirm deletion

---

### Step 6: Verify New Key is Active

**After deleting old keys:**

1. **Option A: Check in Firebase Console**
   - Return to Firebase Console Service Accounts page
   - Verify only the new key exists (or download new key to verify)

2. **Option B: Download New Key and Verify**
   - Click **"Generate New Private Key"** (if button exists)
   - Download the JSON file
   - Open the file and check `private_key_id`
   - Should match: `bfbee198e111b9c78f12ca8e36b7f545a0a19895`
   - If it matches, you're using the correct key

3. **Option C: Test Application**
   ```bash
   cd backend
   python3 -c "from firebase_config import initialize_firebase; initialize_firebase(); print('✅ Firebase initialized')"
   ```
   - If it works, the key is valid

---

## 📸 Visual Guide (What to Look For)

### In Firebase Console:

```
┌─────────────────────────────────────────────────────────┐
│  Firebase Console - Service Accounts                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Service Account Email:                                 │
│  firebase-adminsdk-fbsvc@studio-7743041576-fc16f...    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Key ID: bfbee198e111b9c7...  [KEEP] ✅          │   │
│  │ Created: Jan 4, 2025                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Key ID: 18d0fa3a786ab64a...  [DELETE] ❌        │   │
│  │ Created: Dec 22, 2024                           │   │
│  │ [🗑️ Delete]                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Key ID: 1ecec80abc...  [DELETE] ❌              │   │
│  │ Created: Dec 21, 2024                           │   │
│  │ [🗑️ Delete]                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Generate New Private Key]                             │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### Before Deleting:

1. **Make sure your application is using the new key**
   - Check: `backend/firebase-service-account.json`
   - Verify `private_key_id` matches: `bfbee198e111b9c7...`

2. **Backup Current Key** (if needed)
   - Download the key file before deleting old ones
   - Store in secure location (password manager, encrypted drive)

3. **Test Application First**
   - Make sure application works with new key
   - Then delete old keys

### After Deleting:

1. **Old keys are immediately invalid**
   - Cannot be used to access Firebase
   - Any applications using old keys will fail
   - This is why we replaced the file first

2. **Verify Application Still Works**
   - Test that Firebase connection works
   - Check application functionality

---

## 🔍 Troubleshooting

### Problem: "I don't see a list of keys"

**Solution:**
- Firebase Console may only show the active key
- Old keys might only be visible in Google Cloud Console
- Try: https://console.cloud.google.com/iam-admin/serviceaccounts?project=studio-7743041576-fc16f

### Problem: "I see multiple keys, but don't know which to delete"

**Solution:**
- Compare key IDs with the old key IDs listed above
- Delete keys with these IDs:
  - `18d0fa3a786ab64aa105d553d074019e17538dd3`
  - Any key created before Jan 4, 2025 (if you see creation dates)
  - Keep the key matching: `bfbee198e111b9c78f12ca8e36b7f545a0a19895`

### Problem: "The key ID format looks different"

**Solution:**
- Key IDs in Firebase Console might be shortened (first 16 characters)
- Compare the first part: `bfbee198e111b9c7` (new) vs `18d0fa3a786ab64a` (old)
- Or download the key file and check the full `private_key_id`

### Problem: "I can't find the delete button"

**Solution:**
- Some Firebase Console views don't show delete buttons directly
- Use Google Cloud Console instead:
  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=studio-7743041576-fc16f
  2. Click on the service account
  3. Go to "Keys" tab
  4. Delete old keys there

---

## ✅ Completion Checklist

After completing this guide:

- [ ] Opened Firebase Console Service Accounts page
- [ ] Located service account keys
- [ ] Identified old keys (matching old key IDs)
- [ ] Deleted old keys
- [ ] Verified new key is active (matches: `bfbee198e111b9c7...`)
- [ ] Tested application (Firebase connection works)
- [ ] Confirmed old keys are deleted

---

## 🔗 Quick Links

- **Firebase Console Service Accounts:**
  https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/serviceaccounts/adminsdk

- **Google Cloud Console Service Accounts:**
  https://console.cloud.google.com/iam-admin/serviceaccounts?project=studio-7743041576-fc16f

- **Firebase Console Home:**
  https://console.firebase.google.com/project/studio-7743041576-fc16f

---

## 📞 Need Help?

If you encounter issues:
- Check Firebase documentation: https://firebase.google.com/docs/admin/setup
- Google Cloud IAM docs: https://cloud.google.com/iam/docs/service-accounts
- Firebase Support: https://firebase.google.com/support

---

**Last Updated:** January 4, 2025  
**Status:** Ready to use



