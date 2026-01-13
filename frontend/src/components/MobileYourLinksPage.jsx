import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  ArrowLeft,
  Plus,
  Globe,
  Eye,
  BarChart3,
  EyeOff,
  Edit,
  Trash2,
  MoreVertical,
  ExternalLink,
  Search,
  Check,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { getIconByName } from "../lib/iconMap";
import { addHapticFeedback } from "../utils/mobileUtils";
import { toast } from "sonner";

const MobileYourLinksPage = ({ 
  user, 
  profile, 
  links = [], 
  onBack,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onToggleActive
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [loadingToggleId, setLoadingToggleId] = useState(null);
  const [bulkToggleLoading, setBulkToggleLoading] = useState(false);
  
  // Debug: Log links data
  console.log('MobileYourLinksPage - Links data:', links);
  
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    icon: "Globe",
    category: "social"
  });

  // Calculate statistics
  const totalLinks = links.length;
  const activeLinks = links.filter(link => link.active).length;
  const hiddenLinks = links.filter(link => !link.active).length;
  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  const categoryOptions = [
    { value: "social", label: "Social", icon: "Users", color: "bg-blue-100 text-blue-800" },
    { value: "media", label: "Media", icon: "Camera", color: "bg-purple-100 text-purple-800" },
    { value: "business", label: "Business", icon: "Briefcase", color: "bg-green-100 text-green-800" }
  ];

  // Popular icons for the dropdown
  const iconOptions = [
    "Globe", "Link", "ExternalLink", "Mail", "Phone", "MapPin", "Calendar", "Clock",
    "User", "Users", "Heart", "Star", "ThumbsUp", "MessageCircle", "Camera", "Video",
    "Music", "Headphones", "Mic", "Play", "Pause", "Download", "Upload", "Share",
    "Bookmark", "Tag", "Search", "Settings", "Bell", "Home", "Building", "Briefcase",
    "GraduationCap", "Award", "Trophy", "Gift", "ShoppingCart", "CreditCard", "DollarSign",
    "Instagram", "Facebook", "Twitter", "Linkedin", "Youtube", "Github", "Gitlab", "Discord",
    "Slack", "Whatsapp", "Telegram", "Tiktok", "Snapchat", "Pinterest", "Reddit", "Twitch"
  ];

  const handleAddLink = () => {
    addHapticFeedback('light');
    setFormData({
      title: "",
      url: "",
      description: "",
      icon: "Globe",
      category: "social"
    });
    setShowAddDialog(true);
  };

  const handleEditLink = (link) => {
    addHapticFeedback('light');
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || "",
      icon: link.icon || "Globe",
      category: link.category || "social"
    });
    setShowEditDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      addHapticFeedback('success');
      if (editingLink) {
        await onEditLink(editingLink.id, formData);
        toast.success("Link updated successfully!", { duration: 1500 });
      } else {
        await onAddLink(formData);
        toast.success("Link added successfully!", { duration: 1500 });
      }
      setShowAddDialog(false);
      setShowEditDialog(false);
      setEditingLink(null);
    } catch (error) {
      addHapticFeedback('error');
      toast.error("Failed to save link", { duration: 1500 });
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      addHapticFeedback('success');
      await onDeleteLink(linkId);
      toast.success("Link deleted successfully!", { duration: 1500 });
    } catch (error) {
      addHapticFeedback('error');
      toast.error("Failed to delete link", { duration: 1500 });
    }
  };

  const handleBulkToggle = async () => {
    setBulkToggleLoading(true);
    try {
      addHapticFeedback('light');
      const allActive = links.every(link => link.active);
      
      // Toggle all links
      const togglePromises = links.map(link => {
        if (link.active !== !allActive) {
          return onToggleActive(link.id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(togglePromises);
      toast.success(allActive ? "All links hidden!" : "All links shown!", { duration: 1500 });
    } catch (error) {
      addHapticFeedback('error');
      toast.error("Failed to update link visibility", { duration: 1500 });
    } finally {
      setBulkToggleLoading(false);
    }
  };

  const handleToggleActive = async (linkId) => {
    setLoadingToggleId(linkId);
    try {
      addHapticFeedback('light');
      await onToggleActive(linkId);
      toast.success("Link visibility updated!", { duration: 1500 });
    } catch (error) {
      addHapticFeedback('error');
      toast.error("Failed to update link visibility", { duration: 1500 });
    } finally {
      setLoadingToggleId(null);
    }
  };

  const renderLinkItem = (link) => {
    // Debug: Log individual link data
    console.log('Rendering link:', link);
    
    return (
    <motion.div
      key={link.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-2"
    >
      <Card className={`border transition-all duration-200 ${
        link.active ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30' : 'border-border bg-card'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              link.active ? 'bg-white shadow-sm' : 'bg-gray-100'
            }`}>
              {getIconByName(link.icon || "Globe", `w-4 h-4 ${
                link.active ? 'text-gray-700' : 'text-gray-500'
              }`)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-xs mb-0.5 truncate">
                {link.title || link.name || 'Untitled Link'}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {link.url || link.link || 'No URL provided'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1">
              {/* Visibility Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(link.id)}
                disabled={loadingToggleId === link.id}
                className="h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingToggleId === link.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                ) : link.active ? (
                  <ToggleRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </Button>
              
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditLink(link)}
                className="h-6 w-6 p-0 hover:bg-blue-100"
              >
                <Edit className="w-3 h-3 text-blue-600" />
              </Button>
              
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteLink(link.id)}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 pt-6 pb-4">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              addHapticFeedback('light');
              onBack();
            }}
            className="h-8 w-8 p-0 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Your Links</h1>
            <p className="text-sm text-gray-300">Create and manage your links</p>
          </div>
        </div>
        
        {/* Add Button */}
        <Button
          onClick={handleAddLink}
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mb-4"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add
        </Button>
        
        {/* Bulk Visibility Controls */}
        <div className="flex items-center justify-between bg-gray-700 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-300">Show All Links</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkToggle}
            disabled={bulkToggleLoading}
            className="h-6 w-6 p-0 hover:bg-gray-600 disabled:opacity-50"
          >
            {bulkToggleLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            ) : links.every(link => link.active) ? (
              <ToggleRight className="w-5 h-5 text-green-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{totalLinks}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{activeLinks}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{totalClicks}</div>
                  <div className="text-xs text-gray-500">Clicks</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <EyeOff className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{hiddenLinks}</div>
                  <div className="text-xs text-gray-500">Hidden</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Management */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Links Management</h2>
          
          {!links || links.length === 0 ? (
            /* Empty State */
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No links yet</h3>
                <p className="text-sm text-gray-500 mb-6">Create your first link to get started</p>
                <Button
                  onClick={handleAddLink}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Links List */
            <div className="space-y-2">
              {links.map(renderLinkItem)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Friendly Add/Edit Dialog */}
      <Sheet open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setEditingLink(null);
        }
      }}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col">
          <SheetHeader className="flex-shrink-0 pb-4">
            <SheetTitle className="text-center">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter link title"
                className="h-10"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="h-10"
              />
            </div>

            {/* URL */}
            <div className="space-y-1">
              <Label htmlFor="url" className="text-sm font-medium">URL (paste your link here) *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="h-10"
                required
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Icon *</Label>
              <Popover open={showIconDropdown} onOpenChange={setShowIconDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={showIconDropdown}
                    className="w-full h-10 justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {getIconByName(formData.icon, "w-4 h-4 text-gray-600")}
                      <span className="text-sm">{formData.icon}</span>
                    </div>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search icons..." />
                    <CommandList>
                      <CommandEmpty>No icon found.</CommandEmpty>
                      <CommandGroup>
                        {iconOptions.map((icon) => (
                          <CommandItem
                            key={icon}
                            value={icon}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, icon: currentValue });
                              setShowIconDropdown(false);
                              addHapticFeedback('light');
                            }}
                            className="flex items-center space-x-2"
                          >
                            {getIconByName(icon, "w-4 h-4")}
                            <span>{icon}</span>
                            <Check
                              className={`ml-auto h-4 w-4 ${
                                formData.icon === icon ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center space-x-2">
                        {getIconByName(category.icon, "w-4 h-4")}
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setEditingLink(null);
                  setShowIconDropdown(false);
                }}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {editingLink ? 'Update Link' : 'Add Link'}
              </Button>
            </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom spacing for navigation */}
      <div className="h-24" />
    </div>
  );
};

export default MobileYourLinksPage;
