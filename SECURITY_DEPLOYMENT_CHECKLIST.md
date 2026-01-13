# Security Deployment Checklist

**Quick reference for security-critical steps during deployment**

---

## Pre-Deployment Security Checks

### 1. Verify No Secrets in Repository

```bash
# Check for committed secrets
cd /Users/sankarreddy/Desktop/odinring-main-2

# Search for common secret patterns
git grep -i "password\|secret\|key\|token" -- '*.py' '*.js' '*.json' | grep -v "node_modules" | grep -v ".git"

# Check for .env files in git
git ls-files | grep "\.env"

# Verify .gitignore
cat .gitignore | grep -E "\.env|service-account|secret|key"
```

**Expected:** No secrets should be found in tracked files

### 2. Verify Sensitive Files Are Ignored

```bash
# Check .gitignore includes:
cat .gitignore | grep -E "\.env|firebase-service-account|\.json"

# If missing, add to .gitignore:
echo "*.env" >> .gitignore
echo "firebase-service-account.json" >> .gitignore
echo "**/service-account*.json" >> .gitignore
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secret (minimum 32 characters)
openssl rand -base64 32

# Generate API key
openssl rand -hex 32

# Save securely (NOT in repository)
```

---

## Deployment Security Configuration

### 4. GitHub Secrets Security

**Never commit these to repository:**
- VERCEL_TOKEN
- FIREBASE_TOKEN
- JWT_SECRET
- FIREBASE_SERVICE_ACCOUNT_JSON
- Any API keys

**Verify secrets are in GitHub Secrets:**
```bash
# Go to: https://github.com/YOUR_USERNAME/odinring-main-2/settings/secrets/actions
# Verify all required secrets are present
```

### 5. Vercel Environment Variables Security

**Backend (Critical):**
```bash
# Required secure variables:
FIREBASE_SERVICE_ACCOUNT_JSON  # Full JSON as string
JWT_SECRET                      # Min 32 chars, use openssl rand -base64 32
CORS_ORIGINS                    # Only your domains, HTTPS only
```

**Frontend (Public - No Secrets):**
```bash
# Only public configuration:
REACT_APP_BACKEND_URL           # Public API URL
REACT_APP_FIREBASE_*            # Public Firebase config
# NO secrets here - they're exposed in browser!
```

### 6. CORS Configuration Security

```bash
# Backend CORS_ORIGINS should be:
# ✅ Good: https://odinring.com,https://www.odinring.com
# ❌ Bad: *
# ❌ Bad: http://localhost:3000 (in production)
# ❌ Bad: https://*
```

---

## Post-Deployment Security Verification

### 7. SSL/TLS Verification

```bash
# Check SSL certificate
openssl s_client -connect odinring.com:443 -servername odinring.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Verify HTTPS redirect
curl -I http://odinring.com | grep -i "location"

# Check certificate validity
curl -v https://odinring.com 2>&1 | grep -i "SSL\|certificate"
```

**Expected:**
- Valid certificate
- HTTPS redirect working
- No certificate errors

### 8. Security Headers Verification

```bash
# Check security headers
curl -I https://odinring.com | grep -iE "x-frame|x-content-type|strict-transport|content-security"

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

### 9. API Security Checks

```bash
# Test rate limiting
for i in {1..10}; do curl https://your-backend.vercel.app/api/status; done

# Test authentication required endpoints
curl https://your-backend.vercel.app/api/users/me
# Should return 401 Unauthorized without token

# Test CORS
curl -H "Origin: https://evil.com" https://your-backend.vercel.app/api/status
# Should reject or not include Access-Control-Allow-Origin
```

### 10. Environment Variable Exposure Check

```bash
# Frontend - check what's exposed
curl https://odinring.com | grep -o "REACT_APP_[A-Z_]*" | sort -u

# Backend - verify no secrets in logs
# Check Vercel function logs for any secret exposure
```

---

## Security Alerts & Warnings

### ⚠️ Critical Security Alerts

1. **Secrets in Code**
   - **Alert:** Any API keys, tokens, or secrets in source code
   - **Action:** Remove immediately, rotate secrets, use environment variables

2. **Weak JWT Secret**
   - **Alert:** JWT_SECRET less than 32 characters or predictable
   - **Action:** Generate new secret: `openssl rand -base64 32`

3. **CORS Misconfiguration**
   - **Alert:** CORS_ORIGINS contains `*` or untrusted domains
   - **Action:** Restrict to specific trusted domains only

4. **Missing HTTPS**
   - **Alert:** Site accessible via HTTP or SSL certificate invalid
   - **Action:** Configure SSL, enforce HTTPS redirect

5. **Exposed Environment Variables**
   - **Alert:** Secrets in frontend environment variables
   - **Action:** Move secrets to backend, use API calls

6. **No Rate Limiting**
   - **Alert:** Rate limiting disabled or too permissive
   - **Action:** Enable rate limiting, set appropriate limits

7. **Weak Authentication**
   - **Alert:** API endpoints don't require authentication
   - **Action:** Add authentication middleware to protected routes

8. **Missing Security Headers**
   - **Alert:** No security headers configured
   - **Action:** Add security headers (X-Frame-Options, CSP, etc.)

---

## Security Monitoring

### Daily Checks

```bash
# Check for failed authentication attempts
# Review Vercel logs for suspicious activity
# Monitor Sentry for security-related errors
```

### Weekly Checks

```bash
# Review environment variables
# Check SSL certificate expiration
# Audit access logs
# Review error rates
```

### Monthly Checks

```bash
# Rotate secrets (JWT_SECRET, API keys)
# Review and update dependencies
# Security audit
# Update security headers if needed
```

---

## Emergency Security Response

### If Secrets Are Exposed

```bash
# 1. Immediately rotate all exposed secrets
# 2. Update in Vercel environment variables
# 3. Update in GitHub Secrets
# 4. Redeploy applications
# 5. Review access logs for unauthorized access
# 6. Notify affected users if necessary
```

### If Domain Is Compromised

```bash
# 1. Change DNS records
# 2. Revoke SSL certificates
# 3. Review Vercel access logs
# 4. Check for unauthorized deployments
# 5. Review GitHub access
```

### If API Is Under Attack

```bash
# 1. Enable stricter rate limiting
# 2. Block suspicious IPs in Vercel
# 3. Review and tighten CORS
# 4. Enable DDoS protection (Vercel Pro)
# 5. Monitor error rates
```

---

## Security Best Practices

### ✅ DO

- Use environment variables for all secrets
- Generate strong, random secrets (32+ characters)
- Use HTTPS everywhere
- Enable rate limiting
- Configure CORS restrictively
- Add security headers
- Monitor error logs
- Rotate secrets regularly
- Use different secrets for staging/production
- Review dependencies for vulnerabilities

### ❌ DON'T

- Commit secrets to git
- Use weak or predictable secrets
- Expose secrets in frontend code
- Use wildcard CORS (`*`)
- Disable HTTPS
- Skip authentication on sensitive endpoints
- Log sensitive data
- Share secrets via insecure channels
- Use same secrets across environments
- Ignore security warnings

---

## Quick Security Commands

```bash
# Generate secure secret
openssl rand -base64 32

# Check SSL certificate
openssl s_client -connect odinring.com:443 < /dev/null

# Verify security headers
curl -I https://odinring.com | grep -i security

# Check for secrets in code
git grep -i "password\|secret\|key" -- '*.py' '*.js'

# Test rate limiting
ab -n 100 -c 10 https://your-backend.vercel.app/api/status

# Check DNS
dig odinring.com +short

# Verify HTTPS redirect
curl -I http://odinring.com
```

---

## Security Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Vercel Security:** https://vercel.com/docs/security
- **Firebase Security:** https://firebase.google.com/docs/rules
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/
- **Security Headers Test:** https://securityheaders.com

---

**Last Updated:** January 2025  
**Status:** Security Checklist  
**Review Frequency:** Before every deployment
