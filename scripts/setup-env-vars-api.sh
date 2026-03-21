#!/bin/bash
# Set Environment Variables in Vercel via API
# Uses API instead of CLI for better automation

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
API_BASE="https://api.vercel.com"

echo "⚙️  Setting Vercel Environment Variables (via API)"
echo "==================================================="
echo ""

# Generate JWT_SECRET
echo "🔐 Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Generated: $JWT_SECRET"
echo ""

# Firebase values
FIREBASE_PROJECT_ID="studio-7743041576-fc16f"
FIREBASE_SERVICE_ACCOUNT_JSON="${FIREBASE_SERVICE_ACCOUNT_JSON:-}"

# Set backend environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting Backend Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Backend project not linked!"
    echo "   Run: ./scripts/link-existing-projects.sh"
    cd ..
    exit 1
fi

BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")

if [ -z "$BACKEND_PROJECT_ID" ]; then
    echo "❌ Could not get backend project ID"
    cd ..
    exit 1
fi

echo "Backend Project ID: $BACKEND_PROJECT_ID"
echo ""

# Function to add env var via API
add_env_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=${3:-production}
    
    echo "  Adding $VAR_NAME ($ENV_TYPE)..."
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\",\"target\":[\"$ENV_TYPE\"],\"type\":\"encrypted\"}" \
        "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env")
    
    ERROR=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', {}).get('code', ''))" 2>/dev/null || echo "")
    
    if [ "$ERROR" = "conflict" ]; then
        echo "    (already exists, updating...)"
        # Get env var ID and update
        ENV_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
            "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env" | \
            python3 -c "
import sys, json
envs = json.load(sys.stdin).get('envs', [])
for e in envs:
    if e.get('key') == '$VAR_NAME' and '$ENV_TYPE' in e.get('target', []):
        print(e.get('id', ''))
        break
" 2>/dev/null || echo "")
        
        if [ -n "$ENV_ID" ]; then
            curl -s -X PATCH \
                -H "Authorization: Bearer $VERCEL_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{\"value\":\"$VAR_VALUE\"}" \
                "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env/$ENV_ID" > /dev/null
            echo "    ✅ Updated"
        fi
    elif [ -n "$ERROR" ]; then
        echo "    ⚠️  Error: $ERROR"
    else
        echo "    ✅ Set"
    fi
}

# Set all backend variables
add_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "production"
add_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "preview"
add_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "development"

add_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "production"
add_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "preview"
add_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "development"

add_env_var "JWT_SECRET" "$JWT_SECRET" "production"
add_env_var "JWT_SECRET" "$JWT_SECRET" "preview"
add_env_var "JWT_SECRET" "$JWT_SECRET" "development"

add_env_var "ENV" "production" "production"
add_env_var "ENV" "preview" "preview"
add_env_var "ENV" "development" "development"

add_env_var "LOG_LEVEL" "INFO" "production"
add_env_var "LOG_LEVEL" "INFO" "preview"
add_env_var "LOG_LEVEL" "DEBUG" "development"

echo ""
echo "⚠️  Note: CORS_ORIGINS, FRONTEND_URL, and BACKEND_URL will be set after deployment"
echo ""

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment Variables Set!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next: Deploy projects"
echo "   ./scripts/quick-deploy.sh both"
echo ""
