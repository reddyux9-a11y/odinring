import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  GripVertical,
  Upload,
  Save,
  Sliders,
  Camera
} from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import IconPicker from "./IconPicker";
import { getAllBannerPatterns } from "../lib/bannerUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Customization = ({ user, profile, setProfile, setUser, links, setLinks, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Color presets
  const colorPresets = [
    { name: "Midnight", bg: "#000000", accent: "#ffffff", card: "#1a1a1a" },
    { name: "Ocean", bg: "#0f172a", accent: "#38bdf8", card: "#1e293b" },
    { name: "Forest", bg: "#064e3b", accent: "#10b981", card: "#065f46" },
    { name: "Sunset", bg: "#7c2d12", accent: "#f97316", card: "#9a3412" },
    { name: "Purple", bg: "#581c87", accent: "#a855f7", card: "#6b21a8" },
    { name: "Clean", bg: "#ffffff", accent: "#000000", card: "#f8fafc" },
    { name: "Minimal", bg: "#f8fafc", accent: "#475569", card: "#ffffff" },
    { name: "Professional", bg: "#1e40af", accent: "#60a5fa", card: "#2563eb" }
  ];

  // Font options (class names and common CSS stacks)
  const fontOptions = [
    { name: "System Sans (Default)", value: "font-sans", preview: "Modern & Clean" },
    { name: "System Serif", value: "font-serif", preview: "Classic & Elegant" },
    { name: "System Mono", value: "font-mono", preview: "Technical & Sharp" },
    { name: "Roboto", value: "Roboto, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Clean & Familiar" },
    { name: "Inter", value: "Inter, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Modern Sans" },
    { name: "Poppins", value: "Poppins, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Rounded Sans" },
    { name: "Montserrat", value: "Montserrat, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Geometric Sans" },
    { name: "Nunito", value: "Nunito, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Friendly Sans" },
    { name: "Outfit", value: "Outfit, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif", preview: "Stylish Sans" },
    { name: "Playfair Display", value: "'Playfair Display', Georgia, Cambria, 'Times New Roman', Times, serif", preview: "Elegant Serif" },
    { name: "Lora", value: "Lora, Georgia, Cambria, 'Times New Roman', Times, serif", preview: "Readable Serif" }
  ];

  // Button radius options
  const radiusOptions = [
    { name: "None", value: "none" },
    { name: "Small", value: "sm" },
    { name: "Medium", value: "md" },
    { name: "Large", value: "lg" },
    { name: "Full", value: "full" }
  ];

  // Button shadow options
  const shadowOptions = [
    { name: "None", value: "none" },
    { name: "Soft", value: "soft" },
    { name: "Medium", value: "md" },
    { name: "Strong", value: "lg" }
  ];

  // Avatar shape options
  const avatarShapeOptions = [
    { name: "Circle", value: "circle" },
    { name: "Rounded", value: "rounded" },
    { name: "Square", value: "square" }
  ];

  // Link card style options
  const cardStyles = [
    { name: "Default", value: "default", preview: "Standard button style" },
    { name: "Minimal", value: "minimal", preview: "Clean and simple" },
    { name: "Gradient", value: "gradient", preview: "Colorful gradient" },
    { name: "Glass", value: "glass", preview: "Glassmorphism effect" },
    { name: "Filled", value: "filled", preview: "Solid color fill" },
    { name: "Outlined", value: "outlined", preview: "Border only" }
  ];

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setLinks(items);
    addHapticFeedback('light');

    try {
      // Update order in backend
      const token = localStorage.getItem('token');
      const updatePromises = items.map((link, index) =>
        api.put(`/links/${link.id}`, { ...link, order: index })
      );

      await Promise.all(updatePromises);
      mobileToast.success("Link order updated! 🔄");
    } catch (error) {
      mobileToast.error("Failed to save link order");
      // Revert on error
      if (onUpdate) onUpdate();
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mobileToast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mobileToast.error("File size must be less than 5MB");
      return;
    }

    // Create immediate preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setImagePreview(previewUrl);
      // Update profile state immediately with preview
      const updates = { 
        avatar: previewUrl,
        custom_logo: previewUrl 
      };
      setProfile(prev => ({ ...prev, ...updates }));
    };
    reader.readAsDataURL(file);

    setLoading(true);
    addHapticFeedback('light');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await api.post(`/upload-logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (response.data.success) {
        // Update both avatar and custom_logo with server response
        const updates = { 
          avatar: response.data.logo_url,
          custom_logo: response.data.logo_url 
        };
        
        await api.put(`/me`, updates);

        setProfile(prev => ({ ...prev, ...updates }));
        setImagePreview(response.data.logo_url);
        
        addHapticFeedback('success');
        mobileToast.success("Profile photo updated! ✨");
      }
    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Failed to upload photo");
      // Revert preview on error
      setImagePreview(null);
      setProfile(prev => ({ 
        ...prev, 
        avatar: profile.avatar || "",
        custom_logo: profile.custom_logo || ""
      }));
    } finally {
      setLoading(false);
    }
  };

  const applyColorPreset = async (preset) => {
    setLoading(true);
    addHapticFeedback('light');

    try {
      const updates = {
        background_color: preset.bg,
        accent_color: preset.accent
      };
      
      // Update profile state immediately for live preview
      setProfile(prev => ({
        ...prev,
        backgroundColor: preset.bg,
        background_color: preset.bg,
        accentColor: preset.accent,
        accent_color: preset.accent
      }));

      const token = localStorage.getItem('token');
      await api.put(`/me`, updates);

      // Don't update user state to avoid Dashboard re-renders that reset activeSection
      // if (setUser) {
      //   setUser(prev => ({ ...prev, ...updates }));
      // }
      
      addHapticFeedback('success');
      mobileToast.success(`${preset.name} theme applied! 🎨`);
    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Failed to apply theme");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      await api.put(`/me`, updates);

      setProfile(prev => ({ ...prev, ...updates }));
      // Don't update user state to avoid Dashboard re-renders
      // if (setUser) setUser(prev => ({ ...prev, ...updates }));
      
      // Remove onUpdate call that might cause navigation
      // if (onUpdate) onUpdate();
      
      addHapticFeedback('success');
    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FadeInUp>
      <div className="h-full w-full">
        {/* Customization Panel */}
        <div className="lg:w-[635px] space-y-6" style={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px', width: '100%', paddingLeft: '24px', paddingRight: '24px' }}>
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Customization</h2>
              <p className="text-muted-foreground">Design your perfect profile</p>
            </div>
          </div>

          {/* Customization Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" style={{ width: '100%' }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Style</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              {/* Color Presets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Color Themes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {colorPresets.map((preset) => (
                      <motion.div
                        key={preset.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          applyColorPreset(preset);
                        }}
                        className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="font-medium text-sm"
                            style={{ color: preset.accent }}
                          >
                            {preset.name}
                          </span>
                          <div className="flex space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: preset.bg }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: preset.accent }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: preset.card }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={profile.backgroundColor || "#ffffff"}
                          onChange={(e) => {
                            const updates = { background_color: e.target.value };
                            setProfile(prev => ({ 
                              ...prev, 
                              backgroundColor: e.target.value, 
                              background_color: e.target.value 
                            }));
                            updateProfile(updates);
                          }}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          value={profile.backgroundColor || "#ffffff"}
                          onChange={(e) => {
                            setProfile(prev => ({ 
                              ...prev, 
                              backgroundColor: e.target.value, 
                              background_color: e.target.value 
                            }));
                          }}
                          onBlur={(e) => updateProfile({ background_color: e.target.value })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={profile.accentColor || "#000000"}
                          onChange={(e) => {
                            const updates = { accent_color: e.target.value };
                            setProfile(prev => ({ 
                              ...prev, 
                              accentColor: e.target.value, 
                              accent_color: e.target.value 
                            }));
                            updateProfile(updates);
                          }}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          value={profile.accentColor || "#000000"}
                          onChange={(e) => {
                            setProfile(prev => ({ 
                              ...prev, 
                              accentColor: e.target.value, 
                              accent_color: e.target.value 
                            }));
                          }}
                          onBlur={(e) => updateProfile({ accent_color: e.target.value })}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Button Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={profile.button_background_color || profile.buttonBackgroundColor || "#000000"}
                          onChange={(e) => {
                            const updates = { button_background_color: e.target.value };
                            setProfile(prev => ({ 
                              ...prev, 
                              buttonBackgroundColor: e.target.value, 
                              button_background_color: e.target.value 
                            }));
                            updateProfile(updates);
                          }}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          value={profile.button_background_color || profile.buttonBackgroundColor || "#000000"}
                          onChange={(e) => {
                            setProfile(prev => ({ 
                              ...prev, 
                              buttonBackgroundColor: e.target.value, 
                              button_background_color: e.target.value 
                            }));
                          }}
                          onBlur={(e) => updateProfile({ button_background_color: e.target.value })}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Button Text Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={profile.button_text_color || profile.buttonTextColor || "#ffffff"}
                          onChange={(e) => {
                            const updates = { button_text_color: e.target.value };
                            setProfile(prev => ({ 
                              ...prev, 
                              buttonTextColor: e.target.value, 
                              button_text_color: e.target.value 
                            }));
                            updateProfile(updates);
                          }}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          value={profile.button_text_color || profile.buttonTextColor || "#ffffff"}
                          onChange={(e) => {
                            setProfile(prev => ({ 
                              ...prev, 
                              buttonTextColor: e.target.value, 
                              button_text_color: e.target.value 
                            }));
                          }}
                          onBlur={(e) => updateProfile({ button_text_color: e.target.value })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typography */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Type className="w-5 h-5" />
                    <span>Typography</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={profile.fontFamily || profile.font_family || "font-sans"}
                      onValueChange={(value) => {
                        // Persist both locally and to backend profile
                        setProfile(prev => ({ ...prev, fontFamily: value, font_family: value }));
                        updateProfile({ font_family: value });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(opt => (
                          <SelectItem key={opt.name} value={opt.value}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Link Appearance - intentionally hidden for now */}
              {false && (
                <Card>
                  <CardHeader>
                    <CardTitle>Link Appearance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Button Radius</Label>
                      <Select
                        value={profile.button_radius || "md"}
                        onValueChange={(value) => {
                          setProfile(prev => ({ ...prev, button_radius: value }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select radius" />
                        </SelectTrigger>
                        <SelectContent>
                          {radiusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Button Shadow</Label>
                      <Select
                        value={profile.button_shadow || "soft"}
                        onValueChange={(value) => {
                          setProfile(prev => ({ ...prev, button_shadow: value }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select shadow" />
                        </SelectTrigger>
                        <SelectContent>
                          {shadowOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Profile Elements */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Avatar Shape</Label>
                    <Select
                      value={profile.avatar_shape || "circle"}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, avatar_shape: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select shape" />
                      </SelectTrigger>
                      <SelectContent>
                        {avatarShapeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="mr-4">Show Footer</Label>
                    <Switch
                      checked={profile.show_footer !== false}
                      onCheckedChange={(checked) => {
                        // Optimistic local update first
                        setProfile(prev => ({ ...prev, show_footer: checked }));
                        // Persist without triggering global refreshes
                        (async () => {
                          try {
                            await api.put(`/me`, { show_footer: checked });
                          } catch (e) {
                            // Revert on failure
                            setProfile(prev => ({ ...prev, show_footer: !checked }));
                            mobileToast.error('Failed to update footer setting');
                          }
                        })();
                      }}
                    />
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-6">
              {/* Link Card Styles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sliders className="w-5 h-5" />
                    <span>Link Card Style</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label>Choose a style</Label>
                      <Select
                        value={(links[0]?.style) || "default"}
                        onValueChange={async (value) => {
                          try {
                            setLoading(true);
                            addHapticFeedback('light');
                            const updatePromises = links.map(link => 
                              api.put(`/links/${link.id}`, { ...link, style: value })
                            );
                            await Promise.all(updatePromises);
                            const updated = links.map(link => ({ ...link, style: value }));
                            setLinks(updated);
                            addHapticFeedback('success');
                            const picked = cardStyles.find(cs => cs.value === value)?.name || value;
                            mobileToast.success(`${picked} style applied to all links! 🎨`);
                          } catch (error) {
                            addHapticFeedback('error');
                            mobileToast.error("Failed to update link styles");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select link style" />
                        </SelectTrigger>
                        <SelectContent>
                          {cardStyles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Link Reordering */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GripVertical className="w-5 h-5" />
                    <span>Reorder Links</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="links">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 drag-container"
                        >
                          {links.map((link, index) => (
                            <Draggable key={link.id} draggableId={link.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 touch-none ${
                                    snapshot.isDragging 
                                      ? 'bg-blue-100 shadow-2xl scale-105 z-50 border-2 border-blue-300' 
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    ...(snapshot.isDragging && {
                                      position: 'relative',
                                      zIndex: 1000,
                                      transform: `${provided.draggableProps.style?.transform || ''} rotate(1deg)`,
                                    })
                                  }}
                                >
                                  <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{link.title}</div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</div>
                                  </div>
                                  <Badge variant={link.active ? "default" : "secondary"}>
                                    {link.active ? "Active" : "Hidden"}
                                  </Badge>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  
                  {links.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GripVertical className="w-8 h-8 mx-auto mb-2 text-muted" />
                      <p>No links to reorder</p>
                      <p className="text-sm">Create some links first</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Profile Photo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {profile.custom_logo || profile.avatar ? (
                        <img 
                          src={profile.custom_logo || profile.avatar} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={profile.name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      onBlur={(e) => updateProfile({ name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <Label>Bio</Label>
                    <Input
                      value={profile.bio || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      onBlur={(e) => updateProfile({ bio: e.target.value })}
                      placeholder="Tell people about yourself"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Banner Pattern - intentionally hidden for now */}
              {false && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>Banner Pattern</span>
                    </CardTitle>
                    <CardDescription>
                      Choose a background pattern for your profile page
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {getAllBannerPatterns().map((pattern) => (
                        <Button
                          key={pattern.id}
                          variant={profile.banner_pattern === pattern.id ? "default" : "outline"}
                          className="h-16 flex flex-col items-center justify-center space-y-1"
                          onClick={() => {
                            setProfile(prev => ({ ...prev, banner_pattern: pattern.id }));
                            updateProfile({ banner_pattern: pattern.id });
                          }}
                        >
                          <div className={`w-8 h-4 rounded ${pattern.preview} opacity-60`}></div>
                          <span className="text-xs">{pattern.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </FadeInUp>
  );
};

export default Customization;