# Terminal Commands Reference

**Copy-paste ready commands for OdinRing deployment**

---

## Phase 1: Local Repository → GitHub

### Initial Setup

```bash
# Navigate to project
cd /Users/sankarreddy/Desktop/odinring-main-2

# Check git status
git status

# Check current branch
git branch

# Verify no secrets in tracked files
git ls-files | grep -E '\.env|service-account|secret'
```

### Security Check Before Commit

```bash
# Remove any accidentally tracked sensitive files
git rm --cached backend/.env 2>/dev/null || true
git rm --cached frontend/.env 2>/dev/null || true
git rm --cached backend/firebase-service-account.json 2>/dev/null || true

# Verify .gitignore
cat .gitignore | grep -E '\.env|service-account'
```

### Commit and Push

```bash
# Stage changes
git add .

# Review what will be committed
git status

# Commit
git commit -m "chore: prepare for production deployment"

# Push to GitHub
git push origin main

# If first time, set upstream:
# git push -u origin main
```

---

## Phase 2: Vercel Setup

### Install and Login

```bash
# Install Vercel CLI
npm install -g vercel

# Verify installation
vercel --version

# Login to Vercel
vercel login
```

### Deploy Backend

```bash
# Navigate to backend
cd backend

# Deploy to production
vercel --prod

# Follow prompts (first time only):
# - Set up and deploy? Yes
# - Which scope? [Select your account]
# - Link to existing project? No
# - Project name? odinring-backend
# - Directory? ./
# - Override settings? No

# Save the deployment URL shown (e.g., https://odinring-backend.vercel.app)
```

### Deploy Frontend

```bash
# Navigate to frontend
cd ../frontend

# Deploy to production
vercel --prod

# Follow prompts (first time only):
# - Set up and deploy? Yes
# - Which scope? [Select your account]
# - Link to existing project? No
# - Project name? odinring-frontend
# - Directory? ./
# - Override settings? No

# Save the deployment URL shown (e.g., https://odinring-frontend.vercel.app)
```

### Set Environment Variables (CLI Method)

```bash
# Backend variables
cd backend

# Set individual variables
vercel env add FIREBASE_PROJECT_ID production
vercel env add JWT_SECRET production
vercel env add CORS_ORIGINS production
# ... (enter values when prompted)

# Or use Vercel Dashboard (recommended for first time)
# https://vercel.com/dashboard → Project → Settings → Environment Variables
```

---

## Phase 3: Firebase Setup

### Get Firebase Token

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and get CI token
firebase login:ci

# Copy the token that appears - save it for GitHub Secrets
```

### Deploy Firestore Indexes

```bash
# From project root
cd /Users/sankarreddy/Desktop/odinring-main-2

# Deploy indexes
firebase deploy --only firestore:indexes --project YOUR_PROJECT_ID

# Deploy security rules
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

---

## Phase 4: Domain Configuration

### Check DNS Propagation

```bash
# Check A record
dig odinring.com +short

# Check CNAME record
dig www.odinring.com +short

# Check all records
dig odinring.com ANY +short
```

### Verify SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect odinring.com:443 -servername odinring.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Test HTTPS
curl -I https://odinring.com

# Test HTTP redirect
curl -I http://odinring.com | grep -i location
```

---

## Phase 5: Security Verification

### Check Security Headers

```bash
# Check all security headers
curl -I https://odinring.com | grep -iE "x-frame|x-content-type|strict-transport|content-security"

# Detailed check
curl -v https://odinring.com 2>&1 | grep -i "x-frame\|x-content-type\|strict-transport"
```

### Test API Security

```bash
# Test health endpoint
curl https://your-backend.vercel.app/api/status

# Test authentication required
curl https://your-backend.vercel.app/api/users/me
# Should return 401

# Test CORS
curl -H "Origin: https://evil.com" -H "Access-Control-Request-Method: GET" \
  -X OPTIONS https://your-backend.vercel.app/api/status -v
```

### Check for Exposed Secrets

```bash
# Check frontend for exposed secrets
curl https://odinring.com | grep -o "REACT_APP_[A-Z_]*" | sort -u

# Check git history for secrets (if needed)
git log -p --all -S "password" -- '*.py' '*.js'
```

---

## Phase 6: Generate Secure Secrets

### Generate JWT Secret

```bash
# Generate secure JWT secret (32+ characters)
openssl rand -base64 32

# Save output - use for JWT_SECRET environment variable
```

### Generate API Key

```bash
# Generate API key
openssl rand -hex 32

# Save output securely
```

---

## Phase 7: Monitoring & Maintenance

### View Vercel Deployments

```bash
# List all deployments
vercel ls

# View specific deployment
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]
```

### Redeploy

```bash
# Redeploy backend
cd backend
vercel --prod

# Redeploy frontend
cd frontend
vercel --prod
```

### Check Deployment Status

```bash
# Check GitHub Actions workflow
gh run list --workflow=deploy-production.yml

# View workflow logs
gh run view [run-id] --log
```

---

## Quick Troubleshooting Commands

### Check Environment Variables

```bash
# Vercel CLI - list environment variables
vercel env ls

# Check specific variable
vercel env pull .env.local
cat .env.local | grep VARIABLE_NAME
```

### Test Local Build

```bash
# Test backend locally
cd backend
python3 -m uvicorn server:app --reload

# Test frontend locally
cd frontend
npm start
```

### Check Git Status

```bash
# See what changed
git status

# See detailed diff
git diff

# See commit history
git log --oneline -10
```

### Verify Configuration Files

```bash
# Check vercel.json
cat backend/vercel.json
cat frontend/vercel.json

# Check firebase.json
cat firebase.json

# Check .gitignore
cat .gitignore
```

---

## One-Liner Commands

### Complete Security Check

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2 && \
git ls-files | grep -E '\.env|service-account' && \
echo "⚠️ Sensitive files found!" || echo "✅ No sensitive files tracked"
```

### Quick Deployment

```bash
git add . && git commit -m "deploy" && git push origin main
```

### Test All Endpoints

```bash
curl https://odinring.com && \
curl https://your-backend.vercel.app/api/status && \
echo "✅ All endpoints responding"
```

### Generate All Secrets

```bash
echo "JWT_SECRET: $(openssl rand -base64 32)" && \
echo "API_KEY: $(openssl rand -hex 32)"
```

---

## Environment-Specific Commands

### Development

```bash
# Start backend
cd backend && python3 -m uvicorn server:app --reload

# Start frontend
cd frontend && npm start
```

### Staging

```bash
# Deploy to preview
vercel

# Get preview URL
vercel inspect
```

### Production

```bash
# Deploy to production
vercel --prod

# Or via GitHub (automatic on push to main)
git push origin main
```

---

## Useful Aliases (Optional)

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# OdinRing deployment aliases
alias odin-deploy='cd /Users/sankarreddy/Desktop/odinring-main-2 && git add . && git commit -m "deploy" && git push origin main'
alias odin-backend='cd /Users/sankarreddy/Desktop/odinring-main-2/backend && vercel --prod'
alias odin-frontend='cd /Users/sankarreddy/Desktop/odinring-main-2/frontend && vercel --prod'
alias odin-status='curl https://odinring.com && curl https://your-backend.vercel.app/api/status'
alias odin-secret='openssl rand -base64 32'
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

---

## Command Reference by Task

### Git Operations
```bash
git status          # Check status
git add .           # Stage all
git commit -m "msg"  # Commit
git push origin main # Push
```

### Vercel Operations
```bash
vercel login        # Login
vercel --prod       # Deploy production
vercel ls           # List deployments
vercel logs         # View logs
```

### Firebase Operations
```bash
firebase login:ci                    # Get CI token
firebase deploy --only firestore:indexes  # Deploy indexes
firebase deploy --only firestore:rules    # Deploy rules
```

### Security Checks
```bash
openssl rand -base64 32              # Generate secret
curl -I https://odinring.com          # Check HTTPS
dig odinring.com +short               # Check DNS
```

---

**Last Updated:** January 2025  
**Quick Reference:** Copy-paste commands for deployment
