# Firestore Database Structure - Complete Documentation

## Overview

This document provides a comprehensive overview of the OdinRing Firestore database structure, including all collections, their fields, relationships, indexes, and usage patterns.

**Last Updated**: 2024-01-29  
**Database**: Google Cloud Firestore  
**Project**: OdinRing - Smart Bio Link Platform with Physical Ring Integration

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Collection Overview](#collection-overview)
3. [Detailed Collection Schemas](#detailed-collection-schemas)
4. [Indexes](#indexes)
5. [Relationships](#relationships)
6. [Business Rules](#business-rules)
7. [Query Patterns](#query-patterns)
8. [Data Lifecycle](#data-lifecycle)

---

## Database Architecture

### Design Principles

- **NoSQL Document Store**: Firestore uses a document-based data model
- **Collection-Based Organization**: Data organized into logical collections
- **Denormalization for Performance**: Some data duplicated for faster queries
- **Index-Optimized Queries**: All queries use indexed fields for performance
- **Audit Trail**: Comprehensive logging of all data changes
- **Security-First**: Role-based access control and session management

### Collection Categories

1. **Core Collections (Phase 0)**: User profiles, links, analytics, rings
2. **Security Collections (Phase 1)**: Sessions, refresh tokens, audit logs
3. **Identity Collections (Phase 2)**: Businesses, organizations, subscriptions

---

## Collection Overview

### Summary Table

| Collection | Purpose | Document Count | Indexes |
|------------|---------|----------------|---------|
| `users` | User profiles and authentication | Variable | 4 |
| `links` | User links and content | Variable | 3 |
| `rings` | NFC ring inventory | Variable | 3 |
| `analytics` | Page view analytics | High volume | 1 |
| `ring_analytics` | NFC ring tap events | High volume | 3 |
| `qr_scans` | QR code scan tracking | High volume | 1 |
| `appointments` | User scheduling | Variable | 1 |
| `sessions` | Active user sessions | Medium | 3 |
| `refresh_tokens` | JWT refresh tokens | Medium | 4 |
| `audit_logs` | Audit trail for compliance | High volume | 4 |
| `businesses` | Solo business profiles | Variable | 1 |
| `organizations` | Multi-user organizations | Variable | 1 |
| `departments` | Organization departments | Variable | 1 |
| `memberships` | Organization memberships | Variable | 3 |
| `subscriptions` | Subscription plans and billing | Variable | 20 |

**Total Collections**: 15  
**Total Indexes**: 54

---

## Detailed Collection Schemas

### 1. `users` Collection

**Purpose**: User profiles, authentication, and profile settings

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique user ID (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `email` | string | ✅ | User email address (unique, indexed) | `"user@example.com"` |
| `username` | string | ✅ | Username (unique, indexed) | `"johndoe"` |
| `name` | string | ✅ | Display name | `"John Doe"` |
| `password` | string | ✅ | Hashed password (bcrypt) | `"$2b$12$..."` |
| `ring_id` | string | ❌ | Associated NFC ring ID (indexed) | `"RING123456"` |
| `google_id` | string | ❌ | Google OAuth ID (indexed) | `"123456789"` |
| `avatar` | string | ❌ | Profile photo URL | `"https://cdn.example.com/avatar.jpg"` |
| `bio` | string | ❌ | User biography | `"Digital creator..."` |
| `theme` | string | ❌ | UI theme (`light`/`dark`) | `"light"` |
| `accent_color` | string | ❌ | Accent color (hex) | `"#000000"` |
| `background_color` | string | ❌ | Background color (hex) | `"#ffffff"` |
| `custom_logo` | string | ❌ | Custom logo URL | `"https://..."` |
| `show_footer` | boolean | ❌ | Show "Powered by OdinRing" footer | `true` |
| `show_ring_badge` | boolean | ❌ | Show "Ring Connected" badge | `true` |
| `phone_number` | string | ❌ | Phone number for WhatsApp/Call | `"+1234567890"` |
| `items` | array | ❌ | Links stored directly in user doc | `[{...}]` |
| `profile_views` | number | ❌ | Total profile view count | `1234` |
| `total_clicks` | number | ❌ | Total click count | `5678` |
| `is_active` | boolean | ❌ | Account active status | `true` |
| `created_at` | timestamp | ✅ | Creation timestamp (UTC) | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp (UTC) | `2024-01-29T10:30:00Z` |

#### Indexes

1. Single field: `email` (ASCENDING)
2. Single field: `username` (ASCENDING)
3. Single field: `ring_id` (ASCENDING)
4. Single field: `google_id` (ASCENDING)

#### Relationships

- **One-to-Many**: `users` → `links` (via `user_id`)
- **One-to-Many**: `users` → `analytics` (via `user_id`)
- **One-to-One**: `users` → `subscriptions` (via `user_id`, for personal accounts)
- **One-to-One**: `users` → `businesses` (via `owner_id`)

---

### 2. `links` Collection

**Purpose**: User links and content items

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique link ID (UUID) | `"uuid-here"` |
| `user_id` | string | ✅ | Owner user ID (indexed) | `"user-uuid"` |
| `title` | string | ✅ | Link title | `"My Website"` |
| `url` | string | ✅ | Link URL | `"https://example.com"` |
| `icon` | string | ❌ | Icon identifier | `"Globe"` |
| `order` | number | ✅ | Display order (indexed) | `1` |
| `category` | string | ❌ | Link category | `"general"` |
| `style` | string | ❌ | Link style | `"default"` |
| `color` | string | ❌ | Link color | `"#000000"` |
| `background_color` | string | ❌ | Background color | `"#ffffff"` |
| `border_radius` | string | ❌ | Border radius | `"md"` |
| `description` | string | ❌ | Link description | `"Visit my site"` |
| `clicks` | number | ❌ | Click count | `123` |
| `active` | boolean | ✅ | Link active status (indexed) | `true` |
| `schedule` | object | ❌ | Scheduling configuration | `{start: "...", end: "..."}` |
| `created_at` | timestamp | ✅ | Creation timestamp | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `user_id` + `order` (ASCENDING)
2. Composite: `user_id` + `active` + `order` (ASCENDING)
3. Composite: `user_id` + `created_at` (DESCENDING)

#### Relationships

- **Many-to-One**: `links` → `users` (via `user_id`)

---

### 3. `rings` Collection

**Purpose**: NFC ring inventory and assignments

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique ring record ID | `"uuid"` |
| `ring_id` | string | ✅ | Physical ring ID (unique, indexed) | `"RING123456"` |
| `assigned_user` | string | ❌ | Assigned user ID (indexed) | `"user-uuid"` |
| `status` | string | ✅ | Ring status (indexed) | `"available"`, `"assigned"`, `"inactive"` |
| `activation_date` | timestamp | ❌ | Activation timestamp | `2024-01-15T10:30:00Z` |
| `created_at` | timestamp | ✅ | Creation timestamp | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Single field: `ring_id` (ASCENDING)
2. Single field: `assigned_user` (ASCENDING)
3. Single field: `status` (ASCENDING)

#### Relationships

- **One-to-One**: `rings` → `users` (via `assigned_user` and `ring_id`)

---

### 4. `analytics` Collection

**Purpose**: Page view and interaction analytics

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique analytics ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `timestamp` | timestamp | ✅ | Event timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `ip_address` | string | ❌ | Visitor IP address | `"192.168.1.1"` |
| `user_agent` | string | ❌ | User agent string | `"Mozilla/5.0..."` |
| `referrer` | string | ❌ | Referrer URL | `"https://google.com"` |
| `country` | string | ❌ | Visitor country | `"US"` |
| `city` | string | ❌ | Visitor city | `"New York"` |

#### Indexes

1. Composite: `user_id` + `timestamp` (DESCENDING)

---

### 5. `ring_analytics` Collection

**Purpose**: NFC ring tap events and interactions

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique event ID | `"uuid"` |
| `ring_id` | string | ✅ | Ring ID (indexed) | `"RING123456"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `timestamp` | timestamp | ✅ | Event timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `event_type` | string | ✅ | Event type (indexed) | `"tap"`, `"scan"` |
| `ip_address` | string | ❌ | Visitor IP | `"192.168.1.1"` |
| `location` | object | ❌ | Geographic location | `{lat: 40.7128, lng: -74.0060}` |

#### Indexes

1. Composite: `ring_id` + `timestamp` (DESCENDING)
2. Composite: `user_id` + `timestamp` (DESCENDING)
3. Composite: `event_type` + `timestamp` (DESCENDING)

---

### 6. `qr_scans` Collection

**Purpose**: QR code scan tracking

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique scan ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `scan_type` | string | ✅ | Scan type | `"profile"`, `"link"` |
| `link_id` | string | ❌ | Link ID (if link scan) | `"link-uuid"` |
| `timestamp` | timestamp | ✅ | Scan timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `ip_address` | string | ❌ | Scanner IP | `"192.168.1.1"` |
| `user_agent` | string | ❌ | User agent | `"Mozilla/5.0..."` |

#### Indexes

1. Composite: `user_id` + `timestamp` (DESCENDING)

---

### 7. `appointments` Collection

**Purpose**: User scheduling and appointments

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique appointment ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `title` | string | ✅ | Appointment title | `"Meeting"` |
| `description` | string | ❌ | Description | `"Discuss project"` |
| `appointment_date` | timestamp | ✅ | Appointment date/time (indexed) | `2024-01-15T10:30:00Z` |
| `duration` | number | ❌ | Duration in minutes | `60` |
| `status` | string | ✅ | Status (indexed) | `"scheduled"`, `"completed"`, `"cancelled"` |
| `attendee_email` | string | ❌ | Attendee email | `"attendee@example.com"` |
| `attendee_name` | string | ❌ | Attendee name | `"Jane Doe"` |
| `created_at` | timestamp | ✅ | Creation timestamp | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `user_id` + `status` + `appointment_date` (ASCENDING)

---

### 8. `sessions` Collection

**Purpose**: Active user sessions for authentication (Phase 1: Security)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique session ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `session_id` | string | ✅ | Session identifier | `"session-uuid"` |
| `token` | string | ✅ | JWT token | `"eyJhbGc..."` |
| `ip_address` | string | ❌ | Session IP address | `"192.168.1.1"` |
| `user_agent` | string | ❌ | User agent | `"Mozilla/5.0..."` |
| `created_at` | timestamp | ✅ | Creation timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `expires_at` | timestamp | ✅ | Expiration timestamp (indexed) | `2024-01-16T10:30:00Z` |
| `is_active` | boolean | ✅ | Active status (indexed) | `true` |
| `last_activity` | timestamp | ❌ | Last activity timestamp (indexed) | `2024-01-15T11:00:00Z` |

#### Indexes

1. Composite: `user_id` + `is_active` + `created_at` (DESCENDING)
2. Composite: `expires_at` + `is_active` (ASCENDING)
3. Composite: `user_id` + `last_activity` (DESCENDING)

---

### 9. `refresh_tokens` Collection

**Purpose**: Refresh tokens for JWT rotation (Phase 1: Security)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique token ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `session_id` | string | ✅ | Associated session ID (indexed) | `"session-uuid"` |
| `token_hash` | string | ✅ | Hashed refresh token | `"$2b$12$..."` |
| `family_id` | string | ✅ | Token family ID (indexed) | `"family-uuid"` |
| `created_at` | timestamp | ✅ | Creation timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `expires_at` | timestamp | ✅ | Expiration timestamp (indexed) | `2024-01-29T10:30:00Z` |
| `is_revoked` | boolean | ✅ | Revocation status (indexed) | `false` |
| `revoked_at` | timestamp | ❌ | Revocation timestamp | `2024-01-20T10:30:00Z` |

#### Indexes

1. Composite: `user_id` + `is_revoked` + `created_at` (DESCENDING)
2. Composite: `expires_at` + `is_revoked` (ASCENDING)
3. Composite: `family_id` + `created_at` (DESCENDING)
4. Composite: `session_id` + `is_revoked` (ASCENDING)

---

### 10. `audit_logs` Collection

**Purpose**: Comprehensive audit trail for compliance (Phase 1: Security)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique log ID | `"uuid"` |
| `actor_id` | string | ✅ | User/system that performed action (indexed) | `"user-uuid"` |
| `action` | string | ✅ | Action performed (indexed) | `"user_login"`, `"subscription_activated"` |
| `entity_type` | string | ✅ | Entity type (indexed) | `"user"`, `"subscription"` |
| `entity_id` | string | ✅ | Entity ID (indexed) | `"entity-uuid"` |
| `timestamp` | timestamp | ✅ | Event timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `ip_address` | string | ❌ | IP address (indexed) | `"192.168.1.1"` |
| `user_agent` | string | ❌ | User agent | `"Mozilla/5.0..."` |
| `metadata` | object | ❌ | Additional metadata | `{key: "value"}` |

#### Indexes

1. Composite: `actor_id` + `timestamp` (DESCENDING)
2. Composite: `action` + `timestamp` (DESCENDING)
3. Composite: `entity_type` + `entity_id` + `timestamp` (DESCENDING)
4. Composite: `ip_address` + `timestamp` (DESCENDING)

#### Common Actions

- `user_register`, `user_login`, `user_logout`
- `subscription_created`, `subscription_activated`, `subscription_expired`
- `link_created`, `link_updated`, `link_deleted`
- `onboarding_completed`

---

### 11. `businesses` Collection

**Purpose**: Solo business and micro-enterprise profiles (Phase 2: Identity)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique business ID | `"uuid"` |
| `owner_id` | string | ✅ | Owner user ID (indexed) | `"user-uuid"` |
| `name` | string | ✅ | Business name | `"Acme Corp"` |
| `description` | string | ❌ | Business description | `"We do amazing things"` |
| `email` | string | ❌ | Business email | `"info@acme.com"` |
| `phone` | string | ❌ | Business phone | `"+1234567890"` |
| `website` | string | ❌ | Business website | `"https://acme.com"` |
| `industry` | string | ❌ | Industry type | `"Technology"` |
| `created_at` | timestamp | ✅ | Creation timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `owner_id` + `created_at` (DESCENDING)

#### Relationships

- **One-to-One**: `businesses` → `users` (via `owner_id`)
- **One-to-One**: `businesses` → `subscriptions` (via `business_id`)

---

### 12. `organizations` Collection

**Purpose**: Multi-user organization profiles (Phase 2: Identity)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique organization ID | `"uuid"` |
| `owner_id` | string | ✅ | Owner user ID (indexed) | `"user-uuid"` |
| `name` | string | ✅ | Organization name | `"Tech Corp"` |
| `description` | string | ❌ | Organization description | `"Leading tech company"` |
| `max_members` | number | ❌ | Maximum members | `100` |
| `created_at` | timestamp | ✅ | Creation timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `owner_id` + `created_at` (DESCENDING)

#### Relationships

- **One-to-One**: `organizations` → `users` (via `owner_id`)
- **One-to-One**: `organizations` → `subscriptions` (via `organization_id`)
- **One-to-Many**: `organizations` → `departments` (via `organization_id`)
- **One-to-Many**: `organizations` → `memberships` (via `organization_id`)

---

### 13. `departments` Collection

**Purpose**: Organization departments or teams (Phase 2: Identity)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique department ID | `"uuid"` |
| `organization_id` | string | ✅ | Organization ID (indexed) | `"org-uuid"` |
| `name` | string | ✅ | Department name (indexed) | `"Engineering"` |
| `description` | string | ❌ | Department description | `"Software development team"` |
| `created_at` | timestamp | ✅ | Creation timestamp | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `organization_id` + `name` (ASCENDING)

#### Relationships

- **Many-to-One**: `departments` → `organizations` (via `organization_id`)
- **One-to-Many**: `departments` → `memberships` (via `department_id`)

---

### 14. `memberships` Collection

**Purpose**: Organization membership and roles (Phase 2: Identity)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique membership ID | `"uuid"` |
| `user_id` | string | ✅ | User ID (indexed) | `"user-uuid"` |
| `organization_id` | string | ✅ | Organization ID (indexed) | `"org-uuid"` |
| `department_id` | string | ❌ | Department ID (indexed) | `"dept-uuid"` |
| `role` | string | ✅ | Role (indexed) | `"owner"`, `"admin"`, `"member"` |
| `created_at` | timestamp | ✅ | Creation timestamp (indexed) | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Indexes

1. Composite: `user_id` + `created_at` (DESCENDING)
2. Composite: `organization_id` + `role` + `created_at` (ASCENDING)
3. Composite: `organization_id` + `department_id` + `created_at` (ASCENDING)

#### Relationships

- **Many-to-One**: `memberships` → `users` (via `user_id`)
- **Many-to-One**: `memberships` → `organizations` (via `organization_id`)
- **Many-to-One**: `memberships` → `departments` (via `department_id`)

---

### 15. `subscriptions` Collection

**Purpose**: Subscription plans, billing state, and lifecycle management (Phase 2: Identity)

**Document ID**: UUID (string)

#### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique subscription ID | `"550e8400-e29b-41d4-a716-446655440000"` |
| `subscriber_reference` | string | ❌ | External reference (e.g., Stripe) | `"sub_1234567890"` |
| `user_id` | string | ❌ | User ID (for personal, indexed) | `"user-uuid"` |
| `business_id` | string | ❌ | Business ID (for business_solo, indexed) | `"business-uuid"` |
| `organization_id` | string | ❌ | Organization ID (for org, indexed) | `"org-uuid"` |
| `plan` | string | ✅ | Plan type (indexed) | `"personal"`, `"solo"`, `"org"` |
| `status` | string | ✅ | Status (indexed) | `"none"`, `"trial"`, `"active"`, `"expired"` |
| `billing_cycle` | string | ✅ | Billing cycle | `"monthly"`, `"yearly"` |
| `amount` | number | ❌ | Subscription amount | `24.0` |
| `currency` | string | ❌ | Currency code | `"EUR"` |
| `trial_start_date` | timestamp | ❌ | Trial start date (indexed) | `2024-01-15T10:30:00Z` |
| `trial_end_date` | timestamp | ❌ | Trial end date (indexed) | `2024-01-29T10:30:00Z` |
| `current_period_start` | timestamp | ❌ | Current period start (indexed) | `2024-01-29T10:30:00Z` |
| `current_period_end` | timestamp | ❌ | Current period end (indexed) | `2024-01-29T10:30:00Z` |
| `cancelled_at` | timestamp | ❌ | Cancellation timestamp | `2024-02-15T10:30:00Z` |
| `transaction_id` | string | ❌ | Payment transaction ID (indexed) | `"ch_1234567890"` |
| `checkout_details` | object | ❌ | Checkout/payment details | `{checkout_session_id: "...", ...}` |
| `payment_integration` | object | ❌ | Payment gateway data | `{provider: "stripe", ...}` |
| `billing` | object | ❌ | Billing information | `{amount: 24.0, currency: "EUR"}` |
| `metadata` | object | ❌ | Additional metadata | `{source: "onboarding"}` |
| `created_at` | timestamp | ✅ | Creation timestamp | `2024-01-15T10:30:00Z` |
| `updated_at` | timestamp | ✅ | Last update timestamp | `2024-01-29T10:30:00Z` |

#### Subscription Status Values

- `none`: No subscription
- `trial`: 14-day free trial period
- `active`: Active paid subscription
- `expired`: Trial or subscription expired

#### Subscription Plan Values

- `personal`: Personal account plan (free, default)
- `solo`: Business Solo plan (Standard: €24/year, Enterprise: €36/year)
- `org`: Organization plan (€68/year)

#### Indexes (20 total)

**Single Field Indexes:**
1. `user_id` (ASCENDING)
2. `business_id` (ASCENDING)
3. `organization_id` (ASCENDING)
4. `plan` (ASCENDING)
5. `transaction_id` (ASCENDING)
6. `trial_start_date` (ASCENDING)
7. `current_period_start` (ASCENDING)
8. `trial_end_date` (ASCENDING)
9. `current_period_end` (ASCENDING)

**Composite Indexes:**
10. `status` + `trial_end_date` (ASCENDING)
11. `status` + `current_period_end` (ASCENDING)
12. `plan` + `trial_start_date` (ASCENDING)
13. `plan` + `current_period_start` (ASCENDING)
14. `plan` + `trial_end_date` (ASCENDING)
15. `plan` + `current_period_end` (ASCENDING)
16. `plan` + `transaction_id` (ASCENDING)
17. `trial_start_date` + `trial_end_date` (ASCENDING)
18. `current_period_start` + `current_period_end` (ASCENDING)
19. `plan` + `trial_start_date` + `trial_end_date` (ASCENDING)
20. `plan` + `current_period_start` + `current_period_end` (ASCENDING)

#### Relationships

- **One-to-One**: `subscriptions` → `users` (via `user_id`, for personal accounts)
- **One-to-One**: `subscriptions` → `businesses` (via `business_id`, for business_solo accounts)
- **One-to-One**: `subscriptions` → `organizations` (via `organization_id`, for organization accounts)

#### Subscription Lifecycle

1. **Creation**: On signup, subscription created with `status: "trial"`, 14-day trial period set
2. **Trial**: User has full access during 14-day trial
3. **Activation**: After payment, `status` changes to `"active"`, billing period set (1 year for yearly plans)
4. **Expiration**: When trial or billing period ends, `status` changes to `"expired"`, access blocked
5. **Renewal**: User can renew expired subscription, reactivating access

#### Business Rules

- **Trial Period**: 14 days from signup (`trial_end_date = trial_start_date + 14 days`)
- **Billing Periods**: 
  - Yearly: 365 days (`current_period_end = current_period_start + 365 days`)
  - Monthly: 30 days (`current_period_end = current_period_start + 30 days`)
- **Pricing**:
  - Solo Standard: €24/year
  - Solo Enterprise: €36/year
  - Organization: €68/year
- **Expiration Handling**:
  - Trial: `trial_end_date < now` → Set `status: "expired"`
  - Active: `current_period_end < now AND status = "active"` → Set `status: "expired"`

---

## Indexes

### Index Summary

**Total Indexes**: 54

### Index Categories

1. **Single Field Indexes**: 15 indexes
2. **Composite Indexes**: 39 indexes

### Index Deployment

Indexes are defined in `firestore.indexes.json` and deployed using:

```bash
firebase deploy --only firestore:indexes
```

### Index Best Practices

1. **Always use indexed fields** in queries
2. **Composite indexes** required for queries on multiple fields
3. **Order matters** in composite indexes (match query field order)
4. **ASCENDING vs DESCENDING** must match query order
5. **Index limits**: Firestore allows up to 200 indexes per project

---

## Relationships

### Entity Relationship Diagram (Text)

```
users
  ├── links (1:N via user_id)
  ├── analytics (1:N via user_id)
  ├── ring_analytics (1:N via user_id)
  ├── qr_scans (1:N via user_id)
  ├── appointments (1:N via user_id)
  ├── sessions (1:N via user_id)
  ├── refresh_tokens (1:N via user_id)
  ├── audit_logs (1:N via actor_id)
  ├── businesses (1:1 via owner_id)
  ├── organizations (1:1 via owner_id)
  └── subscriptions (1:1 via user_id for personal accounts)

businesses
  └── subscriptions (1:1 via business_id)

organizations
  ├── departments (1:N via organization_id)
  ├── memberships (1:N via organization_id)
  └── subscriptions (1:1 via organization_id)

departments
  └── memberships (1:N via department_id)

rings
  └── users (1:1 via ring_id and assigned_user)
```

### Relationship Rules

1. **One-to-One**: User → Subscription (personal), Business → Subscription, Organization → Subscription
2. **One-to-Many**: User → Links, User → Analytics, Organization → Departments, Organization → Memberships
3. **Many-to-Many**: Users ↔ Organizations (via memberships)

---

## Business Rules

### Subscription Lifecycle

1. **Signup**: User creates account → Subscription created with `status: "trial"`, 14-day trial starts
2. **Trial Period**: 14 days of full access
3. **Trial Expiry**: After 14 days, if not activated → `status: "expired"`, access blocked
4. **Activation**: User selects plan and pays → `status: "active"`, billing period set (1 year)
5. **Active Period**: User has full access for billing period duration
6. **Expiration**: When billing period ends → `status: "expired"`, access blocked
7. **Renewal**: User can renew expired subscription → Back to active state

### Access Control

- **Trial Status**: Full dashboard access
- **Active Status**: Full dashboard access
- **Expired Status**: Dashboard access blocked, redirect to `/billing/choose-plan`
- **None Status**: No subscription, access limited

### Data Retention

- **Audit Logs**: Retained for compliance (minimum 7 years)
- **Analytics**: Retained for reporting (configurable)
- **Sessions**: Auto-expired after expiration date
- **Refresh Tokens**: Auto-expired after expiration date

---

## Query Patterns

### Common Queries

#### 1. Get User Subscription

```javascript
db.collection('subscriptions')
  .where('user_id', '==', userId)
  .limit(1)
  .get()
```

#### 2. Find Expired Trials

```javascript
db.collection('subscriptions')
  .where('status', '==', 'trial')
  .where('trial_end_date', '<', now)
  .get()
```

#### 3. Get User Links (Ordered)

```javascript
db.collection('links')
  .where('user_id', '==', userId)
  .where('active', '==', true)
  .orderBy('order')
  .get()
```

#### 4. Get User Audit Logs

```javascript
db.collection('audit_logs')
  .where('actor_id', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get()
```

#### 5. Find Expiring Trials (for notifications)

```javascript
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 3); // 3 days from now

db.collection('subscriptions')
  .where('status', '==', 'trial')
  .where('trial_end_date', '>=', targetDate.setHours(0,0,0,0))
  .where('trial_end_date', '<', targetDate.setHours(23,59,59,999))
  .get()
```

---

## Data Lifecycle

### Document Lifecycle

1. **Creation**: Document created with `created_at` timestamp
2. **Updates**: Document updated with `updated_at` timestamp
3. **Soft Deletes**: Some collections use `is_active: false` instead of deletion
4. **Hard Deletes**: Some collections (e.g., audit_logs) are never deleted

### Retention Policies

- **Users**: Retained indefinitely (GDPR compliance required)
- **Links**: Retained until user deletion
- **Analytics**: Retained for 2 years (configurable)
- **Sessions**: Auto-deleted after expiration
- **Refresh Tokens**: Auto-deleted after expiration
- **Audit Logs**: Retained for 7 years (compliance)
- **Subscriptions**: Retained indefinitely (billing records)

---

## Security & Access Control

### Security Rules

Firestore security rules are defined in:
- Development: `backend/firestore-rules-dev.txt`
- Production: `backend/firestore-rules-prod.txt`

### Access Patterns

1. **Public Read**: Public profile pages (users, links)
2. **Authenticated Read**: User's own data (dashboard)
3. **Authenticated Write**: User's own data (profile, links)
4. **Admin Write**: System administrators (all collections)
5. **System Write**: Server-side only (audit_logs, sessions)

---

## Maintenance & Monitoring

### Monitoring

- **Collection Size**: Monitor document counts per collection
- **Index Usage**: Monitor index performance
- **Query Performance**: Monitor slow queries
- **Storage Usage**: Monitor database storage

### Backup & Recovery

- **Automated Backups**: Daily backups via `backend/scripts/backup_firestore.py`
- **Restore Process**: `backend/scripts/restore_firestore.py`
- **Backup Retention**: 30 days (configurable)

### Migration & Updates

1. **Schema Changes**: Update schema definitions in `backend/firestore_schemas/`
2. **Index Updates**: Update `firestore.indexes.json` and deploy
3. **Data Migration**: Use migration scripts in `backend/scripts/`
4. **Validation**: Run `backend/scripts/verify_firestore.py` after changes

---

## Related Documentation

- **Subscription Schema**: `backend/firestore_schemas/subscription_schema.json`
- **Setup Script**: `backend/scripts/init_firestore_collections.py`
- **Firestore Indexes**: `firestore.indexes.json`
- **Firestore Rules**: `backend/firestore-rules-*.txt`

---

## Appendices

### A. Field Type Reference

| Firestore Type | Python Type | JavaScript Type | Example |
|----------------|-------------|-----------------|---------|
| `string` | `str` | `string` | `"hello"` |
| `number` | `int`/`float` | `number` | `123`, `45.67` |
| `boolean` | `bool` | `boolean` | `true`, `false` |
| `timestamp` | `datetime` | `Date` | `2024-01-15T10:30:00Z` |
| `array` | `list` | `array` | `[1, 2, 3]` |
| `map` | `dict` | `object` | `{key: "value"}` |
| `null` | `None` | `null` | `null` |

### B. Timestamp Format

All timestamps are stored in UTC ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

Example: `2024-01-15T10:30:00Z`

### C. UUID Format

All document IDs are UUIDs in standard format: `550e8400-e29b-41d4-a716-446655440000`

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-29  
**Maintained By**: OdinRing Development Team







