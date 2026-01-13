import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  FileText,
  Crown,
  Sparkles,
  Search,
  Filter,
  Eye,
  Download,
  Heart,
  Star,
  Briefcase,
  Palette,
  Music,
  Camera,
  Code,
  Gamepad2,
  Coffee,
  Zap,
  Wand2,
  CheckCircle2,
  TrendingUp,
  User,
  Calendar,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplatesHub = ({ user, onApplyTemplate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const templateCategories = [
    { id: "all", name: "All Templates", icon: FileText },
    { id: "business", name: "Business", icon: Briefcase },
    { id: "creative", name: "Creative", icon: Palette },
    { id: "personal", name: "Personal", icon: Heart },
    { id: "tech", name: "Tech", icon: Code },
    { id: "music", name: "Music", icon: Music },
    { id: "photography", name: "Photography", icon: Camera },
    { id: "gaming", name: "Gaming", icon: Gamepad2 }
  ];

  const premiumTemplates = [
    {
      id: "executive-pro",
      name: "Executive Pro",
      description: "Professional business template with premium features",
      category: "business",
      premium: true,
      rating: 4.9,
      downloads: 1200,
      preview: {
        backgroundColor: "#1a1a1a",
        accentColor: "#3b82f6",
        fontFamily: "Inter",
        theme: "dark",
        features: ["Custom Logo", "Analytics", "Lead Capture", "Social Proof"]
      },
      mockLinks: [
        { title: "Company Website", icon: Briefcase, style: "filled" },
        { title: "LinkedIn Profile", icon: User, style: "gradient" },
        { title: "Schedule Meeting", icon: Calendar, style: "glass" },
        { title: "Portfolio", icon: BarChart3, style: "minimal" }
      ]
    },
    {
      id: "creative-artist",
      name: "Creative Artist",
      description: "Vibrant template perfect for artists and creators",
      category: "creative",
      premium: true,
      rating: 4.8,
      downloads: 890,
      preview: {
        backgroundColor: "#f3f4f6",
        accentColor: "#8b5cf6",
        fontFamily: "Plus Jakarta Sans",
        theme: "light",
        features: ["Portfolio Gallery", "Custom Animations", "Color Schemes", "Typography"]
      },
      mockLinks: [
        { title: "Art Portfolio", icon: Palette, style: "gradient" },
        { title: "Instagram", icon: Camera, style: "neon" },
        { title: "Commissions", icon: TrendingUp, style: "glass" },
        { title: "Shop", icon: Briefcase, style: "filled" }
      ]
    },
    {
      id: "tech-innovator",
      name: "Tech Innovator",
      description: "Modern template for developers and tech professionals",
      category: "tech",
      premium: true,
      rating: 4.9,
      downloads: 1450,
      preview: {
        backgroundColor: "#0f172a",
        accentColor: "#00ff88",
        fontFamily: "JetBrains Mono",
        theme: "dark",
        features: ["Code Snippets", "GitHub Integration", "Terminal Theme", "Syntax Highlighting"]
      },
      mockLinks: [
        { title: "GitHub Profile", icon: Code, style: "neon" },
        { title: "Tech Blog", icon: FileText, style: "glass" },
        { title: "Open Source", icon: Star, style: "minimal" },
        { title: "Contact", icon: User, style: "filled" }
      ]
    },
    {
      id: "music-producer",
      name: "Music Producer",
      description: "Audio-focused template with sound wave animations",
      category: "music",
      premium: true,
      rating: 4.7,
      downloads: 650,
      preview: {
        backgroundColor: "#1e1b4b",
        accentColor: "#fbbf24",
        fontFamily: "Poppins",
        theme: "dark",
        features: ["Audio Player", "Waveform Animations", "Streaming Links", "Tour Dates"]
      },
      mockLinks: [
        { title: "Latest Album", icon: Music, style: "gradient" },
        { title: "Spotify", icon: Heart, style: "filled" },
        { title: "YouTube Music", icon: Eye, style: "glass" },
        { title: "Book Studio Time", icon: Calendar, style: "neon" }
      ]
    },
    {
      id: "photographer-lens",
      name: "Photographer Lens",
      description: "Visual-first template showcasing your photography",
      category: "photography",
      premium: true,
      rating: 4.8,
      downloads: 920,
      preview: {
        backgroundColor: "#fafafa",
        accentColor: "#374151",
        fontFamily: "Playfair Display",
        theme: "light",
        features: ["Image Gallery", "Lightbox", "EXIF Data", "Client Portal"]
      },
      mockLinks: [
        { title: "Photography Portfolio", icon: Camera, style: "glass" },
        { title: "Wedding Gallery", icon: Heart, style: "minimal" },
        { title: "Book Session", icon: Calendar, style: "filled" },
        { title: "Print Shop", icon: Briefcase, style: "gradient" }
      ]
    },
    {
      id: "gamer-elite",
      name: "Gamer Elite",
      description: "Gaming-focused template with RGB animations",
      category: "gaming",
      premium: true,
      rating: 4.6,
      downloads: 1100,
      preview: {
        backgroundColor: "#111827",
        accentColor: "#ff0080",
        fontFamily: "Orbitron",
        theme: "dark",
        features: ["RGB Animations", "Gaming Stats", "Stream Schedule", "Leaderboards"]
      },
      mockLinks: [
        { title: "Twitch Stream", icon: Gamepad2, style: "neon" },
        { title: "YouTube Gaming", icon: Eye, style: "gradient" },
        { title: "Discord Server", icon: User, style: "glass" },
        { title: "Gaming Setup", icon: Zap, style: "filled" }
      ]
    }
  ];

  const freeTemplates = [
    {
      id: "simple-clean",
      name: "Simple & Clean",
      description: "Minimalist template perfect for getting started",
      category: "personal",
      premium: false,
      rating: 4.5,
      downloads: 2300,
      preview: {
        backgroundColor: "#ffffff",
        accentColor: "#000000",
        fontFamily: "Inter",
        theme: "light",
        features: ["Basic Customization", "Mobile Optimized", "Fast Loading"]
      },
      mockLinks: [
        { title: "About Me", icon: User, style: "default" },
        { title: "Contact", icon: User, style: "minimal" },
        { title: "Social Media", icon: Heart, style: "glass" }
      ]
    },
    {
      id: "student-starter",
      name: "Student Starter",
      description: "Perfect template for students and beginners",
      category: "personal",
      premium: false,
      rating: 4.3,
      downloads: 1800,
      preview: {
        backgroundColor: "#f9fafb",
        accentColor: "#3b82f6",
        fontFamily: "Inter",
        theme: "light",
        features: ["Academic Focus", "Project Showcase", "Resume Links"]
      },
      mockLinks: [
        { title: "Resume", icon: FileText, style: "filled" },
        { title: "LinkedIn", icon: User, style: "gradient" },
        { title: "Projects", icon: Star, style: "minimal" }
      ]
    }
  ];

  const allTemplates = [...premiumTemplates, ...freeTemplates];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
    addHapticFeedback('light');
  };

  const handleApplyTemplate = async (template) => {
    setLoading(true);
    addHapticFeedback('medium');

    try {
      // Simulate applying template
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call parent callback
      if (onApplyTemplate) {
        onApplyTemplate(template);
      }
      
      addHapticFeedback('success');
      toast.success(`${template.name} template applied successfully! ✨`);
      setPreviewOpen(false);
      
    } catch (error) {
      console.error('Failed to apply template:', error);
      addHapticFeedback('error');
      toast.error("Failed to apply template");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (templateId) => {
    setFavorites(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
    addHapticFeedback('light');
  };

  const TemplateCard = ({ template }) => {
    const isFavorite = favorites.includes(template.id);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <Card className="overflow-hidden border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300">
          {/* Template Preview */}
          <div 
            className="h-48 p-4 relative"
            style={{ 
              backgroundColor: template.preview.backgroundColor,
              backgroundImage: template.preview.theme === 'dark' ? 
                'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%)' :
                'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1), transparent 50%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1), transparent 50%)'
            }}
          >
            {/* Premium Badge */}
            {template.premium && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </div>
            )}

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(template.id)}
              className={`absolute top-2 left-2 h-8 w-8 p-0 ${
                isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>

            {/* Mock Profile */}
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${
                template.preview.theme === 'dark' ? 'bg-white/20' : 'bg-black/10'
              }`}>
                <User className={`w-6 h-6 ${
                  template.preview.theme === 'dark' ? 'text-white' : 'text-gray-700'
                }`} />
              </div>
              <div className={`text-sm font-semibold mb-1 ${
                template.preview.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Your Name
              </div>
              
              {/* Mock Links */}
              <div className="space-y-1 w-full max-w-[120px]">
                {template.mockLinks.slice(0, 3).map((link, index) => {
                  const IconComponent = link.icon;
                  return (
                    <div 
                      key={index}
                      className={`h-6 rounded-lg flex items-center justify-center text-xs ${
                        link.style === 'filled' ? 'bg-gray-900 text-white' :
                        link.style === 'gradient' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                        link.style === 'glass' ? 'bg-white/20 backdrop-blur text-gray-900 border border-white/30' :
                        link.style === 'neon' ? 'bg-black text-green-400 border border-green-400' :
                        'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <IconComponent className="w-3 h-3 mr-1" />
                      {link.title}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center">
                  {template.name}
                  {template.premium && (
                    <Sparkles className="w-4 h-4 ml-1 text-yellow-500" />
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                {template.rating}
              </div>
              <div className="flex items-center">
                <Download className="w-3 h-3 mr-1" />
                {template.downloads.toLocaleString()}
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-4">
              {template.preview.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewTemplate(template)}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => handleApplyTemplate(template)}
                className={`flex-1 ${
                  template.premium 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                <Zap className="w-3 h-3 mr-1" />
                {template.premium ? 'Upgrade' : 'Apply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Templates Hub
            <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </h1>
          <p className="text-gray-600 mt-1">Professional templates to make your profile stand out</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            6 New This Week
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templateCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </motion.div>
      )}

      {/* Template Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {selectedTemplate.name}
                  {selectedTemplate.premium && (
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Live Preview</h4>
                  <div 
                    className="aspect-[9/16] rounded-xl border-2 border-gray-200 p-4 relative overflow-hidden"
                    style={{ 
                      backgroundColor: selectedTemplate.preview.backgroundColor,
                      backgroundImage: selectedTemplate.preview.theme === 'dark' ? 
                        'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2), transparent 50%)' :
                        'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05), transparent 50%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05), transparent 50%)'
                    }}
                  >
                    {/* Full Preview Content */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        selectedTemplate.preview.theme === 'dark' ? 'bg-white/20' : 'bg-black/10'
                      }`}>
                        <span className={`text-2xl ${
                          selectedTemplate.preview.theme === 'dark' ? 'text-white' : 'text-gray-700'
                        }`}>
                          👤
                        </span>
                      </div>
                      <h3 className={`font-bold text-lg mb-1 ${
                        selectedTemplate.preview.theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user?.name || 'Your Name'}
                      </h3>
                      <p className={`text-sm ${
                        selectedTemplate.preview.theme === 'dark' ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        Your bio will appear here
                      </p>
                    </div>

                    <div className="space-y-3">
                      {selectedTemplate.mockLinks.map((link, index) => {
                        const IconComponent = link.icon;
                        return (
                          <div 
                            key={index}
                            className={`h-12 rounded-xl flex items-center px-4 ${
                              link.style === 'filled' ? 'bg-gray-900 text-white' :
                              link.style === 'gradient' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                              link.style === 'glass' ? 'bg-white/20 backdrop-blur text-gray-900 border border-white/30' :
                              link.style === 'neon' ? 'bg-black text-green-400 border border-green-400' :
                              'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <IconComponent className="w-5 h-5 mr-3" />
                            <span className="font-medium">{link.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Features Included</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.preview.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Template Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{selectedTemplate.rating}</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedTemplate.downloads.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Downloads</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <Badge variant="outline" className="capitalize">
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleApplyTemplate(selectedTemplate)}
                  disabled={loading}
                  className={selectedTemplate.premium 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                    : 'bg-black hover:bg-gray-800'
                  }
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Applying...' : selectedTemplate.premium ? 'Unlock & Apply' : 'Apply Template'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesHub;