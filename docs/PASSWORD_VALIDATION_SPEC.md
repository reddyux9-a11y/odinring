# Password Validation Specification

**Version:** 1.0  
**Last Updated:** January 4, 2025  
**Status:** ✅ **ACTIVE - SINGLE SOURCE OF TRUTH**

---

## 📋 Password Requirements

This document defines the **official password validation rules** for OdinRing. All password validation logic in both frontend and backend **MUST** match these rules.

### Rules (All Required)

1. **Minimum Length:** 8 characters
2. **Uppercase Letter:** Must contain at least one uppercase letter (A-Z)
3. **Lowercase Letter:** Must contain at least one lowercase letter (a-z)
4. **Digit:** Must contain at least one digit (0-9)

---

## 🔧 Implementation Reference

### Backend (Python/Pydantic)

**Location:** `backend/server.py` (lines 289-300)

```python
@field_validator('password')
@classmethod
def validate_password(cls, v):
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters')
    if not re.search(r'[A-Z]', v):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', v):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', v):
        raise ValueError('Password must contain at least one digit')
    return v
```

**Regex Patterns:**
- Uppercase: `r'[A-Z]'`
- Lowercase: `r'[a-z]'`
- Digit: `r'[0-9]'`

---

### Frontend (JavaScript/React)

**Location:** `frontend/src/pages/AuthPage.jsx` (lines 147-165)

```javascript
// Validate password requirements (must match backend validation)
if (password.length < 8) {
  toast.error("Password must be at least 8 characters");
  return;
}

if (!/[A-Z]/.test(password)) {
  toast.error("Password must contain at least one uppercase letter");
  return;
}

if (!/[a-z]/.test(password)) {
  toast.error("Password must contain at least one lowercase letter");
  return;
}

if (!/[0-9]/.test(password)) {
  toast.error("Password must contain at least one digit");
  return;
}
```

**Regex Patterns:**
- Uppercase: `/[A-Z]/`
- Lowercase: `/[a-z]/`
- Digit: `/[0-9]/`

---

## 📝 Validation Constants

### Regex Patterns (Shared Reference)

```javascript
// Frontend (JavaScript)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
const PASSWORD_DIGIT_REGEX = /[0-9]/;
```

```python
# Backend (Python)
PASSWORD_MIN_LENGTH = 8
PASSWORD_UPPERCASE_PATTERN = r'[A-Z]'
PASSWORD_LOWERCASE_PATTERN = r'[a-z]'
PASSWORD_DIGIT_PATTERN = r'[0-9]'
```

---

## ✅ Validation Checklist

When implementing or updating password validation:

- [ ] Minimum length check: `>= 8 characters`
- [ ] Uppercase letter check: `/[A-Z]/` or `r'[A-Z]'`
- [ ] Lowercase letter check: `/[a-z]/` or `r'[a-z]'`
- [ ] Digit check: `/[0-9]/` or `r'[0-9]'`
- [ ] Error messages match this specification
- [ ] Backend validation updated
- [ ] Frontend validation updated
- [ ] All password change endpoints updated
- [ ] Reset password endpoints updated

---

## 🔄 Change Process

**If password rules need to change:**

1. **Update this document first** (single source of truth)
2. **Update backend validation** (`backend/server.py`)
3. **Update frontend validation** (`frontend/src/pages/AuthPage.jsx`)
4. **Update all password change endpoints:**
   - `POST /api/me/change-password`
   - `POST /api/auth/reset-password`
   - Frontend: `SecuritySettings.jsx`
   - Frontend: `MobileSettingsPage.jsx`
   - Frontend: `ResetPassword.jsx`
5. **Test consistency** between frontend and backend
6. **Update this document's version number**

---

## 📍 Implementation Locations

### Backend
- ✅ `backend/server.py` - `UserCreate.validate_password()` (lines 289-300)
- ⚠️ `backend/server.py` - `POST /api/me/change-password` (line ~2953) - **Needs verification**
- ⚠️ `backend/server.py` - Password reset endpoints - **Needs verification**

### Frontend
- ✅ `frontend/src/pages/AuthPage.jsx` - Registration validation (lines 147-165)
- ⚠️ `frontend/src/components/SecuritySettings.jsx` - Password change (line ~26) - **Only checks length**
- ⚠️ `frontend/src/components/MobileSettingsPage.jsx` - Password change (line ~99) - **Only checks length**
- ✅ `frontend/src/pages/ResetPassword.jsx` - Reset password validation (lines 107-120)

---

## ⚠️ Known Issues

### Incomplete Validation in Some Endpoints

**Issue:** Some password change endpoints only check minimum length, not all rules.

**Locations:**
- `frontend/src/components/SecuritySettings.jsx` (line 26) - Only checks `length < 8`
- `frontend/src/components/MobileSettingsPage.jsx` (line 99) - Only checks `length < 8`

**Risk:** Users can set weak passwords that pass frontend but fail backend validation.

**Recommendation:** Update these endpoints to use full validation or rely on backend validation (backend will reject invalid passwords).

---

## 🧪 Testing

### Test Cases

Valid passwords:
- `Password1` ✅
- `Test1234` ✅
- `MyP@ssw0rd` ✅

Invalid passwords:
- `short` ❌ (too short, < 8 characters)
- `NOLOWERCASE123` ❌ (no lowercase letter)
- `nolowercase123` ❌ (no uppercase letter)
- `NoLowercase` ❌ (no digit)

### Validation Testing

1. **Frontend validation** - Should reject invalid passwords before API call
2. **Backend validation** - Should reject invalid passwords that bypass frontend
3. **Consistency test** - Frontend and backend should reject same passwords

---

## 📚 Related Documentation

- User Registration: `docs/API.md`
- Password Reset: `docs/PASSWORD_RESET.md`
- Security Guidelines: `docs/SECURITY.md`

---

## 🔒 Security Notes

1. **Always validate on backend** - Frontend validation is for UX only
2. **Backend is source of truth** - Never trust frontend validation alone
3. **Error messages** - Should be user-friendly but not reveal validation rules
4. **Rate limiting** - Password endpoints should be rate-limited
5. **Password storage** - Passwords are hashed using bcrypt before storage

---

**Last Updated:** January 4, 2025  
**Version:** 1.0  
**Status:** ✅ **ACTIVE**



