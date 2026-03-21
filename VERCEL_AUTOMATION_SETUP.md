# 🤖 Vercel Automation Setup Guide

**Your Vercel API Token:** `CytdA0p8Mj0pVsK1Pa1D28jQ`

This guide shows you how to use your Vercel token for automated deployments.

---

## 🔐 **SECURITY FIRST**

### **⚠️ CRITICAL: Protect Your Token**

1. **Never commit tokens to git:**
   ```bash
   # Add to .gitignore
   echo ".vercelrc" >> .gitignore
   echo ".vercel/" >> .gitignore
   ```

2. **Use environment variables:**
   ```bash
   export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
   ```

3. **Store securely:**
   - Use password manager
   - Use shell profile (with proper permissions)
   - Use CI/CD secrets (GitHub Actions, etc.)

---

## 🚀 **METHOD 1: Quick Deployment Script**

### **Setup:**

1. **Add token to your environment:**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
   
   # Reload shell
   source ~/.zshrc  # or source ~/.bash_profile
   ```

2. **Make script executable:**
   ```bash
   chmod +x scripts/deploy-to-vercel.sh
   ```

3. **Run deployment:**
   ```bash
   ./scripts/deploy-to-vercel.sh
   ```

### **What it does:**
- ✅ Checks for Vercel CLI
- ✅ Authenticates with your token
- ✅ Deploys backend to Vercel
- ✅ Deploys frontend to Vercel
- ✅ Supports production and preview deployments

---

## 🚀 **METHOD 2: Direct Vercel CLI**

### **One-time setup:**

```bash
# Login with token
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
npx vercel@latest login --token "$VERCEL_TOKEN"
```

### **Deploy commands:**

```bash
# Deploy backend
cd backend
npx vercel@latest --prod --token "$VERCEL_TOKEN"

# Deploy frontend
cd ../frontend
npx vercel@latest --prod --token "$VERCEL_TOKEN"
```

---

## 🚀 **METHOD 3: GitHub Actions (CI/CD)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm i -g vercel
      
      - name: Deploy Backend
        working-directory: ./backend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          vercel --prod --token "$VERCEL_TOKEN" --yes
      
      - name: Deploy Frontend
        working-directory: ./frontend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          vercel --prod --token "$VERCEL_TOKEN" --yes
```

### **Setup GitHub Secret:**

1. Go to GitHub → Your Repo → Settings → Secrets → Actions
2. Click "New repository secret"
3. Name: `VERCEL_TOKEN`
4. Value: `CytdA0p8Mj0pVsK1Pa1D28jQ`
5. Click "Add secret"

---

## 🚀 **METHOD 4: Using .vercelrc (Local Development)**

### **Setup:**

1. **Create `.vercelrc` file:**
   ```bash
   cat > .vercelrc << EOF
   {
     "token": "CytdA0p8Mj0pVsK1Pa1D28jQ"
   }
   EOF
   ```

2. **Add to .gitignore:**
   ```bash
   echo ".vercelrc" >> .gitignore
   ```

3. **Deploy:**
   ```bash
   cd backend
   npx vercel@latest --prod
   ```

**Note:** `.vercelrc` is automatically read by Vercel CLI.

---

## 📋 **Quick Reference Commands**

### **Deploy Backend:**
```bash
cd backend
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
npx vercel@latest --prod --token "$VERCEL_TOKEN"
```

### **Deploy Frontend:**
```bash
cd frontend
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
npx vercel@latest --prod --token "$VERCEL_TOKEN"
```

### **Deploy Both:**
```bash
./scripts/deploy-to-vercel.sh
```

### **Check Deployment Status:**
```bash
npx vercel@latest ls --token "$VERCEL_TOKEN"
```

### **View Logs:**
```bash
npx vercel@latest logs [deployment-url] --token "$VERCEL_TOKEN"
```

---

## 🔒 **Security Best Practices**

### **✅ DO:**
- Store token in environment variables
- Use GitHub Secrets for CI/CD
- Add `.vercelrc` to `.gitignore`
- Rotate token if exposed
- Use different tokens for different environments

### **❌ DON'T:**
- Commit tokens to git
- Share tokens in chat/email
- Use same token for multiple projects
- Store tokens in code files
- Leave tokens in public repositories

---

## 🧪 **Testing Your Setup**

### **1. Verify Token Works:**
```bash
export VERCEL_TOKEN='CytdA0p8Mj0pVsK1Pa1D28jQ'
npx vercel@latest whoami --token "$VERCEL_TOKEN"
```

Should show your Vercel username/email.

### **2. Test Deployment:**
```bash
cd backend
npx vercel@latest --token "$VERCEL_TOKEN"
```

Should deploy successfully.

---

## 📝 **Environment Variables Setup**

After deployment, ensure environment variables are set:

```bash
# Set environment variables
npx vercel@latest env add FIREBASE_PROJECT_ID production --token "$VERCEL_TOKEN"
npx vercel@latest env add FIREBASE_SERVICE_ACCOUNT_JSON production --token "$VERCEL_TOKEN"
# ... etc
```

Or use the setup script:
```bash
./scripts/setup-vercel-env-npx.sh
```

---

## 🎯 **Recommended Workflow**

1. **Development:**
   - Use local `.vercelrc` (not committed)
   - Deploy to preview: `vercel` (no --prod)

2. **Production:**
   - Use environment variable: `export VERCEL_TOKEN=...`
   - Deploy: `vercel --prod --token "$VERCEL_TOKEN"`

3. **CI/CD:**
   - Use GitHub Secrets
   - Automated on push to main

---

## 🚨 **If Token is Compromised**

1. **Revoke immediately:**
   - Go to Vercel Dashboard → Settings → Tokens
   - Delete the compromised token

2. **Generate new token:**
   - Create new token in Vercel dashboard
   - Update all scripts/configurations

3. **Check for unauthorized deployments:**
   - Review deployment history
   - Check for unexpected changes

---

## 📚 **Additional Resources**

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel API Tokens](https://vercel.com/docs/accounts/tokens)
- [GitHub Actions with Vercel](https://vercel.com/docs/integrations/github)

---

**Your token is ready to use! Follow the security best practices above.**
