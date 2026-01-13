// Mobile-first utility functions for OdinRing

/**
 * Device Detection
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Screen Size Detection
 */
export const getScreenSize = () => {
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 768) return 'mobile-lg';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop';
  return 'desktop-xl';
};

export const isMobileScreen = () => {
  const size = getScreenSize();
  return size === 'mobile' || size === 'mobile-lg';
};

/**
 * Touch & Gesture Utilities
 */
export const addHapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50,
      success: [10, 10, 10],
      error: [50, 50, 50],
      warning: [20, 10, 20]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};

export const handleTouchFeedback = (element, callback) => {
  let touchStart = null;
  let touchTimeout = null;

  const onTouchStart = (e) => {
    touchStart = Date.now();
    element.style.transform = 'scale(0.98)';
    element.style.opacity = '0.8';
    
    // Long press detection
    touchTimeout = setTimeout(() => {
      if (callback.onLongPress) {
        addHapticFeedback('medium');
        callback.onLongPress(e);
      }
    }, 500);
  };

  const onTouchEnd = (e) => {
    clearTimeout(touchTimeout);
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
    
    const touchEnd = Date.now();
    const touchDuration = touchEnd - touchStart;
    
    if (touchDuration < 500 && callback.onTap) {
      addHapticFeedback('light');
      callback.onTap(e);
    }
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchEnd);
  };
};

/**
 * Safe Area & Viewport Utilities
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0')
  };
};

export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

/**
 * Performance & Loading Utilities
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getConnectionSpeed = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

/**
 * Mobile-Specific Event Handlers
 */
export const addSwipeGesture = (element, callbacks = {}) => {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  
  const minSwipeDistance = 50;
  const maxVerticalDistance = 100;

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    startX = currentX = touch.clientX;
    startY = currentY = touch.clientY;
  };

  const onTouchMove = (e) => {
    if (!e.touches[0]) return;
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    if (Math.abs(deltaY) > maxVerticalDistance) return;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && callbacks.onSwipeRight) {
        addHapticFeedback('light');
        callbacks.onSwipeRight();
      } else if (deltaX < 0 && callbacks.onSwipeLeft) {
        addHapticFeedback('light');
        callbacks.onSwipeLeft();
      }
    }
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
  };
};

/**
 * Mobile Keyboard Utilities
 */
export const handleMobileKeyboard = () => {
  const initialViewportHeight = window.innerHeight;
  let isKeyboardVisible = false;

  const checkKeyboard = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    const wasKeyboardVisible = isKeyboardVisible;
    
    isKeyboardVisible = heightDifference > 150; // Threshold for keyboard

    if (isKeyboardVisible !== wasKeyboardVisible) {
      document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('keyboardToggle', {
        detail: { visible: isKeyboardVisible, height: heightDifference }
      }));
    }
  };

  window.addEventListener('resize', checkKeyboard);
  window.addEventListener('orientationchange', () => {
    setTimeout(checkKeyboard, 500);
  });

  return () => {
    window.removeEventListener('resize', checkKeyboard);
  };
};

/**
 * Share API Utilities
 */
export const canShare = () => {
  return 'share' in navigator;
};

export const shareContent = async (data) => {
  if (canShare()) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * PWA Utilities
 * Note: These are legacy functions. Use the usePWAInstall hook for better PWA management.
 * The hook provides proper React state management and cross-browser support.
 */
export const canInstallPWA = () => {
  // Check if app is already installed
  const isStandalone = window.navigator.standalone || 
                      window.matchMedia('(display-mode: standalone)').matches;
  return !isStandalone;
};

export const isAppInstalled = () => {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Mobile-Optimized Animations
 */
export const getMobileAnimationConfig = () => {
  const reducedMotion = prefersReducedMotion();
  const lowPerformance = getConnectionSpeed()?.saveData;
  
  return {
    duration: reducedMotion ? 0 : lowPerformance ? 0.2 : 0.3,
    easing: 'ease-out',
    scale: reducedMotion ? 1 : 0.98,
    translateY: reducedMotion ? 0 : -2
  };
};

/**
 * Initialize Mobile Environment
 */
export const initializeMobileEnvironment = () => {
  // Set CSS custom properties for safe areas
  if (isIOS()) {
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
  }

  // Set viewport height variable
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });

  // Initialize keyboard handling
  handleMobileKeyboard();

  // Add mobile device class
  document.body.classList.add(
    isMobileDevice() ? 'mobile-device' : 'desktop-device',
    isIOS() ? 'ios' : isAndroid() ? 'android' : 'other',
    isTouchDevice() ? 'touch-device' : 'no-touch'
  );

  // Note: PWA install prompt is handled by usePWAInstall hook
  // to avoid duplicate handlers and warnings
};

export default {
  isMobileDevice,
  isIOS,
  isAndroid,
  isTouchDevice,
  getScreenSize,
  isMobileScreen,
  addHapticFeedback,
  handleTouchFeedback,
  getSafeAreaInsets,
  setViewportHeight,
  prefersReducedMotion,
  getConnectionSpeed,
  addSwipeGesture,
  handleMobileKeyboard,
  canShare,
  shareContent,
  canInstallPWA,
  isAppInstalled,
  getMobileAnimationConfig,
  initializeMobileEnvironment
};