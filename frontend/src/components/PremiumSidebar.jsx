import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Link, 
  Zap, 
  BarChart3, 
  Settings, 
  Palette,
  FileText,
  Crown,
  Sparkles,
  QrCode,
  Calendar,
  Users,
  Shield,
  Smartphone,
  X,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Globe,
  Megaphone,
  Brain,
  Eye,
  LogOut,
  User,
  Briefcase,
  Camera,
  Code,
  Music,
  Gamepad2,
  ShoppingBag,
  LifeBuoy
} from "lucide-react";
import { addHapticFeedback, isMobileDevice } from "../utils/mobileUtils";
import { ThemeToggle } from "./ThemeToggle";
import { useIdentityContext } from "../hooks/useIdentityContext";
import SubscriptionBadge from "./SubscriptionBadge";

const PremiumSidebar = ({ 
  user, 
  activeSection, 
  setActiveSection, 
  onLogout,
  links = [],
  totalClicks = 0 
}) => {
  const { subscription, loading: contextLoading } = useIdentityContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsCollapsed(false); // Reset collapse state on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainSections = [
    {
      id: "items",
      label: "Items",
      icon: ShoppingBag,
      description: "Merchant items",
      gradient: "from-emerald-500 to-green-600"
    },
    {
      id: "links",
      label: "Links",
      icon: Link,
      description: "Manage your links",
      badge: links.length,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "media",
      label: "Media",
      icon: Camera,
      description: "Images & videos",
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: "customization",
      label: "Customization",
      icon: Palette,
      description: "Design & customize",
      gradient: "from-purple-500 to-pink-500"
    },
    // HIDDEN TEMPORARILY - Templates Hub feature
    // {
    //   id: "templates",
    //   label: "Templates",
    //   icon: FileText,
    //   description: "Premium designs",
    //   badge: "NEW",
    //   gradient: "from-purple-500 to-pink-500",
    //   premium: true
    // },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Performance insights",
      badge: totalClicks,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const premiumSections = [
    {
      id: "branding",
      label: "Custom Branding",
      icon: Palette,
      description: "Logo, colors, fonts",
      gradient: "from-violet-500 to-purple-500",
      premium: true
    },
    {
      id: "qr-codes",
      label: "QR Codes",
      icon: QrCode,
      description: "Custom QR generation",
      gradient: "from-indigo-500 to-blue-500",
      premium: true
    },
    // HIDDEN TEMPORARILY - Smart Scheduling feature
    // {
    //   id: "scheduling",
    //   label: "Smart Scheduling",
    //   icon: Calendar,
    //   description: "Time-based visibility",
    //   gradient: "from-cyan-500 to-teal-500",
    //   premium: true
    // },
    // HIDDEN TEMPORARILY - AI Insights feature
    // {
    //   id: "ai-insights",
    //   label: "AI Insights",
    //   icon: Brain,
    //   description: "Smart optimization",
    //   gradient: "from-pink-500 to-rose-500",
    //   premium: true,
    //   badge: "AI"
    // },
    // HIDDEN TEMPORARILY - Social Hub feature
    // {
    //   id: "social-hub",
    //   label: "Social Hub",
    //   icon: Megaphone,
    //   description: "Auto-post updates",
    //   gradient: "from-yellow-500 to-orange-500",
    //   premium: true
    // },
    // HIDDEN TEMPORARILY - Team collaboration feature
    // {
    //   id: "collaboration",
    //   label: "Team",
    //   icon: Users,
    //   description: "Collaborate & share",
    //   gradient: "from-emerald-500 to-green-500",
    //   premium: true
    // }
  ];

  const settingsSections = [
    {
      id: "profile",
      label: "Profile Settings",
      icon: User,
      description: "Account preferences"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Privacy & protection",
      premium: true
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: Crown,
      description: "Manage subscription & billing",
      isNavigation: true,
      navigationPath: "/subscription/manage"
    },
    {
      id: "customer-support",
      label: "Customer Support",
      icon: LifeBuoy,
      description: "Guides, scripts & contact",
      isNavigation: true,
      navigationPath: "/support"
    },
    // Appearance page hidden (merged with Profile Settings)
  ];

  const handleSectionClick = (sectionId, section) => {
    // Check if this section has a navigation path (like subscription management)
    if (section?.isNavigation && section.navigationPath) {
      navigate(section.navigationPath);
      if (isMobile) {
        setIsOpen(false);
      }
      return;
    }
    
    setActiveSection(sectionId);
    addHapticFeedback('light');
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
    addHapticFeedback('light');
  };

  const SidebarContent = () => (
    <motion.div
      initial={isMobile ? { x: -300 } : { opacity: 0 }}
      animate={isMobile ? { x: 0 } : { opacity: 1 }}
      exit={isMobile ? { x: -300 } : { opacity: 0 }}
      className={`h-full bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300 ${
        !isMobile && isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-border relative ${isCollapsed && !isMobile ? 'p-3' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center flex-col space-y-2' : 'justify-between'}`}>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-background border border-border">
                <img 
                  src="/OdinRingLogo.png" 
                  alt="OdinRing Logo" 
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">OdinRing</h2>
                <p className="text-xs text-muted-foreground">Build. Share. Connect.</p>
              </div>
            </div>
          )}
          
          {isCollapsed && !isMobile && (
            <>
              <button
                onClick={toggleCollapsed}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer overflow-hidden bg-background border border-border"
                title="Expand sidebar"
              >
                <img 
                  src="/OdinRingLogo.png" 
                  alt="OdinRing Logo" 
                  className="w-full h-full object-contain p-1.5"
                />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className="h-7 w-7 p-0 hover:bg-muted absolute top-2 right-2"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : (
            !isCollapsed && (
              <div className="flex items-center gap-2">
                <ThemeToggle variant="ghost" size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapsed}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )
          )}
        </div>

        {/* User Profile - Hide when collapsed */}
        {(!isCollapsed || isMobile) && (
          <div className="mt-4 p-3 bg-muted rounded-xl">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 ring-2 ring-background">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground truncate">{user?.name}</p>
                  <SubscriptionBadge 
                    subscription={subscription}
                    loading={contextLoading} 
                    size="small" 
                    clickable={true}
                    title="Click to upgrade or change plan"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed user avatar */}
        {isCollapsed && !isMobile && (
          <div className="mt-3 flex justify-center">
            <Avatar className="w-9 h-9 ring-2 ring-border">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed && !isMobile ? 'p-2 space-y-3' : 'p-4 space-y-6'}`}>
        {/* Main Sections */}
        <div>
          {(!isCollapsed || isMobile) && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Main
            </h3>
          )}
          <div className={isCollapsed && !isMobile ? 'space-y-0.5' : 'space-y-1'}>
            {mainSections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full flex items-center ${isCollapsed && !isMobile ? 'justify-center px-0 py-2' : 'space-x-3 px-3 py-2.5'} rounded-xl text-left transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r ' + section.gradient + ' text-white shadow-lg shadow-blue-500/25' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  whileHover={{ scale: isCollapsed && !isMobile ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={isCollapsed && !isMobile ? section.label : undefined}
                >
                  <div className={`${isCollapsed && !isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-muted group-hover:bg-muted/80'
                  }`}>
                    <IconComponent className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {section.label}
                          {section.premium && (
                            <Sparkles className="w-3 h-3 inline ml-1 text-yellow-400" />
                          )}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {section.description}
                        </div>
                      </div>
                      {section.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {section.badge}
                        </Badge>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive ? 'text-white rotate-90' : 'text-muted-foreground'
                      }`} />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {(!isCollapsed || isMobile) && <Separator className="my-4" />}
        {isCollapsed && !isMobile && <div className="h-px bg-border my-2 mx-2" />}

        {/* Premium Features */}
        {/* <div>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Premium Features
              </h3>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
          )}
          <div className={isCollapsed && !isMobile ? 'space-y-0.5' : 'space-y-1'}>
            {premiumSections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full flex items-center ${isCollapsed && !isMobile ? 'justify-center px-0 py-2' : 'space-x-3 px-3 py-2.5'} rounded-xl text-left transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r ' + section.gradient + ' text-white shadow-lg shadow-purple-500/25' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  whileHover={{ scale: isCollapsed && !isMobile ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={isCollapsed && !isMobile ? section.label : undefined}
                >
                  <div className={`${isCollapsed && !isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-br ' + section.gradient + ' text-white'
                  }`}>
                    <IconComponent className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  </div>
                  
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {section.label}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {section.description}
                        </div>
                      </div>
                      {section.badge && (
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs border-0"
                        >
                          {section.badge}
                        </Badge>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive ? 'text-white rotate-90' : 'text-muted-foreground'
                      }`} />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div> */}

        {(!isCollapsed || isMobile) && <Separator className="my-4" />}
        {isCollapsed && !isMobile && <div className="h-px bg-border my-2 mx-2" />}

        {/* Settings */}
        <div>
          {(!isCollapsed || isMobile) && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Settings
            </h3>
          )}
          <div className={isCollapsed && !isMobile ? 'space-y-0.5' : 'space-y-1'}>
            {settingsSections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id, section)}
                  className={`w-full flex items-center ${isCollapsed && !isMobile ? 'justify-center px-0 py-2' : 'space-x-3 px-3 py-2.5'} rounded-xl text-left transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  whileHover={{ scale: isCollapsed && !isMobile ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={isCollapsed && !isMobile ? section.label : undefined}
                >
                  <div className={`${isCollapsed && !isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-muted group-hover:bg-muted/80'
                  }`}>
                    <IconComponent className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {section.label}
                          {section.premium && (
                            <Sparkles className="w-3 h-3 inline ml-1 text-yellow-400" />
                          )}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {section.description}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive ? 'text-white rotate-90' : 'text-muted-foreground'
                      }`} />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t border-border ${isCollapsed && !isMobile ? 'p-2' : 'p-4'}`}>
        <Button
          variant="ghost"
          onClick={() => {
            addHapticFeedback('medium');
            onLogout();
          }}
          className={`w-full ${isCollapsed && !isMobile ? 'justify-center px-0 py-2 h-10' : 'justify-start'} text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all`}
          title={isCollapsed && !isMobile ? 'Sign out' : undefined}
        >
          <LogOut className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${!isCollapsed || isMobile ? 'mr-3' : ''}`} />
          {(!isCollapsed || isMobile) && 'Sign out'}
        </Button>
      </div>
    </motion.div>
  );

  if (isMobile) {
    return null;
  }

  return (
    <div className={`h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      <SidebarContent />
    </div>
  );
};

export default PremiumSidebar;