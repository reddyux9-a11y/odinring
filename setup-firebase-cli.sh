#!/bin/bash

# Firebase CLI Setup and Configuration Script
# This script installs Firebase CLI and configures authorized domains

echo "🔥 Firebase CLI Setup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Check if Firebase CLI is already installed
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI is already installed: $(firebase --version)"
    echo ""
else
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
    
    if [ $? -eq 0 ]; then
        echo "✅ Firebase CLI installed successfully!"
        echo ""
    else
        echo "❌ Failed to install Firebase CLI"
        echo "   Try running: sudo npm install -g firebase-tools"
        exit 1
    fi
fi

# Login to Firebase
echo "🔐 Logging in to Firebase..."
echo "   A browser window will open for authentication"
echo ""
firebase login --no-localhost

if [ $? -ne 0 ]; then
    echo "❌ Firebase login failed"
    exit 1
fi

echo ""
echo "✅ Firebase login successful!"
echo ""

# Check if .env file exists
if [ ! -f "frontend/.env" ]; then
    echo "❌ frontend/.env file not found"
    echo "   Please create it with your Firebase configuration"
    exit 1
fi

# Extract project ID from .env
PROJECT_ID=$(grep REACT_APP_FIREBASE_PROJECT_ID frontend/.env | cut -d '=' -f2 | tr -d ' "'"'"'')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not find REACT_APP_FIREBASE_PROJECT_ID in frontend/.env"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"
echo ""

# Use Firebase CLI to check current project
echo "🔧 Setting Firebase project..."
firebase use $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ Failed to set Firebase project"
    echo "   Make sure the project ID is correct"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Firebase CLI Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Run: firebase auth:export auth-config.json"
echo "   2. Or manually add 'localhost' to authorized domains:"
echo "      → https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings"
echo "      → Click 'Authorized domains' → Add 'localhost'"
echo ""
echo "🔗 Useful Commands:"
echo "   firebase projects:list          - List all your projects"
echo "   firebase auth:export FILE        - Export auth configuration"
echo "   firebase open auth               - Open Auth console in browser"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


