#!/bin/bash
# Fix npm permissions for global package installation

echo "🔧 Fixing npm permissions..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "Current npm configuration:"
npm config get prefix
echo ""

# Option 1: Change npm's default directory (Recommended)
echo "📝 Option 1: Change npm's default directory (Recommended)"
echo "   This creates a directory in your home folder for global packages"
echo ""

# Create directory for global packages
mkdir -p ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to PATH (if not already there)
if ! grep -q '~/.npm-global/bin' ~/.zshrc 2>/dev/null; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
    echo "✅ Added to ~/.zshrc"
fi

if ! grep -q '~/.npm-global/bin' ~/.bash_profile 2>/dev/null; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
    echo "✅ Added to ~/.bash_profile"
fi

echo ""
echo "✅ npm permissions fixed!"
echo ""
echo "📋 Next steps:"
echo "1. Reload your shell: source ~/.zshrc (or source ~/.bash_profile)"
echo "2. Install Vercel CLI: npm install -g vercel"
echo ""
echo "💡 Alternative: You can also use npx without installing globally:"
echo "   npx vercel@latest [command]"
