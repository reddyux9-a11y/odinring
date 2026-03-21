#!/bin/bash
# Set Environment Variables in Vercel
# Run this AFTER projects are linked

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

echo "⚙️  Setting Vercel Environment Variables"
echo "=========================================="
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Generate JWT_SECRET
echo "🔐 Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Generated: $JWT_SECRET"
echo ""

# Firebase values from screenshot
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
    echo "   Run: cd backend && $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    cd ..
    exit 1
fi

echo "Setting variables for backend (production)..."
echo ""

# Function to add env var
add_env_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=${3:-production}
    
    echo "  Adding $VAR_NAME ($ENV_TYPE)..."
    echo "$VAR_VALUE" | $VERCEL_CMD env add "$VAR_NAME" "$ENV_TYPE" --token "$VERCEL_TOKEN" --yes 2>&1 | grep -E "(Added|already exists|Error)" || echo "    ✅ Set"
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
echo "   (We need the deployment URLs first)"
echo ""

cd ..

echo ""
echo "✅ Backend environment variables set!"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy backend: cd backend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo "2. Deploy frontend: cd frontend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo "3. Get URLs from Vercel dashboard"
echo "4. Set remaining vars: CORS_ORIGINS, FRONTEND_URL, BACKEND_URL"
echo "5. Redeploy"
echo ""
