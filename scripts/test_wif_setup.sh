#!/bin/bash
#
# Verify Workload Identity Federation Setup
# This script validates that WIF is correctly configured
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WIF Setup Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Read config if available
if [ -f .wif_config.txt ]; then
    PROVIDER_NAME=$(sed -n '1p' .wif_config.txt)
    SERVICE_ACCOUNT_EMAIL=$(sed -n '2p' .wif_config.txt)
    PROJECT_ID=$(sed -n '3p' .wif_config.txt)
    echo -e "${GREEN}✅ Loaded configuration from .wif_config.txt${NC}"
else
    read -p "Enter your Firebase/GCP Project ID: " PROJECT_ID
    read -p "Enter WIF Provider resource name (or press Enter to auto-detect): " PROVIDER_NAME
    read -p "Enter Service Account email: " SERVICE_ACCOUNT_EMAIL
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: Project ID is required${NC}"
    exit 1
fi

# Auto-detect provider if not provided
if [ -z "$PROVIDER_NAME" ]; then
    echo "Auto-detecting WIF provider..."
    PROVIDER_NAME=$(gcloud iam workload-identity-pools providers list \
        --project="$PROJECT_ID" \
        --location="global" \
        --workload-identity-pool="github-actions-pool" \
        --format="value(name)" | head -1)
fi

if [ -z "$SERVICE_ACCOUNT_EMAIL" ]; then
    SERVICE_ACCOUNT_EMAIL="firestore-backup@${PROJECT_ID}.iam.gserviceaccount.com"
fi

echo ""
echo -e "${BLUE}Verifying Setup...${NC}"
echo ""

# Check 1: Verify WIF Pool exists
echo -e "${BLUE}1. Checking Workload Identity Pool...${NC}"
if gcloud iam workload-identity-pools describe "github-actions-pool" \
    --project="$PROJECT_ID" \
    --location="global" &>/dev/null; then
    echo -e "${GREEN}   ✅ Pool exists${NC}"
else
    echo -e "${RED}   ❌ Pool not found${NC}"
    exit 1
fi

# Check 2: Verify Provider exists
echo -e "${BLUE}2. Checking OIDC Provider...${NC}"
if gcloud iam workload-identity-pools providers describe "github-provider" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="github-actions-pool" &>/dev/null; then
    echo -e "${GREEN}   ✅ Provider exists${NC}"
    echo -e "   Provider: $PROVIDER_NAME"
else
    echo -e "${RED}   ❌ Provider not found${NC}"
    exit 1
fi

# Check 3: Verify Service Account exists
echo -e "${BLUE}3. Checking Service Account...${NC}"
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${GREEN}   ✅ Service account exists${NC}"
    echo -e "   Email: $SERVICE_ACCOUNT_EMAIL"
else
    echo -e "${RED}   ❌ Service account not found${NC}"
    exit 1
fi

# Check 4: Verify IAM roles
echo -e "${BLUE}4. Checking IAM Roles...${NC}"
ROLES=$(gcloud projects get-iam-policy "$PROJECT_ID" \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --format="value(bindings.role)" 2>/dev/null)

if echo "$ROLES" | grep -q "roles/datastore.importExportAdmin"; then
    echo -e "${GREEN}   ✅ datastore.importExportAdmin role granted${NC}"
else
    echo -e "${RED}   ❌ datastore.importExportAdmin role missing${NC}"
fi

if echo "$ROLES" | grep -q "roles/storage.admin"; then
    echo -e "${GREEN}   ✅ storage.admin role granted${NC}"
else
    echo -e "${RED}   ❌ storage.admin role missing${NC}"
fi

# Check 5: Verify WIF binding
echo -e "${BLUE}5. Checking WIF Binding...${NC}"
BINDINGS=$(gcloud iam service-accounts get-iam-policy "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --format="value(bindings.members)" 2>/dev/null)

if echo "$BINDINGS" | grep -q "principalSet://iam.googleapis.com"; then
    echo -e "${GREEN}   ✅ WIF binding exists${NC}"
    echo "$BINDINGS" | grep "principalSet" | while read -r binding; do
        echo -e "   Binding: $binding"
    done
else
    echo -e "${RED}   ❌ WIF binding not found${NC}"
fi

# Check 6: Verify GitHub Secrets (informational)
echo ""
echo -e "${BLUE}6. GitHub Secrets Checklist${NC}"
echo -e "${YELLOW}   ⚠️  Manual check required:${NC}"
echo "   [ ] WIF_PROVIDER = $PROVIDER_NAME"
echo "   [ ] WIF_SERVICE_ACCOUNT = $SERVICE_ACCOUNT_EMAIL"
echo "   [ ] FIREBASE_PROJECT_ID = $PROJECT_ID"
echo "   [ ] BACKUP_BUCKET_NAME (optional)"
echo "   [ ] JWT_SECRET (if not already set)"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Add GitHub secrets as listed above"
echo "2. Test the workflow in GitHub Actions"
echo "3. Remove old GCP_SA_KEY secret if it exists"
echo ""
