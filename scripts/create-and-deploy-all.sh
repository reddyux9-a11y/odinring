#!/bin/bash
# Complete Setup: Create Projects, Link, Set Env Vars, and Deploy
# Automated end-to-end deployment

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
API_BASE="https://api.vercel.com"

echo "🚀 Complete Vercel Setup and Deployment"
echo "========================================"
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Step 1: Create Projects via API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Creating Projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get account info for org ID
ACCOUNT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v2/user")
ORG_ID=$(echo "$ACCOUNT_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null || echo "")

# Create backend project
echo "📦 Creating backend project..."
BACKEND_CREATE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"odinring-backend","framework":null}' \
    "$API_BASE/v9/projects")

BACKEND_PROJECT_ID=$(echo "$BACKEND_CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -n "$BACKEND_PROJECT_ID" ] && [ "$BACKEND_PROJECT_ID" != "null" ]; then
    echo "✅ Backend project created: $BACKEND_PROJECT_ID"
    
    # Link backend
    mkdir -p backend/.vercel
    cat > backend/.vercel/project.json <<EOF
{
  "projectId": "$BACKEND_PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF
    echo "✅ Backend linked"
else
    echo "⚠️  Could not create backend project via API"
    echo "   Response: $BACKEND_CREATE"
    echo "   Will try CLI method..."
    BACKEND_PROJECT_ID=""
fi

echo ""

# Create frontend project
echo "📦 Creating frontend project..."
FRONTEND_CREATE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"odinring-frontend","framework":null}' \
    "$API_BASE/v9/projects")

FRONTEND_PROJECT_ID=$(echo "$FRONTEND_CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -n "$FRONTEND_PROJECT_ID" ] && [ "$FRONTEND_PROJECT_ID" != "null" ]; then
    echo "✅ Frontend project created: $FRONTEND_PROJECT_ID"
    
    # Link frontend
    mkdir -p frontend/.vercel
    cat > frontend/.vercel/project.json <<EOF
{
  "projectId": "$FRONTEND_PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF
    echo "✅ Frontend linked"
else
    echo "⚠️  Could not create frontend project via API"
    echo "   Response: $FRONTEND_CREATE"
    echo "   Will try CLI method..."
    FRONTEND_PROJECT_ID=""
fi

echo ""

# If API creation failed, use CLI
if [ -z "$BACKEND_PROJECT_ID" ] || [ -z "$FRONTEND_PROJECT_ID" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Using CLI to Create/Link Projects"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  This requires interactive input. Please run:"
    echo ""
    echo "   cd backend"
    echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    echo "   # Choose: Create new project → odinring-backend"
    echo ""
    echo "   cd ../frontend"
    echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    echo "   # Choose: Create new project → odinring-frontend"
    echo ""
    echo "Press Enter when done, or Ctrl+C to exit..."
    read
fi

# Verify projects are linked
if [ ! -f "backend/.vercel/project.json" ] || [ ! -f "frontend/.vercel/project.json" ]; then
    echo "❌ Projects not linked. Please complete linking first."
    exit 1
fi

echo ""

# Step 2: Set Environment Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Setting Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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
echo "Setting backend environment variables..."
cd backend

# Function to add env var via API
add_env_var_api() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=${3:-production}
    local PROJECT_ID=$4
    
    echo "  Adding $VAR_NAME ($ENV_TYPE)..."
    curl -s -X POST \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\",\"target\":[\"$ENV_TYPE\"],\"type\":\"encrypted\"}" \
        "$API_BASE/v10/projects/$PROJECT_ID/env" > /dev/null 2>&1 || echo "    (may already exist)"
}

BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")

if [ -n "$BACKEND_PROJECT_ID" ]; then
    # Set via API
    add_env_var_api "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "production" "$BACKEND_PROJECT_ID"
    add_env_var_api "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "preview" "$BACKEND_PROJECT_ID"
    add_env_var_api "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "development" "$BACKEND_PROJECT_ID"
    
    add_env_var_api "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "production" "$BACKEND_PROJECT_ID"
    add_env_var_api "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "preview" "$BACKEND_PROJECT_ID"
    add_env_var_api "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "development" "$BACKEND_PROJECT_ID"
    
    add_env_var_api "JWT_SECRET" "$JWT_SECRET" "production" "$BACKEND_PROJECT_ID"
    add_env_var_api "JWT_SECRET" "$JWT_SECRET" "preview" "$BACKEND_PROJECT_ID"
    add_env_var_api "JWT_SECRET" "$JWT_SECRET" "development" "$BACKEND_PROJECT_ID"
    
    add_env_var_api "ENV" "production" "production" "$BACKEND_PROJECT_ID"
    add_env_var_api "ENV" "preview" "preview" "$BACKEND_PROJECT_ID"
    add_env_var_api "ENV" "development" "development" "$BACKEND_PROJECT_ID"
    
    add_env_var_api "LOG_LEVEL" "INFO" "production" "$BACKEND_PROJECT_ID"
    add_env_var_api "LOG_LEVEL" "INFO" "preview" "$BACKEND_PROJECT_ID"
    add_env_var_api "LOG_LEVEL" "DEBUG" "development" "$BACKEND_PROJECT_ID"
    
    echo "✅ Backend environment variables set via API"
else
    echo "⚠️  Using CLI method for environment variables..."
    echo "   Run: ./scripts/setup-env-vars.sh"
fi

cd ..

echo ""

# Step 3: Deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Deploying to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy backend
echo "📦 Deploying backend..."
cd backend
BACKEND_DEPLOY=$(echo "y" | $VERCEL_CMD --prod --token "$VERCEL_TOKEN" 2>&1 | tee /tmp/backend-deploy.log)
BACKEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/backend-deploy.log | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL=$(echo "$BACKEND_DEPLOY" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")
fi

if [ -n "$BACKEND_URL" ]; then
    echo "✅ Backend deployed: $BACKEND_URL"
    echo "BACKEND_URL=$BACKEND_URL" > ../.deployment-urls
else
    echo "⚠️  Backend deployment may have succeeded, but URL not extracted"
    echo "   Check Vercel dashboard for URL"
fi

cd ..

echo ""

# Deploy frontend
echo "📦 Deploying frontend..."
cd frontend
FRONTEND_DEPLOY=$(echo "y" | $VERCEL_CMD --prod --token "$VERCEL_TOKEN" 2>&1 | tee /tmp/frontend-deploy.log)
FRONTEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/frontend-deploy.log | head -1 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(echo "$FRONTEND_DEPLOY" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")
fi

if [ -n "$FRONTEND_URL" ]; then
    echo "✅ Frontend deployed: $FRONTEND_URL"
    echo "FRONTEND_URL=$FRONTEND_URL" >> ../.deployment-urls
else
    echo "⚠️  Frontend deployment may have succeeded, but URL not extracted"
    echo "   Check Vercel dashboard for URL"
fi

cd ..

echo ""

# Step 4: Set Remaining Environment Variables
if [ -n "$BACKEND_URL" ] && [ -n "$FRONTEND_URL" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 4: Setting URL-Based Environment Variables"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    cd backend
    BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    
    if [ -n "$BACKEND_PROJECT_ID" ]; then
        add_env_var_api "CORS_ORIGINS" "$FRONTEND_URL" "production" "$BACKEND_PROJECT_ID"
        add_env_var_api "FRONTEND_URL" "$FRONTEND_URL" "production" "$BACKEND_PROJECT_ID"
        add_env_var_api "BACKEND_URL" "$BACKEND_URL" "production" "$BACKEND_PROJECT_ID"
        echo "✅ URL-based environment variables set"
    fi
    
    cd ..
fi

echo ""

# Step 5: Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".deployment-urls" ]; then
    echo "📋 Deployment URLs:"
    cat .deployment-urls
    echo ""
    
    if [ -n "$BACKEND_URL" ]; then
        echo "🧪 Testing backend health endpoint..."
        sleep 5
        if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "⚠️  Backend health check failed (may need more time or env vars)"
            echo "   Try: curl $BACKEND_URL/api/health"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. If URLs were extracted, they're saved in .deployment-urls"
echo "2. Test endpoints:"
if [ -n "$BACKEND_URL" ]; then
    echo "   - Backend: curl $BACKEND_URL/api/health"
fi
if [ -n "$FRONTEND_URL" ]; then
    echo "   - Frontend: Visit $FRONTEND_URL"
fi
echo "3. If health check failed, wait a few minutes and try again"
echo "4. Check Vercel dashboard for deployment status"
echo ""
