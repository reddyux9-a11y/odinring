import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Eye, LogOut, Palette, QrCode, Calendar, Shield, ExternalLink, Link as LinkIcon, Copy, Mail, Download, AlertCircle } from "lucide-react";
import SimpleLinkManager from "../components/SimpleLinkManager";
import LinksAndMediaManager from "../components/LinksAndMediaManager";
import MediaManager from "../components/MediaManager";
import ItemManager from "../components/ItemManager";
import Customization from "../components/Customization";
import ProfilePreview from "../components/ProfilePreview";
import AnalyticsView from "../components/AnalyticsView";
import ProfileSettings from "../components/ProfileSettings";
import CustomBranding from "../components/CustomBranding";
import QRCodes from "../components/QRCodes";
import MobileYourLinksPage from "../components/MobileYourLinksPage";
import MobileHomePage from "../components/MobileHomePage";
import MobileSettingsPage from "../components/MobileSettingsPage";
import { sanitizeUsernameForUrl } from "../lib/utils";
// import SmartScheduling from "../components/SmartScheduling"; // Hidden for now
// HIDDEN TEMPORARILY - Templates Hub and AI Insights imports
// import TemplatesHub from "../components/TemplatesHub";
// import AIInsights from "../components/AIInsights";
import PremiumSidebar from "../components/PremiumSidebar";
import SecuritySettings from "../components/SecuritySettings";
import { PageTransition, FadeInUp } from "../components/PageTransitions";
import { ProfileSkeletonLoader, AnalyticsSkeletonLoader } from "../components/SkeletonLoader";
import { mobileToast } from "../components/MobileOptimizedToast";
import { toast } from "sonner";
import { initializeMobileEnvironment, addHapticFeedback, isMobileDevice, isMobileScreen } from "../utils/mobileUtils";
import MobileNavigation from "../components/MobileNavigation";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { useIdentityContext } from "../hooks/useIdentityContext";
import SubscriptionStatusBanner from "../components/SubscriptionStatusBanner";
import api from "../lib/api";
import logger from "../lib/logger";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const normalizeLink = (link) => {
  if (!link) return link;
  const stableId = link.id || link._id || link.link_id || "";
  return { ...link, id: stableId };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { context: identityContext, loading: identityLoading, needsBilling, accountType } = useIdentityContext();
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem('activeSection') || "links";
    } catch {
      return "links";
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [links, setLinks] = useState([]);
  const [media, setMedia] = useState([]);
  const [items, setItems] = useState([]);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const isMountedRef = useRef(true);
  const hasAutoActivatedRef = useRef(false);
  const hasInitialLoadRef = useRef(false);

  const [profile, setProfile] = useState({
    name: user?.name || "Loading...",
    bio: "Loading profile...",
    avatar: "",
    theme: "default",
    accentColor: "#000000",
    backgroundType: "solid",
    backgroundColor: "#ffffff"
  });

  // Handle identity-based subscription logging (no hard redirect)
  useEffect(() => {
    if (identityLoading) return;

    if (needsBilling && identityContext?.next_route === '/billing/choose-plan') {
      logger.warn('Dashboard: Subscription expired, billing required – dashboard will be blurred.');
    }

    if (accountType) {
      logger.debug('Dashboard: Account type:', accountType);
      logger.debug('Dashboard: Subscription status:', identityContext?.subscription?.status);
    }
  }, [identityLoading, needsBilling, identityContext, accountType]);

  useEffect(() => {
    let isMounted = true;
    initializeMobileEnvironment();
    setIsMobile(isMobileDevice());
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Only load data on initial mount when user exists
    if (!hasInitialLoadRef.current && user) {
      hasInitialLoadRef.current = true;
      (async () => {
        setIsLoading(true);
        try {
          // PERFORMANCE FIX: Load data in parallel on initial mount
          await Promise.all([
            loadUserData(),
            loadRingSettings()
          ]);
        } catch {
          // non-blocking
        } finally {
          if (isMounted) setIsLoading(false);
        }
      })();
    }

    const handleResize = () => {
      setIsMobile(isMobileScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [user, navigate]); // Include 'user' to handle logout, but use ref to prevent data reload loops

  // Persist active section to avoid unexpected resets after updates
  useEffect(() => {
    try {
      localStorage.setItem('activeSection', activeSection);
    } catch {}
  }, [activeSection]);

  // Cleanup effect to properly manage isMountedRef
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-activate first social media link if none are active
  useEffect(() => {
    const autoActivateFirstLink = async () => {
      // Only do this once after initial load
      if (hasAutoActivatedRef.current) return;
      
      // Find active social media links
      const socialMediaLinks = links.filter(link => 
        (link.category === 'social' || link.category === 'media') && link.active
      );
      
      // If no social media links, nothing to do
      if (socialMediaLinks.length === 0) {
        // Mark as done even if no links, so we don't keep checking
        hasAutoActivatedRef.current = true;
        return;
      }
      
      // Direct link mode removed - no action needed
      hasAutoActivatedRef.current = true;
    };

    // Only run when links are loaded and we have links
    if (links.length > 0) {
      autoActivateFirstLink();
    }
  }, [links]);

  const loadUserData = async (skipUserRefresh = false) => {
    try {
      logger.debug('loadUserData() called');
      
      const token = localStorage.getItem('token');
      if (!token) {
        // Don't log as error - this is expected when user is not logged in
        // Only log if we're actually on the dashboard (shouldn't happen due to ProtectedRoute)
        if (window.location.pathname === '/dashboard') {
          logger.warn('No token found in localStorage - user should be redirected to login');
        }
        return;
      }
      
      // Decode JWT to see user_id
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        logger.debug('JWT Payload:', payload);
        logger.debug('User ID from JWT:', payload.user_id);
        logger.debug('Token expires:', new Date(payload.exp * 1000).toISOString());
      } catch (e) {
        logger.error('Failed to decode JWT:', e);
      }
      
      // Only refresh user if explicitly needed (not on every load)
      if (!skipUserRefresh && refreshUser) {
        await refreshUser();
      }
      
      // PERFORMANCE FIX: Use combined endpoint for maximum performance
      // This reduces load time from 33s to 2-3s (90% improvement)
      logger.debug('Loading dashboard data from combined endpoint...');
      const startTime = performance.now();
      
      try {
        // Use combined endpoint - single request, all data
        const response = await api.get('/dashboard/data');
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        logger.debug(`All data loaded in ${loadTime}s (combined endpoint)`);
        
        if (!isMountedRef.current) return;
        
        const data = response.data || {};
        
        // Process links
        const links = (data.links || []).map(normalizeLink);
        if (links.length > 0) {
          logger.debug('Links found:', links.length);
          links.forEach((link, idx) => {
            logger.debug(`   ${idx + 1}. ${link.title} (${link.id})`);
          });
        }
        // Reset auto-activation ref when loading new links
        hasAutoActivatedRef.current = false;
        setLinks(links);
        logger.debug('Links state updated');
        
        // Process media
        const media = data.media || [];
        logger.debug('Media loaded:', media.length);
        setMedia(media);
        
        // Process items
        const fetchedItems = data.items || [];
        logger.debug('Number of items received from backend:', fetchedItems.length);
        logger.debug('Items from backend:', fetchedItems.map(item => ({ id: item.id, name: item.name })));
        
        // Update items state - use functional update to ensure we have latest state
        setItems(prevItems => {
          // If backend returned items, use them (source of truth)
          // If backend returned empty but we have items, keep existing (might be timing issue)
          if (fetchedItems.length > 0) {
            return fetchedItems;
          } else if (prevItems.length > 0) {
            logger.warn('Backend returned empty items but state has items - keeping existing state');
            return prevItems;
          } else {
            return fetchedItems;
          }
        });
        
        // Ring settings removed (direct link mode killed)
        
      } catch (combinedError) {
        logger.warn('Combined endpoint failed, falling back to individual calls:', combinedError);
        
        // FALLBACK: Use parallel individual calls if combined endpoint fails
        logger.debug('Falling back to parallel individual API calls...');
        const fallbackStartTime = performance.now();
        
        const [linksResponse, mediaResponse, itemsResponse] = await Promise.all([
          api.get('/links').catch(err => {
            logger.error('Failed to load links:', err);
            return { data: [] };
          }),
          api.get('/media').catch(err => {
            logger.error('Failed to load media:', err);
            return { data: [] };
          }),
          api.get('/items').catch(err => {
            logger.error('Failed to load items:', err);
            return { data: [] };
          })
        ]);
        
        const fallbackTime = ((performance.now() - fallbackStartTime) / 1000).toFixed(2);
        logger.debug(`Fallback data loaded in ${fallbackTime}s (parallel)`);
        
        if (!isMountedRef.current) return;
        
        // Process fallback results
        const links = (linksResponse.data || []).map(normalizeLink);
        if (links.length > 0) {
          logger.debug('Links found (fallback):', links.length);
        }
        hasAutoActivatedRef.current = false;
        setLinks(links);
        
        setMedia(mediaResponse.data || []);
        
        const fetchedItems = itemsResponse.data || [];
        setItems(prevItems => {
          if (fetchedItems.length > 0) {
            return fetchedItems;
          } else if (prevItems.length > 0) {
            return prevItems;
          } else {
            return fetchedItems;
          }
        });
      }

      // Set profile from user data - use current user from context
      if (user && isMountedRef.current) {
        setProfile({
          name: user.name,
          bio: user.bio || "Digital creator & entrepreneur. Building the future one link at a time.",
          avatar: user.avatar || "",
          theme: user.theme || "default",
          accentColor: user.accent_color || "#000000",
          backgroundType: "solid",
          backgroundColor: user.background_color || "#ffffff",
          // Custom Branding fields
          custom_logo: user.custom_logo || "",
          show_footer: user.show_footer !== false,
          phone_number: user.phone_number || ""
        });
      }
    } catch (error) {
      logger.error('Dashboard: Failed to load user data:', error);
      logger.error('Error details:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      mobileToast.error("Failed to load user data");
    }
  };

  const loadRingSettings = async () => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        logger.debug('loadRingSettings: No token found, skipping ring settings fetch');
        return;
      }
      
      // Ring settings removed (direct link mode killed)
    } catch (error) {
      // Only log error if it's not a 401/403 (expected when not authenticated)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        logger.error('Failed to load ring settings:', error);
      }
    }
  };

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Subscription/billing state helpers
  const isSubscriptionExpired = identityContext?.subscription?.status === 'expired';
  const isBillingBlocked = needsBilling && isSubscriptionExpired;

  const getProfileUrl = () => {
    if (!user?.username) return window.location.origin;
    const sanitized = sanitizeUsernameForUrl(user.username);
    return `${window.location.origin}/profile/${sanitized}`;
  };

  const handleSendEmail = () => {
    const email = user?.email;
    if (!email) {
      toast.error("No email configured for this profile.");
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  const handleSaveContact = () => {
    try {
      const name = profile?.name || user?.name || "Contact";
      const email = user?.email || "";
      const phone = user?.phone_number || profile?.phone_number || "";
      const bio = profile?.bio || user?.bio || "";

      let vCard = "BEGIN:VCARD\n";
      vCard += "VERSION:3.0\n";
      vCard += `FN:${name}\n`;
      if (email) {
        vCard += `EMAIL:${email}\n`;
      }
      if (phone) {
        vCard += `TEL:${phone}\n`;
      }
      if (bio) {
        vCard += `NOTE:${bio}\n`;
      }

      const socialLinks = links.filter(link => link.active && link.category === "social");
      socialLinks.forEach(link => {
        vCard += `URL;TYPE=${link.title}:${link.url}\n`;
      });

      vCard += `URL;TYPE=Website:${getProfileUrl()}\n`;
      vCard += "END:VCARD";

      const blob = new Blob([vCard], { type: "text/vcard" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Contact downloaded.");
    } catch (error) {
      logger.error("Failed to save contact from dashboard:", error);
      toast.error("Failed to download contact.");
    }
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirmed = () => {
    addHapticFeedback('medium');
    logout();
    mobileToast.info("You've been logged out. See you soon! 👋");
    navigate('/');
  };

  const handleRefresh = async (skipUserRefresh = false) => {
    setIsLoading(true);
    addHapticFeedback('light');
    
      try {
        // PERFORMANCE FIX: Load user data and ring settings in parallel
        await Promise.all([
          loadUserData(skipUserRefresh),
          loadRingSettings()
        ]);
        mobileToast.success("Dashboard refreshed! ⚡");
      } catch (error) {
        mobileToast.error("Failed to refresh data");
      } finally {
        setIsLoading(false);
      }
  };

  const handleApplyTemplate = async (template) => {
    // Apply template logic here
    addHapticFeedback('success');
    mobileToast.success(`${template.name} template applied! ✨`);
  };

  if (!user) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const activeLinks = links.filter(link => link.active).length;

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div>
          {(activeSection === "links" || activeSection === "profile") && <ProfileSkeletonLoader />}
          {activeSection === "analytics" && <AnalyticsSkeletonLoader />}
          {(activeSection === "templates" || activeSection === "ai-insights") && <ProfileSkeletonLoader />}
        </div>
      );
    }

    // Mobile-specific rendering
    if (isMobile) {
      // Show link manager if editing links
      if (showLinkManager) {
        return (
          <MobileYourLinksPage
            user={user}
            profile={profile}
            links={links}
            onBack={() => setShowLinkManager(false)}
            onAddLink={async (linkData) => {
              try {
                const token = localStorage.getItem('token');
                const response = await api.post('/links', linkData);
                setLinks(prev => [...prev, normalizeLink(response.data)]);
              } catch (error) {
                logger.error('Add link failed:', error);
                throw error;
              }
            }}
            onEditLink={async (linkId, linkData) => {
              try {
                const token = localStorage.getItem('token');
                const response = await api.put(`/links/${linkId}`, linkData);
                setLinks(prev =>
                  prev.map(l => (l.id === linkId ? normalizeLink(response.data) : l))
                );
              } catch (error) {
                logger.error('Edit link failed:', error);
                throw error;
              }
            }}
            onDeleteLink={async (linkId) => {
              try {
                const token = localStorage.getItem('token');
                await api.delete(`/links/${linkId}`);
                setLinks(prev => prev.filter(l => l.id !== linkId));
              } catch (error) {
                logger.error('Delete link failed:', error);
                throw error;
              }
            }}
            onToggleActive={async (linkId) => {
              try {
                const link = links.find(l => l.id === linkId);
                if (!link) return;
                
                const token = localStorage.getItem('token');
                const response = await api.put(`/links/${linkId}`, { active: !link.active });
                setLinks(prev =>
                  prev.map(l => (l.id === linkId ? normalizeLink(response.data) : l))
                );
              } catch (error) {
                logger.error('Toggle visibility failed:', error);
                throw error;
              }
            }}
          />
        );
      }
      
      switch (activeSection) {
        case "items":
          return (
            <div className="p-4">
              <ItemManager items={items} setItems={setItems} />
            </div>
          );
        case "links":
          return (
            <MobileHomePage
              user={user}
              profile={profile}
              links={links}
              onEditLinks={() => setShowLinkManager(true)}
              onEditProfile={() => setActiveSection("profile")}
              onShareQR={() => setActiveSection("qr-codes")}
            />
          );
        case "media":
          return (
            <div className="p-4">
              <MediaManager media={media} setMedia={setMedia} />
            </div>
          );
        case "analytics":
          return <AnalyticsView links={links} />;
        case "qr-codes":
          return <QRCodes user={user} links={links} onNavigateToAnalytics={() => setActiveSection("analytics")} />;
        case "profile":
          return (
            <MobileSettingsPage
              user={user}
              profile={profile}
              setProfile={setProfile}
              links={links}
              onBack={() => setActiveSection("links")}
              onEditLinks={(category) => {
                setShowLinkManager(true);
                // Could add category filtering here
              }}
              onEditProfile={() => {
                // Profile editing is handled within the MobileSettingsPage component
                // This callback can be used for additional profile-related actions if needed
              }}
              onProfileUpdate={handleRefresh}
              onLogout={handleLogout}
            />
          );
        default:
          return (
            <MobileHomePage
              user={user}
              profile={profile}
              links={links}
              onEditLinks={() => setShowLinkManager(true)}
              onEditProfile={() => setActiveSection("profile")}
              onShareQR={() => setActiveSection("qr-codes")}
            />
          );
      }
    }

    // Desktop rendering (existing logic)
      switch (activeSection) {
        case "items":
          return <ItemManager items={items} setItems={setItems} />;
        case "links":
          return <SimpleLinkManager links={links} setLinks={setLinks} />;
        case "media":
          return <MediaManager media={media} setMedia={setMedia} />;
        case "customization":
          return <Customization user={user} profile={profile} setProfile={setProfile} setUser={() => {}} links={links} setLinks={setLinks} onUpdate={loadUserData} />;
      case "direct":
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500">Direct link mode has been removed.</p>
          </div>
        );
      case "analytics":
        return <AnalyticsView links={links} />;
      case "profile":
      case "appearance":
        return <ProfileSettings profile={profile} setProfile={setProfile} user={user} />;
      case "branding":
        return <CustomBranding user={user} profile={profile} setProfile={setProfile} setUser={() => {}} onUpdate={loadUserData} />;
      case "qr-codes":
        return <QRCodes user={user} links={links} onNavigateToAnalytics={() => setActiveSection("analytics")} />;
      case "security":
        return <SecuritySettings user={user} />;
      default:
        return <SimpleLinkManager links={links} setLinks={setLinks} />;
    }
  };

  return (
    <PageTransition>
      {/* Global logout confirmation dialog */}
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={handleLogoutConfirmed}
      />
      {isMobile ? (
        // Mobile Layout - Full Screen
        <div className="min-h-screen bg-background pb-20 relative">
          {/* Subscription Status Banner */}
          <div className="px-4 pt-4">
            <SubscriptionStatusBanner />
          </div>
          
          {/* Main Content (blurred when billing is blocked) */}
          <div className={`min-h-screen pb-20 transition duration-200 ${isBillingBlocked ? 'opacity-50 blur-[2px] pointer-events-none select-none' : ''}`}>
            {renderMainContent()}
          </div>
          
          {/* Mobile Navigation */}
          <MobileNavigation
            activeTab={activeSection}
            setActiveTab={(section) => {
              // Close link manager if open when navigating
              if (showLinkManager) {
                setShowLinkManager(false);
              }
              setActiveSection(section);
            }}
          />

          {/* Billing overlay for expired subscription */}
          {isBillingBlocked && (
            <div className="absolute inset-0 z-40 flex items-center justify-center px-4">
              <div className="max-w-md w-full rounded-xl border border-red-500 bg-background/95 shadow-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Subscription expired</p>
                    <p className="text-xs text-muted-foreground">
                      Your trial or subscription has ended. Choose a plan to continue using all dashboard features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/billing/choose-plan')}
                  >
                    View plans
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Desktop Layout - Existing Layout
        <div className="min-h-screen bg-background flex relative">
          {/* Premium Sidebar */}
          <PremiumSidebar
            user={user}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onLogout={handleLogout}
            links={links}
            totalClicks={totalClicks}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Subscription Status Banner */}
            <div className="px-6 pt-6">
              <SubscriptionStatusBanner />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-auto relative">
              {/* Blurred content when billing is blocked */}
              <div className={`pt-6 pb-28 px-6 w-full flex justify-start items-start gap-6 transition duration-200 ${isBillingBlocked ? 'opacity-50 blur-[2px] pointer-events-none select-none' : ''}`}>
                <div className="flex-1 min-w-0">
                  <FadeInUp>
                    {renderMainContent()}
                  </FadeInUp>
                </div>
                
                {/* Live Preview Sidebar - Show for links, items, media, and customization */}
                {(activeSection === "links" || activeSection === "items" || activeSection === "media" || activeSection === "customization") && (
                  <div className="w-[clamp(20rem,28vw,26rem)] bg-card border-l border-border flex-shrink-0">
                    <div className="p-6">
                      <div className="sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Live Preview</h3>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={handleSendEmail}
                              title="Send message"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={handleSaveContact}
                              title="Download contact"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(`/profile/${sanitizeUsernameForUrl(user.username)}`, '_blank')}
                              title="View public profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Public Profile URL Preview Link */}
                        <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Public Profile URL</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-sm text-primary hover:text-primary/80 hover:underline truncate font-mono"
                              title={`${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`}
                            >
                              {window.location.origin}/profile/{sanitizeUsernameForUrl(user.username)}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                              onClick={async () => {
                                const profileUrl = `${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`;
                                try {
                                  if (navigator.clipboard && document.hasFocus()) {
                                    await navigator.clipboard.writeText(profileUrl);
                                    addHapticFeedback('success');
                                    mobileToast.success("Profile URL copied to clipboard!");
                                  } else {
                                    const textArea = document.createElement('textarea');
                                    textArea.value = profileUrl;
                                    textArea.style.position = 'fixed';
                                    textArea.style.left = '-999999px';
                                    textArea.style.top = '-999999px';
                                    document.body.appendChild(textArea);
                                    textArea.focus();
                                    textArea.select();
                                    
                                    try {
                                      document.execCommand('copy');
                                      addHapticFeedback('success');
                                      mobileToast.success("Profile URL copied to clipboard!");
                                    } catch (err) {
                                      logger.error('Failed to copy:', err);
                                      mobileToast.error("Failed to copy URL");
                                    } finally {
                                      document.body.removeChild(textArea);
                                    }
                                  }
                                } catch (error) {
                                  logger.error('Clipboard error:', error);
                                  mobileToast.error("Failed to copy URL");
                                }
                              }}
                              title="Copy profile URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                              onClick={() => window.open(`/profile/${sanitizeUsernameForUrl(user.username)}`, '_blank')}
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <ProfilePreview 
                          profile={profile}
                          links={links.filter(link => link.active)}
                          media={media.filter(m => m.active)}
                          items={items.filter(item => item.active)}
                          username={user.username}
                          publicView={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing overlay for expired subscription */}
              {isBillingBlocked && (
                <div className="absolute inset-0 z-40 flex items-start justify-center pt-24 px-6 pointer-events-none">
                  <div className="max-w-xl w-full rounded-xl border border-red-500 bg-background/95 shadow-xl p-4 space-y-3 pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Subscription expired</p>
                        <p className="text-xs text-muted-foreground">
                          Your trial or subscription has ended. You can still see your dashboard in read‑only mode,
                          but changes are disabled until you choose a plan.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/billing/choose-plan')}
                      >
                        Go to billing
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Dashboard;