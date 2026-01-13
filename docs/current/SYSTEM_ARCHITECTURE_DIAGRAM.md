# OdinRing System Architecture Diagram

**Version:** 2.0  
**Date:** December 25, 2025  
**Status:** Current Production Architecture

---

## 🏗️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ODINRING ECOSYSTEM                              │
│                    NFC Bio Link Platform - Full Stack                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐              ┌──────▼───────┐
            │   FRONTEND     │◄────HTTPS────┤   BACKEND    │
            │  React SPA     │              │   FastAPI    │
            │  (Port 3000)   │              │  (Port 8000) │
            └────────────────┘              └──────────────┘
                    │                               │
        ┌───────────┼───────────┐          ┌───────┼────────┐
        │           │           │          │       │        │
   ┌────▼─────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼──┐ ┌──▼───┐ ┌─▼────┐
   │Firebase  │ │Radix  │ │ Axios  │ │Firestore│ │Auth │ │Sentry│
   │  Auth    │ │  UI   │ │ Client │ │   DB    │ │Utils│ │ SDK  │
   └──────────┘ └───────┘ └────────┘ └─────────┘ └─────┘ └──────┘
```

---

## 📦 Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND (SPA)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ROUTING LAYER (React Router)               │    │
│  │  /          → Landing                                   │    │
│  │  /login     → AuthPage                                  │    │
│  │  /dashboard → Dashboard (Protected)                     │    │
│  │  /profile   → Profile (Public)                          │    │
│  │  /admin     → AdminDashboard (Protected)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             STATE MANAGEMENT LAYER                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │ AuthContext  │  │ ThemeContext │                   │    │
│  │  │ - user       │  │ - theme      │                   │    │
│  │  │ - loading    │  │ - accent     │                   │    │
│  │  │ - login()    │  │ - toggle()   │                   │    │
│  │  └──────────────┘  └──────────────┘                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               PAGE COMPONENTS (7)                       │    │
│  │  Landing | AuthPage | Dashboard | Profile              │    │
│  │  AdminDashboard | AdminLogin | Install                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            FEATURE COMPONENTS (30+)                     │    │
│  │  LinkManager | AnalyticsView | ProfileSettings         │    │
│  │  QRCodes | SecuritySettings | CustomBranding           │    │
│  │  SmartScheduling | AIInsights | TemplatesHub           │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              UI COMPONENTS (68)                         │    │
│  │  Button | Card | Dialog | Input | Toast | Tabs         │    │
│  │  (Radix UI + shadcn/ui)                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                API CLIENT LAYER                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  axios instance (lib/api.js)                     │  │    │
│  │  │  - Request interceptor (add JWT)                 │  │    │
│  │  │  - Response interceptor (handle 401)             │  │    │
│  │  │  - Base URL: /api                                │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              EXTERNAL SERVICES                          │    │
│  │  Firebase Auth (OAuth) | Sentry (Monitoring)            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (API)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE LAYER                           │    │
│  │  CORSMiddleware → RateLimiter → RequestLogger          │    │
│  │  ContextGuard (Phase 2) → SecurityHeaders              │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ROUTING LAYER (62+ endpoints)              │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  /api/auth/*         Authentication (7)          │  │    │
│  │  │  /api/me/*           User Profile (8)            │  │    │
│  │  │  /api/links/*        Link Management (6)         │  │    │
│  │  │  /api/analytics/*    Analytics (4)               │  │    │
│  │  │  /api/qr/*           QR Codes (4)                │  │    │
│  │  │  /api/appointments/* Scheduling (5)              │  │    │
│  │  │  /api/admin/*        Admin Panel (10+)           │  │    │
│  │  │  /api/onboarding/*   Account Setup (2) [Phase 2] │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           AUTHENTICATION & AUTHORIZATION                │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  JWT Verification → Session Validation           │  │    │
│  │  │  Role Check (user/admin)                         │  │    │
│  │  │  Depends: get_current_user                       │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              SERVICE LAYER (Business Logic)             │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  Phase 1 Services:                               │  │    │
│  │  │  - SessionManager     (session_utils.py)         │  │    │
│  │  │  - RefreshTokenMgr    (refresh_token_utils.py)   │  │    │
│  │  │  - AuditLogger        (audit_log_utils.py)       │  │    │
│  │  │                                                   │  │    │
│  │  │  Phase 2 Services:                               │  │    │
│  │  │  - IdentityResolver   (services/)                │  │    │
│  │  │  - SubscriptionService (services/)               │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              DATA ACCESS LAYER                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  FirestoreDB wrapper (firestore_db.py)           │  │    │
│  │  │  - CRUD operations                                │  │    │
│  │  │  - Query helpers                                  │  │    │
│  │  │  - Transaction support                            │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 FIRESTORE DATABASE                      │    │
│  │  19 Collections (see Database Schema below)             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture (Firestore)

```
┌───────────────────────────────────────────────────────────────┐
│                  FIRESTORE DATABASE SCHEMA                     │
│                      odinringdb (19 Collections)               │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  CORE COLLECTIONS (Phase 0 - Original)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  users              User profiles & settings            │  │
│  │  ├── email, username, name, password                    │  │
│  │  ├── ring_id, profile_photo, theme                      │  │
│  │  └── profile_views, total_clicks                        │  │
│  │                                                          │  │
│  │  links              User links & content                │  │
│  │  ├── user_id [INDEXED]                                  │  │
│  │  ├── title, url, icon, order                            │  │
│  │  └── clicks, is_active, schedule                        │  │
│  │                                                          │  │
│  │  rings              NFC ring inventory                  │  │
│  │  ├── ring_id, assigned_user                             │  │
│  │  └── status, activation_date                            │  │
│  │                                                          │  │
│  │  analytics          Page view tracking                  │  │
│  │  ├── user_id [INDEXED]                                  │  │
│  │  ├── timestamp, ip_address                              │  │
│  │  └── user_agent, referrer                               │  │
│  │                                                          │  │
│  │  ring_analytics     Ring tap events                     │  │
│  │  qr_scans           QR code scans                       │  │
│  │  appointments       Scheduling data                     │  │
│  │  availability       Time slots                          │  │
│  │  admins             Admin accounts                      │  │
│  │  status_checks      System health                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  PHASE 1 COLLECTIONS (Security & Compliance)                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  sessions           Active user sessions                │  │
│  │  ├── user_id [INDEXED]                                  │  │
│  │  ├── session_id, token                                  │  │
│  │  ├── ip_address, user_agent                             │  │
│  │  ├── created_at, expires_at                             │  │
│  │  └── is_active, last_activity                           │  │
│  │                                                          │  │
│  │  refresh_tokens     Refresh token store                 │  │
│  │  ├── user_id [INDEXED]                                  │  │
│  │  ├── token_hash                                         │  │
│  │  ├── session_id, family_id                              │  │
│  │  ├── created_at, expires_at                             │  │
│  │  └── is_revoked, revoked_at                             │  │
│  │                                                          │  │
│  │  audit_logs         Comprehensive audit trail           │  │
│  │  ├── actor_id [INDEXED]                                 │  │
│  │  ├── action, entity_type, entity_id                     │  │
│  │  ├── timestamp [INDEXED]                                │  │
│  │  ├── ip_address, user_agent                             │  │
│  │  └── metadata (JSON)                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  PHASE 2 COLLECTIONS (Identity & Subscriptions)               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  businesses         Solo business profiles              │  │
│  │  ├── owner_id [INDEXED]                                 │  │
│  │  ├── business_name, business_email                      │  │
│  │  ├── industry, description                              │  │
│  │  └── created_at, updated_at                             │  │
│  │                                                          │  │
│  │  organizations      Organization profiles               │  │
│  │  ├── owner_id [INDEXED]                                 │  │
│  │  ├── organization_name, max_members                     │  │
│  │  └── created_at, updated_at                             │  │
│  │                                                          │  │
│  │  departments        Org departments                     │  │
│  │  ├── organization_id [INDEXED]                          │  │
│  │  ├── department_name                                    │  │
│  │  └── created_at, updated_at                             │  │
│  │                                                          │  │
│  │  memberships        Organization memberships            │  │
│  │  ├── user_id [INDEXED]                                  │  │
│  │  ├── organization_id [INDEXED]                          │  │
│  │  ├── department_id                                      │  │
│  │  ├── role (owner|admin|member)                          │  │
│  │  └── created_at, updated_at                             │  │
│  │                                                          │  │
│  │  subscriptions      Subscription state                  │  │
│  │  ├── owner_id [INDEXED]                                 │  │
│  │  ├── owner_type (personal|business|org)                 │  │
│  │  ├── plan (personal|solo|org)                           │  │
│  │  ├── status (active|trial|expired|none)                 │  │
│  │  ├── billing_cycle, trial_end_date                      │  │
│  │  ├── stripe_customer_id, stripe_subscription_id         │  │
│  │  └── created_at, updated_at                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagrams

### 1. Authentication Flow (Phase 1 Enhanced)

```
┌─────────┐                                              ┌─────────┐
│ Browser │                                              │  Server │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │ 1. POST /api/auth/login                               │
     │    { email, password }                                │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                                            2. Validate │
     │                                               password │
     │                                                  (bcrypt)
     │                                                        │
     │                                         3. Create session
     │                                            ┌──────────┐│
     │                                            │ sessions ││
     │                                            └──────────┘│
     │                                                        │
     │                                      4. Generate tokens
     │                                         - Access (15m) │
     │                                         - Refresh (7d) │
     │                                                        │
     │                                    5. Store refresh token
     │                                            ┌────────────┐
     │                                            │refresh_    │
     │                                            │  tokens    │
     │                                            └────────────┘
     │                                                        │
     │                                          6. Log event   │
     │                                            ┌──────────┐│
     │                                            │audit_logs││
     │                                            └──────────┘│
     │                                                        │
     │ 7. { access_token, refresh_token, user }              │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
     │ 8. Store tokens in localStorage                       │
     │    - token: access_token                              │
     │    - refresh_token: refresh_token                     │
     │                                                        │
     │ 9. GET /api/me                                         │
     │    Authorization: Bearer <access_token>               │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                                  10. Verify JWT        │
     │                                  11. Validate session  │
     │                                      ┌──────────┐     │
     │                                      │ sessions │     │
     │                                      └──────────┘     │
     │                                                        │
     │ 12. { user: {...} }                                   │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
```

### 2. Token Refresh Flow (Phase 1)

```
┌─────────┐                                              ┌─────────┐
│ Browser │                                              │  Server │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │ 1. GET /api/me                                         │
     │    Authorization: Bearer <expired_token>              │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                                   2. Verify JWT → FAIL│
     │                                      (token expired)   │
     │                                                        │
     │ 3. 401 Unauthorized                                   │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
     │ 4. Axios interceptor detects 401                      │
     │                                                        │
     │ 5. POST /api/auth/refresh                             │
     │    { refresh_token }                                  │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                                6. Verify refresh token │
     │                                   ┌────────────┐      │
     │                                   │refresh_    │      │
     │                                   │  tokens    │      │
     │                                   └────────────┘      │
     │                                                        │
     │                                7. Generate new tokens  │
     │                                   - New access token   │
     │                                   - New refresh token  │
     │                                     (rotation)         │
     │                                                        │
     │                                8. Revoke old refresh   │
     │                                   ┌────────────┐      │
     │                                   │refresh_    │      │
     │                                   │  tokens    │      │
     │                                   └────────────┘      │
     │                                                        │
     │ 9. { access_token, refresh_token }                    │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
     │ 10. Store new tokens                                  │
     │                                                        │
     │ 11. Retry original request                            │
     │     GET /api/me                                        │
     │     Authorization: Bearer <new_token>                 │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │ 12. { user: {...} }                                   │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
```

### 3. Identity Resolution Flow (Phase 2)

```
┌─────────┐                                              ┌─────────┐
│Dashboard│                                              │  Server │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │ 1. GET /api/me/context                                 │
     │    Authorization: Bearer <token>                      │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                                   2. Verify JWT & session
     │                                      ┌──────────┐     │
     │                                      │ sessions │     │
     │                                      └──────────┘     │
     │                                                        │
     │                                3. Get user profile     │
     │                                      ┌──────────┐     │
     │                                      │  users   │     │
     │                                      └──────────┘     │
     │                                                        │
     │                                4. Check business      │
     │                                      ┌───────────┐    │
     │                                      │businesses │    │
     │                                      └───────────┘    │
     │                                                        │
     │                                5. Check organization   │
     │                                      ┌──────────────┐ │
     │                                      │organizations │ │
     │                                      └──────────────┘ │
     │                                                        │
     │                                6. Check membership     │
     │                                      ┌────────────┐   │
     │                                      │memberships │   │
     │                                      └────────────┘   │
     │                                                        │
     │                                7. Get subscription     │
     │                                      ┌──────────────┐ │
     │                                      │subscriptions │ │
     │                                      └──────────────┘ │
     │                                                        │
     │                                8. Determine account_type
     │                                   - If owns business → business_solo
     │                                   - If owns/member org → organization
     │                                   - Default → personal │
     │                                                        │
     │                                9. Check subscription   │
     │                                   - active → /dashboard│
     │                                   - expired → /billing │
     │                                   - trial → /dashboard │
     │                                                        │
     │ 10. IdentityContext                                   │
     │     {                                                  │
     │       account_type: "personal",                       │
     │       subscription: { status: "trial" },              │
     │       next_route: "/dashboard"                        │
     │     }                                                  │
     │◄──────────────────────────────────────────────────────┤
     │                                                        │
     │ 11. Navigate to next_route                            │
     │     Render appropriate dashboard                      │
     │                                                        │
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER 1: Network Security                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • HTTPS/TLS enforcement                               │    │
│  │  • CORS configuration (allowed origins)                │    │
│  │  • Rate limiting (slowapi)                             │    │
│  │    - 5/min for auth endpoints                          │    │
│  │    - 10/min for sensitive operations                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 2: Authentication                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • JWT tokens (RS256 or HS256)                         │    │
│  │    - Access token: 15 minutes                          │    │
│  │    - Refresh token: 7 days                             │    │
│  │  • bcrypt password hashing (cost=12)                   │    │
│  │  • Firebase Auth integration (OAuth)                   │    │
│  │  • Session binding (JWT ↔ session_id)                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 3: Session Management                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Active session tracking (sessions collection)       │    │
│  │  • Session validation on every request                 │    │
│  │  • Automatic expiration (aligned with JWT)             │    │
│  │  • Manual invalidation on logout                       │    │
│  │  • IP & User-Agent tracking                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 4: Authorization                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Role-based access control (user/admin)              │    │
│  │  • Resource ownership validation                       │    │
│  │  • FastAPI Depends() for reusable guards               │    │
│  │  • Organization membership checks (Phase 2)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 5: Audit & Compliance                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Comprehensive audit logging                         │    │
│  │    - Login/logout events                               │    │
│  │    - CRUD operations (links, rings, etc.)              │    │
│  │    - Admin actions                                     │    │
│  │  • GDPR data export (/users/export)                    │    │
│  │  • Metadata capture (IP, timestamp, user agent)        │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 6: Token Security (Phase 1)                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Refresh token rotation (prevents replay)            │    │
│  │  • Token family tracking (detects theft)               │    │
│  │  • Token hashing before storage                        │    │
│  │  • Revocation mechanism                                │    │
│  │  • Reuse detection                                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ▼                                    │
│  LAYER 7: Data Security                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Firebase security rules                             │    │
│  │  • Input validation (Pydantic models)                  │    │
│  │  • SQL injection prevention (Firestore NoSQL)          │    │
│  │  • XSS protection (React auto-escaping)                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TOPOLOGY                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (Vercel)                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Domain: odinring.com                                    │  │
│  │  ├── Static hosting                                      │  │
│  │  ├── Edge CDN (global)                                   │  │
│  │  ├── Automatic HTTPS                                     │  │
│  │  └── Environment variables                               │  │
│  │      • REACT_APP_BACKEND_URL                             │  │
│  │      • REACT_APP_FIREBASE_*                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │ HTTPS                            │
│                              ▼                                  │
│  BACKEND (Vercel Serverless or Render)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Domain: api.odinring.com                                │  │
│  │  ├── Serverless Functions (Vercel)                       │  │
│  │  │   OR                                                   │  │
│  │  ├── Container Deployment (Render)                       │  │
│  │  ├── Auto-scaling                                         │  │
│  │  ├── Environment variables                               │  │
│  │  │   • DATABASE_URL                                      │  │
│  │  │   • JWT_SECRET                                        │  │
│  │  │   • FIREBASE_CREDENTIALS                              │  │
│  │  └── Monitoring (Sentry)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │                                  │
│                              ▼                                  │
│  DATABASE (Firebase/GCP)                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Firestore Database                                      │  │
│  │  ├── Multi-region replication                            │  │
│  │  ├── Automatic backups                                   │  │
│  │  ├── Security rules                                      │  │
│  │  └── Indexes (composite queries)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │                                  │
│                              ▼                                  │
│  EXTERNAL SERVICES                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Firebase Auth     OAuth provider                        │  │
│  │  Sentry            Error tracking & monitoring           │  │
│  │  Stripe            Payment processing (future)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       TESTING PYRAMID                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          ┌──────┐                              │
│                          │  E2E │  Playwright                  │
│                          │Tests │  (1 file)                    │
│                          └──────┘                              │
│                        ┌──────────┐                            │
│                        │Integration│  pytest                   │
│                        │   Tests   │  (1 file)                 │
│                        └──────────┘                            │
│                    ┌──────────────────┐                        │
│                    │   Unit Tests     │  pytest + Jest         │
│                    │   (Backend +     │  (2 backend files)     │
│                    │    Frontend)     │  (1 frontend file)     │
│                    └──────────────────┘                        │
│                ┌────────────────────────────┐                  │
│                │   Smoke Tests              │  Manual scripts  │
│                │   (test_security_impl.py)  │                  │
│                │   (test_phase2_identity.py)│                  │
│                └────────────────────────────┘                  │
│                                                                 │
│  Coverage Status:                                              │
│  • Backend: ~20% (auth module)                                 │
│  • Frontend: Minimal (AuthContext only)                        │
│  • E2E: Basic auth flow                                        │
│  • Target: 70%+                                                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Module Dependencies

### Backend Dependencies

```
fastapi ──────► starlette
   │            uvicorn
   │
   ├──► pydantic ──► email-validator
   │
   ├──► firebase-admin ──► google-cloud-firestore
   │                       httpx
   │
   ├──► bcrypt
   │
   ├──► PyJWT
   │
   ├──► slowapi ──► limits
   │
   ├──► sentry-sdk
   │
   └──► python-dotenv
```

### Frontend Dependencies

```
react ──────► react-dom
   │          react-router-dom
   │
   ├──► @radix-ui/* (30 packages)
   │
   ├──► axios
   │
   ├──► firebase ──► firebase/auth
   │                 firebase/app
   │
   ├──► framer-motion
   │
   ├──► tailwindcss ──► autoprefixer
   │                    postcss
   │
   ├──► lucide-react (icons)
   │
   ├──► recharts (charts)
   │
   └──► zod (validation)
```

---

## 🔄 Data Synchronization

```
┌────────────────────────────────────────────────────────────────┐
│                    DATA FLOW & SYNC                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action (Frontend) → API Call → Backend Processing →     │
│  Firestore Write → Firestore Read → Backend Response →        │
│  Frontend State Update → UI Render                             │
│                                                                 │
│  Example: Update Link                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. User clicks "Save" on LinkManager                    │  │
│  │  2. onClick → handleUpdate()                             │  │
│  │  3. api.put('/links/${id}', data)                        │  │
│  │  4. Backend: Validate JWT                                │  │
│  │  5. Backend: Check ownership                             │  │
│  │  6. Backend: Update Firestore                            │  │
│  │  7. Backend: Log audit event                             │  │
│  │  8. Backend: Return updated link                         │  │
│  │  9. Frontend: Update local state                         │  │
│  │ 10. Frontend: Refresh UI (optimistic or pessimistic)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Real-time Updates: NOT IMPLEMENTED                            │
│  • No Firestore listeners in frontend                          │
│  • No WebSocket connections                                    │
│  • Manual refresh required                                     │
│  • Future: Consider Firebase Realtime listeners                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase Implementation Status

```
┌────────────────────────────────────────────────────────────────┐
│                      PHASE STATUS                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 0: Core Platform                                        │
│  ✅ Links management                                           │
│  ✅ Analytics tracking                                         │
│  ✅ QR code generation                                         │
│  ✅ Ring assignment                                            │
│  ✅ Appointment scheduling                                     │
│  ✅ Admin panel                                                │
│  Status: COMPLETE & PRODUCTION                                 │
│                                                                 │
│  Phase 1: Security & Compliance                                │
│  ✅ JWT + Refresh tokens                                       │
│  ✅ Session management                                         │
│  ✅ Audit logging                                              │
│  ✅ GDPR data export                                           │
│  ✅ Admin data validation                                      │
│  Status: BACKEND COMPLETE, FRONTEND PARTIAL                    │
│  Gap: Token refresh not implemented in frontend                │
│                                                                 │
│  Phase 2: Identity & Subscriptions                             │
│  ✅ Account types (personal/business/org)                      │
│  ✅ Identity resolution service                                │
│  ✅ Subscription tracking                                      │
│  ✅ Organization memberships                                   │
│  ✅ Onboarding endpoints                                       │
│  Status: BACKEND COMPLETE, FRONTEND NOT STARTED                │
│  Gap: Identity context not integrated in frontend              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📝 Summary

This architecture represents a **well-designed, production-grade full-stack application** with:

- ✅ Clean separation of concerns
- ✅ Scalable backend (FastAPI + Firestore)
- ✅ Modern frontend (React + Radix UI)
- ✅ Comprehensive security (multi-layered)
- ✅ Phase-based development (non-breaking)
- ✅ Extensive documentation

**Next Steps:** Implement critical gaps (token refresh, Phase 2 integration) to achieve 100% alignment.

---

**Document Version:** 2.0  
**Last Updated:** December 25, 2025  
**Maintained By:** Development Team  
**Status:** CURRENT & ACCURATE ✅

