import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, GripVertical, ExternalLink, RefreshCw, Eye, MoreHorizontal, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import IconPicker from "./IconPicker";
import { addHapticFeedback, isMobileDevice } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MobileEnhancedLinkManager = ({ links, setLinks }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile] = useState(isMobileDevice());
  
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    icon: "Globe",
    category: "social",
    style: "default",
    color: "#000000",
    backgroundColor: "#ffffff",
    borderRadius: "md",
    animation: "none",
    description: ""
  });

  const linkCategories = [
    { id: "social", name: "Social", color: "bg-blue-100", icon: "Users" },
    { id: "media", name: "Media", color: "bg-purple-100", icon: "Camera" },
    { id: "business", name: "Business", color: "bg-green-100", icon: "Briefcase" }
  ];

  const linkStyles = [
    { id: "default", name: "Default", preview: "bg-white border border-gray-200 shadow-sm" },
    { id: "filled", name: "Filled", preview: "bg-gray-900 text-white shadow-sm" },
    { id: "gradient", name: "Gradient", preview: "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-sm" },
    { id: "glass", name: "Glass", preview: "bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm" },
    { id: "minimal", name: "Minimal", preview: "bg-white border border-gray-100 shadow-sm" }
  ];

  const borderRadius = [
    { id: "none", name: "Square", class: "rounded-none" },
    { id: "sm", name: "Small", class: "rounded-lg" },
    { id: "md", name: "Medium", class: "rounded-xl" },
    { id: "lg", name: "Large", class: "rounded-2xl" },
    { id: "full", name: "Pill", class: "rounded-full" }
  ];

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      icon: "Globe",
      category: "social",
      style: "default",
      color: "#000000",
      backgroundColor: "#ffffff",
      borderRadius: "md",
      animation: "none",
      description: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      const linkData = {
        ...formData,
        active: true,
        clicks: editingLink ? editingLink.clicks : 0
      };

      let response;
      if (editingLink) {
        response = await api.put(`/links/${editingLink.id}`, linkData);
        
        setLinks(links.map(link => 
          link.id === editingLink.id ? response.data : link
        ));
        
        addHapticFeedback('success');
        toast.success("Link updated successfully! ✨");
      } else {
        response = await api.post(`/links`, linkData);
        
        setLinks([...links, response.data]);
        
        addHapticFeedback('success');
        toast.success("Link created successfully! 🎉");
      }

      setIsDialogOpen(false);
      setEditingLink(null);
      resetForm();
      
    } catch (error) {
      console.error('Failed to save link:', error);
      addHapticFeedback('error');
      toast.error(error.response?.data?.detail || "Failed to save link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon,
      category: link.category,
      style: link.style,
      color: link.color || "#000000",
      backgroundColor: link.backgroundColor || "#ffffff",
      borderRadius: link.borderRadius || "md",
      animation: link.animation || "none",
      description: link.description || ""
    });
    setIsDialogOpen(true);
    addHapticFeedback('light');
  };

  const handleDelete = async (linkId) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/links/${linkId}`);
      
      setLinks(links.filter(link => link.id !== linkId));
      addHapticFeedback('success');
      toast.success("Link deleted successfully");
    } catch (error) {
      console.error('Failed to delete link:', error);
      addHapticFeedback('error');
      toast.error("Failed to delete link");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    addHapticFeedback('light');
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/links`);
      setLinks(response.data);
      toast.success("Links refreshed! ⚡");
    } catch (error) {
      console.error('Failed to refresh links:', error);
      toast.error("Failed to refresh links");
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleActive = async (linkId) => {
    try {
      const link = links.find(l => l.id === linkId);
      if (!link) return;
      
      const token = localStorage.getItem('token');
      const response = await api.put(`/links/${linkId}`, { active: !link.active });
      
      setLinks(links.map(l => l.id === linkId ? response.data : l));
      addHapticFeedback('success');
      toast.success(!link.active ? "Link activated" : "Link hidden");
    } catch (error) {
      console.error('Toggle visibility failed:', error);
      addHapticFeedback('error');
      toast.error("Failed to update link visibility");
    }
  };

  const getLinkStyle = (link) => {
    const baseClasses = "w-full h-12 justify-start mobile-tap-target transition-all duration-300 ease-out";
    const radiusClass = borderRadius.find(r => r.id === (link.borderRadius || "md"))?.class || "rounded-xl";
    
    switch (link.style) {
      case "filled":
        return `${baseClasses} ${radiusClass} bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] border-0 shadow-sm hover:shadow-md`;
      case "gradient":
        return `${baseClasses} ${radiusClass} bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 hover:scale-[1.02] border-0 shadow-sm hover:shadow-md`;
      case "glass":
        return `${baseClasses} ${radiusClass} bg-white/60 backdrop-blur-md border border-gray-200/50 text-gray-900 hover:bg-white/80 hover:scale-[1.02] shadow-sm hover:shadow-md`;
      case "minimal":
        return `${baseClasses} ${radiusClass} bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:scale-[1.02] shadow-sm hover:shadow-md text-gray-900`;
      default:
        return `${baseClasses} ${radiusClass} bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02] shadow-sm hover:shadow-md text-gray-900`;
    }
  };

  const renderLinkForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">Link Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="My awesome link"
            className="mt-1 h-10 mobile-input"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="url" className="text-sm font-medium">URL (paste your link here)</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com"
            className="mt-1 h-10 mobile-input"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Icon</Label>
          <div className="mt-1">
            <IconPicker
              selectedIcon={formData.icon}
              onIconSelect={(icon) => setFormData({ ...formData, icon })}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Category *</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {linkCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: category.id })}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                  formData.category === category.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white/80'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    formData.category === category.id ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    {getIconByName(category.icon, `w-4 h-4 ${
                      formData.category === category.id ? 'text-indigo-600' : 'text-gray-600'
                    }`)}
                  </div>
                  <span className={`text-xs font-medium ${
                    formData.category === category.id ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Style</Label>
          <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {linkStyles.map(style => (
                <SelectItem key={style.id} value={style.id}>
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Border Radius</Label>
          <Select value={formData.borderRadius} onValueChange={(value) => setFormData({ ...formData, borderRadius: value })}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {borderRadius.map(radius => (
                <SelectItem key={radius.id} value={radius.id}>
                  {radius.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description"
            className="mt-1 h-10 mobile-input"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="mt-2">
          <Button
            className={getLinkStyle(formData)}
            disabled
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{formData.icon}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate">{formData.title || "Link Title"}</div>
                {formData.description && (
                  <div className="text-xs opacity-70 truncate">{formData.description}</div>
                )}
              </div>
              <ExternalLink className="w-3 h-3 opacity-70 flex-shrink-0" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  const filteredLinks = selectedCategory === "all" 
    ? links 
    : links.filter(link => link.category === selectedCategory);

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header */}
      <Card className="border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Link Manager</CardTitle>
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
                <span className="hidden sm:inline">Sync</span>
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
                          {editingLink ? "Update your link details" : "Create a new premium link"}
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
                        {editingLink ? "Update your link details and styling" : "Create a new premium link with custom styling"}
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

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-lg font-semibold truncate">Your Links</h2>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
            {filteredLinks.length} links
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {linkCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredLinks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No links yet</h3>
              <p className="text-gray-600 text-sm mb-4">Create your first premium link to get started</p>
              <Button
                onClick={() => {
                  setEditingLink(null);
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="bg-black hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Link
              </Button>
            </motion.div>
          ) : (
            filteredLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-sm transition-all duration-200 border border-gray-100 bg-white/70 backdrop-blur-md hover:border-gray-200">
                  <CardContent className="p-4">
                    {/* Top row: Reorder arrows */}
                    <div className="flex items-center justify-start mb-3">
                      <div className="flex items-center space-x-2">
                        {/* Reorder arrows */}
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                            disabled={index === filteredLinks.length - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Single row: Name and actions */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0 mr-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
                          {link.title}
                        </h3>
                        {link.category && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0.5 mt-0.5 ${
                              link.category === 'social' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              link.category === 'media' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                              link.category === 'business' ? 'border-green-200 text-green-700 bg-green-50' :
                              'border-gray-200 text-gray-700 bg-gray-50'
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
                          onClick={() => toggleActive(link.id)}
                          className={`h-5 w-5 p-0 ${link.active ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                          title={link.active ? "Deactivate link" : "Activate link"}
                        >
                          {link.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(link)}
                          className="h-5 w-5 p-0 hover:bg-gray-100/80"
                        >
                          <Edit className="w-2.5 h-2.5 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          className="h-5 w-5 p-0 hover:bg-red-50/80 hover:text-red-600"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Link URL below */}
                    <div className="pl-0">
                      <p className="text-sm text-gray-500 truncate">
                        {link.url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileEnhancedLinkManager;