# 🔧 Fix Vercel API Permissions

**Issue:** API token doesn't have permission to create projects  
**Error:** `{"error":{"code":"forbidden","message":"You don't have permission to create the project."}}`

---

## 🔍 **Understanding the Problem**

The current token (`CytdA0p8Mj0pVsK1Pa1D28jQ`) can:
- ✅ Authenticate
- ✅ Read projects
- ✅ Read deployments
- ❌ **Cannot create projects** (missing permission)

---

## ✅ **Solution 1: Create New Token with Full Permissions**

### **Step 1: Generate New Token**

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. **Name:** `OdinRing Full Access`
4. **Scope:** Select **"Full Account"** (not just "Read Only")
5. **Expiration:** Choose your preference (or "No expiration")
6. Click **"Create"**
7. **Copy the token immediately** (you won't see it again)

### **Step 2: Update Scripts**

Replace the token in your scripts:

```bash
# Old token (limited permissions)
VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'

# New token (full permissions)
VERCEL_TOKEN='vck_YOUR_NEW_TOKEN_HERE'
```

### **Step 3: Update Environment Variable**

```bash
export VERCEL_TOKEN='vck_YOUR_NEW_TOKEN_HERE'
```

---

## ✅ **Solution 2: Use CLI with Existing Token**

The CLI might have different permissions. Use this approach:

### **Create Projects via CLI:**

```bash
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'

# Link backend (creates project if needed)
cd backend
npx vercel@latest link --token "$VERCEL_TOKEN"
# When prompted:
#   1. Select "Create new project"
#   2. Name: odinring-backend
#   3. Press Enter for defaults

# Link frontend
cd ../frontend
npx vercel@latest link --token "$VERCEL_TOKEN"
# When prompted:
#   1. Select "Create new project"
#   2. Name: odinring-frontend
#   3. Press Enter for defaults
```

---

## ✅ **Solution 3: Check Team/Organization Permissions**

If you're part of a team, you might need team-level permissions:

### **Check Current Account Type:**

```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v2/user | python3 -m json.tool
```

Look for:
- `user.team` - If null, you're on a personal account
- `user.username` - Your account name

### **If You Need Team Permissions:**

1. Go to [Vercel Teams](https://vercel.com/teams)
2. Check if you're a member of a team
3. Create token at team level: `https://vercel.com/teams/YOUR_TEAM/settings/tokens`
4. Select team scope when creating token

---

## 🔧 **Solution 4: Update Script to Handle Permissions**

Here's a script that tries API first, falls back to CLI:

```bash
#!/bin/bash
# Smart project creation - tries API, falls back to CLI

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

create_project_smart() {
    local PROJECT_NAME=$1
    local PROJECT_DIR=$2
    
    echo "📦 Creating $PROJECT_NAME..."
    
    # Try API first
    CREATE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$PROJECT_NAME\"}" \
        "https://api.vercel.com/v9/projects")
    
    ERROR_CODE=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', {}).get('code', ''))" 2>/dev/null || echo "")
    
    if [ "$ERROR_CODE" = "forbidden" ]; then
        echo "⚠️  API permission denied - using CLI method"
        echo ""
        echo "Please run manually:"
        echo "  cd $PROJECT_DIR"
        echo "  npx vercel@latest link --token \"$VERCEL_TOKEN\""
        echo "  # Choose: Create new project → $PROJECT_NAME"
        return 1
    else
        PROJECT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
        if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
            echo "✅ Project created via API: $PROJECT_ID"
            return 0
        fi
    fi
    
    return 1
}

# Usage
create_project_smart "odinring-backend" "backend"
create_project_smart "odinring-frontend" "frontend"
```

---

## 📋 **Quick Fix: Update Token in All Scripts**

If you get a new token, update these files:

```bash
# Files to update:
grep -r "CytdA0p8Mj0pVsK1Pa1D28jQ" scripts/
grep -r "CytdA0p8Mj0pVsK1Pa1D28jQ" .github/
```

Or use this one-liner to replace:

```bash
# Replace old token with new token
find . -type f -name "*.sh" -o -name "*.yml" -o -name "*.md" | \
  xargs sed -i '' 's/CytdA0p8Mj0pVsK1Pa1D28jQ/vck_YOUR_NEW_TOKEN/g'
```

---

## 🎯 **Recommended Approach**

**For immediate deployment:**

1. **Use CLI method** (works with current token):
   ```bash
   cd backend && npx vercel@latest link --token "$VERCEL_TOKEN"
   cd ../frontend && npx vercel@latest link --token "$VERCEL_TOKEN"
   ```

2. **Then run setup script:**
   ```bash
   ./scripts/setup-env-vars.sh
   ./scripts/quick-deploy.sh both
   ```

**For automation (long-term):**

1. Create new token with "Full Account" scope
2. Update all scripts with new token
3. Use API-based automation

---

## 🔐 **Security Note**

- **Full Account tokens** have complete access - store securely
- Use **environment variables** instead of hardcoding
- Consider **team tokens** for organization projects
- Rotate tokens periodically

---

## ✅ **Verification**

After getting new token, test:

```bash
export VERCEL_TOKEN='vck_YOUR_NEW_TOKEN'

# Test project creation
curl -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-project"}' \
  https://api.vercel.com/v9/projects

# Should return project JSON (not forbidden error)
```

---

**Status:** Ready to apply  
**Priority:** Use CLI method now, upgrade token later for automation
