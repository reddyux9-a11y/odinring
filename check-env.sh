#!/bin/bash

# Check Frontend .env Configuration

echo "🔍 Checking Frontend .env Configuration..."
echo ""

if [ ! -f "frontend/.env" ]; then
    echo "❌ frontend/.env file not found!"
    echo ""
    echo "📝 Create it with:"
    echo "cat > frontend/.env << 'ENVFILE'"
    echo "REACT_APP_BACKEND_URL=http://localhost:8000"
    echo ""
    echo "# Firebase Configuration"
    echo "REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592ekWX1DHxCDD4IN8Pqz4cs"
    echo "REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com"
    echo "REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f"
    echo "REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app"
    echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948"
    echo "REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529"
    echo "ENVFILE"
    exit 1
fi

echo "✅ frontend/.env exists"
echo ""

# Check each required variable
check_var() {
    local var_name=$1
    if grep -q "^${var_name}=" frontend/.env; then
        local value=$(grep "^${var_name}=" frontend/.env | cut -d'=' -f2-)
        if [ -z "$value" ]; then
            echo "❌ $var_name is empty"
        else
            echo "✅ $var_name is set"
        fi
    else
        echo "❌ $var_name is missing"
    fi
}

echo "Checking Firebase configuration:"
check_var "REACT_APP_FIREBASE_API_KEY"
check_var "REACT_APP_FIREBASE_AUTH_DOMAIN"
check_var "REACT_APP_FIREBASE_PROJECT_ID"
check_var "REACT_APP_FIREBASE_STORAGE_BUCKET"
check_var "REACT_APP_FIREBASE_MESSAGING_SENDER_ID"
check_var "REACT_APP_FIREBASE_APP_ID"

echo ""
echo "Checking backend URL:"
check_var "REACT_APP_BACKEND_URL"

echo ""
echo "📖 Remember: Restart frontend server after changing .env"
echo "   ./restart-dev.sh"
