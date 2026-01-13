import { useCallback, useEffect, useState } from 'react';

// Browser detection utility
export const detectBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  return {
    isIOS: /iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1),
    isAndroid: /android/.test(ua),
    isChrome: /chrome/.test(ua) && !/edg|opr|samsung/.test(ua),
    isEdge: /edg/.test(ua),
    isFirefox: /firefox/.test(ua),
    isSafari: /safari/.test(ua) && !/chrome|crios|fxios/.test(ua),
    isSamsung: /samsung/.test(ua),
    isOpera: /opr/.test(ua),
    isStandalone: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
  };
};

// Get installation instructions based on browser
export const getInstallInstructions = (browser) => {
  if (browser.isStandalone) {
    return null; // Already installed
  }

  if (browser.isIOS) {
    return {
      title: 'Install OdinRing on iOS',
      description: 'Tap the Share button (square with arrow) at the bottom of Safari, then scroll down and select "Add to Home Screen"',
      icon: 'share',
      steps: [
        'Tap the Share button (□↑) at the bottom of Safari',
        'Scroll down in the share sheet',
        'Tap "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    };
  }

  if (browser.isAndroid) {
    if (browser.isChrome || browser.isEdge) {
      return {
        title: 'Installation Instructions',
        description: 'Tap the menu (⋮) in the top right, then select "Install app" or "Add to Home screen"',
        icon: 'menu',
      };
    }
    if (browser.isSamsung) {
      return {
        title: 'Installation Instructions',
        description: 'Tap the menu (⋮), then select "Add page to" > "Home screen"',
        icon: 'menu',
      };
    }
    if (browser.isFirefox) {
      return {
        title: 'Installation Instructions',
        description: 'Tap the menu (⋮), then tap the "Install" icon in the menu',
        icon: 'menu',
      };
    }
  }

  if (browser.isFirefox) {
    return {
      title: 'Installation Instructions',
      description: 'Click the install icon in the address bar, or go to Menu > Install',
      icon: 'address-bar',
    };
  }

  if (browser.isSafari && !browser.isIOS) {
    return {
      title: 'Installation Instructions',
      description: 'Click Share button in Safari toolbar, then "Add to Dock"',
      icon: 'share',
    };
  }

  return {
    title: 'Installation Instructions',
    description: 'Look for an install icon in your browser\'s address bar, or check the browser menu for "Install" option',
    icon: 'address-bar',
  };
};

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browser, setBrowser] = useState(null);

  useEffect(() => {
    // Detect browser on mount
    const browserInfo = detectBrowser();
    setBrowser(browserInfo);

    // Check if already installed
    if (browserInfo.isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Only listen for beforeinstallprompt on supported browsers
    if (browserInfo.isChrome || browserInfo.isEdge || (browserInfo.isAndroid && !browserInfo.isIOS)) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    }

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    // For iOS: We cannot programmatically trigger "Add to Home Screen"
    // Safari requires manual user action via the native share button
    // Return a special flag to indicate we need to show instructions
    if (browser?.isIOS && !browser.isStandalone) {
      return { outcome: 'ios_instruction_required' };
    }
    
    // For Android/Chrome: Use native install prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
        return choice;
      } catch (error) {
        console.error('Install prompt error:', error);
        return { outcome: 'dismissed' };
      }
    }
    return { outcome: 'dismissed' };
  }, [deferredPrompt, browser]);

  return { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    browser,
    getInstallInstructions: () => browser ? getInstallInstructions(browser) : null,
  };
}


