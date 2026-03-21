import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Mail, 
  Lock, 
  Globe, 
  Moon, 
  User, 
  Users, 
  Briefcase, 
  Edit,
  Eye,
  EyeOff,
  Phone,
  Save,
  ArrowLeft,
  ChevronRight,
  Camera,
  Copy,
  Check,
  LogOut,
  ToggleRight,
  ToggleLeft,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { addHapticFeedback } from "../utils/mobileUtils";
import { toast } from "sonner";
import api from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";
import { sanitizeUsernameForUrl } from "../lib/utils";
import { useIdentityContext } from "../hooks/useIdentityContext";
import SubscriptionBadge from "./SubscriptionBadge";
import { validatePassword } from "../lib/passwordValidation";

const MobileSettingsPage = ({ 
  user, 
  profile, 
  setProfile, 
  links = [], 
  onBack,
  onEditLinks,
  onEditProfile,
  onLogout,
  onProfileUpdate
}) => {
  const { theme, toggleTheme } = useTheme();
  const { subscription } = useIdentityContext();
  const isDarkMode = theme === 'dark';
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    email: user.email || "",
    phone_number: user.phone_number || "",
    whatsapp_number: user.whatsapp_number || "",
    avatar: profile.avatar || "",
    custom_logo: profile.custom_logo || ""
  });
  const [isWhatsAppSameAsMobile, setIsWhatsAppSameAsMobile] = useState(() => {
    const phone = (user.phone_number || "").trim();
    const wa = (user.whatsapp_number || "").trim();
    return !wa || wa === phone;
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Update formData when user or profile changes
  useEffect(() => {
    setFormData({
      name: profile.name || "",
      bio: profile.bio || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      whatsapp_number: user.whatsapp_number || "",
      avatar: profile.avatar || "",
      custom_logo: profile.custom_logo || ""
    });
  }, [user, profile]);

  // Group links by category
  const personalLinks = links.filter(link => link.category === 'social' && link.active);
  const socialMediaLinks = links.filter(link => link.category === 'media' && link.active);
  const businessLinks = links.filter(link => link.category === 'business' && link.active);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    // Validate password requirements (must match backend validation)
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }
    try {
      setPasswordLoading(true);
      addHapticFeedback('light');
      await api.post(`/me/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordDialog(false);
      toast.success("Password updated successfully!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      addHapticFeedback('light');
      
      // Use existing /me API for profile updates
      const response = await api.put('/me', {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        phone_number: formData.phone_number || null,
        whatsapp_number: isWhatsAppSameAsMobile ? null : (formData.whatsapp_number || null)
      });
      
      // Update local state with response - the response contains updated user data
      setProfile({ ...profile, ...response.data });
      
      // The response from /me contains the full updated user object
      // Only refresh links if needed, not the entire user data (which we already have)
      if (onProfileUpdate) {
        // Pass flag to skip user refresh since we already have updated data
        await onProfileUpdate(true);
      }
      
      setIsEditingProfile(false);
      addHapticFeedback('success');
      toast.success("Profile updated successfully!", { duration: 1500 });
    } catch (error) {
      addHapticFeedback('error');
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage, { duration: 1500 });
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file", { duration: 1500 });
      return;
    }

    // Validate file size (5MB limit - matching existing API)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB", { duration: 1500 });
      return;
    }

    // Create immediate preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setImagePreview(previewUrl);
      // Update form data immediately with preview
      setFormData(prev => ({ 
        ...prev, 
        avatar: previewUrl,
        custom_logo: previewUrl 
      }));
      // Update profile state immediately to show image
      setProfile(prev => ({ 
        ...prev, 
        avatar: previewUrl,
        custom_logo: previewUrl 
      }));
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    addHapticFeedback('light');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Use existing /upload-logo API
      const response = await api.post('/upload-logo', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update form data with server response (base64 URL)
        const logoUrl = response.data.logo_url;
        setFormData(prev => ({ 
          ...prev, 
          avatar: logoUrl,
          custom_logo: logoUrl 
        }));
        // Update profile state with server response
        setProfile(prev => ({ 
          ...prev, 
          avatar: logoUrl,
          custom_logo: logoUrl 
        }));
        setImagePreview(logoUrl);
        
        // Also update via /me endpoint to sync with backend
        await api.put('/me', {
          avatar: logoUrl,
          custom_logo: logoUrl
        });
        
        addHapticFeedback('success');
        toast.success("Image uploaded successfully!", { duration: 1500 });
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      }
    } catch (error) {
      addHapticFeedback('error');
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || "Failed to upload image";
      toast.error(errorMessage, { duration: 1500 });
      // Revert preview on error
      setImagePreview(null);
      setFormData(prev => ({ 
        ...prev, 
        avatar: profile.avatar || "",
        custom_logo: profile.custom_logo || ""
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profile.name || "",
      bio: profile.bio || "",
      email: user.email || "",
      avatar: profile.avatar || "",
      custom_logo: profile.custom_logo || ""
    });
    setImagePreview(null);
    setIsEditingProfile(false);
  };

  const copyToClipboard = async (url) => {
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

  const copyProfileUrl = async () => {
    const sanitizedUsername = sanitizeUsernameForUrl(user.username);
    const url = `${window.location.origin}/profile/${sanitizedUsername}`;
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const renderSettingItem = (icon, label, value, action, onClick) => (
    <motion.div 
      className={`flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          {React.createElement(icon, { className: "w-4 h-4 text-muted-foreground" })}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{value}</p>
        </div>
      </div>
      {action || (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/70" />)}
    </motion.div>
  );

  const renderLinkCategory = (icon, title, subtitle, count, onEdit) => (
    <motion.div 
      className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border hover:bg-muted/50 cursor-pointer"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        addHapticFeedback('light');
        onEdit();
      }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          {React.createElement(icon, { className: "w-4 h-4 text-muted-foreground" })}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <p className="text-xs text-muted-foreground/70">{count} links</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          addHapticFeedback('light');
          onEdit();
        }}
        className="text-primary hover:text-primary/90 hover:bg-primary/10 px-2 py-1 h-auto"
      >
        <Edit className="w-3 h-3 mr-1" />
        Edit
      </Button>
    </motion.div>
  );

  if (isEditingProfile) {
    return (
      <div className="min-h-screen bg-card">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                addHapticFeedback('light');
                handleCancelEdit();
              }}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Update your profile information</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="px-6 py-6 space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-white dark:border-background shadow-lg">
                <AvatarImage src={imagePreview || formData.custom_logo || formData.avatar || user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                  {formData.name ? formData.name.split(' ').map(n => n[0]).join('') : user.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload').click()}
                  disabled={uploadingImage}
                  className="w-full h-10"
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      Change Photo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your display name"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell people about yourself..."
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-sm font-medium">Mobile Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1234567890"
              className="h-12"
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                checked={isWhatsAppSameAsMobile}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  setIsWhatsAppSameAsMobile(next);
                  if (next) {
                    setFormData(prev => ({ ...prev, whatsapp_number: "" }));
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">Same as WhatsApp number</span>
            </div>
            {!isWhatsAppSameAsMobile && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="whatsapp_number" className="text-sm font-medium">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+1234567890"
                  className="h-12"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Used for WhatsApp and Call buttons on your profile
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                addHapticFeedback('light');
                onBack();
              }}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-6 py-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-white dark:border-background shadow-lg">
                <AvatarImage src={imagePreview || profile.custom_logo || profile.avatar || user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                  {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : user.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground text-lg truncate">
                    {profile.name || user.username}
                  </h3>
                  {subscription && (
                    <SubscriptionBadge 
                      subscription={subscription} 
                      size="small" 
                      clickable={true}
                      title="Tap to upgrade or change plan"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addHapticFeedback('light');
                  setIsEditingProfile(true);
                }}
                className="border-blue-300 dark:border-blue-800 text-primary hover:bg-primary/10"
              >
                Edit
              </Button>
            </div>
            
            {/* Profile URLs */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Profile URL</p>
                  <p className="text-sm text-foreground truncate">
                    {window.location.origin}/profile/{sanitizeUsernameForUrl(user.username)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyProfileUrl}
                  className="ml-2 h-8 w-8 p-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Content */}
      <div className="px-6 py-2 space-y-8">
        {/* Account Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            {renderSettingItem(
              Mail,
              "Email",
              user.email || "jordan.smith@gmail.com",
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addHapticFeedback('light');
                  setIsEditingProfile(true);
                }}
                className="text-primary hover:text-primary/90 hover:bg-primary/10 px-2 py-1 h-auto"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}

            {renderSettingItem(
              Phone,
              "Mobile Number",
              user?.phone_number || formData.phone_number || "Not set",
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addHapticFeedback('light');
                  setIsEditingProfile(true);
                }}
                className="text-primary hover:text-primary/90 hover:bg-primary/10 px-2 py-1 h-auto"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            
            {renderSettingItem(
              Lock,
              "Password",
              "••••••••",
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addHapticFeedback('light');
                  setShowPasswordDialog(true);
                }}
                className="text-primary hover:text-primary/90 hover:bg-primary/10 px-2 py-1 h-auto"
                title="Change password"
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Preferences</h2>
          <div className="space-y-3">
            {renderSettingItem(
              Globe,
              "Language",
              "English",
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addHapticFeedback('light');
                  toast.info("Language settings coming soon!", { duration: 1500 });
                }}
                className="text-primary hover:text-primary/90 hover:bg-primary/10 px-2 py-1 h-auto"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            
            <motion.div 
              className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border cursor-pointer hover:bg-muted/50"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                addHapticFeedback('light');
                toggleTheme();
                toast.success(theme === 'dark' ? "Switched to light mode" : "Switched to dark mode", { duration: 1500 });
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">{isDarkMode ? "Dark theme enabled" : "Switch to dark theme"}</p>
                </div>
              </div>
              <div className="flex items-center">
                {isDarkMode ? (
                  <ToggleRight className="w-6 h-6 text-primary" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted-foreground/70" />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Link Management Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Link Management</h2>
          <div className="space-y-3">
            {renderLinkCategory(
              User,
              "Personal Links",
              user.email || "jordan.smith@gmail.com",
              personalLinks.length,
              () => onEditLinks('social')
            )}
            
            {renderLinkCategory(
              Users,
              "Social Media Links",
              user.email || "jordan.smith@gmail.com",
              socialMediaLinks.length,
              () => onEditLinks('media')
            )}
            
            {/* Business Card - Commented out */}
            {/* {renderLinkCategory(
              Briefcase,
              "Business Card",
              user.email || "jordan.smith@gmail.com",
              businessLinks.length,
              () => onEditLinks('business')
            )} */}
          </div>
        </div>

        {/* Logout Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Account Actions</h2>
          <motion.div 
            className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-destructive/30 hover:bg-destructive/10 cursor-pointer"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              addHapticFeedback('medium');
              onLogout();
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-red-900 text-sm">Sign Out</p>
                <p className="text-xs text-destructive">Logout from your account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </motion.div>
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-24" />

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Enter new password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1"
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileSettingsPage;

