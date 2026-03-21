#!/bin/bash
#
# Setup script for pre-commit secret detection hook
#
# This script makes the pre-commit hook executable and verifies it's working.
#

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Setting up pre-commit secret detection hook...${NC}"

# Check if .git/hooks directory exists
if [ ! -d ".git/hooks" ]; then
    echo -e "${RED}❌ Error: .git/hooks directory not found.${NC}"
    echo -e "${YELLOW}This script must be run from the repository root.${NC}"
    exit 1
fi

# Check if pre-commit hook exists
if [ ! -f ".git/hooks/pre-commit" ]; then
    echo -e "${RED}❌ Error: .git/hooks/pre-commit not found.${NC}"
    echo -e "${YELLOW}The pre-commit hook should be at .git/hooks/pre-commit${NC}"
    exit 1
fi

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pre-commit hook is now executable${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not make pre-commit hook executable${NC}"
    echo -e "${YELLOW}You may need to run: chmod +x .git/hooks/pre-commit${NC}"
    exit 1
fi

# Verify hook is working
echo -e "${YELLOW}Testing pre-commit hook...${NC}"

# Check if hook contains expected patterns
if grep -q "BLOCKED" .git/hooks/pre-commit; then
    echo -e "${GREEN}✅ Pre-commit hook is properly configured${NC}"
else
    echo -e "${RED}❌ Warning: Pre-commit hook may not be properly configured${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Pre-commit secret detection hook is now active${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}What this means:${NC}"
echo -e "  • Commits will be automatically scanned for secrets"
echo -e "  • Commits containing secrets will be blocked"
echo -e "  • You'll see clear error messages if secrets are detected"
echo ""
echo -e "${YELLOW}To test:${NC}"
echo -e "  • Try staging a file with 'private_key' in it"
echo -e "  • The hook should block the commit"
echo ""
echo -e "${YELLOW}See SECURITY.md for complete security guidelines.${NC}"
echo ""
