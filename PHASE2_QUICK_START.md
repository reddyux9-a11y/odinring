# Phase 2 Quick Start Guide

## 🚀 What's New

Phase 2 adds **identity-aware authentication** and **subscription routing** without breaking any existing functionality.

**Key Features:**
- 3 account types: Personal, Business Solo, Organization
- Subscription management and enforcement
- Identity resolution and routing
- 100% backward compatible

---

## 📋 Quick Reference

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/me/context` | GET | Get identity and routing |
| `/api/onboarding/account-type` | POST | Create account type |
| `/api/onboarding/status` | GET | Check onboarding status |

### Account Types

| Type | Description | Use Case |
|------|-------------|----------|
| `personal` | Individual user | Default for existing users |
| `business_solo` | Single-person business | Freelancers, solopreneurs |
| `organization` | Multi-member org | Companies, teams |

### Subscription Status

| Status | Meaning | Access |
|--------|---------|--------|
| `active` | Paid subscription | Full access |
| `trial` | Trial period | Full access |
| `expired` | Subscription ended | Redirect to billing |
| `none` | Free tier | Full access (for now) |

---

## 🎯 For Frontend Developers

### 1. Call Identity Context After Login

```javascript
// After successful authentication
async function getIdentityContext(accessToken) {
  const response = await fetch('/api/me/context', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const context = await response.json();
  
  return context;
}

// Example response:
{
  "authenticated": true,
  "account_type": "personal",
  "user_id": "uuid",
  "subscription": {
    "status": "none",
    "plan": null
  },
  "next_route": "/dashboard"
}
```

### 2. Route Based on Account Type

```javascript
const context = await getIdentityContext(accessToken);

switch (context.account_type) {
  case 'personal':
    // Route to personal dashboard
    router.push('/dashboard');
    break;
    
  case 'business_solo':
    // Route to business dashboard
    router.push('/dashboard/business');
    break;
    
  case 'organization':
    // Route to organization dashboard
    // Check role: context.role (owner/admin/member)
    router.push('/dashboard/organization');
    break;
}

// Handle subscription
if (context.needs_billing) {
  router.push(context.next_route);  // Usually /billing
}
```

### 3. Implement Onboarding (Optional)

```javascript
// Account type selection during onboarding
async function selectAccountType(type, data) {
  const payload = {
    account_type: type
  };
  
  if (type === 'business_solo') {
    payload.business_data = {
      business_name: data.name,
      business_email: data.email,
      industry: data.industry
    };
  } else if (type === 'organization') {
    payload.organization_data = {
      organization_name: data.name,
      organization_email: data.email,
      max_members: 10
    };
  }
  
  const response = await fetch('/api/onboarding/account-type', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  // Route to dashboard
  router.push(result.next_route);
}
```

---

## 🔧 For Backend Developers

### Using Dashboard Access Guard

```python
from middleware.context_guard import require_dashboard_access

# Protect dashboard routes
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_dashboard_access)
):
    # This will:
    # 1. Verify authentication
    # 2. Check subscription status
    # 3. Block if expired
    # 4. Return user if allowed
    
    return {"stats": "..."}
```

### Checking Organization Permission

```python
from middleware.context_guard import require_organization_access

@app.get("/api/organizations/{org_id}/members")
async def get_organization_members(
    org_id: str,
    current_user: User = Depends(
        lambda current_user=Depends(get_current_user): 
            require_organization_access(org_id, current_user, "admin")
    )
):
    # This will:
    # 1. Verify user is member of org
    # 2. Check user has admin role
    # 3. Check org subscription is active
    # 4. Return user if allowed
    
    return {"members": [...]}
```

### Creating Subscriptions

```python
from services.subscription_service import SubscriptionService
from models.identity_models import SubscriptionCreate, SubscriptionPlan

# Create subscription during onboarding
subscription_data = SubscriptionCreate(
    plan=SubscriptionPlan.SOLO,
    billing_cycle="monthly",
    trial_days=14
)

subscription = await SubscriptionService.create_subscription(
    subscription_data=subscription_data,
    business_id=business.id
)
```

---

## 📊 Database Collections

### businesses
Solo business profiles

**Fields:**
- `owner_id` - References users.id
- `business_name`
- `business_email`
- `industry`

### organizations
Multi-member organizations

**Fields:**
- `owner_id` - References users.id
- `organization_name`
- `organization_email`
- `max_members`

### memberships
Organization memberships

**Fields:**
- `organization_id`
- `user_id`
- `role` (owner/admin/member)
- `department_id` (optional)

### subscriptions
Subscription state

**Fields:**
- `user_id` OR `business_id` OR `organization_id`
- `plan` (personal/solo/org)
- `status` (active/trial/expired/none)
- `current_period_end`

---

## ✅ Testing

### Run Tests

```bash
cd backend
python test_phase2_identity.py
```

### Manual Testing

**Existing User:**
```bash
# Login as existing user
# Call /api/me/context
# Should return account_type: "personal"
# Should have subscription.status: "none"
# Should have full dashboard access
```

**New Business Account:**
```bash
# Register new user
# Call /api/onboarding/account-type with business_data
# Call /api/me/context
# Should return account_type: "business_solo"
# Should have subscription.status: "trial"
```

**New Organization Account:**
```bash
# Register new user
# Call /api/onboarding/account-type with organization_data
# Call /api/me/context
# Should return account_type: "organization", role: "owner"
# Should have subscription.status: "trial"
```

---

## 🚨 Common Issues

### Issue: Existing users can't access dashboard

**Solution:** Check that identity resolver returns `subscription.status = "none"` for users without subscriptions, and that free tier allows access.

### Issue: `/api/me/context` returns error

**Solution:**
1. Check Firestore collections are accessible
2. Verify imports in server.py
3. Check backend logs for specific error

### Issue: Onboarding creates record but returns error

**Solution:** Check subscription creation. If subscription creation fails, business/org records are rolled back automatically.

---

## 📚 Documentation

**Full Documentation:** `PHASE2_IDENTITY_IMPLEMENTATION.md`  
**This Guide:** `PHASE2_QUICK_START.md`

**Key Sections in Full Docs:**
- API Endpoints (complete reference)
- Database Schema (all fields)
- Identity Resolution Logic (how it works)
- Security & Access Control (rules)
- Deployment Guide (step by step)
- Troubleshooting (common issues)

---

## 🎯 Backward Compatibility Guarantee

✅ **Existing endpoints unchanged**
- `/api/me` - Still works exactly as before
- `/api/auth/login` - No changes
- `/api/auth/register` - No changes
- All link/ring/analytics endpoints - No changes

✅ **Existing users work automatically**
- No migration required
- Treated as personal accounts
- Full dashboard access
- No subscription enforcement (yet)

✅ **New functionality is additive**
- New endpoints don't affect old ones
- New collections are optional
- Identity resolution fails safely
- Subscription checks fail open

---

## 🚀 Deployment Checklist

- [ ] Create database indexes (see full docs)
- [ ] Deploy backend code
- [ ] Run Phase 2 tests
- [ ] Verify existing users still work
- [ ] Test new `/api/me/context` endpoint
- [ ] (Optional) Update frontend to use new endpoints
- [ ] Monitor logs for errors

---

## 💡 Tips

1. **Start Simple:** Use `/api/me/context` first, implement onboarding later
2. **Test with Existing Users:** Verify they still work before rolling out
3. **Monitor Logs:** Watch for identity resolution errors
4. **Fail Open:** System allows access if checks fail (safe default)
5. **Read Full Docs:** This is a quick start, full docs have all details

---

## 📞 Support

**Questions?**
- Read `PHASE2_IDENTITY_IMPLEMENTATION.md` for detailed info
- Check test file `test_phase2_identity.py` for examples
- Review service code for implementation details

**Issues?**
- Check backend logs for errors
- Verify Firestore collections exist
- Ensure indexes are created
- Test with existing users first

---

**Phase 2 Status:** ✅ COMPLETE  
**Backward Compatible:** 100%  
**Ready for Production:** YES

Happy developing! 🎉

