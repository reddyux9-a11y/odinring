#!/bin/bash
# Update Vercel Token in All Scripts
# Usage: ./scripts/update-vercel-token.sh <new_token>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <new_vercel_token>"
    echo ""
    echo "Example:"
    echo "  $0 vck_abc123xyz789..."
    exit 1
fi

NEW_TOKEN="$1"
OLD_TOKEN="CytdA0p8Mj0pVsK1Pa1D28jQ"

echo "🔄 Updating Vercel Token"
echo "========================"
echo ""

# Find all files with old token
FILES=$(grep -r "$OLD_TOKEN" . --include="*.sh" --include="*.yml" --include="*.md" --include="*.json" 2>/dev/null | cut -d: -f1 | sort -u)

if [ -z "$FILES" ]; then
    echo "✅ No files found with old token"
    exit 0
fi

echo "Found files with old token:"
echo "$FILES" | sed 's/^/  - /'
echo ""

read -p "Replace token in these files? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled"
    exit 0
fi

# Replace token
for file in $FILES; do
    if [ -f "$file" ]; then
        # Use different sed syntax for macOS vs Linux
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|$OLD_TOKEN|$NEW_TOKEN|g" "$file"
        else
            sed -i "s|$OLD_TOKEN|$NEW_TOKEN|g" "$file"
        fi
        echo "✅ Updated: $file"
    fi
done

echo ""
echo "✅ Token updated in all files"
echo ""
echo "📋 Next: Test the new token:"
echo "  export VERCEL_TOKEN='$NEW_TOKEN'"
echo "  ./scripts/check-vercel-api-status.sh"
echo ""
