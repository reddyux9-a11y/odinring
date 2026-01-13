# 🔧 PWA Install Prompt Architecture

## ✅ CURRENT IMPLEMENTATION (CORRECT)

### Single Source of Truth: `usePWAInstall` Hook

The PWA install prompt is handled **exclusively** in `frontend/src/hooks/usePWAInstall.js`:

```javascript
// ✅ CORRECT: This is the ONLY place that handles beforeinstallprompt
useEffect(() => {
  const handleBeforeInstall = (e) => {
    e.preventDefault();
    setDeferredPrompt(e);  // React state, not global variable
    setIsInstallable(true);
  };

  // Only listen on supported browsers
  if (browserInfo.isChrome || browserInfo.isEdge || 
      (browserInfo.isAndroid && !browserInfo.isIOS)) {
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
  }

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  };
}, []);
```

---

## ❌ WHAT NOT TO DO

### DON'T add duplicate handlers in `mobileUtils.js`:

```javascript
// ❌ WRONG: Do NOT add this to mobileUtils.js
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;  // Global variable = bad practice
});
```

**Why this is wrong:**
1. Creates **duplicate event listeners** → Browser warnings
2. Uses **global variables** → Not React-friendly
3. **No cleanup** → Memory leaks
4. **No state management** → Components can't react to changes
5. **Always listens** → Even on unsupported browsers

---

## 🏗️ ARCHITECTURE

### Component Hierarchy:

```
App.js
  └─ usePWAInstall() hook
       ├─ State: deferredPrompt
       ├─ State: isInstallable
       ├─ State: isInstalled
       └─ Function: promptInstall()

Install.jsx / Landing.jsx / etc.
  └─ const { isInstallable, promptInstall } = usePWAInstall()
       └─ Uses hook data to show install button
```

---

## 🎯 HOW TO USE

### In Any Component:

```javascript
import usePWAInstall from '../hooks/usePWAInstall';

function MyComponent() {
  const { 
    isInstallable,   // true if user can install
    isInstalled,     // true if already installed
    promptInstall,   // function to trigger install
    browser,         // browser info
    getInstallInstructions  // get manual instructions
  } = usePWAInstall();

  const handleInstall = async () => {
    const result = await promptInstall();
    
    if (result.outcome === 'accepted') {
      console.log('✅ App installed!');
    } else if (result.outcome === 'ios_instruction_required') {
      // Show iOS manual instructions
      const instructions = getInstallInstructions();
      console.log('📱 iOS Instructions:', instructions);
    } else {
      console.log('❌ Install dismissed');
    }
  };

  if (isInstalled) {
    return <div>Already installed! 🎉</div>;
  }

  if (isInstallable) {
    return (
      <button onClick={handleInstall}>
        Install App
      </button>
    );
  }

  // iOS or unsupported browser - show manual instructions
  if (browser?.isIOS) {
    const instructions = getInstallInstructions();
    return <div>{instructions.description}</div>;
  }

  return null;
}
```

---

## 🔍 UPDATED `mobileUtils.js` FUNCTIONS

### Legacy PWA Functions (Updated):

```javascript
// ✅ Simple check if app is installed
export const isAppInstalled = () => {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches;
};

// ✅ Simple check if installation is possible
export const canInstallPWA = () => {
  return !isAppInstalled();
};
```

**Note:** For full PWA functionality, use the `usePWAInstall` hook instead of these utility functions.

---

## 📋 BROWSER SUPPORT

### Chrome/Edge (Android & Desktop):
- ✅ Native install prompt via `beforeinstallprompt`
- ✅ Programmatic installation via `prompt()`
- ✅ Full support

### Firefox:
- ⚠️ Manual installation only
- ✅ Shows install icon in address bar
- ❌ No `beforeinstallprompt` event

### Safari (iOS):
- ⚠️ Manual installation only
- ✅ "Add to Home Screen" via Share button
- ❌ No programmatic installation
- ❌ No `beforeinstallprompt` event

### Safari (macOS):
- ⚠️ Manual installation only
- ✅ "Add to Dock" via Share button
- ❌ No programmatic installation

---

## 🐛 TROUBLESHOOTING

### "Banner not shown: beforeinstallprompt..." warning

**Cause:** Duplicate event listeners

**Solution:** Ensure `beforeinstallprompt` is only handled in `usePWAInstall` hook

**Check:**
```bash
# Search for duplicate handlers
grep -r "beforeinstallprompt" frontend/src/
```

Should only appear in:
- ✅ `frontend/src/hooks/usePWAInstall.js` (correct)
- ❌ NOT in `mobileUtils.js`
- ❌ NOT in `App.js`
- ❌ NOT anywhere else

---

### Install button not showing

**Possible causes:**
1. App already installed → Check `isInstalled` state
2. Browser doesn't support it → Check `browser` info
3. PWA manifest issues → Check console for errors
4. HTTPS required → Local dev should use `localhost`
5. Service worker not registered → Check DevTools > Application

**Debug:**
```javascript
const { isInstallable, isInstalled, browser } = usePWAInstall();

console.log('Installable?', isInstallable);
console.log('Installed?', isInstalled);
console.log('Browser:', browser);
console.log('Standalone?', browser?.isStandalone);
```

---

## ✅ BEST PRACTICES

1. **Single Handler:** Only listen to `beforeinstallprompt` in `usePWAInstall`
2. **React State:** Use React state, not global variables
3. **Cleanup:** Always remove event listeners in useEffect cleanup
4. **Cross-Browser:** Handle iOS/Safari differently (manual instructions)
5. **Check Support:** Don't show install button on unsupported browsers
6. **User Experience:** Only prompt after meaningful engagement

---

## 🎉 SUMMARY

✅ **DO:**
- Use `usePWAInstall` hook for all PWA install functionality
- Handle iOS/Safari with manual instructions
- Clean up event listeners
- Use React state management

❌ **DON'T:**
- Add `beforeinstallprompt` listeners anywhere else
- Use `window.deferredPrompt` global variable
- Duplicate event handlers
- Forget to clean up listeners

---

**Current Status:** ✅ Implementation is correct!

The PWA architecture is properly set up with no duplicate handlers.

