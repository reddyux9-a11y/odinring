import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Upload, Palette, Eye, Trash2, Image, CheckCircle } from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomBranding = ({ user, profile, setProfile, setUser, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(profile.custom_logo || "");
  const [showFooter, setShowFooter] = useState(profile.show_footer !== false);
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      mobileToast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      mobileToast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    addHapticFeedback('light');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await api.post(`/upload-logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (response.data.success) {
        setLogoPreview(response.data.logo_url);
        setProfile(prev => ({
          ...prev,
          custom_logo: response.data.logo_url
        }));
        
        // Update user state if setUser is available
        if (setUser) {
          setUser(prev => ({
            ...prev,
            custom_logo: response.data.logo_url
          }));
        }
        
        // Only refresh if onUpdate is available and we don't have setUser
        // (to avoid double refresh since we already updated state)
        if (onUpdate && !setUser) {
          onUpdate();
        }
        
        addHapticFeedback('success');
        mobileToast.success("Logo uploaded successfully! ✨");
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/me`, { custom_logo: "" });

      setLogoPreview("");
      setProfile(prev => ({
        ...prev,
        custom_logo: ""
      }));
      
      // Update user state if setUser is available
      if (setUser) {
        setUser(prev => ({
          ...prev,
          custom_logo: ""
        }));
      }
      
      // Refresh user data if onUpdate is available
      if (onUpdate) {
        onUpdate();
      }
      
      addHapticFeedback('light');
      mobileToast.success("Logo removed successfully");
    } catch (error) {
      console.error('Failed to remove logo:', error);
      mobileToast.error("Failed to remove logo");
    }
  };

  const handleFooterToggle = async (checked) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/me`, { show_footer: checked });

      setShowFooter(checked);
      setProfile(prev => ({
        ...prev,
        show_footer: checked
      }));
      
      addHapticFeedback('light');
      mobileToast.success(checked ? "Footer enabled" : "Footer hidden");
    } catch (error) {
      console.error('Failed to update footer setting:', error);
      mobileToast.error("Failed to update footer setting");
    }
  };

  return (
    <FadeInUp>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Custom Branding</h2>
            <p className="text-muted-foreground">Personalize your profile with custom logos and branding</p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Premium
          </Badge>
        </div>

        {/* Custom Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Custom Logo</span>
            </CardTitle>
            <CardDescription>
              Upload your own logo to replace the default profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Preview */}
            {logoPreview && (
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-16 h-16 bg-card rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-border">
                  <img 
                    src={logoPreview} 
                    alt="Custom logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Current Logo</p>
                  <p className="text-sm text-muted-foreground">Your custom logo is active</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}

            {/* Upload Section */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-500 space-y-1">
                <p>• Supported formats: PNG, JPG, GIF, SVG</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended size: 200x200 pixels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Footer Settings</span>
            </CardTitle>
            <CardDescription>
              Control the visibility of the "Powered by OdinRing" footer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="footer-toggle" className="text-base font-medium">
                  Show Footer
                </Label>
                <p className="text-sm text-gray-600">
                  {showFooter 
                    ? 'The "Powered by OdinRing" footer is visible on your profile'
                    : 'The footer is hidden from your profile'
                  }
                </p>
              </div>
              <Switch
                id="footer-toggle"
                checked={showFooter}
                onCheckedChange={handleFooterToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-600">
              <Eye className="w-5 h-5" />
              <span>Live Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-card rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-border">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-muted-foreground font-bold text-lg">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{user?.name}</h3>
              <p className="text-muted-foreground mb-4">{profile.bio}</p>
              
              {showFooter && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Powered by OdinRing</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeInUp>
  );
};

export default CustomBranding;