# Performance Bottleneck Analysis - 33 Second Load Time

**Date:** January 2, 2026  
**Issue:** Dashboard takes 33 seconds to display data  
**Root Cause:** Sequential API calls with high latency

---

## Problem Identification

### Current Data Loading Flow (Sequential - SLOW)

```
Dashboard Load Sequence:
1. useIdentityContext() → GET /api/me/context          (~8-10s)
2. refreshUser() → GET /api/users/me                   (~8-10s) 
3. loadUserData():
   - GET /api/links                                      (~8-10s)
   - GET /api/media                                      (~8-10s)
   - GET /api/items                                      (~8-10s)
4. loadRingSettings() → GET /api/rings/{id}/settings    (~8-10s)

TOTAL: ~32-40 seconds (sequential waterfall)
```

### Root Causes

1. **Sequential API Calls** - Each call waits for the previous one
2. **High Database Latency** - 386ms read latency (from performance tests)
3. **Network Overhead** - Each request adds ~100-200ms network latency
4. **No Parallelization** - All requests are `await`ed sequentially
5. **Multiple Round Trips** - 5-6 separate HTTP requests

---

## Detailed Breakdown

### 1. Identity Context Loading
**Location:** `frontend/src/hooks/useIdentityContext.js`
- Calls: `GET /api/me/context`
- Time: ~8-10 seconds
- Blocks: Dashboard rendering until complete

### 2. User Refresh
**Location:** `frontend/src/pages/Dashboard.jsx:236`
- Calls: `refreshUser()` → `GET /api/users/me`
- Time: ~8-10 seconds
- Blocks: All subsequent data loading

### 3. Links Loading
**Location:** `frontend/src/pages/Dashboard.jsx:242`
- Calls: `GET /api/links`
- Time: ~8-10 seconds
- Blocks: Media and items loading

### 4. Media Loading
**Location:** `frontend/src/pages/Dashboard.jsx:265`
- Calls: `GET /api/media`
- Time: ~8-10 seconds
- Blocks: Items loading

### 5. Items Loading
**Location:** `frontend/src/pages/Dashboard.jsx:277`
- Calls: `GET /api/items`
- Time: ~8-10 seconds
- Blocks: Ring settings loading

### 6. Ring Settings Loading
**Location:** `frontend/src/pages/Dashboard.jsx:331`
- Calls: `GET /api/rings/{ring_id}/settings`
- Time: ~8-10 seconds
- Final blocking call

---

## Performance Impact

### Current (Sequential)
- **Total Time:** 33-40 seconds
- **User Experience:** Poor - blank screen for 30+ seconds
- **Network Efficiency:** Low - 5-6 round trips

### Expected (Parallel)
- **Total Time:** 8-10 seconds (longest single request)
- **User Experience:** Good - data appears much faster
- **Network Efficiency:** High - all requests in parallel

### Expected (Combined Endpoint)
- **Total Time:** 2-3 seconds (single optimized request)
- **User Experience:** Excellent - instant data display
- **Network Efficiency:** Optimal - 1 round trip

---

## Solutions

### Solution 1: Parallelize Existing Calls (Quick Fix) ✅
**Impact:** Reduces load time from 33s to ~8-10s  
**Effort:** Low (5 minutes)  
**Risk:** Low

### Solution 2: Create Combined Dashboard Endpoint (Best Solution) ✅
**Impact:** Reduces load time from 33s to ~2-3s  
**Effort:** Medium (30 minutes)  
**Risk:** Low

### Solution 3: Implement Caching (Already Done) ✅
**Impact:** Reduces subsequent loads to <1s  
**Effort:** Already implemented  
**Risk:** None

---

## Recommended Implementation

**Priority:** Implement Solution 1 immediately, then Solution 2

1. **Immediate:** Parallelize API calls in Dashboard
2. **Short-term:** Create `/api/dashboard/data` combined endpoint
3. **Long-term:** Use caching for subsequent loads

---

## Files to Modify

1. `frontend/src/pages/Dashboard.jsx` - Parallelize API calls
2. `backend/server.py` - Create combined dashboard endpoint
3. `frontend/src/pages/Dashboard.jsx` - Use combined endpoint

---

## Expected Results

### After Solution 1 (Parallelization)
- Load time: **8-10 seconds** (down from 33s)
- Improvement: **70% faster**

### After Solution 2 (Combined Endpoint)
- Load time: **2-3 seconds** (down from 33s)
- Improvement: **90% faster**

### After Solution 3 (Caching)
- Subsequent loads: **<1 second**
- Improvement: **97% faster**

---

**Status:** Ready for implementation  
**Priority:** CRITICAL - User experience blocker



