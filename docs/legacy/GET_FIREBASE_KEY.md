# How to Get Your Firebase Service Account Key

Follow these steps to download your Firebase service account key:

## Step 1: Go to Firebase Console

1. Open your browser and go to: https://console.firebase.google.com/
2. Select your project: **studio-7743041576-fc16f**

## Step 2: Navigate to Service Accounts

1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Click **Project settings**
3. Click the **Service accounts** tab at the top

## Step 3: Generate New Private Key

1. You'll see a section that says "Firebase Admin SDK"
2. Select **Python** as your admin SDK configuration snippet
3. Click the button **"Generate new private key"**
4. A dialog will pop up warning you about keeping this key secure
5. Click **"Generate key"**

## Step 4: Save the Key File

1. A JSON file will be downloaded automatically
2. The file will be named something like: `studio-7743041576-fc16f-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **Rename** this file to: `firebase-service-account.json`
4. **Move** this file to: `/Users/sankarreddy/Desktop/odinring-main-2/backend/firebase-service-account.json`

## Step 5: Verify File Location

Run this command to verify:
```bash
ls -la /Users/sankarreddy/Desktop/odinring-main-2/backend/firebase-service-account.json
```

You should see the file listed.

## Step 6: Security Note

⚠️ **IMPORTANT:** This key file gives full access to your Firebase project!

- ❌ **DO NOT** commit this file to Git
- ❌ **DO NOT** share this file publicly
- ✅ Keep it in the `backend/` directory
- ✅ It's already in `.gitignore`

## Quick Terminal Commands

Once you have the key file, you can verify it's valid JSON:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -c "import json; json.load(open('firebase-service-account.json'))" && echo "✅ Valid JSON file"
```

## Next Steps

After saving the key file:
1. Update `backend/.env` with Firebase configuration
2. Run the migration script to transfer data from MongoDB to Firestore
3. Restart the backend server

## Troubleshooting

**Can't find Service Accounts tab?**
- Make sure you're the project owner or have Editor permissions
- Try refreshing the Firebase Console

**Download didn't start?**
- Check your browser's download settings
- Try a different browser
- Check popup blockers

**Need help?**
Run the migration script with `--help` flag:
```bash
cd backend
python3 firebase_migration.py --help
```

