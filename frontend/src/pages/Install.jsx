import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Download, Smartphone, Share2, ArrowLeft } from "lucide-react";
import usePWAInstall from "../hooks/usePWAInstall";

const Install = () => {
  const { isInstallable, isInstalled, promptInstall, browser } = usePWAInstall();
  const [isLoading, setIsLoading] = React.useState(false);

  // Open native share sheet for iOS
  const openIOSShareSheet = async () => {
    setIsLoading(true);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OdinRing',
          text: 'Install OdinRing App',
          url: window.location.origin
        });
      } catch (err) {
        // User cancelled or share failed, that's okay
        if (err.name !== 'AbortError') {
          console.log('Share cancelled or failed');
        }
      }
    }
    setIsLoading(false);
  };

  // Handle install button click
  const handleInstall = async () => {
    setIsLoading(true);
    try {
      const result = await promptInstall();
      // If iOS, directly open share sheet
      if (result?.outcome === 'ios_instruction_required') {
        await openIOSShareSheet();
      }
    } catch (error) {
      console.log('Install prompt error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center overflow-hidden bg-background border border-border">
            <img 
              src="/OdinRingLogo.png" 
              alt="OdinRing Logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground">Install OdinRing</h1>
          <p className="text-muted-foreground">
            Get the app-like experience with offline support and faster access
          </p>
        </div>

        {isInstalled ? (
          <div className="text-center space-y-4 p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">App Installed!</h2>
            <p className="text-sm text-muted-foreground">
              OdinRing is already installed on your device.
            </p>
            <Link to="/dashboard">
              <Button className="w-full mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {browser?.isIOS ? (
              <div className="text-center space-y-4 p-6 rounded-2xl border border-border bg-card">
                <Share2 className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Install on iOS</h2>
                <p className="text-sm text-muted-foreground">
                  Tap the button below to open the share menu, then scroll down and select "Add to Home Screen"
                </p>
                <Button 
                  onClick={handleInstall}
                  disabled={isLoading}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opening...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Open Share Menu
                    </>
                  )}
                </Button>
              </div>
            ) : browser?.isAndroid ? (
              <div className="text-center space-y-4 p-6 rounded-2xl border border-border bg-card">
                <Download className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Install on Android</h2>
                <p className="text-sm text-muted-foreground">
                  {isInstallable 
                    ? "Tap the button below to install OdinRing on your device"
                    : "Tap the button below or use your browser menu to install."}
                </p>
                <Button 
                  onClick={handleInstall}
                  disabled={isLoading}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </>
                  )}
                </Button>
                {!isInstallable && (
                  <p className="text-xs text-muted-foreground mt-2">
                    If the prompt doesn't appear, look for the install icon in your browser menu (⋮) or address bar
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 p-6 rounded-2xl border border-border bg-card">
                <Download className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Install OdinRing</h2>
                <p className="text-sm text-muted-foreground">
                  {isInstallable 
                    ? "Tap the button below to install OdinRing on your device"
                    : "Check your browser menu or address bar for the install option"}
                </p>
                <Button 
                  onClick={handleInstall}
                  disabled={isLoading || !isInstallable}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Having trouble? Make sure you're using a supported browser on a mobile device.</p>
        </div>
      </div>
    </div>
  );
};

export default Install;

