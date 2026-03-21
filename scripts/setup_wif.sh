#!/bin/bash
#
# Setup Workload Identity Federation for GitHub Actions
# This script automates the GCP setup for Firestore backup authentication
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Workload Identity Federation Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Warning: No active gcloud authentication found${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get project ID
echo -e "${BLUE}Step 1: Get GCP Project Information${NC}"
read -p "Enter your Firebase/GCP Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: Project ID is required${NC}"
    exit 1
fi

# Get project number
echo "Fetching project number..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)" 2>/dev/null)

if [ -z "$PROJECT_NUMBER" ]; then
    echo -e "${RED}❌ Error: Could not fetch project number. Check project ID and permissions.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project ID: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ Project Number: $PROJECT_NUMBER${NC}"
echo ""

# Get GitHub repository info
echo -e "${BLUE}Step 2: Get GitHub Repository Information${NC}"
read -p "Enter GitHub repository owner (e.g., reddyux9-a11y): " REPO_OWNER
read -p "Enter GitHub repository name (e.g., odin_ring_io): " REPO_NAME

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    echo -e "${RED}❌ Error: Repository owner and name are required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Repository: $REPO_OWNER/$REPO_NAME${NC}"
echo ""

# Set variables
WIF_POOL_ID="github-actions-pool"
WIF_PROVIDER_ID="github-provider"
SERVICE_ACCOUNT_NAME="firestore-backup"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if pool already exists
echo -e "${BLUE}Step 3: Check Existing Resources${NC}"
if gcloud iam workload-identity-pools describe "$WIF_POOL_ID" --project="$PROJECT_ID" --location="global" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Workload Identity Pool '$WIF_POOL_ID' already exists${NC}"
    read -p "Do you want to continue and update it? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
else
    echo -e "${GREEN}✅ Pool does not exist, will create new${NC}"
fi

# Enable required APIs
echo ""
echo -e "${BLUE}Step 4: Enable Required APIs${NC}"
echo "Enabling IAM Credentials API..."
gcloud services enable iamcredentials.googleapis.com --project="$PROJECT_ID" --quiet
echo -e "${GREEN}✅ APIs enabled${NC}"

# Create Workload Identity Pool
echo ""
echo -e "${BLUE}Step 5: Create Workload Identity Pool${NC}"
if ! gcloud iam workload-identity-pools describe "$WIF_POOL_ID" --project="$PROJECT_ID" --location="global" &>/dev/null; then
    echo "Creating Workload Identity Pool..."
    gcloud iam workload-identity-pools create "$WIF_POOL_ID" \
        --project="$PROJECT_ID" \
        --location="global" \
        --display-name="GitHub Actions Pool" \
        --quiet
    
    echo -e "${GREEN}✅ Workload Identity Pool created${NC}"
else
    echo -e "${YELLOW}⚠️  Pool already exists, skipping creation${NC}"
fi

# Create Workload Identity Provider
echo ""
echo -e "${BLUE}Step 6: Create OIDC Provider${NC}"
if ! gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$WIF_POOL_ID" &>/dev/null; then
    
    echo "Creating OIDC Provider..."
    gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER_ID" \
        --project="$PROJECT_ID" \
        --location="global" \
        --workload-identity-pool="$WIF_POOL_ID" \
        --display-name="GitHub Provider" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --quiet
    
    echo -e "${GREEN}✅ OIDC Provider created${NC}"
else
    echo -e "${YELLOW}⚠️  Provider already exists, skipping creation${NC}"
fi

# Create Service Account
echo ""
echo -e "${BLUE}Step 7: Create Service Account${NC}"
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    echo "Creating service account..."
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --project="$PROJECT_ID" \
        --display-name="Firestore Backup Service Account" \
        --description="Service account for automated Firestore backups" \
        --quiet
    
    echo -e "${GREEN}✅ Service account created${NC}"
else
    echo -e "${YELLOW}⚠️  Service account already exists, skipping creation${NC}"
fi

# Grant IAM roles to service account
echo ""
echo -e "${BLUE}Step 8: Grant IAM Permissions${NC}"
echo "Granting datastore.importExportAdmin role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/datastore.importExportAdmin" \
    --condition=None \
    --quiet || echo -e "${YELLOW}⚠️  Role may already be granted${NC}"

echo "Granting storage.admin role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.admin" \
    --condition=None \
    --quiet || echo -e "${YELLOW}⚠️  Role may already be granted${NC}"

echo -e "${GREEN}✅ IAM permissions granted${NC}"

# Bind Workload Identity Pool to Service Account
echo ""
echo -e "${BLUE}Step 9: Bind WIF to Service Account${NC}"
PROVIDER_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/providers/${WIF_PROVIDER_ID}"
PRINCIPAL_SET="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"

echo "Binding WIF provider to service account..."
gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="$PRINCIPAL_SET" \
    --quiet || echo -e "${YELLOW}⚠️  Binding may already exist${NC}"

echo -e "${GREEN}✅ WIF binding created${NC}"

# Get provider resource name
echo ""
echo -e "${BLUE}Step 10: Get Configuration Values${NC}"
PROVIDER_RESOURCE_NAME=$(gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$WIF_POOL_ID" \
    --format="value(name)")

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}GitHub Secrets to Add:${NC}"
echo ""
echo -e "${YELLOW}1. WIF_PROVIDER${NC}"
echo "   Value: $PROVIDER_RESOURCE_NAME"
echo ""
echo -e "${YELLOW}2. WIF_SERVICE_ACCOUNT${NC}"
echo "   Value: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo -e "${YELLOW}3. FIREBASE_PROJECT_ID${NC}"
echo "   Value: $PROJECT_ID"
echo ""
echo -e "${YELLOW}4. BACKUP_BUCKET_NAME (Optional)${NC}"
echo "   Value: ${PROJECT_ID}-firestore-backups"
echo "   (or leave empty to use default)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Add the secrets above to GitHub (Settings → Secrets → Actions)"
echo "2. Run: ./scripts/test_wif_setup.sh to verify"
echo "3. Test the workflow manually in GitHub Actions"
echo ""
echo -e "${GREEN}Provider Resource Name saved to: .wif_config.txt${NC}"
echo "$PROVIDER_RESOURCE_NAME" > .wif_config.txt
echo "$SERVICE_ACCOUNT_EMAIL" >> .wif_config.txt
echo "$PROJECT_ID" >> .wif_config.txt
