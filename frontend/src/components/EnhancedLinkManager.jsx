import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, GripVertical, ExternalLink, Palette, Zap, Copy, QrCode, TrendingUp, Calendar, Globe, Briefcase, X, MoreHorizontal, RefreshCw, Laptop, Settings2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import IconPicker from "./IconPicker";
import AdvancedLinkCustomizer from "./AdvancedLinkCustomizer";
import { LinkSkeletonLoader } from "./SkeletonLoader";
import { FadeInUp, StaggerContainer, StaggerItem } from "./PageTransitions";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedLinkManager = ({ links, setLinks, isMobile = false }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdvancedCustomizerOpen, setIsAdvancedCustomizerOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list, grid, compact
  const [sortBy, setSortBy] = useState("order"); // order, clicks, created, title
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    icon: "Globe",
    category: "general",
    style: "default",
    color: "#000000",
    backgroundColor: "#ffffff",
    borderRadius: "md",
    animation: "none",
    description: "",
    scheduled: false,
    publishDate: "",
    unpublishDate: ""
  });

  const linkCategories = [
    { id: "all", name: "All Links", color: "gray", count: links.length },
    { id: "social", name: "Social", color: "blue", count: links.filter(l => l.category === "social").length },
    { id: "professional", name: "Business", color: "green", count: links.filter(l => l.category === "professional").length },
    { id: "creative", name: "Creative", color: "purple", count: links.filter(l => l.category === "creative").length },
    { id: "business", name: "Commerce", color: "orange", count: links.filter(l => l.category === "business").length },
    { id: "personal", name: "Personal", color: "pink", count: links.filter(l => l.category === "personal").length }
  ];

  const linkStyles = [
    { id: "default", name: "Default", preview: "bg-white border border-gray-200 shadow-sm" },
    { id: "filled", name: "Filled", preview: "bg-gray-900 text-white shadow-sm" },
    { id: "gradient", name: "Gradient", preview: "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-sm" },
    { id: "glass", name: "Glass", preview: "bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm" },
    { id: "neon", name: "Clean", preview: "bg-gray-50 border border-gray-200 shadow-sm" },
    { id: "minimal", name: "Minimal", preview: "bg-white border border-gray-100 shadow-sm" }
  ];

  const animationTypes = [
    { id: "none", name: "None" },
    { id: "pulse", name: "Pulse" },
    { id: "bounce", name: "Bounce" },
    { id: "shake", name: "Shake" },
    { id: "glow", name: "Glow" },
    { id: "slide", name: "Slide" }
  ];

  const borderRadius = [
    { id: "none", name: "Square", class: "rounded-none" },
    { id: "sm", name: "Small", class: "rounded-lg" },
    { id: "md", name: "Medium", class: "rounded-xl" },
    { id: "lg", name: "Large", class: "rounded-2xl" },
    { id: "full", name: "Pill", class: "rounded-full" }
  ];

  // Auto-detect link type and suggest category
  const detectLinkType = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes('linkedin') || domain.includes('github')) return 'professional';
      if (domain.includes('instagram') || domain.includes('twitter') || domain.includes('facebook')) return 'social';
      if (domain.includes('youtube') || domain.includes('spotify') || domain.includes('soundcloud')) return 'creative';
      if (domain.includes('shop') || domain.includes('store') || domain.includes('buy')) return 'business';
      return 'general';
    } catch {
      return 'general';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Auto-detect category if not manually set
      let finalData = { ...formData };
      if (!editingLink && formData.category === 'general') {
        finalData.category = detectLinkType(formData.url);
      }

      if (editingLink) {
        const response = await axios.put(`${API}/links/${editingLink.id}`, finalData, { headers });
        setLinks(links.map(link => 
          link.id === editingLink.id ? response.data : link
        ));
        toast.success("Link updated successfully! ✨");
      } else {
        const response = await axios.post(`${API}/links`, finalData, { headers });
        setLinks([...links, response.data]);
        toast.success("Premium link created! 🚀");
      }
    } catch (error) {
      console.error('Link operation failed:', error);
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      icon: "Globe",
      category: "general",
      style: "default",
      color: "#000000",
      backgroundColor: "#ffffff",
      borderRadius: "md",
      animation: "none",
      description: "",
      scheduled: false,
      publishDate: "",
      unpublishDate: ""
    });
    setEditingLink(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon || "Globe",
      category: link.category || "general",
      style: link.style || "default",
      color: link.color || "#000000",
      backgroundColor: link.backgroundColor || "#ffffff",
      borderRadius: link.borderRadius || "md",
      animation: link.animation || "none",
      description: link.description || "",
      scheduled: link.scheduled || false,
      publishDate: link.publishDate || "",
      unpublishDate: link.unpublishDate || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (linkId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/links/${linkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinks(links.filter(link => link.id !== linkId));
      toast.success("Link deleted successfully");
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error("Failed to delete link");
    }
  };

  const toggleActive = async (linkId) => {
    try {
      const token = localStorage.getItem('token');
      const link = links.find(l => l.id === linkId);
      const newActiveState = !link.active;
      
      await axios.put(`${API}/links/${linkId}`, { active: newActiveState }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLinks(links.map(link =>
        link.id === linkId ? { ...link, active: newActiveState } : link
      ));
      
      toast.success(`Link ${newActiveState ? 'activated' : 'hidden'}`);
    } catch (error) {
      console.error('Toggle failed:', error);
      toast.error("Failed to update link status");
    }
  };

  const duplicateLink = (link) => {
    const newLink = {
      ...link,
      id: Date.now().toString(),
      title: `${link.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setLinks([...links, newLink]);
    toast.success("Link duplicated! 📋");
  };

  const copyLinkUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard! 📋");
  };

  const generateQRCode = (link) => {
    toast.success(`QR code generated for ${link.title}! 📱`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Links refreshed! ⚡");
  };

  const openAdvancedCustomizer = (link) => {
    setEditingLink(link);
    setIsAdvancedCustomizerOpen(true);
  };

  const handleAdvancedUpdate = async (customization) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/links/${editingLink.id}`, customization, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLinks(links.map(link => 
        link.id === editingLink.id ? response.data : link
      ));
      
      setIsAdvancedCustomizerOpen(false);
      setEditingLink(null);
      toast.success("Advanced customization saved! 🎨");
    } catch (error) {
      console.error('Advanced update failed:', error);
      toast.error("Failed to save customization");
    }
  };

  // Sort and filter links
  const sortedAndFilteredLinks = (() => {
    let filtered = selectedCategory === "all" 
      ? links 
      : links.filter(link => link.category === selectedCategory);

    switch (sortBy) {
      case "clicks":
        return filtered.sort((a, b) => b.clicks - a.clicks);
      case "created":
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case "title":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  })();

  const getLinkStyle = (link) => {
    const baseClasses = "w-full h-14 justify-start mobile-tap-target transition-all duration-300 ease-out";
    const radiusClass = borderRadius.find(r => r.id === (link.borderRadius || "md"))?.class || "rounded-xl";
    
    switch (link.style) {
      case "filled":
        return `${baseClasses} ${radiusClass} bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] border-0 shadow-sm hover:shadow-md`;
      case "gradient":
        return `${baseClasses} ${radiusClass} bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 hover:scale-[1.02] border-0 shadow-sm hover:shadow-md`;
      case "glass":
        return `${baseClasses} ${radiusClass} bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-900 hover:bg-white/80 hover:scale-[1.02] shadow-sm hover:shadow-md`;
      case "neon":
        return `${baseClasses} ${radiusClass} bg-gray-50 text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-white hover:scale-[1.02] shadow-sm hover:shadow-md`;
      case "minimal":
        return `${baseClasses} ${radiusClass} bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:scale-[1.02] shadow-sm hover:shadow-md text-gray-900`;
      default:
        return `${baseClasses} ${radiusClass} bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02] shadow-sm hover:shadow-md text-gray-900`;
    }
  };

  const getAnimationClass = (animation) => {
    switch (animation) {
      case "pulse": return "hover:animate-pulse";
      case "bounce": return "hover:animate-bounce";
      case "shake": return "hover:animate-bounce";
      case "glow": return "hover:shadow-lg hover:shadow-gray-500/10";
      case "slide": return "hover:translate-x-1";
      default: return "";
    }
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      "Globe": Globe,
      "Briefcase": Briefcase,
      "Laptop": Laptop,
      "default": Globe
    };
    
    const IconComponent = iconMap[iconName] || iconMap.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const DialogContent_ = isMobile ? Sheet : Dialog;
  const DialogTrigger_ = isMobile ? SheetTrigger : DialogTrigger;

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Enhanced Header with Actions */}
      <FadeInUp>
        <Card className="border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Link Manager</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Create and customize your premium links</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="hover:shadow-sm transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                
                {isMobile ? (
                  <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <SheetTrigger asChild>
                      <Button className="bg-black hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full max-w-sm p-0 overflow-y-auto">
                      <div className="h-full flex flex-col">
                        <SheetHeader className="p-4 pb-2">
                          <SheetTitle className="text-lg">
                            {editingLink ? "Edit Link" : "Add Premium Link"}
                          </SheetTitle>
                          <SheetDescription className="text-sm">
                            {editingLink ? "Update your link details" : "Create a new premium link with custom styling"}
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="flex-1 px-4 overflow-y-auto">
                          {renderLinkForm()}
                        </div>
                        
                        <SheetFooter className="p-4 pt-2 border-t">
                          <Button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-black hover:bg-gray-800"
                          >
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {editingLink ? "Update Link" : "Create Link"}
                          </Button>
                        </SheetFooter>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-black hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Premium Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:!hidden [&>button]:!border-0 [&>button]:!ring-0">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {editingLink ? "Edit Link" : "Add Premium Link"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingLink ? "Update your link details and styling" : "Create a new premium link with custom styling and effects"}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {renderLinkForm()}
                      
                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="bg-black hover:bg-gray-800"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {editingLink ? "Update Link" : "Create Link"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </FadeInUp>

      {/* Mobile-Optimized Controls */}
      <FadeInUp delay={0.1}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h2 className="text-lg font-semibold truncate">Your Links</h2>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
              {links.length} • {links.filter(l => l.active).length} active
            </Badge>
          </div>
          
          {/* Mobile-friendly filter and view controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {linkCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="created">New</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex border rounded-lg bg-gray-50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 px-2 text-xs rounded transition-all ${
                  viewMode === "list" 
                    ? "bg-white shadow-sm text-black" 
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-7 px-2 text-xs rounded transition-all ${
                  viewMode === "grid" 
                    ? "bg-white shadow-sm text-black" 
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Grid
              </Button>
            </div>
          </div>
        </div>
      </FadeInUp>
                onClick={() => setViewMode("compact")}
                className="rounded-l-none"
              >
                Compact
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Category Filter */}
        <StaggerContainer className="flex flex-wrap gap-2">
          {linkCategories.map((category, index) => (
            <StaggerItem key={category.id}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${selectedCategory === category.id ? "bg-black shadow-lg" : "hover:shadow-md"} transition-all duration-200`}
                >
                  {category.name}
                  {category.count > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            </StaggerItem>
          ))}
          
          {/* Refresh Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>
        </StaggerContainer>

        {/* Enhanced Add Link Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <DialogContent_ open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger_ asChild>
              <Button 
                className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  setEditingLink(null);
                  resetForm();
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Premium Link
                <Zap className="w-4 h-4 ml-2 text-yellow-400" />
              </Button>
            </DialogTrigger_>
            
            {/* Simple Dialog for Quick Link Creation */}
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:!hidden [&>button]:!border-0 [&>button]:!ring-0">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>{editingLink ? "Edit Premium Link" : "Add Premium Link"}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsAdvancedCustomizerOpen(true);
                    }}
                    className="ml-2"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Advanced
                  </Button>
                </DialogTitle>
                <DialogDescription>
                  Create a stunning, customized link with advanced styling options.
                </DialogDescription>
              </DialogHeader>
              
              {/* Quick form for basic link creation */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., My Website"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {linkCategories.slice(1).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">URL (paste your link here) *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description for this link"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <IconPicker
                  selectedIcon={formData.icon}
                  onIconSelect={(icon) => setFormData({ ...formData, icon })}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-black hover:bg-gray-800"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {editingLink ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingLink ? "Update Link" : "Create Link"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogContent_>
        </motion.div>

        {/* Enhanced Links List */}
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LinkSkeletonLoader />
            </motion.div>
          ) : sortedAndFilteredLinks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-dashed border-2 border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-6xl mb-4"
                  >
                    🎨
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">No {selectedCategory !== "all" ? selectedCategory : ""} links yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Create your first premium link with advanced styling options
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-black hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Link
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <StaggerContainer>
              <motion.div 
                className={
                  viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-4"
                }
              >
                {sortedAndFilteredLinks.map((link, index) => (
                  <StaggerItem key={link.id}>
                    <motion.div
                      layout
                      whileHover={{ scale: viewMode === "compact" ? 1.01 : 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Card className={`${link.active ? 'border-gray-200 hover:shadow-lg' : 'opacity-60 border-gray-100'} transition-all duration-300 hover:shadow-xl ${link.isHighlight ? 'ring-2 ring-yellow-400' : ''}`}>
                        <CardContent className={viewMode === "compact" ? "p-3" : "p-4"}>
                          <div className={`flex items-center ${viewMode === "compact" ? "space-x-2" : "space-x-4"}`}>
                            {/* Enhanced Drag Handle */}
                            <motion.div 
                              className="drag-handle text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <GripVertical className={viewMode === "compact" ? "w-4 h-4" : "w-5 h-5"} />
                            </motion.div>
                            
                            {/* Enhanced Link Preview */}
                            <div className="flex-1">
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <Button
                                  className={`${getLinkStyle(link)} ${getAnimationClass(link.animation)} ${viewMode === "compact" ? "h-10 mb-1" : "h-14 mb-2"}`}
                                  style={{
                                    color: link.style === 'default' ? link.color : undefined,
                                    backgroundColor: link.style === 'default' ? link.backgroundColor : undefined
                                  }}
                                >
                                  <div className={`flex items-center ${viewMode === "compact" ? "space-x-2" : "space-x-3"} w-full`}>
                                    <div className={viewMode === "compact" ? "text-sm" : "text-xl"}>
                                      {getIconComponent(link.icon)}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className={`font-medium ${viewMode === "compact" ? "text-sm" : ""}`}>{link.title}</div>
                                      {link.description && viewMode !== "compact" && (
                                        <div className="text-sm opacity-70">{link.description}</div>
                                      )}
                                    </div>
                                    <ExternalLink className={`${viewMode === "compact" ? "w-3 h-3" : "w-4 h-4"} opacity-70`} />
                                  </div>
                                </Button>
                              </motion.div>
                              
                              {/* Enhanced Meta Info */}
                              {viewMode !== "compact" && (
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{link.clicks} clicks</span>
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs transition-colors ${
                                      linkCategories.find(c => c.id === link.category)?.color === 'blue' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                                      linkCategories.find(c => c.id === link.category)?.color === 'green' ? 'border-green-200 text-green-700 hover:bg-green-50' :
                                      linkCategories.find(c => c.id === link.category)?.color === 'purple' ? 'border-purple-200 text-purple-700 hover:bg-purple-50' :
                                      linkCategories.find(c => c.id === link.category)?.color === 'orange' ? 'border-orange-200 text-orange-700 hover:bg-orange-50' :
                                      'border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {linkCategories.find(c => c.id === link.category)?.name || 'General'}
                                  </Badge>
                                  {link.scheduled && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </Badge>
                                  )}
                                  {link.isHighlight && (
                                    <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                      ⭐ Featured
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Enhanced Premium Controls */}
                            <div className="flex items-center space-x-1">
                              {/* Advanced Customizer Button */}
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAdvancedCustomizer(link)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                                  title="Advanced Customizer"
                                >
                                  <Wand2 className="w-3 h-3" />
                                </Button>
                              </motion.div>

                              {/* Quick Actions */}
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyLinkUrl(link.url)}
                                  className="text-gray-600 hover:text-black hover:bg-gray-100 h-8 w-8 p-0"
                                  title="Copy URL"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </motion.div>
                              
                              <Separator orientation="vertical" className="h-6" />
                              
                              {/* Standard Controls */}
                              <Switch
                                checked={link.active}
                                onCheckedChange={() => toggleActive(link.id)}
                                className="data-[state=checked]:bg-black"
                              />
                              
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(link)}
                                  className="text-gray-600 hover:text-black hover:bg-gray-100 h-8 w-8 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </motion.div>
                              
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(link.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                ))}
              </motion.div>
            </StaggerContainer>
          )}
        </AnimatePresence>
      </FadeInUp>
    </>
  );
};

export default EnhancedLinkManager;

