# OdinRing Threat Model (STRIDE)

**Last Updated:** 2025-01-02  
**Methodology:** STRIDE  
**Status:** Implemented

## Executive Summary

This document provides a comprehensive threat model for the OdinRing platform using the STRIDE methodology. OdinRing is an NFC ring-powered digital identity platform that enables users to share their digital profiles via physical NFC rings.

## Assets

### High-Value Assets

1. **User Identity Data**
   - Email addresses
   - Passwords (hashed)
   - Personal information (name, bio, profile images)
   - Authentication tokens (JWT, refresh tokens)

2. **NFC Ring Identifiers**
   - Ring IDs (RING_001 - RING_999)
   - Ring-to-user mappings
   - Ring status (active/revoked)

3. **User-Generated Content**
   - Links (URLs, titles, descriptions)
   - Merchant items (products, prices, inventory)
   - Media files (images, videos)

4. **Analytics Data**
   - Ring tap events
   - Profile views
   - Link clicks
   - User behavior patterns

5. **Administrative Access**
   - Admin credentials
   - System configuration
   - Database access

## Threat Actors

### 1. External Attackers
- **Motivation:** Data theft, service disruption, financial gain
- **Capabilities:** Network attacks, social engineering, malware
- **Resources:** Moderate to high

### 2. Malicious Users
- **Motivation:** Unauthorized access, data manipulation
- **Capabilities:** Account compromise, API abuse
- **Resources:** Low to moderate

### 3. Insider Threats
- **Motivation:** Data exfiltration, privilege escalation
- **Capabilities:** Legitimate access, knowledge of systems
- **Resources:** High

### 4. Competitors
- **Motivation:** Business intelligence, service disruption
- **Capabilities:** Competitive analysis, targeted attacks
- **Resources:** Moderate to high

## Trust Boundaries

### External Boundary
- **Internet** ↔ **OdinRing API** (FastAPI backend)
- **Internet** ↔ **Firebase/Firestore** (Database)
- **Mobile Devices** ↔ **NFC Ring** (Physical layer)

### Internal Boundaries
- **Frontend (React)** ↔ **Backend API**
- **Backend API** ↔ **Firestore Database**
- **Admin Panel** ↔ **Backend API**
- **NFC Scanner** ↔ **Backend API**

## STRIDE Threat Analysis

### S - Spoofing Identity

#### Threats
1. **NFC Ring UID Cloning**
   - **Risk:** HIGH
   - **Description:** Attacker clones NFC ring UID and impersonates legitimate user
   - **Mitigation:** 
     - Short-lived signed tokens for NFC scans
     - Timestamp validation (±30s window)
     - Nonce-based replay prevention
     - HMAC signature verification
     - Ring status checking (active/revoked)

2. **JWT Token Theft/Replay**
   - **Risk:** HIGH
   - **Description:** Stolen JWT tokens used to impersonate users
   - **Mitigation:**
     - Token expiration (short-lived access tokens)
     - Refresh token rotation
     - Session binding
     - Token revocation endpoint

3. **Admin Account Compromise**
   - **Risk:** CRITICAL
   - **Description:** Unauthorized admin access
   - **Mitigation:**
     - Strong password requirements
     - MFA (future enhancement)
     - Admin action audit logging
     - IP-based restrictions (future)

#### Current Controls
- ✅ JWT tokens with expiration
- ✅ Password hashing (bcrypt)
- ⚠️ No MFA
- ⚠️ No NFC signature validation (TO BE IMPLEMENTED)

### T - Tampering with Data

#### Threats
1. **Profile Data Manipulation**
   - **Risk:** MEDIUM
   - **Description:** Unauthorized modification of user profiles
   - **Mitigation:**
     - Ownership checks on all mutations
     - Firestore security rules
     - Input validation (Pydantic models)
     - Audit logging

2. **Ring Assignment Tampering**
   - **Risk:** HIGH
   - **Description:** Unauthorized ring reassignment
   - **Mitigation:**
     - Ownership verification
     - Admin-only bulk operations
     - Audit logging

3. **Analytics Data Manipulation**
   - **Risk:** MEDIUM
   - **Description:** Fake analytics events
   - **Mitigation:**
     - Rate limiting
     - Event validation
     - Immutable audit logs

#### Current Controls
- ✅ Firestore security rules
- ✅ Input validation
- ✅ Ownership checks
- ⚠️ Analytics events not cryptographically signed

### R - Repudiation

#### Threats
1. **Denial of Admin Actions**
   - **Risk:** MEDIUM
   - **Description:** Admins deny performing actions
   - **Mitigation:**
     - Immutable audit logs
     - Admin action logging
     - Timestamped records

2. **User Action Denial**
   - **Risk:** LOW
   - **Description:** Users deny performing actions
   - **Mitigation:**
     - Session tracking
     - IP address logging
     - User agent logging

#### Current Controls
- ✅ Audit logging implemented
- ⚠️ Log retention policy needs definition
- ⚠️ Log immutability not enforced at storage level

### I - Information Disclosure

#### Threats
1. **Secrets in Repository**
   - **Risk:** CRITICAL
   - **Description:** Firebase service account keys in codebase
   - **Mitigation:**
     - Environment variables
     - Secret management service
     - .gitignore enforcement
     - Key rotation

2. **Sensitive Data in Logs**
   - **Risk:** HIGH
   - **Description:** PII in console logs
   - **Mitigation:**
     - Structured logging
     - Log sanitization
     - Environment-based logging levels

3. **Public Profile Data Exposure**
   - **Risk:** LOW (by design)
   - **Description:** Public profiles intentionally accessible
   - **Mitigation:**
     - User consent
     - Privacy settings
     - Rate limiting

#### Current Controls
- ⚠️ Secrets in repository (CRITICAL - TO BE FIXED)
- ⚠️ Excessive console logging (419 occurrences)
- ✅ Firestore security rules for private data

### D - Denial of Service

#### Threats
1. **API Rate Limit Bypass**
   - **Risk:** MEDIUM
   - **Description:** Distributed attacks bypassing rate limits
   - **Mitigation:**
     - Redis-backed rate limiting
     - IP-based throttling
     - CAPTCHA for suspicious activity

2. **Database Query Overload**
   - **Risk:** MEDIUM
   - **Description:** Expensive queries causing slowdown
   - **Mitigation:**
     - Database indexes
     - Query optimization
     - Connection pooling

3. **NFC Scan Flooding**
   - **Risk:** HIGH
   - **Description:** Rapid-fire NFC scans overwhelming system
   - **Mitigation:**
     - Rate limiting on NFC endpoint
     - Nonce-based deduplication
     - Timestamp validation

#### Current Controls
- ✅ Rate limiting (slowapi)
- ⚠️ In-memory rate limiting (won't scale)
- ⚠️ No NFC-specific rate limiting

### E - Elevation of Privilege

#### Threats
1. **User-to-Admin Escalation**
   - **Risk:** CRITICAL
   - **Description:** Regular users gaining admin access
   - **Mitigation:**
     - RBAC (Role-Based Access Control)
     - Explicit permission checks
     - Admin-only endpoints

2. **Cross-Tenant Data Access**
   - **Risk:** HIGH
   - **Description:** Users accessing other users' data
   - **Mitigation:**
     - Ownership checks
     - Firestore security rules
     - Input validation

3. **Ring Hijacking**
   - **Risk:** HIGH
   - **Description:** Unauthorized ring assignment
   - **Mitigation:**
     - Ownership verification
     - Ring revocation capability
     - Audit logging

#### Current Controls
- ✅ Admin authentication
- ⚠️ Ambiguous "admin" logic (needs formalization)
- ✅ Ownership checks on most endpoints

## Risk Scoring Matrix

| Threat | Likelihood | Impact | Overall Risk | Priority |
|--------|-----------|--------|--------------|----------|
| NFC Ring UID Cloning | 4 | 5 | 9 | CRITICAL |
| Secrets in Repository | 3 | 5 | 8 | CRITICAL |
| JWT Token Theft | 3 | 4 | 7 | HIGH |
| Admin Account Compromise | 2 | 5 | 7 | HIGH |
| NFC Scan Flooding | 4 | 3 | 7 | HIGH |
| Cross-Tenant Data Access | 2 | 4 | 6 | MEDIUM |
| Profile Data Manipulation | 3 | 3 | 6 | MEDIUM |
| API Rate Limit Bypass | 3 | 3 | 6 | MEDIUM |
| Analytics Data Manipulation | 2 | 2 | 4 | LOW |

**Scoring:** Likelihood (1-5) × Impact (1-5) = Overall Risk (1-10)

## Mitigation Roadmap

### Immediate (Phase 1)
1. ✅ Remove secrets from repository
2. ✅ Fix diagnostic metadata
3. 🔄 Implement NFC security hardening
4. 🔄 Formalize RBAC

### Short-term (Phase 2)
1. Implement GDPR compliance layer
2. Add quantitative risk scoring
3. Enhance audit logging
4. Supply chain security hardening

### Long-term (Phase 3)
1. MFA implementation
2. Advanced threat detection
3. Security monitoring and alerting
4. Regular penetration testing

## Trust Assumptions

1. **Firebase/Firestore** is trusted for data storage
2. **HTTPS** is enforced in production
3. **JWT secret** is kept secure
4. **Admin credentials** are properly managed
5. **NFC hardware** cannot be easily cloned (physical security)

## Security Controls Summary

### Authentication
- ✅ JWT tokens with expiration
- ✅ Refresh token mechanism
- ✅ Password hashing (bcrypt)
- ⚠️ No MFA

### Authorization
- ✅ Firestore security rules
- ✅ Ownership checks
- ⚠️ RBAC needs formalization

### Data Protection
- ✅ Input validation (Pydantic)
- ✅ HTTPS (assumed)
- ⚠️ Secrets management needs improvement

### Monitoring
- ✅ Audit logging
- ⚠️ Log retention policy needed
- ⚠️ Security monitoring needed

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [STRIDE Methodology](https://en.wikipedia.org/wiki/STRIDE_(security))
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Document Owner:** Security Team  
**Review Frequency:** Quarterly  
**Next Review:** 2025-04-02


