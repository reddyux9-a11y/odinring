# Changelog

All notable changes to the OdinRing project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-02

### Added
- **NFC Security Hardening** - Comprehensive protection against NFC ring cloning, replay attacks, and stolen ring abuse
  - Short-lived signed tokens with HMAC signatures
  - Timestamp validation (±30s window)
  - Nonce-based replay attack prevention
  - Ring status checking (active/revoked)
  - Rate limiting (10 scans/minute per ring)
- **GDPR & Privacy Compliance Module** (`backend/privacy/`)
  - Data retention service (90-day automatic purging)
  - User deletion service (Right to Erasure - Article 17)
  - Consent management (Article 7 compliance)
- **Role-Based Access Control (RBAC)** (`backend/authorization.py`)
  - Explicit roles: user, admin, superadmin
  - Central permission map
  - Ownership checks on all mutations
  - Cross-tenant isolation
- **Security-Grade Audit Logging**
  - Immutable audit logs (append-only)
  - 180-day retention policy
  - Separate from debug logging
  - Retention metadata tracking
- **Threat Modeling** (`docs/security/threat-model.md`)
  - STRIDE methodology threat analysis
  - Asset inventory
  - Threat actor profiles
  - Risk scoring matrix (CVSS-like)
- **Incident Response Plan** (`docs/security/incident_response.md`)
  - 5-phase response plan (Detection, Containment, Eradication, Recovery, Notification)
  - Runtime hooks for token/ring revocation
  - GDPR notification templates
- **Supply Chain Security**
  - Docker base image pinning (python:3.11.9-slim)
  - Enhanced CI/CD security scanning
  - Dependency vulnerability scanning (npm audit, pip-audit)
  - Docker image scanning (Trivy)
  - Lockfile verification
- **Quantitative Risk Scoring**
  - CVSS-like risk scores for all diagnostic issues
  - Risk = (Likelihood × Impact)
  - Scores range from 1-10 with explanations

### Changed
- **Diagnostic Metadata** - Fixed false "100% coverage" claim
  - Updated to "Partial Diagnostic Coverage (Static Analysis + Config Review)"
  - Added coverage limitations section
  - Added threat model and privacy compliance references
- **Audit Logging** - Enhanced with immutability and retention
  - Added retention metadata (expires_at)
  - Immutable flag for tamper-awareness
  - 180-day retention policy
- **Configuration** - Added security settings
  - `DATA_RETENTION_DAYS: int = 90`
  - `NFC_SECRET_KEY: Optional[str] = None`
  - `AUDIT_LOG_RETENTION_DAYS: int = 180`
  - `AUDIT_LOG_IMMUTABLE: bool = True`
- **Dockerfile** - Pinned base image version for supply chain security
- **Security Workflow** - Enhanced with comprehensive scanning

### Security
- All security enhancements are additive (no breaking changes)
- NFC security protects against cloning and replay attacks
- GDPR compliance ensures data protection and user rights
- RBAC provides fine-grained access control
- Audit logging provides comprehensive security trail
- Supply chain security prevents dependency vulnerabilities

### Technical
- New security modules: `nfc_security.py`, `authorization.py`, `privacy/`
- Enhanced modules: `audit_log_utils.py`, `config.py`
- New documentation: threat model, incident response plan
- Updated: diagnostic metadata, CI/CD workflows, Dockerfile

## [1.3.0] - 2024-12

### Added
- **Media Management Feature**: Users can now add and manage media files (images and videos with embed links) under the Links section
  - Maximum 6 media files per user
  - Support for both image URLs and video embed links
  - Optional thumbnail support for videos
  - Media files are displayed in profile views alongside links
  - Full CRUD operations (Create, Read, Update, Delete) for media files
  - Media visibility toggle (active/inactive)
  - Media ordering support
- Media management UI component with tabs for Links and Media
- Backend API endpoints for media management (`/api/media`)
- Media display in Profile and ProfilePreview components

### Changed
- Updated version numbers across project
- Links section now includes a Media tab for managing media files
- Public profile API now includes media in the response

### Technical
- Added `Media`, `MediaCreate`, and `MediaUpdate` models in backend
- Created `media_collection` in Firestore database
- Added media validation (6 file limit, URL validation)
- Updated `PublicProfile` model to include media array
- Created `MediaManager` component for frontend media management
- Created `LinksAndMediaManager` wrapper component with tabs

## [1.2.0] - 2024-12

### Added
- Dynamic tab background color that syncs with accent color
- Automatic text color adjustment based on background brightness for tabs
- Border styling for default buttons (1px border with subtle color)

### Changed
- Default button background color from `rgb(178, 42, 42)` to `rgba(10, 10, 10, 0.1)`
- Default button border from `0px` to `1px` with color `rgba(156, 163, 175, 0.05)`
- Active tab background now uses accent color instead of hardcoded dark blue
- Inactive tab text color now syncs with background theme properties

### Fixed
- Tab navigation not reflecting user's accent color choice
- Inactive tab text color not adapting to background theme
- Button border visibility issues

### Technical
- Updated `getLinkButtonStyle` function in ProfilePreview.jsx and Profile.jsx
- Enhanced TabsTrigger components with dynamic styling (4 instances across 2 files)
- Improved color contrast calculations for better accessibility

## [1.0.0] - Initial Release

### Added
- Initial release of OdinRing platform
- Core NFC ring management functionality
- User authentication and profile management
- Link and item management features
- Profile customization options

---

[1.3.0]: https://github.com/your-repo/odinring/releases/tag/v1.3.0
[1.2.0]: https://github.com/your-repo/odinring/releases/tag/v1.2.0
[1.0.0]: https://github.com/your-repo/odinring/releases/tag/v1.0.0

