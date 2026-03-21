#!/bin/bash
#
# Remove Old Service Account Keys and GitHub Secrets
# This script helps clean up old credentials after migrating to WIF
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Remove Old Credentials${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Get project ID
read -p "Enter your Firebase/GCP Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: Project ID is required${NC}"
    exit 1
fi

SERVICE_ACCOUNT_EMAIL="firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account exists
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Service account not found: $SERVICE_ACCOUNT_EMAIL${NC}"
    echo "This might be expected if you're using a different service account."
    read -p "Enter service account email (or press Enter to skip): " SERVICE_ACCOUNT_EMAIL
    if [ -z "$SERVICE_ACCOUNT_EMAIL" ]; then
        echo "Skipping service account key deletion..."
    fi
fi

# List and delete service account keys
if [ -n "$SERVICE_ACCOUNT_EMAIL" ]; then
    echo ""
    echo -e "${BLUE}Step 1: List Service Account Keys${NC}"
    KEYS=$(gcloud iam service-accounts keys list \
        --iam-account="$SERVICE_ACCOUNT_EMAIL" \
        --project="$PROJECT_ID" \
        --format="value(name)" 2>/dev/null || echo "")
    
    if [ -z "$KEYS" ]; then
        echo -e "${GREEN}✅ No service account keys found${NC}"
    else
        echo "Found the following keys:"
        echo "$KEYS"
        echo ""
        read -p "Do you want to delete these keys? (y/N): " DELETE_KEYS
        
        if [[ "$DELETE_KEYS" =~ ^[Yy]$ ]]; then
            echo "$KEYS" | while read -r key_name; do
                if [ -n "$key_name" ]; then
                    KEY_ID=$(basename "$key_name")
                    echo "Deleting key: $KEY_ID"
                    gcloud iam service-accounts keys delete "$KEY_ID" \
                        --iam-account="$SERVICE_ACCOUNT_EMAIL" \
                        --project="$PROJECT_ID" \
                        --quiet || echo -e "${YELLOW}⚠️  Failed to delete key: $KEY_ID${NC}"
                fi
            done
            echo -e "${GREEN}✅ Service account keys deleted${NC}"
        else
            echo "Skipping key deletion..."
        fi
    fi
fi

# GitHub Secrets removal instructions
echo ""
echo -e "${BLUE}Step 2: Remove GitHub Secret${NC}"
echo -e "${YELLOW}⚠️  Manual action required:${NC}"
echo ""
echo "To remove the old GCP_SA_KEY secret from GitHub:"
echo ""
echo "1. Go to: https://github.com/$(git remote get-url origin 2>/dev/null | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)\.git.*/\1/' || echo 'OWNER/REPO')/settings/secrets/actions"
echo "2. Find the secret named: GCP_SA_KEY"
echo "3. Click on it and select 'Delete'"
echo "4. Confirm deletion"
echo ""
echo -e "${GREEN}✅ Old credentials cleanup complete!${NC}"
echo ""
echo -e "${BLUE}Reminder:${NC}"
echo "- Service account keys have been deleted (if any existed)"
echo "- Remove GCP_SA_KEY from GitHub Secrets manually"
echo "- Verify WIF is working before removing the old secret"
echo ""
