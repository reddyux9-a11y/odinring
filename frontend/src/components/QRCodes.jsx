import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { sanitizeUsernameForUrl } from "../lib/utils";
import { 
  QrCode, 
  Download, 
  Eye, 
  BarChart3, 
  User, 
  Link as LinkIcon,
  Share,
  RefreshCw,
  ExternalLink,
  Loader2,
  X,
  Edit
} from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Loading component for QR codes
const QRCodeLoader = ({ size = "w-8 h-8" }) => (
  <div className={`${size} bg-muted rounded-lg flex items-center justify-center animate-pulse`}>
    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
  </div>
);

// Lazy load QR code image component
const LazyQRImage = ({ src, alt, className, fallback }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setHasError(false);
      
      // Check if image is already cached
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      img.src = src;
    }
  }, [src]);

  if (hasError) {
    return fallback || <QRCodeLoader size="w-full h-full" />;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <QRCodeLoader size="w-6 h-6" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

const QRCodes = ({ user, links = [], onNavigateToAnalytics }) => {
  const [profileQR, setProfileQR] = useState("");
  const [linkQRs, setLinkQRs] = useState({});
  const [analytics, setAnalytics] = useState({
    total_scans: 0,
    profile_scans: 0,
    link_scans: 0,
    recent_scans: []
  });
  const [loading, setLoading] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadQRAnalytics();
    generateProfileQR(); // Pre-generate profile QR
    
    // Set up automatic refresh every 2 minutes (reduced from 30 seconds)
    const interval = setInterval(() => {
      loadQRAnalytics();
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // Track previous links to avoid regenerating unchanged QRs
  const prevLinksRef = useRef([]);
  
  // Generate link QRs only when links actually change (by ID/content)
  useEffect(() => {
    const linksChanged = JSON.stringify(links.map(l => ({ id: l.id, url: l.url, title: l.title }))) !== 
                         JSON.stringify(prevLinksRef.current.map(l => ({ id: l.id, url: l.url, title: l.title })));
    
    if (links.length > 0 && linksChanged) {
      prevLinksRef.current = links;
      generateAllLinkQRs();
    }
  }, [links]);

  const loadQRAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await api.get(`/qr/analytics`);
      console.log('QR Analytics API Response:', response.data);
      setAnalytics(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load QR analytics:', error);
      // Set default values on error
      setAnalytics({
        total_scans: 0,
        profile_scans: 0,
        link_scans: 0,
        recent_scans: []
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const generateProfileQR = async () => {
    if (profileQR) return; // Already generated
    
    setGeneratingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/qr/profile/base64`);
      setProfileQR(response.data.qr_code);
      setGeneratingProfile(false); // Stop loading immediately after getting QR
    } catch (error) {
      console.error('Failed to generate profile QR:', error);
      setGeneratingProfile(false);
    }
  };

  const generateAllLinkQRs = async () => {
    if (links.length === 0) return;
    
    setGeneratingLinks(true);
    try {
      const token = localStorage.getItem('token');
      const qrPromises = links.map(async (link) => {
        try {
          const response = await api.get(`/qr/link/${link.id}/base64`);
          return { linkId: link.id, qrCode: response.data.qr_code };
        } catch (error) {
          console.error(`Failed to generate QR for link ${link.id}:`, error);
          return { linkId: link.id, qrCode: null };
        }
      });
      
      const results = await Promise.all(qrPromises);
      const qrMap = {};
      results.forEach(({ linkId, qrCode }) => {
        if (qrCode) qrMap[linkId] = qrCode;
      });
      setLinkQRs(qrMap);
      setGeneratingLinks(false); // Stop loading immediately after getting QRs
    } catch (error) {
      console.error('Failed to generate link QRs:', error);
      setGeneratingLinks(false);
    }
  };

  const downloadQR = async (type, linkId = null, format = 'png') => {
    try {
      const token = localStorage.getItem('token');
      let url;
      
      if (type === 'profile') {
        url = `/qr/profile/download?format=${format}`;
      } else {
        url = `/qr/link/${linkId}/download?format=${format}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type === 'profile' ? 'profile' : `link-${linkId}`}-qr.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      addHapticFeedback('success');
      mobileToast.success("QR code downloaded successfully!");
    } catch (error) {
      console.error('Download failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to download QR code");
    }
  };

  const shareQR = async (qrDataUrl, title) => {
    try {
    if (navigator.share) {
        // Convert base64 to blob for sharing
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${title}-qr.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${title} QR Code`,
          text: `Check out my ${title.toLowerCase()} QR code!`,
          files: [file]
        });
        addHapticFeedback('success');
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(qrDataUrl);
      mobileToast.success("QR code copied to clipboard! 📋");
    }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const viewProfile = () => {
    const sanitizedUsername = sanitizeUsernameForUrl(user?.username || '');
    const profileUrl = `${window.location.origin}/profile/${sanitizedUsername}`;
    window.open(profileUrl, '_blank');
  };

  const handleQRClick = (qrData, title, type = 'profile', linkId = null) => {
    setSelectedQR({ data: qrData, title, type, linkId });
    setShowQRDialog(true);
  };

  const refreshAnalytics = () => {
    loadQRAnalytics();
  };

  return (
    <FadeInUp>
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto bg-card rounded-t-3xl shadow-2xl min-h-screen overflow-hidden flex flex-col">
          {/* Header - Fixed Full Width */}
          <div className="flex items-center space-x-3 px-6 pt-6 pb-4 bg-card border-b border-border flex-shrink-0 sticky top-0 z-10">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">QR Codes</h2>
              <p className="text-muted-foreground text-sm">Share your profile and links</p>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 space-y-4 py-4">
              {/* Profile QR Card and Business Card - Horizontal Scrollable Layout - Commented out */}
              {/* <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
                <div className="flex gap-4 flex-nowrap min-w-max">
                  <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 shadow-lg flex-shrink-0 w-[320px]">
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-16 h-16 bg-white rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => profileQR && handleQRClick(profileQR, 'Profile QR', 'profile')}
                          >
                            {profileQR ? (
                              <img
                                src={profileQR}
                                alt="Profile QR Code"
                                className="w-full h-full object-contain"
                              />
                            ) : generatingProfile ? (
                              <QRCodeLoader size="w-full h-full" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-base mb-1">Profile QR</h3>
                          <p className="text-gray-300 text-xs leading-relaxed">Share your complete profile</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={viewProfile}
                          className="bg-white hover:bg-gray-100 text-slate-800 border-0 h-8 text-xs font-medium flex-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View & Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAnalyticsModal(true)}
                          className="bg-gray-700/50 hover:bg-gray-600/70 text-white border-gray-600/50 h-8 text-xs font-medium flex-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                          Stats
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-b from-teal-400 to-teal-700 border-0 shadow-lg flex-shrink-0 w-[320px]">
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => profileQR && handleQRClick(profileQR, 'Business Card', 'profile')}
                          >
                            {profileQR ? (
                              <img
                                src={profileQR}
                                alt="Business Card QR Code"
                                className="w-full h-full object-contain"
                              />
                            ) : generatingProfile ? (
                              <QRCodeLoader size="w-full h-full" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-100 font-bold text-base mb-1">Business Card</h3>
                          <p className="text-gray-100/90 text-xs leading-relaxed">Network like a pro with your digital card.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={viewProfile}
                          className="bg-white hover:bg-gray-100 text-blue-600 border-0 h-8 text-xs font-medium flex-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View & Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAnalyticsModal(true)}
                          className="bg-teal-800 hover:bg-teal-700 text-gray-100 border-teal-700/50 h-8 text-xs font-medium flex-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                          Stats
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div> */}

            {/* Analytics Summary - Accordion */}
            <Accordion type="single" collapsible className="bg-card border border-border rounded-lg shadow-sm">
              <AccordionItem value="analytics" className="border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
                        <BarChart3 className="w-3 h-3 text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">QR Analytics</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshAnalytics();
                      }}
                      disabled={analyticsLoading}
                      className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                    >
                      <RefreshCw className={`h-3 w-3 ${analyticsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-3">
                    Track your QR code performance
                    {lastUpdated && (
                      <span className="block text-xs text-muted-foreground/70 mt-1">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-muted rounded-lg animate-pulse">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted-foreground/20 rounded mb-1"></div>
                            <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-foreground">{analytics.total_scans}</p>
                          <p className="text-xs text-muted-foreground">Total Scans</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-foreground">{analytics.profile_scans}</p>
                          <p className="text-xs text-muted-foreground">Profile Scans</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <LinkIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-foreground">{analytics.link_scans}</p>
                          <p className="text-xs text-muted-foreground">Link Scans</p>
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

              {/* Link QR Cards */}
              {links.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Link QR Codes</h3>
                    {generatingLinks && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </div>
                    )}
                  </div>
                    {links.map((link) => (
                    <Card key={link.id} className="bg-card border border-border shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          {/* QR Code */}
                          <div className="flex-shrink-0">
                            <div 
                              className="w-12 h-12 bg-muted rounded-md p-1 border border-border cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => linkQRs[link.id] && handleQRClick(linkQRs[link.id], `${link.title} QR`, 'link', link.id)}
                            >
                              {linkQRs[link.id] ? (
                                <img
                                  src={linkQRs[link.id]}
                                  alt={`${link.title} QR Code`}
                                  className="w-full h-full object-contain"
                                />
                              ) : generatingLinks ? (
                                <QRCodeLoader size="w-full h-full" />
                              ) : (
                                <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                  <QrCode className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-foreground mb-1">{link.title}</h4>
                              <p className="text-muted-foreground text-xs truncate">{link.description || link.url}</p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(link.url, '_blank')}
                                className="text-muted-foreground border-border hover:bg-muted rounded-md px-2 py-1 text-xs h-6"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Visit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQR('link', link.id, 'png')}
                                className="text-muted-foreground border-border hover:bg-muted rounded-md px-2 py-1 text-xs h-6"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                PNG
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQR('link', link.id, 'svg')}
                                className="text-muted-foreground border-border hover:bg-muted rounded-md px-2 py-1 text-xs h-6"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                SVG
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Analytics Modal */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-sm mx-auto bg-card rounded-xl shadow-lg">
          <DialogHeader className="pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-medium text-foreground flex items-center space-x-2">
                <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-foreground" />
                </div>
                <span>QR Analytics</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalyticsModal(false)}
                className="h-6 w-6 p-0 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-3">
            {analyticsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-muted rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted-foreground/20 rounded mb-1"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">{analytics.total_scans}</p>
                    <p className="text-xs text-muted-foreground">Total QR Scans</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">{analytics.profile_scans}</p>
                    <p className="text-xs text-muted-foreground">Profile QR Scans</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">{analytics.link_scans}</p>
                    <p className="text-xs text-muted-foreground">Link QR Scans</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-3 border-t border-border">
              <Button
                onClick={() => {
                  setShowAnalyticsModal(false);
                  if (onNavigateToAnalytics) {
                    onNavigateToAnalytics();
                  }
                }}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm h-8"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Full Analytics
              </Button>
            </div>
      </div>
        </DialogContent>
      </Dialog>

      {/* Individual QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="w-full max-w-sm mx-auto bg-white rounded-t-xl shadow-lg fixed bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full data-[state=open]:translate-y-0 transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto pb-safe [&>button]:hidden">
          <div className="px-6 pt-4 pb-8">
            {/* Drag Handle */}
            <div className="flex justify-center items-center mb-4 relative">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRDialog(false)}
                className="absolute right-0 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900">{selectedQR?.title}</h3>
              </div>
            </div>
            
            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
                {selectedQR?.data ? (
                  <img
                    src={selectedQR.data}
                    alt={selectedQR.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    if (selectedQR?.type === 'profile') {
                      downloadQR('profile', null, 'png');
                    } else {
                      downloadQR('link', selectedQR?.linkId, 'png');
                    }
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm h-9"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  onClick={() => {
                    if (selectedQR?.type === 'profile') {
                      downloadQR('profile', null, 'svg');
                    } else {
                      downloadQR('link', selectedQR?.linkId, 'svg');
                    }
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm h-9"
                >
                  <Download className="w-4 h-4 mr-2" />
                  SVG
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  if (selectedQR?.data) {
                    shareQR(selectedQR.data, selectedQR.title);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm h-9"
              >
                <Share className="w-4 h-4 mr-2" />
                Share QR Code
              </Button>
              
              {/* Link Info for Link QRs */}
              {selectedQR?.type === 'link' && selectedQR?.linkId && (
                <div className="pt-3 border-t border-gray-200 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">QR Code for:</p>
                    <Button
                      onClick={() => {
                        const link = links.find(l => l.id === selectedQR.linkId);
                        if (link) {
                          window.open(link.url, '_blank');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-lg text-xs h-7"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Visit Link
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FadeInUp>
  );
};

export default QRCodes;