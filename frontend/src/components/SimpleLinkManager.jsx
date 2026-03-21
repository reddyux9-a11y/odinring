import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";  
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getIconByName } from "../lib/iconMap";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  ArrowLeft
} from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sanitize phone number input to keep it reasonably short and valid
const normalizePhoneNumber = (value, countryMeta) => {
  if (!value) return "";
  // Allow digits, +, spaces, dashes, dots, parentheses
  let cleaned = value.replace(/[^0-9+()\-\s.]/g, "");
  // Prevent multiple '+' signs
  const plusIndex = cleaned.indexOf("+");
  if (plusIndex > 0) {
    cleaned = cleaned.replace(/\+/g, "");
  } else if (plusIndex === 0) {
    cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
  }
  // Hard cap length to avoid absurdly long entries
  const maxLen = countryMeta?.maxDigits ?? 15;
  // We only care about limiting the digits; country code is applied separately
  const digitsOnly = cleaned.replace(/\D/g, "");
  return digitsOnly.slice(0, maxLen);
};

// Custom DialogContent without close button
const CustomDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = "CustomDialogContent";

const SimpleLinkManager = ({ links, setLinks, onBack }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const PHONE_COUNTRIES = [
    { code: "IN", label: "India (+91)", dialCode: "+91", maxDigits: 10 },
    { code: "US", label: "USA (+1)", dialCode: "+1", maxDigits: 10 },
    { code: "GB", label: "UK (+44)", dialCode: "+44", maxDigits: 10 },
    { code: "EU", label: "Europe (+49)", dialCode: "+49", maxDigits: 11 },
  ];

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    phone_number: "",
    icon: "Link",
    category: "social"
  });

  const [phoneCountry, setPhoneCountry] = useState("IN");
  const [phoneLocal, setPhoneLocal] = useState("");

  // Icon dropdown state
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);

  // Category options
  const categoryOptions = [
    { value: "social", label: "Social", icon: "Users", color: "bg-blue-100 text-blue-800" },
    { value: "media", label: "Media", icon: "Camera", color: "bg-purple-100 text-purple-800" },
    { value: "business", label: "Business", icon: "Briefcase", color: "bg-green-100 text-green-800" }
  ];

  // Icon data for dropdown
  const iconData = [
    { name: "Link", category: "General" },
    { name: "Globe", category: "General" },
    { name: "Briefcase", category: "Business" },
    { name: "Laptop", category: "Tech" },
    { name: "Smartphone", category: "Tech" },
    { name: "Music", category: "Creative" },
    { name: "Camera", category: "Creative" },
    { name: "Video", category: "Creative" },
    { name: "Mail", category: "Communication" },
    { name: "MessageCircle", category: "Communication" },
    { name: "ShoppingCart", category: "Business" },
    { name: "Facebook", category: "Social" },
    { name: "Twitter", category: "Social" },
    { name: "Instagram", category: "Social" },
    { name: "Linkedin", category: "Social" },
    { name: "Youtube", category: "Social" },
    { name: "Github", category: "Tech" },
    { name: "Phone", category: "Communication" },
    { name: "Users", category: "Social" },
    { name: "BarChart3", category: "Business" },
    { name: "DollarSign", category: "Business" },
    { name: "Building", category: "Business" },
    { name: "TrendingUp", category: "Business" },
    { name: "Target", category: "Business" },
    { name: "Lightbulb", category: "Business" },
    { name: "Zap", category: "Business" },
    { name: "Settings", category: "Tech" },
    { name: "Palette", category: "Creative" },
    { name: "PenTool", category: "Creative" },
    { name: "Paintbrush", category: "Creative" },
    { name: "FileText", category: "Creative" },
    { name: "Mic", category: "Creative" },
    { name: "Star", category: "Creative" },
    { name: "Heart", category: "Creative" },
    { name: "Monitor", category: "Tech" },
    { name: "Tablet", category: "Tech" },
    { name: "Database", category: "Tech" },
    { name: "Server", category: "Tech" },
    { name: "Wifi", category: "Tech" },
    { name: "Coffee", category: "Lifestyle" },
    { name: "Dumbbell", category: "Lifestyle" },
    { name: "Pizza", category: "Lifestyle" },
    { name: "Plane", category: "Lifestyle" },
    { name: "BookOpen", category: "Lifestyle" },
    { name: "Gamepad2", category: "Lifestyle" },
    { name: "Home", category: "Lifestyle" },
    { name: "Leaf", category: "Lifestyle" },
    { name: "Gift", category: "Lifestyle" },
    { name: "Calendar", category: "Lifestyle" }
  ];

  const updateOrderOnServer = async (items) => {
    try {
      const token = localStorage.getItem('token');
      const updatePromises = items.map((link, index) =>
        api.put(`/links/${link.id}`, { ...link, order: index })
      );
      await Promise.all(updatePromises);
      mobileToast.success("Link order updated! 🔄");
    } catch (error) {
      mobileToast.error("Failed to save link order");
    }
  };

  const moveLink = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= links.length) return;
    const items = Array.from(links);
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setLinks(items);
    addHapticFeedback('light');
    await updateOrderOnServer(items);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      mobileToast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      const linkData = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        phone_number: formData.phone_number?.trim() || null,
        icon: formData.icon, // Use selected icon
        category: formData.category, // Use selected category
        style: "default" // Default style
      };

      let response;
      if (editingLink) {
        // Update existing link
        response = await api.put(`/links/${editingLink.id}`, linkData);
        
        // Update links in state
        setLinks(prev => prev.map(link => 
          link.id === editingLink.id ? response.data : link
        ));
        
        mobileToast.success("Link updated successfully! ✅");
      } else {
        // Create new link
        response = await api.post(`/links`, linkData);
        
        // Add new link to state
        setLinks(prev => [...prev, response.data]);
        mobileToast.success("Link created successfully! 🚀");
      }

      // Reset form and close dialog
      setFormData({ title: "", url: "", description: "", phone_number: "", icon: "Globe", category: "social" });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingLink(null);
      setIconDropdownOpen(false);
      addHapticFeedback('success');

    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    // Infer country from stored phone_number if possible
    let inferredCountry = "IN";
    let localPart = "";
    if (link.phone_number && typeof link.phone_number === "string") {
      const match = PHONE_COUNTRIES.find(c => link.phone_number.startsWith(c.dialCode));
      if (match) {
        inferredCountry = match.code;
        localPart = link.phone_number.slice(match.dialCode.length).replace(/\D/g, "").slice(0, match.maxDigits);
      } else {
        // Fallback: keep digits only, assume current default country
        localPart = link.phone_number.replace(/\D/g, "");
      }
    }
    setPhoneCountry(inferredCountry);
    setPhoneLocal(localPart);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || "",
      phone_number: link.phone_number || "",
      icon: link.icon || "Link",
      category: link.category || "social"
    });
    setIsEditDialogOpen(true);
    addHapticFeedback('light');
  };

  const trackClickAndOpen = async (link) => {
    try {
      // Track click (endpoint does not require auth)
      await api.post(`/links/${link.id}/click`);
      // Optimistically update UI
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, clicks: (l.clicks || 0) + 1 } : l));
    } catch (e) {
      // Non-blocking; ignore errors for UX
    } finally {
      window.open(link.url, '_blank');
    }
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm("Are you sure you want to delete this link?")) {
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/links/${linkId}`);

      // Remove link from state
      setLinks(prev => prev.filter(link => link.id !== linkId));
      addHapticFeedback('success');
      mobileToast.success("Link deleted successfully");

    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Failed to delete link");
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkVisibility = async (linkId, currentActive) => {
    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/links/${linkId}`, { active: !currentActive });

      // Update links in state
      setLinks(prev => prev.map(link => 
        link.id === linkId ? response.data : link
      ));
      
      addHapticFeedback('success');
      mobileToast.success(!currentActive ? "Link activated" : "Link hidden");

    } catch (error) {
      addHapticFeedback('error');
      mobileToast.error("Failed to update link visibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FadeInUp>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  addHapticFeedback('light');
                  onBack();
                }}
                className="h-8 w-8 p-0 hover:bg-muted sm:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Your Links</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Create and manage your links</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Link</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{links.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Links</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{links.filter(l => l.active).length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{links.reduce((sum, l) => sum + (l.clicks || 0), 0)}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{links.filter(l => !l.active).length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Hidden</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links List */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Links Management</CardTitle>
          </CardHeader>
          <CardContent className="w-full p-3 sm:p-6 ml-0">
            {(() => {
              if (!links || links.length === 0) {
                return (
                  <div className="text-center py-8 sm:py-12">
                    <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-muted mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No links yet</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">Create your first link to get started</p>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto border-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Link
                    </Button>
                  </div>
                );
              } else {
                return (
                  <div className="w-full space-y-3 overflow-x-hidden">
                    {links.map((link, index) => {
                      return (
                  <div key={link.id} className="border border-border rounded-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm hover:bg-card/90 hover:shadow-lg hover:border-border sm:border sm:rounded-lg sm:bg-card sm:hover:bg-muted sm:hover:shadow-md" style={{ width: '100%' }}>
                    {/* Mobile-optimized compact layout */}
                    <div className="w-full p-2 sm:p-4">
                      <div className="flex items-center sm:items-start gap-1 sm:gap-3">
                        {/* Reorder arrows - smaller on mobile */}
                        <div className="flex flex-col -my-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLink(index, index - 1)}
                            className="h-4 w-4 sm:h-6 sm:w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Move up"
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLink(index, index + 1)}
                            className="h-4 w-4 sm:h-6 sm:w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Move down"
                            disabled={index === links.length - 1}
                          >
                            <ChevronDown className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        
                        {/* Icon - hidden on mobile, visible on desktop */}
                        <div className="hidden sm:flex w-6 h-6 sm:w-10 sm:h-10 bg-muted rounded-xl items-center justify-center flex-shrink-0">
                          {getIconByName(link.icon || "Globe", "w-3 h-3 sm:w-5 sm:h-5 text-foreground")}
                        </div>
                        
                        {/* Content area */}
                        <div className="flex-1 min-w-0">
                                    {/* Header row (desktop): Title • Category • Active • clicks • #index | actions on far right */}
                                    <div className="hidden sm:flex items-center gap-2 mb-1 min-w-0">
                                      <h3 className="font-semibold text-foreground text-base truncate">
                                        {link.title}
                                      </h3>
                                      {link.category && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs px-2 py-0.5 flex-shrink-0 ${
                                            link.category === 'social' ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' :
                                            link.category === 'media' ? 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30' :
                                            link.category === 'business' ? 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30' :
                                            'border-border text-foreground bg-muted'
                                          }`}
                                        >
                                          {link.category === 'social' ? 'Social' :
                                           link.category === 'media' ? 'Media' :
                                           link.category === 'business' ? 'Business' :
                                           link.category}
                                        </Badge>
                                      )}
                                      <Badge 
                                        variant={link.active ? "default" : "secondary"} 
                                        className="text-xs px-2 py-0.5 flex-shrink-0"
                                      >
                                        {link.active ? "Active" : "Hidden"}
                                      </Badge>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                        <span className="flex items-center gap-1">
                                          <BarChart3 className="w-3 h-3" />
                                          <span>{(link.clicks || 0)} clicks</span>
                                        </span>
                                        <span>#{index + 1}</span>
                                      </div>
                                      {/* Actions (desktop) */}
                                      <div className="flex items-center gap-1 ml-auto">
                                        <Switch
                                          checked={link.active}
                                          onCheckedChange={() => toggleLinkVisibility(link.id, link.active)}
                                          className="data-[state=checked]:bg-black"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => trackClickAndOpen(link)}
                                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                          title="Open link"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(link)}
                                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                          title="Edit link"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(link.id)}
                                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                          title="Delete link"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Mobile compact header: name and actions in single row */}
                                    <div className="sm:hidden min-w-0">
                                      {/* Single row: Name and actions */}
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex-1 min-w-0 mr-1">
                                          <h3 className="font-medium text-foreground text-sm leading-tight truncate">
                                            {link.title}
                                          </h3>
                                          {link.category && (
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs px-1.5 py-0.5 mt-0.5 ${
                                                link.category === 'social' ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' :
                                                link.category === 'media' ? 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30' :
                                                link.category === 'business' ? 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30' :
                                                'border-border text-foreground bg-muted'
                                              }`}
                                            >
                                              {link.category === 'social' ? 'Social' :
                                               link.category === 'media' ? 'Media' :
                                               link.category === 'business' ? 'Business' :
                                               link.category}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0 flex-shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleLinkVisibility(link.id, link.active)}
                                            className={`h-5 w-5 p-0 ${link.active ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                            title={link.active ? "Deactivate link" : "Activate link"}
                                          >
                                            {link.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => trackClickAndOpen(link)}
                                            className="text-muted-foreground hover:text-foreground h-5 w-5 p-0"
                                            title="Open link"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(link)}
                                            className="text-muted-foreground hover:text-foreground h-5 w-5 p-0"
                                            title="Edit link"
                                          >
                                            <Edit className="w-2.5 h-2.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(link.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-5 w-5 p-0"
                                            title="Delete link"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Link URL below */}
                                      <div className="pl-0">
                                        <p className="text-xs text-muted-foreground truncate">
                                          {link.url}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* URL below on larger screens only */}
                                    <p className="hidden sm:block text-sm text-blue-600 font-mono break-all mb-1">
                                      {link.url}
                                    </p>
                                    
                                    {/* Description - hide on mobile for compact strip */}
                                    {link.description && (
                                      <p className="hidden sm:block text-xs text-muted-foreground mb-2 line-clamp-2">
                                        {link.description}
                                      </p>
                                    )}
                                    
                                    {/* Stats and actions row (mobile) merged into header above */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                    })}
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>

        {/* Add Link Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <CustomDialogContent className="mx-2 w-[calc(100vw-1rem)] max-w-md sm:mx-auto sm:w-full border-0 shadow-2xl bg-card">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Add New Link
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Create a beautiful link for your profile</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="add-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Link Title *
                </Label>
                <Input
                  id="add-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="My Website"
                  required
                  autoFocus
                  className="h-12 border-2 border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-200 bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-url" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  URL (paste your link here) *
                </Label>
                <Input
                  id="add-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  required
                  className="h-12 border-2 border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-200 bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-description" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Description (Optional)
                </Label>
                <Input
                  id="add-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="h-12 border-2 border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-200 bg-background/80 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-phone" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Mobile Number (Optional)
                </Label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountry}
                    onChange={(e) => {
                      const code = e.target.value;
                      setPhoneCountry(code);
                      const meta = PHONE_COUNTRIES.find(c => c.code === code);
                      const normalized = normalizePhoneNumber(phoneLocal, meta);
                      setPhoneLocal(normalized);
                      setFormData(prev => ({
                        ...prev,
                        phone_number: normalized ? `${meta.dialCode}${normalized}` : ""
                      }));
                    }}
                    className="h-12 rounded-xl border-2 border-border bg-background px-2 text-sm"
                  >
                    {PHONE_COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="add-phone"
                    type="tel"
                    value={phoneLocal}
                    inputMode="tel"
                    maxLength={PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.maxDigits ?? 15}
                    onChange={(e) => {
                      const meta = PHONE_COUNTRIES.find(c => c.code === phoneCountry);
                      const normalized = normalizePhoneNumber(e.target.value, meta);
                      setPhoneLocal(normalized);
                      setFormData(prev => ({
                        ...prev,
                        phone_number: normalized ? `${meta.dialCode}${normalized}` : ""
                      }));
                    }}
                    placeholder="1234567890"
                    className="h-12 border-2 border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-200 bg-background/80 backdrop-blur-sm flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  For WhatsApp and Call buttons. We’ll format it as full international number.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Category *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        formData.category === category.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-border hover:border-border/80 bg-background/80'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          formData.category === category.value ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-muted'
                        }`}>
                          {getIconByName(category.icon, `w-4 h-4 ${
                            formData.category === category.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                          }`)}
                        </div>
                        <span className={`text-xs font-medium ${
                          formData.category === category.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground'
                        }`}>
                          {category.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Icon
                </Label>
                <div className="border-2 border-border rounded-xl p-4 bg-card/80 backdrop-blur-sm">
                  <Popover open={iconDropdownOpen} onOpenChange={setIconDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={iconDropdownOpen}
                        className="w-full justify-between h-12 text-left font-normal border-2 border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-200 bg-background/80 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          {getIconByName(formData.icon, "w-5 h-5 text-foreground")}
                          <span className="text-foreground">{formData.icon}</span>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search icons..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No icon found.</CommandEmpty>
                          {iconData.map((icon) => (
                            <CommandItem
                              key={icon.name}
                              value={icon.name}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, icon: icon.name }));
                                setIconDropdownOpen(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2"
                            >
                              {getIconByName(icon.name, "w-4 h-4")}
                              <span>{icon.name}</span>
                              <span className="ml-auto text-xs text-gray-500">{icon.category}</span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  Live Preview
                </Label>
                <div className="border-2 border-border rounded-xl p-4 bg-muted">
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
                      {getIconByName(formData.icon, "w-5 h-5 text-foreground")}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-base truncate text-foreground">
                        {formData.title || "Link Title"}
                      </div>
                      {formData.description && (
                        <div className="text-sm opacity-70 truncate text-muted-foreground">
                          {formData.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-60 flex-shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({ title: "", url: "", description: "", phone_number: "", icon: "Globe", category: "social" });
                    setIconDropdownOpen(false);
                  }}
                  className="flex-1 h-12 text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-xl"
                >
                  {loading ? "Creating..." : "Create Link"}
                </Button>
              </div>
            </form>
          </CustomDialogContent>
        </Dialog>

        {/* Edit Link Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <CustomDialogContent className="mx-2 w-[calc(100vw-1rem)] max-w-md sm:mx-auto sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium">Link Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="My Website"
                  required
                  autoFocus
                  className="mt-1 h-10 sm:h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-url" className="text-sm font-medium">URL (paste your link here) *</Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  required
                  className="mt-1 h-10 sm:h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium">Description (Optional)</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="mt-1 h-10 sm:h-11"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone" className="text-sm font-medium">Mobile Number (Optional)</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone_number}
                  inputMode="tel"
                  maxLength={20}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, phone_number: normalizePhoneNumber(e.target.value) }))
                  }
                  placeholder="+1234567890"
                  className="mt-1 h-10 sm:h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">For WhatsApp and Call buttons</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Category *</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                      className={`p-2 rounded-lg border transition-all duration-200 text-center ${
                        formData.category === category.value
                          ? 'border-blue-500 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-border hover:border-border/80'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          formData.category === category.value ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
                        }`}>
                          {getIconByName(category.icon, `w-3 h-3 ${
                            formData.category === category.value ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                          }`)}
                        </div>
                        <span className={`text-xs font-medium ${
                          formData.category === category.value ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'
                        }`}>
                          {category.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Icon</Label>
                <div className="mt-1">
                  <Popover open={iconDropdownOpen} onOpenChange={setIconDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={iconDropdownOpen}
                        className="w-full justify-between h-10 sm:h-11 text-left font-normal"
                      >
                        <div className="flex items-center gap-3">
                          {getIconByName(formData.icon, "w-4 h-4 text-gray-600")}
                          <span className="text-gray-700">{formData.icon}</span>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search icons..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No icon found.</CommandEmpty>
                          {iconData.map((icon) => (
                            <CommandItem
                              key={icon.name}
                              value={icon.name}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, icon: icon.name }));
                                setIconDropdownOpen(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2"
                            >
                              {getIconByName(icon.name, "w-4 h-4")}
                              <span>{icon.name}</span>
                              <span className="ml-auto text-xs text-gray-500">{icon.category}</span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setFormData({ title: "", url: "", description: "", phone_number: "", icon: "Globe", category: "social" });
                    setEditingLink(null);
                    setIconDropdownOpen(false);
                  }}
                  className="flex-1 h-11 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {loading ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </CustomDialogContent>
        </Dialog>
      </div>
    </FadeInUp>
  );
};

export default SimpleLinkManager;