import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { QrCode, LogIn, UserPlus, Share2, Download, X } from 'lucide-react';
import { isMobileDevice } from '../utils/mobileUtils';
import { toast } from 'sonner';

const MobileLanding = () => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loadingQR, setLoadingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Generate QR code for sharing the app
  const generateShareQR = () => {
    setLoadingQR(true);
    try {
      // Get the current app URL
      const appUrl = window.location.origin;
      
      // Use public QR code service (no authentication required)
      // This generates a QR code that links to the OdinRing app
      const qrServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(appUrl)}`;
      setQrCodeUrl(qrServiceUrl);
      setShowQR(true);
      toast.success('QR code generated!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OdinRing - Share Your Digital Identity',
          text: 'Check out OdinRing - Your all-in-one digital identity platform!',
          url: window.location.origin
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          generateShareQR();
        }
      }
    } else {
      generateShareQR();
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'odinring-share-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    }
  };

  // Only show on mobile devices
  useEffect(() => {
    if (!isMobileDevice()) {
      // Redirect to regular landing page on desktop
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-primary-foreground">OR</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">OdinRing</h1>
          <p className="text-muted-foreground text-center text-sm">
            Your all-in-one digital identity platform
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 text-lg"
            size="lg"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
          
          <Button
            className="w-full h-14 text-lg"
            variant="outline"
            size="lg"
            onClick={() => navigate('/auth?tab=register')}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Sign Up
          </Button>
        </div>

        {/* Share Section */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-semibold text-center">
                Share OdinRing with Friends
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Scan the QR code to access OdinRing on another device
              </p>
              
              {!showQR ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={generateShareQR}
                  disabled={loadingQR}
                >
                  {loadingQR ? (
                    <>
                      <QrCode className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Show QR Code
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4 w-full">
                  <div className="flex justify-center relative">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img
                        src={qrCodeUrl}
                        alt="OdinRing Share QR Code - Scan to access the app"
                        className="w-64 h-64"
                        onError={(e) => {
                          toast.error('Failed to load QR code');
                          setShowQR(false);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 bg-background rounded-full shadow-md"
                      onClick={() => setShowQR(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Scan this QR code with another phone to access OdinRing
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDownloadQR}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip to regular landing */}
        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => navigate('/')}
        >
          Continue to Website
        </Button>
      </div>
    </div>
  );
};

export default MobileLanding;
