import { useState } from "react";
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
import { Plus, Edit, Trash2, GripVertical, ExternalLink, Palette, Zap, Copy, QrCode, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

const LinkManager = ({ links, setLinks }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    icon: "🔗",
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
    { id: "all", name: "All Links", color: "gray" },
    { id: "social", name: "Social Media", color: "blue" },
    { id: "professional", name: "Professional", color: "green" },
    { id: "creative", name: "Creative", color: "purple" },
    { id: "business", name: "Business", color: "orange" },
    { id: "personal", name: "Personal", color: "pink" }
  ];

  const linkStyles = [
    { id: "default", name: "Default", preview: "bg-white border-2 border-gray-200" },
    { id: "filled", name: "Filled", preview: "bg-black text-white" },
    { id: "gradient", name: "Gradient", preview: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
    { id: "glass", name: "Glass", preview: "bg-white/20 backdrop-blur-sm border border-white/30" },
    { id: "neon", name: "Neon", preview: "bg-black text-green-400 border-2 border-green-400 shadow-[0_0_10px_theme(colors.green.400)]" },
    { id: "minimal", name: "Minimal", preview: "bg-gray-50 border-l-4 border-black" }
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
    { id: "sm", name: "Small", class: "rounded-sm" },
    { id: "md", name: "Medium", class: "rounded-md" },
    { id: "lg", name: "Large", class: "rounded-lg" },
    { id: "full", name: "Pill", class: "rounded-full" }
  ];

  // Enhanced icon categories
  const iconCategories = {
    popular: ["🌐", "💼", "💻", "📱", "🎵", "📷", "🎥", "📧", "💬", "🛒"],
    social: ["📘", "🐦", "📷", "💼", "🎵", "🎮", "📹", "💬", "📱", "🔗"],
    business: ["💼", "📊", "💰", "🏢", "📈", "🎯", "💡", "⚡", "🚀", "🔧"],
    creative: ["🎨", "✨", "🎭", "🎪", "🎸", "📝", "🖼️", "🎬", "📖", "💫"],
    tech: ["💻", "⚙️", "🔧", "💾", "🖥️", "📟", "🔌", "💡", "🤖", "⚡"],
    lifestyle: ["☕", "🏃", "🍕", "✈️", "📚", "🎮", "🏠", "🌱", "💪", "🧘"]
  };

  const popularIcons = Object.values(iconCategories).flat();

  // Auto-detect link type and suggest category
  const detectLinkType = (url) => {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes('linkedin') || domain.includes('github')) return 'professional';
    if (domain.includes('instagram') || domain.includes('twitter') || domain.includes('facebook')) return 'social';
    if (domain.includes('youtube') || domain.includes('spotify') || domain.includes('soundcloud')) return 'creative';
    return 'general';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Auto-detect category if not manually set
    let finalData = { ...formData };
    if (!editingLink && formData.category === 'general') {
      try {
        finalData.category = detectLinkType(formData.url);
      } catch (e) {
        // Keep general if URL parsing fails
      }
    }

    if (editingLink) {
      setLinks(links.map(link => 
        link.id === editingLink.id 
          ? { ...link, ...finalData }
          : link
      ));
      toast.success("Link updated successfully");
    } else {
      const newLink = {
        id: Date.now().toString(),
        ...finalData,
        active: true,
        clicks: 0,
        createdAt: new Date().toISOString()
      };
      setLinks([...links, newLink]);
      toast.success("Link added successfully");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      icon: "🔗",
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
      icon: link.icon || "🔗",
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

  const handleDelete = (linkId) => {
    setLinks(links.filter(link => link.id !== linkId));
    toast.success("Link deleted");
  };

  const toggleActive = (linkId) => {
    setLinks(links.map(link =>
      link.id === linkId
        ? { ...link, active: !link.active }
        : link
    ));
  };

  const duplicateLink = (link) => {
    const newLink = {
      ...link,
      id: Date.now().toString(),
      title: `${link.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setLinks([...links, newLink]);
    toast.success("Link duplicated");
  };

  const copyLinkUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link URL copied to clipboard");
  };

  const generateQRCode = (link) => {
    // In a real app, this would generate a QR code
    toast.success(`QR code generated for ${link.title}`);
  };

  // Filter links by category
  const filteredLinks = selectedCategory === "all" 
    ? links 
    : links.filter(link => link.category === selectedCategory);

  const getLinkStyle = (link) => {
    const baseClasses = "w-full h-14 justify-start mobile-tap-target link-item transition-all duration-200";
    const radiusClass = borderRadius.find(r => r.id === (link.borderRadius || "md"))?.class || "rounded-md";
    
    switch (link.style) {
      case "filled":
        return `${baseClasses} ${radiusClass} bg-black text-white hover:bg-gray-800 border-0`;
      case "gradient":
        return `${baseClasses} ${radiusClass} bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0`;
      case "glass":
        return `${baseClasses} ${radiusClass} bg-white/20 backdrop-blur-sm border border-white/30 text-gray-900 hover:bg-white/30`;
      case "neon":
        return `${baseClasses} ${radiusClass} bg-black text-green-400 border-2 border-green-400 hover:shadow-[0_0_15px_theme(colors.green.400)]`;
      case "minimal":
        return `${baseClasses} ${radiusClass} bg-gray-50 border-l-4 border-black hover:bg-gray-100 border-r-0 border-t-0 border-b-0`;
      default:
        return `${baseClasses} ${radiusClass} border-gray-200 hover:bg-gray-50 hover:border-gray-300`;
    }
  };

  const getAnimationClass = (animation) => {
    switch (animation) {
      case "pulse": return "animate-pulse";
      case "bounce": return "animate-bounce";
      case "shake": return "animate-bounce"; // Using bounce as placeholder
      case "glow": return "hover:shadow-lg hover:shadow-purple-500/25";
      case "slide": return "hover:translate-x-1";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {linkCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={`${selectedCategory === category.id ? "bg-black" : ""}`}
          >
            {category.name}
            {category.id !== "all" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {links.filter(link => link.category === category.id).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Premium Add Link Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black premium-button h-12"
            onClick={() => {
              setEditingLink(null);
              resetForm();
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Premium Link
            <Zap className="w-4 h-4 ml-2 text-yellow-400" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:!hidden [&>button]:!border-0 [&>button]:!ring-0">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>{editingLink ? "Edit Premium Link" : "Add Premium Link"}</span>
            </DialogTitle>
            <DialogDescription>
              Create a stunning, customized link with advanced styling options.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="space-y-3">
                    {Object.entries(iconCategories).map(([categoryName, icons]) => (
                      <div key={categoryName}>
                        <Label className="text-xs text-gray-600 uppercase tracking-wide">{categoryName}</Label>
                        <div className="grid grid-cols-10 gap-2 mt-1">
                          {icons.map((icon) => (
                            <Button
                              key={icon}
                              type="button"
                              variant={formData.icon === icon ? "default" : "outline"}
                              className="h-10 w-10 p-0 text-lg"
                              onClick={() => setFormData({ ...formData, icon })}
                            >
                              {icon}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div className="space-y-2">
                  <Label>Link Style</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {linkStyles.map((style) => (
                      <Button
                        key={style.id}
                        type="button"
                        variant={formData.style === style.id ? "default" : "outline"}
                        className="h-16 flex flex-col items-center justify-center p-2"
                        onClick={() => setFormData({ ...formData, style: style.id })}
                      >
                        <div className={`w-8 h-4 mb-1 rounded ${style.preview}`}></div>
                        <span className="text-xs">{style.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Select
                      value={formData.borderRadius}
                      onValueChange={(value) => setFormData({ ...formData, borderRadius: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {borderRadius.map((radius) => (
                          <SelectItem key={radius.id} value={radius.id}>
                            {radius.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Animation</Label>
                    <Select
                      value={formData.animation}
                      onValueChange={(value) => setFormData({ ...formData, animation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animationTypes.map((animation) => (
                          <SelectItem key={animation.id} value={animation.id}>
                            {animation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Text Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Link Preview</h3>
                    <Button
                      type="button"
                      className={`${getLinkStyle({ ...formData })} ${getAnimationClass(formData.animation)}`}
                      style={{
                        color: formData.style === 'default' ? formData.color : undefined,
                        backgroundColor: formData.style === 'default' ? formData.backgroundColor : undefined
                      }}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <span className="text-xl">{formData.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{formData.title || "Link Title"}</div>
                          {formData.description && (
                            <div className="text-sm opacity-70">{formData.description}</div>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-70" />
                      </div>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="scheduled"
                    checked={formData.scheduled}
                    onCheckedChange={(checked) => setFormData({ ...formData, scheduled: checked })}
                  />
                  <Label htmlFor="scheduled">Schedule this link</Label>
                </div>
                
                {formData.scheduled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="publishDate">Publish Date</Label>
                      <Input
                        id="publishDate"
                        type="datetime-local"
                        value={formData.publishDate}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unpublishDate">Unpublish Date (Optional)</Label>
                      <Input
                        id="unpublishDate"
                        type="datetime-local"
                        value={formData.unpublishDate}
                        onChange={(e) => setFormData({ ...formData, unpublishDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  {editingLink ? "Update Link" : "Create Link"}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Premium Links List */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">No {selectedCategory !== "all" ? selectedCategory : ""} links yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first premium link with advanced styling options
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLinks.map((link, index) => (
            <Card 
              key={link.id}
              className={`${link.active ? '' : 'opacity-60'} hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Drag Handle */}
                  <div className="drag-handle text-gray-400 hover:text-gray-600 cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  {/* Link Preview */}
                  <div className="flex-1">
                    <Button
                      className={`${getLinkStyle(link)} ${getAnimationClass(link.animation)} mb-2`}
                      style={{
                        color: link.style === 'default' ? link.color : undefined,
                        backgroundColor: link.style === 'default' ? link.backgroundColor : undefined
                      }}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <span className="text-xl">{link.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{link.title}</div>
                          {link.description && (
                            <div className="text-sm opacity-70">{link.description}</div>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-70" />
                      </div>
                    </Button>
                    
                    {/* Link Meta Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{link.clicks} clicks</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          linkCategories.find(c => c.id === link.category)?.color === 'blue' ? 'border-blue-200 text-blue-700' :
                          linkCategories.find(c => c.id === link.category)?.color === 'green' ? 'border-green-200 text-green-700' :
                          linkCategories.find(c => c.id === link.category)?.color === 'purple' ? 'border-purple-200 text-purple-700' :
                          linkCategories.find(c => c.id === link.category)?.color === 'orange' ? 'border-orange-200 text-orange-700' :
                          'border-gray-200 text-gray-700'
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
                    </div>
                  </div>
                  
                  {/* Premium Controls */}
                  <div className="flex items-center space-x-2">
                    {/* Quick Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLinkUrl(link.url)}
                      className="text-gray-600 hover:text-black"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateQRCode(link)}
                      className="text-gray-600 hover:text-black"
                      title="Generate QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateLink(link)}
                      className="text-gray-600 hover:text-black"
                      title="Duplicate Link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    {/* Standard Controls */}
                    <Switch
                      checked={link.active}
                      onCheckedChange={() => toggleActive(link.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(link)}
                      className="text-gray-600 hover:text-black"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(link.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkManager;