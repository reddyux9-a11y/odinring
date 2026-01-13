import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { sanitizeUsernameForUrl } from "../lib/utils";

const ProfileSettings = ({ profile, setProfile, user }) => {
  const [formData, setFormData] = useState({ 
    ...profile,
    email: user.email || "",
    phone_number: profile.phone_number || user.phone_number || ""
  });
  const [copied, setCopied] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update profile via API
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        email: formData.email || null,
        phone_number: formData.phone_number || null
      };
      await api.put('/me', updateData);
      setProfile({ ...profile, ...formData });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Profile update failed:', error);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const copyProfileUrl = () => {
    const sanitizedUsername = sanitizeUsernameForUrl(user.username);
    const url = `${window.location.origin}/profile/${sanitizedUsername}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Profile URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
        
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || "Failed to upload image";
      toast.error(errorMessage);
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

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile details and personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={imagePreview || formData.custom_logo || formData.avatar || user.avatar} />
                <AvatarFallback className="bg-black text-white text-xl">
                  {formData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-3 h-3 mr-2" />
                      Change Photo
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-gray-600">
                  Username cannot be changed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                maxLength={142}
                className="resize-none"
              />
              <p className={`text-xs text-right ${formData.bio.length >= 142 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                {formData.bio.length}/142
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || user.email || ""}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Mobile Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number || user.phone_number || ""}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Used for WhatsApp and Call buttons on your profile
              </p>
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile URL */}
      <Card>
        <CardHeader>
          <CardTitle>Share Profile</CardTitle>
          <CardDescription>
            Share your profile URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Profile URL</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={`${window.location.origin}/profile/${sanitizeUsernameForUrl(user.username)}`}
                  readOnly
                  className="bg-muted text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProfileUrl}
                  className="border-border"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
};

export default ProfileSettings;