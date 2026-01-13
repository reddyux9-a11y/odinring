# Features Removed

**Date:** January 6, 2025  
**Version:** 1.4.0

## Removed Features

### 1. Direct Link Mode ❌

**Status:** Completely removed

**What was removed:**
- `DirectLinkMode.jsx` component (deleted)
- `/api/rings/{ring_id}/direct-mode` endpoint (removed)
- Direct link mode logic from NFC scan endpoint
- `direct_mode` and `direct_link_id` fields from Ring model
- `direct_link_active` field references from frontend
- All direct link mode UI components and interactions

**Files Modified:**
- `frontend/src/components/DirectLinkMode.jsx` - **DELETED**
- `frontend/src/pages/Dashboard.jsx` - Removed imports, state, and usage
- `frontend/src/components/MobileHomePage.jsx` - Removed direct link logic
- `backend/server.py` - Removed endpoint and model fields
- `backend/tests/integration/test_nfc_endpoints.py` - Removed test

**Impact:**
- NFC rings now always redirect to user profile (bundle mode)
- No direct link selection available
- Simplified ring behavior

---

### 2. Google Calendar Integration ❌

**Status:** Completely removed

**What was removed:**
- Google Calendar API imports
- `google_event_id` field from Appointment model
- Google Calendar TODO comment
- `SmartScheduling.jsx` component (deleted)
- `HAS_GOOGLE_CALENDAR` flag

**Files Modified:**
- `frontend/src/components/SmartScheduling.jsx` - **DELETED**
- `backend/server.py` - Removed imports and fields

**Impact:**
- Appointments no longer sync with Google Calendar
- Scheduling features remain but without calendar integration
- Appointment data stored in database only

---

## Migration Notes

### For Existing Users

1. **Direct Link Mode:**
   - Any existing direct link settings are ignored
   - All rings now use profile mode (bundle)
   - No migration needed - feature simply disabled

2. **Google Calendar:**
   - Existing appointments remain in database
   - No calendar sync will occur
   - No data loss

---

## Technical Details

### Backend Changes

1. **Ring Model:**
   ```python
   # REMOVED:
   direct_mode: bool = False
   direct_link_id: Optional[str] = None
   mode_schedule: Optional[Dict[str, Any]] = None
   location_settings: Optional[Dict[str, Any]] = None
   ```

2. **Endpoints Removed:**
   - `POST /api/rings/{ring_id}/direct-mode`

3. **NFC Scan Logic:**
   - Removed direct link mode check
   - Always returns profile redirect

### Frontend Changes

1. **Components Deleted:**
   - `DirectLinkMode.jsx`
   - `SmartScheduling.jsx`

2. **State Removed:**
   - `ringSettings` state (or simplified)
   - `direct_link_active` field handling

3. **UI Removed:**
   - Direct link mode toggle
   - Link selection for direct mode
   - Active link badges

---

## Rollback Instructions

If you need to restore these features:

1. **Direct Link Mode:**
   - Restore from git history
   - Re-add fields to Ring model
   - Re-implement endpoint
   - Restore component

2. **Google Calendar:**
   - Restore imports
   - Re-add `google_event_id` field
   - Implement calendar sync logic

---

**Note:** These features were removed per user request. All related code has been cleaned up.


