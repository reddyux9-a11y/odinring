import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { ExternalLink, Phone, Mail, MessageCircle, Link as LinkIcon, MessageSquare, Save, UserPlus, ShoppingBag, Image as ImageIcon, Tag, DollarSign, Video, Camera, Users, Copy, Check, Globe, Download, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// WhatsApp Icon Component
const WhatsAppIcon = ({ className, style }) => (
  <svg 
    className={className} 
    style={style}
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import { toast } from "sonner";
import { getIconByName } from "../lib/iconMap";
import { useBannerPattern } from "../hooks/useBannerPattern";
import { sanitizeUsernameForUrl } from "../lib/utils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'MXN': 'MX$',
    'BRL': 'R$',
    'KRW': '₩',
    'RUB': '₽',
    'TRY': '₺',
    'ZAR': 'R',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'THB': '฿',
    'IDR': 'Rp',
    'MYR': 'RM',
    'PHP': '₱',
    'VND': '₫',
  };
  return currencyMap[currencyCode?.toUpperCase()] || '$';
};

// YouTube helpers shared across profile media rendering
const getYouTubeId = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return u.pathname.replace("/", "") || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m1 = u.pathname.match(/^\/embed\/([^/]+)/);
      if (m1?.[1]) return m1[1];
      const m2 = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (m2?.[1]) return m2[1];
    }
    return null;
  } catch {
    return null;
  }
};

const normalizeVideoSrc = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  const iframeMatch = trimmed.match(/<iframe[^>]+src=['"]([^'"]+)['"][^>]*>/i);
  const src = iframeMatch?.[1] || trimmed;
  const ytId = getYouTubeId(src);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  return src;
};

const getAutoThumbnailUrl = (src) => {
  const ytId = getYouTubeId(src);
  if (!ytId) return null;
  return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
};

const Profile = () => {
  const { username, ringId } = useParams();
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [media, setMedia] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ profileViews: 0, totalClicks: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [copiedField, setCopiedField] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Apply font class / stack
  const rawFont = profile?.fontFamily || profile?.font_family || "font-sans";
  const tailwindFontClasses = ["font-sans", "font-serif", "font-mono"];
  const isTailwindFontClass = tailwindFontClasses.includes(rawFont);
  const fontClass = isTailwindFontClass ? rawFont : "font-sans";
  const fontStyle = !isTailwindFontClass ? { fontFamily: rawFont } : {};
  
  // Get colors with correct fallbacks - API returns background_color and accent_color
  // Default to dark blue/navy background to match the design
  const backgroundColor = profile?.background_color || profile?.backgroundColor || "#1e293b";
  const accentColor = profile?.accent_color || profile?.accentColor || "#10b981";
  const buttonBackgroundColor = profile?.button_background_color || profile?.buttonBackgroundColor;
  const buttonTextColor = profile?.button_text_color || profile?.buttonTextColor;
  
  // Determine if background is dark
  const isDarkBackground = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness < 128;
  };

  const isBackgroundDark = isDarkBackground(backgroundColor);
  const textColor = isBackgroundDark ? "#ffffff" : "#000000";
  const secondaryTextColor = isBackgroundDark ? "#e5e7eb" : "#6b7280";

  // Get banner pattern with optimized hook - MUST be called before any conditional returns
  const { className: bannerPatternClass } = useBannerPattern(profile);

  // Check if mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getLinkButtonStyle = (link) => {
    const style = link.style || "default";
    const baseClasses = "w-full justify-start text-left font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-2 h-full";
    
    switch (style) {
      case "minimal":
        return {
          className: `${baseClasses} bg-transparent border-0 hover:bg-opacity-10`,
          style: { 
            color: accentColor,
            backgroundColor: "transparent",
            borderColor: "transparent"
          }
        };
      case "gradient":
        return {
          className: `${baseClasses} text-white border-0 bg-gradient-to-r hover:shadow-lg`,
          style: { 
            backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            color: "#ffffff"
          }
        };
      case "glass":
        return {
          className: `${baseClasses} backdrop-blur-sm border hover:shadow-lg`,
          style: { 
            backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            borderColor: isBackgroundDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
            color: textColor
          }
        };
      case "filled":
        return {
          className: `${baseClasses} border-0 hover:shadow-lg`,
          style: { 
            backgroundColor: buttonBackgroundColor || accentColor,
            color: buttonTextColor || (isDarkBackground(buttonBackgroundColor || accentColor) ? "#ffffff" : "#000000")
          }
        };
      case "outlined":
        return {
          className: `${baseClasses} bg-transparent hover:bg-opacity-10`,
          style: { 
            borderColor: accentColor,
            color: accentColor,
            backgroundColor: "transparent",
            borderWidth: "2px"
          }
        };
      default:
        return {
          className: `${baseClasses} hover:shadow-md rounded-lg`,
          style: { 
            backgroundColor: "rgba(10, 10, 10, 0.1)",
            borderWidth: "1px",
            borderColor: "rgba(156, 163, 175, 0.05)",
            color: buttonTextColor || "#ffffff"
          }
        };
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        let response;
        if (ringId) {
          // Fetch by ring ID
          response = await api.get(`/ring/${ringId}`);
        } else if (username) {
          // Fetch by username
          response = await api.get(`/profile/${username}`);
        } else {
          throw new Error("No username or ring ID provided");
        }

        const profileData = response.data;
        setProfile(profileData);
        setLinks(profileData.links || []);
        setMedia(profileData.media || []);
        
        // Ensure items are properly set - items should come from Firestore via API
        let fetchedItems = profileData.items || [];
        setItems(fetchedItems);
        
        setAnalytics({
          profileViews: profileData.profile_views || 0,
          totalClicks: profileData.total_clicks || 0
        });
      } catch (error) {
        toast.error("Profile not found");
        
        // Fallback to mock data for demo purposes
        const mockProfile = {
          name: "John Doe",
          bio: "Digital creator & entrepreneur. Building the future one link at a time.",
          avatar: "",
          custom_logo: "",
          show_footer: true,
          username: username || "johndoe",
          ring_id: ringId || "RING_001",
          theme: "light",
          accent_color: "#000000",
          background_color: "#ffffff"
        };

        const mockLinks = [
          {
            id: "1",
            title: "Personal Website",
            url: "https://johndoe.com",
            icon: "Globe",
            active: true,
            clicks: 234,
            style: "gradient",
            border_radius: "lg",
            category: "professional"
          },
          {
            id: "2",
            title: "LinkedIn Profile", 
            url: "https://linkedin.com/in/johndoe",
            icon: "Briefcase",
            active: true,
            clicks: 189,
            style: "filled",
            border_radius: "md",
            category: "professional"
          }
        ];

        setProfile(mockProfile);
        setLinks(mockLinks);
        setItems([]);
        setAnalytics({ profileViews: 1247, totalClicks: 423 });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, ringId]);

  const trackProfileView = async () => {
    // In real app, this would call analytics API
  };

  const handleLinkClick = async (link) => {
    try {
      // Track click on backend (so taps + engagements reflect Community link clicks)
      if (link?.id) {
        api.post(`/links/${link.id}/click`).catch(() => {});
      }
      // Update local state for immediate feedback
      setLinks(prevLinks =>
        prevLinks.map(l =>
          l.id === link.id
            ? { ...l, clicks: (l.clicks || 0) + 1 }
            : l
        )
      );

      // Open link
      window.open(link.url, '_blank', 'noopener,noreferrer');

      // Provide haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast.error("Failed to open link");
    }
  };

  const handleMediaClick = async (mediaItem) => {
    try {
      // Track engagement for media clicks on public profile/preview
      if (mediaItem?.id) {
        await api.post(`/public/media/${mediaItem.id}/engage`);
      }
    } catch (error) {
      // Ignore tracking failures in UI
    }

    const next = mediaItem?.type === "video" && mediaItem.url
      ? { ...mediaItem, url: normalizeVideoSrc(mediaItem.url) }
      : mediaItem;

    // Open media in an inline modal on the same page
    setSelectedMedia(next);
    setIsMediaModalOpen(true);
  };

  const copyToClipboard = async (text, field) => {
    try {
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getProfileUrl = () => {
    const profileUsername = profile?.username || username || '';
    const sanitizedUsername = sanitizeUsernameForUrl(profileUsername);
    return `${window.location.origin}/profile/${sanitizedUsername}`;
  };

  const saveContact = () => {
    try {
      // Create vCard content
      let vCard = 'BEGIN:VCARD\n';
      vCard += 'VERSION:3.0\n';
      vCard += `FN:${profile?.name || ''}\n`;
      if (profile?.email) {
        vCard += `EMAIL:${profile.email}\n`;
      }
      if (profile?.phone_number) {
        vCard += `TEL:${profile.phone_number}\n`;
      }
      if (profile?.bio) {
        vCard += `NOTE:${profile.bio}\n`;
      }
      
      // Add social media links
      const socialLinks = links.filter(link => link.active && link.category === 'social');
      socialLinks.forEach(link => {
        vCard += `URL;TYPE=${link.title}:${link.url}\n`;
      });
      
      // Add website/profile URL
      vCard += `URL;TYPE=Website:${getProfileUrl()}\n`;
      
      vCard += 'END:VCARD';
      
      // Create blob and download
      const blob = new Blob([vCard], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile?.name || 'contact'}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Contact saved!");
    } catch (error) {
      toast.error("Failed to save contact");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen w-full max-w-lg mx-auto shadow-xl relative ${fontClass}`}
      style={{ backgroundColor, ...fontStyle }}
    >
      {/* Top Banner Section - Gradient Header */}
      <div className={`h-32 ${bannerPatternClass} relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500"></div>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      {/* Profile Section */}
      <div className="relative text-center p-6 pb-4 -mt-16">
        <Avatar className={`w-[172px] h-[172px] mx-auto mb-4 border-2 ${
          profile.avatar_shape === 'square' ? 'rounded-none' : profile.avatar_shape === 'rounded' ? 'rounded-xl' : 'rounded-full'
        }`} style={{ borderColor: accentColor }}>
          <AvatarImage src={profile.custom_logo || profile.avatar} alt={profile.name} />
          <AvatarFallback 
            className="text-xl font-bold"
            style={{ backgroundColor: accentColor || "#1e293b", color: "#ffffff" }}
          >
            {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <h1 className="text-xl font-bold mb-2 tracking-wide" style={{ color: textColor }}>
          {profile.name}
        </h1>
        <p className="text-sm leading-relaxed mb-4" style={{ color: secondaryTextColor }}>
          {profile.bio}
        </p>
        
        {/* Action Icons Group */}
        <div className="flex items-center justify-center gap-3 mt-4 mb-4 flex-wrap">
          {/* Email Icon */}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{ 
                backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                borderColor: accentColor,
                borderWidth: "1px",
                borderStyle: "solid"
              }}
              title={`Send email to ${profile.email}`}
            >
              <Mail className="w-5 h-5" style={{ color: accentColor }} />
            </a>
          )}
          
          {/* Phone Icon */}
          {profile.phone_number && (
            <a
              href={`tel:${profile.phone_number}`}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{ 
                backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                borderColor: accentColor,
                borderWidth: "1px",
                borderStyle: "solid"
              }}
              title={`Call ${profile.phone_number}`}
            >
              <Phone className="w-5 h-5" style={{ color: accentColor }} />
            </a>
          )}
          
          {/* Save Contact Icon */}
          {(profile.email || profile.phone_number) && (
            <button
              onClick={saveContact}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{ 
                backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                borderColor: accentColor,
                borderWidth: "1px",
                borderStyle: "solid"
              }}
              title="Save contact details"
            >
              <Download className="w-5 h-5" style={{ color: accentColor }} />
            </button>
          )}
          
          {/* Website/Profile URL Icon */}
          <a
            href={getProfileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ 
              backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              borderColor: accentColor,
              borderWidth: "1px",
              borderStyle: "solid"
            }}
            title="View profile website"
          >
            <Globe className="w-5 h-5" style={{ color: accentColor }} />
          </a>
        </div>
      </div>

      {/* Content Tabs - Links & Items */}
      <div className="px-6 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className="h-12 items-center justify-center rounded-md p-0.5 text-muted-foreground grid w-full grid-cols-3 mb-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'solid' }}
          >
            <TabsTrigger 
              value="items" 
              className="text-xs h-9 rounded-[999px] bg-transparent text-gray-600"
              style={activeTab === "items" ? {
                backgroundColor: buttonBackgroundColor || accentColor,
                color: buttonTextColor || (isDarkBackground(buttonBackgroundColor || accentColor) ? "#ffffff" : "#000000")
              } : {
                color: textColor
              }}
            >
              <ShoppingBag className="w-3 h-3 mr-1" strokeWidth={2} />
              Items
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="text-xs h-9 rounded-[999px] bg-transparent text-gray-600"
              style={activeTab === "media" ? {
                backgroundColor: buttonBackgroundColor || accentColor,
                color: buttonTextColor || (isDarkBackground(buttonBackgroundColor || accentColor) ? "#ffffff" : "#000000")
              } : {
                color: textColor
              }}
            >
              <Camera className="w-3 h-3 mr-1" strokeWidth={2} />
              Media
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className="text-xs h-9 rounded-[999px] bg-transparent text-gray-600"
              style={activeTab === "community" ? {
                backgroundColor: buttonBackgroundColor || accentColor,
                color: buttonTextColor || (isDarkBackground(buttonBackgroundColor || accentColor) ? "#ffffff" : "#000000")
              } : {
                color: textColor
              }}
            >
              <Users className="w-3 h-3 mr-1" strokeWidth={2} />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="mt-0 space-y-3">
            {links.filter(link => link.active).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} strokeWidth={2} />
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>No community links available</h3>
                <p className="text-sm" style={{ color: secondaryTextColor }}>
                  This profile doesn't have any active community links yet.
                </p>
              </div>
            ) : (
              links.filter(link => link.active).map((link) => {
                const buttonProps = getLinkButtonStyle(link);
                return (
                  <Button
                    key={link.id}
                    className={buttonProps.className}
                    style={buttonProps.style}
                    onClick={() => handleLinkClick(link)}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                        style={{ 
                          backgroundColor: "rgba(255,255,255,0.1)"
                        }}
                      >
                        {getIconByName(link.icon || "Globe", "w-5 h-5")}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-base truncate">{link.title}</div>
                        {link.description && (
                          <div className="text-sm opacity-70 truncate">{link.description}</div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-60 flex-shrink-0" />
                    </div>
                  </Button>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-0 space-y-3">
            {media.filter(m => m.active).length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} />
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>No media available</h3>
                <p className="text-sm" style={{ color: secondaryTextColor }}>
                  This profile doesn't have any active media files yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {media.filter(m => m.active).map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className="rounded-lg overflow-hidden border cursor-pointer"
                    onClick={() => handleMediaClick(mediaItem)}
                    style={{ 
                      backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                      borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                    }}
                  >
                    {mediaItem.type === "image" ? (
                      <img
                        src={mediaItem.thumbnail_url || mediaItem.url}
                        alt={mediaItem.title || "Media"}
                        className="w-full h-auto"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to main image if thumbnail fails
                          if (e.target.src !== mediaItem.url) {
                            e.target.src = mediaItem.url;
                          } else {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full bg-muted flex items-center justify-center relative">
                        {mediaItem.thumbnail_url || getAutoThumbnailUrl(mediaItem.url) ? (
                          <img
                            src={mediaItem.thumbnail_url || getAutoThumbnailUrl(mediaItem.url)}
                            alt={mediaItem.title || "Video"}
                            className="w-full h-auto"
                          />
                        ) : (
                          <Video className="w-12 h-12" style={{ color: secondaryTextColor }} />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-0 space-y-3">
            {/* When items are locked due to expired subscription, hide them on public profile */}
            {profile.items_locked ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} />
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>Items unavailable</h3>
                <p className="text-sm" style={{ color: secondaryTextColor }}>
                  This profile&apos;s subscription has ended, so items are currently hidden.
                </p>
              </div>
            ) : items.filter(item => item.active).length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} />
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>No items available</h3>
                <p className="text-sm" style={{ color: secondaryTextColor }}>
                  This profile doesn't have any active items yet.
                </p>
              </div>
            ) : (
              items.filter(item => item && item.active).map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                      borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Item Image */}
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                          style={{ borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 border"
                          style={{ 
                            backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                          }}
                        >
                          <ImageIcon className="w-6 h-6" style={{ color: secondaryTextColor }} />
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base truncate" style={{ color: textColor }}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="flex items-center gap-1 mt-1">
                                <Tag className="w-3 h-3" style={{ color: secondaryTextColor }} />
                                <span className="text-sm opacity-70" style={{ color: secondaryTextColor }}>
                                  {item.description}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Price */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-base font-bold whitespace-nowrap" style={{ color: accentColor }}>
                              {getCurrencySymbol(item.currency || "USD")}{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Media viewer modal (images and videos) */}
      {isMediaModalOpen && selectedMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-2xl mx-4 bg-black rounded-xl overflow-hidden">
            <button
              type="button"
              aria-label="Close media"
              className="absolute top-3 right-3 z-[210] rounded-full bg-black/70 p-1.5 hover:bg-black/90 text-white"
              onClick={() => {
                setIsMediaModalOpen(false);
                setSelectedMedia(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>

            {selectedMedia.type === "video" ? (
              <div className="w-full aspect-video bg-black">
                <iframe
                  src={selectedMedia.url}
                  title={selectedMedia.title || "Video"}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={selectedMedia.media_file_url || selectedMedia.thumbnail_url || selectedMedia.url}
                alt={selectedMedia.title || "Media"}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
            )}

            {(selectedMedia.title || selectedMedia.description) && (
              <div className="p-3 border-t border-white/10">
                {selectedMedia.title && (
                  <div className="text-sm font-semibold text-white">
                    {selectedMedia.title}
                  </div>
                )}
                {selectedMedia.description && (
                  <div className="mt-1 text-xs text-gray-300">
                    {selectedMedia.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Footer - Show only if show_footer is true */}
      {profile.show_footer !== false && (
        <div className="text-center pb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs" style={{ color: secondaryTextColor }}>Powered by</span>
            <img 
              src="/OdinRingLogo.png" 
              alt="OdinRing" 
              className="h-4 w-4 object-contain opacity-70"
            />
            <span className="text-xs font-semibold" style={{ color: accentColor || "#10b981" }}>OdinRing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
