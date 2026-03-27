import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import {
  Globe, Briefcase, Laptop, Smartphone, Music, Camera, Video, Mail, MessageCircle, ShoppingCart,
  FileText, Palette, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Phone, MapPin,
  BarChart3, DollarSign, Building, TrendingUp, Target, Lightbulb, Zap, Wrench, Coffee, Dumbbell,
  Pizza, Plane, BookOpen, Gamepad2, Home, Leaf, Users, Heart, Star, Gift, Clock, Calendar,
  Settings, Monitor, Smartphone as Mobile, Tablet, Headphones, Mic, Radio, Tv, Newspaper, PenTool,
  Paintbrush, Scissors, Hammer, Screwdriver, Calculator, Database, Server, Wifi, Bluetooth, Battery,
  Download, Upload, Share, Link, ExternalLink, Search, Filter, Plus, Minus, X, Check, ArrowRight,
  Edit, Trash2, Copy, Eye, EyeOff, MoreHorizontal, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from "lucide-react";

const IconPicker = ({ selectedIcon, onIconSelect, className = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const iconCategories = {
    popular: [
      { icon: Globe, name: "Globe" },
      { icon: Briefcase, name: "Briefcase" },
      { icon: Laptop, name: "Laptop" },
      { icon: Smartphone, name: "Smartphone" },
      { icon: Music, name: "Music" },
      { icon: Camera, name: "Camera" },
      { icon: Video, name: "Video" },
      { icon: Mail, name: "Mail" },
      { icon: MessageCircle, name: "Message" },
      { icon: ShoppingCart, name: "Shopping" }
    ],
    social: [
      { icon: Facebook, name: "Facebook" },
      { icon: Twitter, name: "Twitter" },
      { icon: Instagram, name: "Instagram" },
      { icon: Linkedin, name: "LinkedIn" },
      { icon: Youtube, name: "YouTube" },
      { icon: Github, name: "GitHub" },
      { icon: MessageCircle, name: "Chat" },
      { icon: Phone, name: "Phone" },
      { icon: Mail, name: "Email" },
      { icon: Users, name: "Links" }
    ],
    business: [
      { icon: Briefcase, name: "Portfolio" },
      { icon: BarChart3, name: "Analytics" },
      { icon: DollarSign, name: "Finance" },
      { icon: Building, name: "Company" },
      { icon: TrendingUp, name: "Growth" },
      { icon: Target, name: "Goals" },
      { icon: Lightbulb, name: "Ideas" },
      { icon: Zap, name: "Energy" },
      { icon: Settings, name: "Services" },
      { icon: Users, name: "Team" }
    ],
    creative: [
      { icon: Palette, name: "Art" },
      { icon: Camera, name: "Photography" },
      { icon: Video, name: "Video" },
      { icon: Music, name: "Music" },
      { icon: PenTool, name: "Design" },
      { icon: Paintbrush, name: "Paint" },
      { icon: FileText, name: "Writing" },
      { icon: Mic, name: "Podcast" },
      { icon: Star, name: "Featured" },
      { icon: Heart, name: "Passion" }
    ],
    tech: [
      { icon: Laptop, name: "Computer" },
      { icon: Monitor, name: "Desktop" },
      { icon: Mobile, name: "Mobile" },
      { icon: Tablet, name: "Tablet" },
      { icon: Database, name: "Database" },
      { icon: Server, name: "Server" },
      { icon: Wifi, name: "Network" },
      { icon: Settings, name: "Config" },
      { icon: Github, name: "Code" },
      { icon: Zap, name: "API" }
    ],
    lifestyle: [
      { icon: Coffee, name: "Coffee" },
      { icon: Dumbbell, name: "Fitness" },
      { icon: Pizza, name: "Food" },
      { icon: Plane, name: "Travel" },
      { icon: BookOpen, name: "Education" },
      { icon: Gamepad2, name: "Gaming" },
      { icon: Home, name: "Home" },
      { icon: Leaf, name: "Nature" },
      { icon: Gift, name: "Gifts" },
      { icon: Calendar, name: "Events" }
    ]
  };

  // Flatten all icons for search
  const allIcons = Object.values(iconCategories).flat();

  // Filter icons based on search term
  const filteredCategories = searchTerm
    ? { search: allIcons.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )}
    : iconCategories;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Icon</Label>
        <Input
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-4">
        {Object.entries(filteredCategories).map(([categoryName, icons]) => (
          <div key={categoryName}>
            <Label className="text-xs text-gray-600 uppercase tracking-wide mb-2 block">
              {categoryName === 'search' ? 'Search Results' : categoryName}
            </Label>
            <div className="grid grid-cols-8 gap-2">
              {icons.map((iconItem, index) => {
                const IconComponent = iconItem.icon;
                const iconKey = `${categoryName}-${iconItem.name}-${index}`;
                const isSelected = selectedIcon === iconItem.name;
                
                return (
                  <Button
                    key={iconKey}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 w-10 p-0 ${
                      isSelected ? "bg-black text-white" : "hover:bg-gray-100"
                    }`}
                    onClick={() => onIconSelect(iconItem.name)}
                    title={iconItem.name}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconPicker;