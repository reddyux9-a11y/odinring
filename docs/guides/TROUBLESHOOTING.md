# Troubleshooting Guide

## Current Issues & Solutions

### 1. Deprecated Meta Tag Warning

**Warning:**
```
<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. 
Please include <meta name="mobile-web-app-capable" content="yes">
```

**Status:** ✅ Fixed in code, but browser cache may show old version

**Solution:**
1. **Hard Refresh Browser:**
   - **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - **Safari:** `Cmd+Option+R`

2. **Clear Browser Cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

3. **Verify Fix:**
   - Open DevTools → Elements tab
   - Check `<head>` section
   - Should see both:
     ```html
     <meta name="apple-mobile-web-app-capable" content="yes" />
     <meta name="mobile-web-app-capable" content="yes" />
     ```

---

### 2. PWA Install Banner Warning

**Warning:**
```
Banner not shown: beforeinstallpromptevent.preventDefault() called. 
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

**Status:** ✅ This is expected behavior, not an error

**Explanation:**
- The app prevents the default browser install banner
- It stores the prompt for manual triggering via the `usePWAInstall` hook
- The warning appears until the user triggers installation
- This is intentional - the app controls when to show the install prompt

**Solution:**
- This warning can be safely ignored
- The install functionality works via the `usePWAInstall` hook
- Users can install via the app's install button/UI

**To Suppress (Optional):**
If you want to suppress this warning, you can add this to your browser console filter:
```javascript
// Filter out this specific warning in DevTools
// Settings → Console → Filter → Add: -beforeinstallprompt
```

---

### 3. WebSocket Connection Errors

**Errors:**
```
WebSocket connection to 'ws://localhost:3000/ws' failed
GET http://localhost:3000/main.23020d1….hot-update.json net::ERR_CONNECTION_RESET
```

**Status:** ⚠️ Dev server issue

**Causes:**
- React dev server (webpack) hot module replacement (HMR) issues
- Network/firewall blocking WebSocket connections
- Dev server crashed or restarted
- Port conflicts

**Solutions:**

1. **Restart Frontend Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   cd frontend
   npm start
   ```

2. **Clear Build Cache:**
   ```bash
   cd frontend
   rm -rf node_modules/.cache
   npm start
   ```

3. **Check Port Availability:**
   ```bash
   # Check if port 3000 is in use
   lsof -i :3000
   
   # Kill process if needed
   lsof -ti :3000 | xargs kill -9
   ```

4. **Disable HMR (if persistent):**
   - Create/update `frontend/.env`:
     ```
     FAST_REFRESH=false
     WDS_SOCKET_PORT=0
     ```

5. **Check Firewall/Antivirus:**
   - Ensure localhost connections aren't blocked
   - WebSocket connections need to be allowed

---

### 4. JSONP Chunk Loading Error

**Error:**
```
GET http://localhost:3000/main.23020d1….hot-update.json net::ERR_CONNECTION_RESET
```

**Status:** Related to WebSocket/HMR issues

**Solution:**
- Same as WebSocket errors above
- Usually resolves after restarting dev server

---

## Quick Fix Checklist

1. ✅ **Hard refresh browser** (Cmd+Shift+R / Ctrl+Shift+R)
2. ✅ **Restart frontend dev server**
3. ✅ **Clear browser cache** if warnings persist
4. ✅ **Check both servers are running:**
   - Backend: http://localhost:8000/docs
   - Frontend: http://localhost:3000

---

## Verification Steps

### Check Meta Tag Fix:
```bash
# In browser DevTools Console:
document.querySelector('meta[name="mobile-web-app-capable"]')
# Should return the meta element, not null
```

### Check PWA Hook:
```bash
# In browser DevTools Console:
# The warning is expected - check if install button works
```

### Check WebSocket:
```bash
# In browser DevTools → Network tab
# Filter: WS (WebSocket)
# Should see successful connection to ws://localhost:3000/ws
```

---

## If Issues Persist

1. **Stop all servers:**
   ```bash
   # Kill processes on ports 8000 and 3000
   lsof -ti :8000 | xargs kill -9
   lsof -ti :3000 | xargs kill -9
   ```

2. **Clear all caches:**
   ```bash
   # Frontend
   cd frontend
   rm -rf node_modules/.cache build .eslintcache
   
   # Browser: Clear cache and hard reload
   ```

3. **Restart fresh:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Hard refresh browser** (Cmd+Shift+R)

---

## Expected vs Actual Behavior

| Issue | Expected | Actual | Action Needed |
|-------|----------|--------|---------------|
| Meta tag warning | None | Shows (cached) | Hard refresh browser |
| PWA banner warning | Can appear | Appears | Ignore (expected) |
| WebSocket errors | None | Shows | Restart dev server |
| JSONP errors | None | Shows | Restart dev server |

---

## Contact

If issues persist after trying all solutions:
1. Check browser console for specific error messages
2. Check terminal output for server errors
3. Verify environment variables are set correctly
4. Review `LOCAL_SETUP.md` for setup verification

