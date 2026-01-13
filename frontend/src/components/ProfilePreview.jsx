import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, ExternalLink, Link as LinkIcon, ShoppingBag, DollarSign, Tag, Image as ImageIcon, Video, Camera, Users, Mail, Phone, Globe, Download } from "lucide-react";
import { getIconByName } from "../lib/iconMap";
import { useBannerPattern } from "../hooks/useBannerPattern";
import { sanitizeUsernameForUrl } from "../lib/utils";

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

const ProfilePreview = ({ profile, links = [], media = [], items = [], isPreview = false, publicView = false, username }) => {
  const [activeTab, setActiveTab] = useState("items");
  console.log('👁️ ProfilePreview: Component rendered');
  console.log('👁️ ProfilePreview: Profile:', profile);
  console.log('👁️ ProfilePreview: Links:', links);
  console.log('👁️ ProfilePreview: Links count:', links?.length);
  console.log('👁️ ProfilePreview: Links is array:', Array.isArray(links));
  console.log('👁️ ProfilePreview: Active links:', links?.filter(link => link.active));
  
  const actualUsername = username || profile.username || "user";

  // Apply font class or font-family string
  const fontValue = profile.fontFamily || profile.font_family || "font-sans";
  const isUtilityFontClass = ["font-sans", "font-serif", "font-mono"].includes(fontValue);
  const fontClass = isUtilityFontClass ? fontValue : undefined;
  const fontFamilyStyle = isUtilityFontClass ? undefined : { fontFamily: fontValue };
  
  // Get colors
  const backgroundColor = profile.backgroundColor || profile.background_color || "#ffffff";
  const accentColor = profile.accentColor || profile.accent_color || "#000000";
  const buttonBackgroundColor = profile.button_background_color || profile.buttonBackgroundColor;
  const buttonTextColor = profile.button_text_color || profile.buttonTextColor;
  
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

  // Get banner pattern with optimized hook
  const { className: bannerPatternClass } = useBannerPattern(profile);

  // Helper functions for contact actions
  const getProfileUrl = () => {
    const profileUsername = profile?.username || actualUsername || '';
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
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

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
          className: `${baseClasses} hover:shadow-md`,
          style: { 
            backgroundColor: "rgba(10, 10, 10, 0.1)",
            borderWidth: "1px",
            borderColor: "rgba(156, 163, 175, 0.05)",
            color: buttonTextColor || textColor
          }
        };
    }
  };

  if (isPreview) {
    return (
      <div 
        className={`min-h-[500px] relative ${fontClass || ''}`}
        style={{ backgroundColor, ...(fontFamilyStyle || {}) }}
      >
        {/* Top Banner Section */}
        <div className={`h-32 ${bannerPatternClass} relative`}>
        </div>
        
        {/* Profile Section */}
        <div className="relative text-center p-6 pb-4 -mt-16">
          <Avatar className={`w-[172px] h-[172px] mx-auto mb-4 border-2 ${
            profile.avatar_shape === 'square' ? 'rounded-none' : profile.avatar_shape === 'rounded' ? 'rounded-xl' : 'rounded-full'
          }`} style={{ borderColor: accentColor }}>
            <AvatarImage src={profile.custom_logo || profile.avatar} />
            <AvatarFallback 
              className="text-xl font-bold"
              style={{ backgroundColor: accentColor, color: isDarkBackground(accentColor) ? "#ffffff" : "#000000" }}
            >
              {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-xl font-bold mb-2 font-serif tracking-wide" style={{ color: textColor }}>
            {profile.name || "Your Name"}
          </h1>
          <p className="text-sm leading-relaxed mb-4 font-serif" style={{ color: secondaryTextColor }}>
            {profile.bio || "Your bio will appear here"}
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
              className="h-9 items-center justify-center rounded-md p-0.5 grid w-full grid-cols-3 mb-3 bg-transparent border-0"
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
                  const radiusMap = {
                    none: 'rounded-none', sm: 'rounded-md', md: 'rounded-lg',
                    lg: 'rounded-xl', full: 'rounded-full'
                  };
                  const shadowMap = {
                    none: '', soft: 'shadow', md: 'shadow-md', lg: 'shadow-lg'
                  };
                  const extra = `${radiusMap[profile.button_radius || 'md']} ${shadowMap[profile.button_shadow || 'soft']}`;
                  return (
                    <Button
                      key={link.id}
                      className={`${buttonProps.className} ${extra}`}
                      style={buttonProps.style}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ 
                            backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" 
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
                      className="rounded-lg overflow-hidden border"
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
                          {mediaItem.thumbnail_url ? (
                            <img
                              src={mediaItem.thumbnail_url}
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
              {items.filter(item => item.active).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🛍️</div>
                  <p className="text-xs" style={{ color: secondaryTextColor }}>No active items</p>
                </div>
              ) : (
                items.filter(item => item.active).map((item) => {
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

        {/* Footer - Show only if show_footer is true */}
        {profile.show_footer !== false && (
          <div className="text-center pb-6 flex items-center justify-center gap-2">
            <span className="text-xs" style={{ color: secondaryTextColor }}>Powered by</span>
            <img 
              src="/OdinRingLogo.png" 
              alt="OdinRing" 
              className="h-4 w-4 object-contain opacity-70"
            />
            <span className="text-xs font-semibold" style={{ color: accentColor }}>OdinRing</span>
          </div>
        )}
      </div>
    );
  }

  // Public view mode - matches Profile.jsx styling
  if (publicView) {
    return (
      <div 
        className={`w-full shadow-xl relative ${fontClass}`}
        style={{ backgroundColor, ...(fontFamilyStyle || {}) }}
      >
        {/* Profile Section */}
        <div className="relative text-center p-6 pb-4 -mt-16">
          <Avatar className={`w-[172px] h-[172px] mx-auto mb-4 border-2 ${
            profile.avatar_shape === 'square' ? 'rounded-none' : profile.avatar_shape === 'rounded' ? 'rounded-xl' : 'rounded-full'
          }`} style={{ borderColor: accentColor }}>
            <AvatarImage src={profile.custom_logo || profile.avatar} />
            <AvatarFallback 
              className="text-xl font-bold"
              style={{ backgroundColor: accentColor, color: isDarkBackground(accentColor) ? "#ffffff" : "#000000" }}
            >
              {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-xl font-bold mb-2 font-serif tracking-wide" style={{ color: textColor }}>
            {profile.name || "Your Name"}
          </h1>
          <p className="text-sm leading-relaxed mb-4 font-serif" style={{ color: secondaryTextColor }}>
            {profile.bio || "Your bio will appear here"}
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

        {/* Content Tabs - Links, Media & Items */}
        <div className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList 
                  className="h-9 items-center justify-center rounded-md p-0.5 text-muted-foreground grid w-full grid-cols-3 mb-3 bg-transparent border-0"
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
                      <LinkIcon className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} />
                      <h3 className="font-semibold mb-2" style={{ color: textColor }}>No links available</h3>
                      <p className="text-sm" style={{ color: secondaryTextColor }}>
                        This profile doesn't have any active links yet.
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
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ 
                                backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" 
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
                          className="rounded-lg overflow-hidden border"
                          style={{ 
                            backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                          }}
                        >
                          {mediaItem.type === "image" ? (
                            <img
                              src={mediaItem.url}
                              alt={mediaItem.title || "Media"}
                              className="w-full h-auto"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="w-full bg-muted flex items-center justify-center relative">
                              {mediaItem.thumbnail_url ? (
                                <img
                                  src={mediaItem.thumbnail_url}
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

                <TabsContent value="items" className="mt-0 space-y-1.5">
                  {items.filter(item => item.active).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🛍️</div>
                      <p className="text-xs" style={{ color: secondaryTextColor }}>No active items</p>
                    </div>
                  ) : (
                    items.filter(item => item.active).map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg border"
                          style={{ 
                            backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                          }}
                        >
                          <div className="flex items-start space-x-2">
                            {/* Item Image */}
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                                style={{ borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border"
                                style={{ 
                                  backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                  borderColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                                }}
                              >
                                <ImageIcon className="w-5 h-5" style={{ color: secondaryTextColor }} />
                              </div>
                            )}
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-xs truncate" style={{ color: textColor }}>
                                    {item.name}
                                  </div>
                                  {item.description && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Tag className="w-2.5 h-2.5" style={{ color: secondaryTextColor }} />
                                      <span className="text-[10px] opacity-70" style={{ color: secondaryTextColor }}>
                                        {item.description}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* Price */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: accentColor }}>
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

        {/* Footer - Show only if show_footer is true */}
        {profile.show_footer !== false && (
          <div className="text-center pb-6">
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-xs" style={{ color: secondaryTextColor }}>Powered by</span>
              <img 
                src="/OdinRingLogo.png" 
                alt="OdinRing" 
                className="h-4 w-4 object-contain opacity-70"
              />
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold hover:underline"
                style={{ color: accentColor }}
                onClick={() => window.open('/', '_blank')}
              >
                OdinRing
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular preview with card wrapper
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Preview</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/profile/${sanitizeUsernameForUrl(actualUsername)}`, '_blank')}
            className="border-border"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Live
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        {/* Mobile Frame */}
        <div className="bg-black rounded-[2.5rem] p-3 shadow-xl">
          <div 
            className={`rounded-[2rem] min-h-[500px] overflow-hidden ${fontClass}`}
            style={{ backgroundColor }}
          >
            {/* Top Banner Section */}
            <div className={`h-32 ${bannerPatternClass} relative`}>
            </div>
            
            {/* Profile Section */}
            <div className="relative text-center p-6 pb-4 -mt-16">
              <Avatar className={`w-[172px] h-[172px] mx-auto mb-4 border-2 ${
                profile.avatar_shape === 'square' ? 'rounded-none' : profile.avatar_shape === 'rounded' ? 'rounded-xl' : 'rounded-full'
              }`} style={{ borderColor: accentColor }}>
                <AvatarImage src={profile.custom_logo || profile.avatar} />
                <AvatarFallback 
                  className="text-xl font-bold"
                  style={{ backgroundColor: accentColor, color: isDarkBackground(accentColor) ? "#ffffff" : "#000000" }}
                >
                  {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <h1 className="text-xl font-bold mb-2 font-serif tracking-wide" style={{ color: textColor }}>
                {profile.name || "Your Name"}
              </h1>
              <p className="text-sm leading-relaxed mb-4 font-serif" style={{ color: secondaryTextColor }}>
                {profile.bio || "Your bio will appear here"}
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

            {/* Content Tabs - Links, Media & Items */}
            <div className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList 
                  className="h-9 items-center justify-center rounded-md p-0.5 text-muted-foreground grid w-full grid-cols-3 mb-3 bg-transparent border-0"
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
                      <LinkIcon className="w-12 h-12 mx-auto mb-4" style={{ color: secondaryTextColor }} />
                      <h3 className="font-semibold mb-2" style={{ color: textColor }}>No links available</h3>
                      <p className="text-sm" style={{ color: secondaryTextColor }}>
                        This profile doesn't have any active links yet.
                      </p>
                    </div>
                  ) : (
                    links.filter(link => link.active).map((link) => {
                      const buttonProps = getLinkButtonStyle(link);
                      const radiusMap = {
                        none: 'rounded-none', sm: 'rounded-md', md: 'rounded-lg',
                        lg: 'rounded-xl', full: 'rounded-full'
                      };
                      const shadowMap = {
                        none: '', soft: 'shadow', md: 'shadow-md', lg: 'shadow-lg'
                      };
                      const extra = `${radiusMap[profile.button_radius || 'md']} ${shadowMap[profile.button_shadow || 'soft']}`;
                      return (
                        <Button
                          key={link.id}
                          className={`${buttonProps.className} ${extra}`}
                          style={buttonProps.style}
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ 
                                backgroundColor: isBackgroundDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" 
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
                      className="rounded-lg overflow-hidden border"
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
                          {mediaItem.thumbnail_url ? (
                            <img
                              src={mediaItem.thumbnail_url}
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
                  {items.filter(item => item.active).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🛍️</div>
                      <p className="text-xs" style={{ color: secondaryTextColor }}>No active items</p>
                    </div>
                  ) : (
                    items.filter(item => item.active).map((item) => {
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

            {/* Footer - Show only if show_footer is true */}
            {profile.show_footer !== false && (
              <div className="text-center pb-6 flex items-center justify-center gap-2">
                <span className="text-xs" style={{ color: secondaryTextColor }}>Powered by</span>
                <img 
                  src="/OdinRingLogo.png" 
                  alt="OdinRing" 
                  className="h-4 w-4 object-contain opacity-70"
                />
                <span className="text-xs font-semibold" style={{ color: accentColor }}>OdinRing</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePreview;