import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { 
  QrCode, 
  ExternalLink,
  X,
  Share,
  Eye,
  BarChart3,
  Edit,
  Mail,
  Phone,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { getIconByName } from "../lib/iconMap";
import { addHapticFeedback } from "../utils/mobileUtils";
import { toast } from "sonner";
import api from "../lib/api";
import { sanitizeUsernameForUrl } from "../lib/utils";

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

const MobileHomePage = ({ 
  user, 
  profile, 
  links = [], 
  onEditLinks, 
  onEditProfile,
  onShareQR,
}) => {
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [qrType, setQrType] = useState('bundle'); // 'bundle' or 'individual'
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [loadingLinkId, setLoadingLinkId] = useState(null);

  // Group links by category
  const socialMediaLinks = links.filter(link => 
    (link.category === 'social' || link.category === 'media') && link.active
  );
  const allLinks = links.filter(link => link.active);

  // Direct link mode removed

  const handleLinkClick = async (link) => {
    addHapticFeedback('light');
    
    // Open the URL for all links
    try {
      // Track click analytics
      await fetch(`/api/links/${link.id}/click`, { method: 'POST' });
    } catch (error) {
    }
    window.open(link.url, '_blank');
  };

  const generateQRCode = async (type, link = null) => {
    setQrLoading(true);
    try {
      let response;
      if (type === 'individual' && link) {
        // Generate QR for individual link
        response = await api.get(`/qr/link/${link.id}/base64`, {
          params: {
            fill: "#000000",
            back: "#ffffff",
            box_size: 10,
            border: 4
          }
        });
      } else {
        // Generate QR for profile/bundle
        response = await api.get('/qr/profile/base64', {
          params: {
            fill: "#000000",
            back: "#ffffff",
            box_size: 10,
            border: 4
          }
        });
      }
      
      setQrCodeData(response.data.qr_code);
      addHapticFeedback('success');
    } catch (error) {
      addHapticFeedback('error');
      toast.error("Failed to generate QR code", { duration: 1500 });
    } finally {
      setQrLoading(false);
    }
  };

  const handleQRShare = async (type, link = null) => {
    addHapticFeedback('light');
    
    // Direct link mode removed - use original logic
    setQrType(type);
    setSelectedLink(link);
    setShowQRDialog(true);
    await generateQRCode(type, link);
  };

  const generateQRUrl = () => {
    if (qrType === 'individual' && selectedLink) {
      return selectedLink.url;
    } else {
      // Bundle mode - return profile URL
      return `${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`;
    }
  };

  const copyQRUrl = async () => {
    const url = generateQRUrl();
    try {
      // Check if clipboard API is available and document is focused
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(url);
        addHapticFeedback('success');
        toast.success("URL copied to clipboard!", { duration: 1500 });
      } else {
        // Fallback for mobile or when document is not focused
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          addHapticFeedback('success');
          toast.success("URL copied to clipboard!", { duration: 1500 });
        } catch (err) {
          toast.error("Failed to copy URL", { duration: 1500 });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      toast.error("Failed to copy URL", { duration: 1500 });
    }
  };

  const shareQRUrl = async () => {
    const url = generateQRUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: qrType === 'individual' ? selectedLink.title : `${profile.name || user.username}'s Profile`,
          text: qrType === 'individual' ? selectedLink.title : 'Check out my profile',
          url: url
        });
        addHapticFeedback('success');
      } catch (error) {
        // If sharing fails, try to copy to clipboard
        await copyQRUrl();
      }
    } else {
      // If native sharing is not available, copy to clipboard
      await copyQRUrl();
    }
  };

  const renderSocialLinkItem = (link) => (
    <motion.div
      key={link.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
      <div 
        className="rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer px-3 py-2.5 bg-card border-border dark:border-gray-600/50"
        onClick={() => handleLinkClick(link)}
      >
        <div className="flex items-center space-x-2.5">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800/60 shadow-sm border border-gray-200/50 dark:border-gray-700/30"
          >
            {loadingLinkId === link.id ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            ) : (
              getIconByName(link.icon || "Globe", `w-5 h-5 text-foreground`)
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <h3 
                className="font-semibold text-[15px] truncate text-foreground dark:text-foreground"
              >
                {link.title}
              </h3>
            </div>
            <p className="text-[12px] text-muted-foreground truncate dark:text-muted-foreground/80">
              {link.url}
            </p>
          </div>
          
          {/* QR Code Button */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleQRShare('individual', link);
            }}
            className="h-7 w-7 p-0 hover:bg-muted dark:hover:bg-muted/50"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-primary" />
          </Button> */}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="text-center">
          {/* Profile Picture */}
          <Avatar className="w-[172px] h-[172px] mx-auto mb-4 border-2 border-gray-300 dark:border-gray-600 shadow-lg">
            <AvatarImage src={profile.custom_logo || profile.avatar} alt={profile.name} />
            <AvatarFallback className="text-lg font-semibold bg-muted text-foreground">
              {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* Title */}
              <h1 className="text-xl font-semibold text-foreground mb-1 font-serif tracking-wide">
            {profile.name || "Title"}
          </h1>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed font-serif">
            {profile.bio || "Description"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {/* Mail Button */}
          <Button
            variant="outline"
            className="h-14 w-14 p-0 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50 transition-all rounded-lg shadow-sm hover:shadow"
            onClick={() => {
              addHapticFeedback('light');
              // Use user's email from settings, or fallback to email from links
              let email = user?.email || null;
              
              if (!email) {
                // Fallback: Find email from links (mailto: links or links containing @)
                const emailLink = links.find(link => 
                  link.url && (link.url.startsWith('mailto:') || link.url.includes('@'))
                );
                
                if (emailLink) {
                  email = emailLink.url.startsWith('mailto:') 
                    ? emailLink.url.replace('mailto:', '') 
                    : emailLink.url;
                }
              }
              
              if (email) {
                // mailto: protocol opens default mail app (on mobile, shows app chooser popup)
                window.location.href = `mailto:${email}`;
              } else {
                toast.error("No email found.");
              }
            }}
            disabled={!user?.email && !links.some(link => 
              link.url && (link.url.startsWith('mailto:') || link.url.includes('@'))
            )}
          >
            <Mail className="w-5 h-5" style={{ color: "#6B7280" }} />
          </Button>

          {/* WhatsApp Button */}
          <Button
            variant="outline"
            className="h-14 w-14 p-0 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50 transition-all rounded-lg shadow-sm hover:shadow"
            onClick={() => {
              addHapticFeedback('light');
              // Prefer WhatsApp number if user set it; otherwise use mobile number; then fallback to links
              let phone = user?.whatsapp_number || user?.phone_number || null;
              
              if (!phone) {
                const phoneLink = links.find(link => link.phone_number);
                phone = phoneLink?.phone_number;
              }
              
              if (phone) {
                // Clean phone number for WhatsApp API
                // Remove all non-digit characters, but keep + if it's at the start
                let cleanPhone = phone.replace(/[^\d+]/g, '');
                // If phone doesn't start with +, ensure it's properly formatted
                if (!cleanPhone.startsWith('+')) {
                  // Remove leading zeros and ensure proper format
                  cleanPhone = cleanPhone.replace(/^0+/, '');
                }
                // WhatsApp API format: https://wa.me/[country code][phone number]
                // Example: https://wa.me/1234567890 (without +)
                const whatsappPhone = cleanPhone.replace(/^\+/, '');
                window.open(`https://wa.me/${whatsappPhone}`, '_blank');
              } else {
                toast.error("Please go to Settings and add your mobile number to use WhatsApp.", {
                  duration: 3000,
                  action: {
                    label: "Go to Settings",
                    onClick: () => {
                      addHapticFeedback('light');
                      // Navigate to settings - this will be handled by parent component
                      if (onEditProfile) {
                        onEditProfile();
                      }
                    }
                  }
                });
              }
            }}
            disabled={!(user?.whatsapp_number || user?.phone_number) && !links.some(link => link.phone_number)}
          >
            <WhatsAppIcon className="w-5 h-5" style={{ color: "#25D366" }} />
          </Button>

          {/* Call Button */}
          <Button
            variant="outline"
            className="h-14 w-14 p-0 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50 transition-all rounded-lg shadow-sm hover:shadow"
            onClick={() => {
              addHapticFeedback('light');
              // Use phone number from user profile first, then fallback to links
              let phone = user?.phone_number || null;
              
              if (!phone) {
                const phoneLink = links.find(link => link.phone_number);
                phone = phoneLink?.phone_number;
              }
              
              if (phone) {
                // tel: protocol opens dialpad with number prefilled (works on mobile and desktop)
                // Clean the phone number but keep + if present
                const cleanPhone = phone.replace(/[^\d+]/g, '');
                window.location.href = `tel:${cleanPhone}`;
              } else {
                toast.error("Please go to Settings and add your mobile number to make calls.", {
                  duration: 3000,
                  action: {
                    label: "Go to Settings",
                    onClick: () => {
                      addHapticFeedback('light');
                      if (onEditProfile) {
                        onEditProfile();
                      }
                    }
                  }
                });
              }
            }}
            disabled={!user?.phone_number && !links.some(link => link.phone_number)}
          >
            <Phone className="w-5 h-5" style={{ color: "#007AFF" }} />
          </Button>

          {/* Save Contact Button */}
          <Button
            variant="outline"
            className="h-14 w-14 p-0 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50 transition-all rounded-lg shadow-sm hover:shadow"
            onClick={() => {
              addHapticFeedback('light');
              // Use phone number from user profile first, then fallback to links
              let phone = user?.phone_number || null;
              
              if (!phone) {
                const phoneLink = links.find(link => link.phone_number);
                phone = phoneLink?.phone_number;
              }
              
              // Use email from user first, then fallback to email from links
              let email = user?.email || '';
              
              if (!email) {
                const emailLink = links.find(link => 
                  link.url && (link.url.startsWith('mailto:') || link.url.includes('@'))
                );
                email = emailLink 
                  ? (emailLink.url.startsWith('mailto:') ? emailLink.url.replace('mailto:', '') : emailLink.url)
                  : '';
              }
              
              // Use profile name to prefill contact
              const name = profile?.name || user?.name || 'Contact';
              const nameParts = name.split(' ');
              const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              const firstName = nameParts[0] || '';
              
              const vCard = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${name}`,
                `N:${lastName};${firstName};;;`,
                email ? `EMAIL:${email}` : '',
                phone ? `TEL:${phone}` : '',
                profile?.bio || user?.bio ? `NOTE:${profile?.bio || user?.bio}` : '',
                'END:VCARD'
              ].filter(line => line).join('\n');

              // Create blob and download
              const blob = new Blob([vCard], { type: 'text/vcard' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${name.replace(/\s+/g, '_')}.vcf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              toast.success("Contact saved!");
            }}
          >
            <UserPlus className="w-5 h-5" style={{ color: "#6366F1" }} />
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-6 space-y-6">
        {/* Social Media Links Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-foreground underline decoration-gray-300 dark:decoration-gray-600 decoration-1 underline-offset-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Favourites
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                addHapticFeedback('light');
                onEditLinks('social');
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-primary dark:hover:text-primary/80 p-0 h-auto font-medium"
            >
              Edit
            </Button>
          </div>

          {/* Social Media Links List */}
          <div className="space-y-3">
            {socialMediaLinks.length > 0 ? (
              socialMediaLinks.map(renderSocialLinkItem)
            ) : (
              <Card className="border-2 border-dashed border-border bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">No featured links yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addHapticFeedback('light');
                      onEditLinks('social');
                    }}
                    className="mt-2"
                  >
                    Add Links
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* Floating QR Code Button */}
      <div className="fixed bottom-24 left-6 right-6 z-50">
        <Button
          onClick={() => handleQRShare('bundle')}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg transition-all duration-200"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Share QR Code
        </Button>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>

      {/* QR Code Bottom Sheet */}
      <Sheet open={showQRDialog} onOpenChange={setShowQRDialog}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl [&>button]:!hidden [&>button]:!border-0 [&>button]:!ring-0">
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* Header with custom close button */}
            <div className="relative w-full flex justify-center items-center">
              <SheetTitle className="text-center text-lg font-semibold">
                {qrType === 'individual' ? `${selectedLink?.title} QR Code` : 'Profile QR Code'}
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRDialog(false)}
                className="absolute right-0 h-8 w-8 p-0 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* QR Code and Business Card - Horizontal Scrollable Layout */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 flex-nowrap min-w-max">
                {/* Profile QR Card */}
                <div className="flex-shrink-0 w-[280px]">
                  <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 shadow-lg h-full">
                    <CardContent className="p-4 h-full flex flex-col justify-between min-h-[280px]">
                      <div className="flex items-center space-x-3 mb-4">
                        {/* QR Code */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-sm">
                            {qrLoading ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
                              </div>
                            ) : qrCodeData ? (
                              <img
                                src={qrCodeData}
                                alt="Profile QR Code"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-base mb-1">Profile QR</h3>
                          <p className="text-gray-300 dark:text-gray-400 text-xs leading-relaxed">Share your complete profile</p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/profile/${sanitizeUsernameForUrl(user.username)}`, '_blank');
                            addHapticFeedback('light');
                          }}
                          className="flex-1 bg-white hover:bg-gray-100 text-slate-800 border-0 h-8 text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View & Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            addHapticFeedback('light');
                            setShowQRDialog(false);
                            if (onShareQR) {
                              onShareQR();
                            }
                          }}
                          className="flex-1 bg-gray-700/50 hover:bg-gray-600/70 text-white border-gray-600/50 h-8 text-xs font-medium"
                        >
                          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                          Stats
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Business Card */}
                <div className="flex-shrink-0 w-[280px]">
                  <Card className="bg-gradient-to-b from-teal-400 to-teal-700 border-0 shadow-lg h-full">
                    <CardContent className="p-4 h-full flex flex-col justify-between min-h-[280px]">
                      <div className="flex items-center space-x-3 mb-4">
                        {/* QR Code */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-sm">
                            {qrLoading ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                              </div>
                            ) : qrCodeData ? (
                              <img
                                src={qrCodeData}
                                alt="Business Card QR Code"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-gray-100 font-bold text-base mb-1">Business Card</h3>
                          <p className="text-gray-100/90 text-xs leading-relaxed">Network like a pro with your digital card.</p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/profile/${sanitizeUsernameForUrl(user.username)}`, '_blank');
                            addHapticFeedback('light');
                          }}
                          className="flex-1 bg-white hover:bg-gray-100 text-blue-600 border-0 h-8 text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View & Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            addHapticFeedback('light');
                            setShowQRDialog(false);
                            if (onShareQR) {
                              onShareQR();
                            }
                          }}
                          className="flex-1 bg-teal-800 hover:bg-teal-700 text-gray-100 border-teal-700/50 h-8 text-xs font-medium"
                        >
                          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                          Stats
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* QR Code Info */}
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground mb-1">
                {qrType === 'individual' ? `${selectedLink?.title} QR Code` : 'Profile QR Code'}
              </p>
              <p className="text-xs text-muted-foreground/70 break-all">
                {qrType === 'individual' ? selectedLink?.url : `${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`}
              </p>
              {qrType === 'individual' && (
                <p className="text-xs text-blue-600 dark:text-primary mt-1">
                  Direct Link Mode - Opens {selectedLink?.title} directly
                </p>
              )}
              {qrType === 'bundle' && (
                <p className="text-xs text-muted-foreground mt-1">
                  All Links - Opens your complete profile
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default MobileHomePage;