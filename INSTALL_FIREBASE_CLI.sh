#!/bin/bash
# Install Firebase CLI
# This script installs Firebase CLI globally

set -e  # Exit on error

echo "🔥 Installing Firebase CLI"
echo "=========================="
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo ""
    echo "Please install Node.js and npm first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use: brew install node (on macOS)"
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Try to install Firebase CLI without sudo first
echo "Attempting to install Firebase CLI..."
if npm install -g firebase-tools 2>&1; then
    echo ""
    echo "✅ Firebase CLI installed successfully!"
    echo ""
    firebase --version
    echo ""
    echo "Next steps:"
    echo "1. Login to Firebase: firebase login"
    echo "2. Deploy indexes: firebase deploy --only firestore:indexes"
    exit 0
else
    echo ""
    echo "⚠️  Installation failed (may require sudo)"
    echo ""
    echo "Please run with sudo:"
    echo "  sudo npm install -g firebase-tools"
    echo ""
    echo "Or install manually in your terminal."
    exit 1
fi



