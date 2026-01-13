import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { motion } from "framer-motion";
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  Shadow, 
  BorderAll,
  AlignCenter,
  AlignLeft,
  AlignRight,
  RotateCcw,
  Save,
  Eye
} from "lucide-react";
import { toast } from "sonner";

const AdvancedLinkCustomizer = ({ link, onUpdate, onClose }) => {
  const [customization, setCustomization] = useState({
    // Basic Properties
    title: link?.title || "",
    url: link?.url || "",
    description: link?.description || "",
    
    // Style Properties
    style: link?.style || "default",
    
    // Typography
    fontSize: link?.fontSize || 16,
    fontWeight: link?.fontWeight || 500,
    fontFamily: link?.fontFamily || "system",
    textAlign: link?.textAlign || "left",
    letterSpacing: link?.letterSpacing || 0,
    textTransform: link?.textTransform || "none",
    
    // Colors
    backgroundColor: link?.backgroundColor || "#ffffff",
    textColor: link?.textColor || "#000000",
    borderColor: link?.borderColor || "#e5e7eb",
    hoverBackgroundColor: link?.hoverBackgroundColor || "#f3f4f6",
    hoverTextColor: link?.hoverTextColor || "#000000",
    
    // Gradients
    useGradient: link?.useGradient || false,
    gradientDirection: link?.gradientDirection || "to-r",
    gradientFromColor: link?.gradientFromColor || "#3b82f6",
    gradientToColor: link?.gradientToColor || "#8b5cf6",
    
    // Dimensions
    buttonHeight: link?.buttonHeight || 56,
    buttonWidth: link?.buttonWidth || "full",
    maxWidth: link?.maxWidth || 400,
    
    // Border & Shape
    borderRadius: link?.borderRadius || 8,
    borderWidth: link?.borderWidth || 1,
    borderStyle: link?.borderStyle || "solid",
    
    // Shadow & Effects
    shadowSize: link?.shadowSize || 0,
    shadowColor: link?.shadowColor || "#000000",
    shadowOpacity: link?.shadowOpacity || 20,
    
    // Icon Properties
    icon: link?.icon || "Globe",
    iconPosition: link?.iconPosition || "left",
    iconSize: link?.iconSize || 20,
    iconColor: link?.iconColor || "#6b7280",
    showIcon: link?.showIcon !== false,
    
    // Animation & Interaction
    hoverAnimation: link?.hoverAnimation || "scale",
    animationDuration: link?.animationDuration || 200,
    pressAnimation: link?.pressAnimation || "scale-down",
    
    // Advanced Features
    showClickCount: link?.showClickCount || false,
    showDescription: link?.showDescription || false,
    isHighlight: link?.isHighlight || false,
    customCSS: link?.customCSS || "",
    
    // Spacing
    marginTop: link?.marginTop || 8,
    marginBottom: link?.marginBottom || 8,
    paddingX: link?.paddingX || 16,
    paddingY: link?.paddingY || 16,
  });

  const fontFamilies = [
    { value: "system", label: "System Default" },
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "openSans", label: "Open Sans" },
    { value: "montserrat", label: "Montserrat" },
    { value: "poppins", label: "Poppins" },
    { value: "lato", label: "Lato" },
    { value: "nunito", label: "Nunito" },
    { value: "playfair", label: "Playfair Display" },
    { value: "merriweather", label: "Merriweather" }
  ];

  const buttonStyles = [
    { id: "default", name: "Default", className: "border bg-white text-black" },
    { id: "filled", name: "Filled", className: "bg-black text-white border-black" },
    { id: "outline", name: "Outline", className: "border-2 bg-transparent" },
    { id: "ghost", name: "Ghost", className: "bg-transparent hover:bg-gray-100" },
    { id: "soft", name: "Soft", className: "bg-gray-100 text-gray-900 border-0" },
    { id: "gradient", name: "Gradient", className: "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0" },
    { id: "glassmorphism", name: "Glass", className: "bg-white/20 backdrop-blur-md border border-white/30" },
    { id: "neon", name: "Neon", className: "bg-black text-green-400 border-2 border-green-400" },
    { id: "retro", name: "Retro", className: "bg-yellow-400 text-black border-4 border-black" },
    { id: "minimal", name: "Minimal", className: "border-l-4 border-black bg-gray-50" }
  ];

  const hoverAnimations = [
    { value: "none", label: "None" },
    { value: "scale", label: "Scale Up" },
    { value: "scale-down", label: "Scale Down" },
    { value: "lift", label: "Lift Up" },
    { value: "slide-right", label: "Slide Right" },
    { value: "slide-left", label: "Slide Left" },
    { value: "rotate", label: "Rotate" },
    { value: "glow", label: "Glow Effect" },
    { value: "bounce", label: "Bounce" },
    { value: "pulse", label: "Pulse" }
  ];

  const gradientDirections = [
    { value: "to-r", label: "Left to Right" },
    { value: "to-l", label: "Right to Left" },
    { value: "to-t", label: "Bottom to Top" },
    { value: "to-b", label: "Top to Bottom" },
    { value: "to-tr", label: "Bottom-left to Top-right" },
    { value: "to-tl", label: "Bottom-right to Top-left" },
    { value: "to-br", label: "Top-left to Bottom-right" },
    { value: "to-bl", label: "Top-right to Bottom-left" }
  ];

  const updateCustomization = (key, value) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setCustomization({
      title: link?.title || "",
      url: link?.url || "",
      description: link?.description || "",
      style: "default",
      fontSize: 16,
      fontWeight: 500,
      fontFamily: "system",
      textAlign: "left",
      letterSpacing: 0,
      textTransform: "none",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#e5e7eb",
      hoverBackgroundColor: "#f3f4f6",
      hoverTextColor: "#000000",
      useGradient: false,
      gradientDirection: "to-r",
      gradientFromColor: "#3b82f6",
      gradientToColor: "#8b5cf6",
      buttonHeight: 56,
      buttonWidth: "full",
      maxWidth: 400,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "solid",
      shadowSize: 0,
      shadowColor: "#000000",
      shadowOpacity: 20,
      icon: link?.icon || "Globe",
      iconPosition: "left",
      iconSize: 20,
      iconColor: "#6b7280",
      showIcon: true,
      hoverAnimation: "scale",
      animationDuration: 200,
      pressAnimation: "scale-down",
      showClickCount: false,
      showDescription: false,
      isHighlight: false,
      customCSS: "",
      marginTop: 8,
      marginBottom: 8,
      paddingX: 16,
      paddingY: 16,
    });
    toast.success("Reset to default settings");
  };

  const handleSave = () => {
    onUpdate(customization);
    toast.success("Link customization saved!");
    onClose();
  };

  const generatePreviewStyle = () => {
    const baseStyle = {
      height: `${customization.buttonHeight}px`,
      maxWidth: customization.buttonWidth === "full" ? "100%" : `${customization.maxWidth}px`,
      margin: `${customization.marginTop}px auto ${customization.marginBottom}px`,
      padding: `${customization.paddingY}px ${customization.paddingX}px`,
      borderRadius: `${customization.borderRadius}px`,
      borderWidth: `${customization.borderWidth}px`,
      borderStyle: customization.borderStyle,
      borderColor: customization.borderColor,
      fontSize: `${customization.fontSize}px`,
      fontWeight: customization.fontWeight,
      letterSpacing: `${customization.letterSpacing}px`,
      textTransform: customization.textTransform,
      textAlign: customization.textAlign,
      transitionDuration: `${customization.animationDuration}ms`,
      boxShadow: customization.shadowSize > 0 
        ? `0 ${customization.shadowSize}px ${customization.shadowSize * 2}px rgba(${hexToRgb(customization.shadowColor)}, ${customization.shadowOpacity / 100})`
        : "none"
    };

    if (customization.useGradient) {
      baseStyle.background = `linear-gradient(${customization.gradientDirection}, ${customization.gradientFromColor}, ${customization.gradientToColor})`;
      baseStyle.color = "#ffffff";
    } else {
      baseStyle.backgroundColor = customization.backgroundColor;
      baseStyle.color = customization.textColor;
    }

    return baseStyle;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
  };

  const getAnimationClass = () => {
    switch (customization.hoverAnimation) {
      case "scale": return "hover:scale-105";
      case "scale-down": return "hover:scale-95";
      case "lift": return "hover:-translate-y-1";
      case "slide-right": return "hover:translate-x-1";
      case "slide-left": return "hover:-translate-x-1";
      case "rotate": return "hover:rotate-1";
      case "glow": return "hover:shadow-lg";
      case "bounce": return "hover:animate-bounce";
      case "pulse": return "hover:animate-pulse";
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Palette className="w-6 h-6" />
            <span>Advanced Link Customizer</span>
          </h2>
          <p className="text-gray-600 mt-1">Create pixel-perfect links with professional-grade customization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} className="bg-black hover:bg-gray-800">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Customization Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="typography">Type</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Link Content</CardTitle>
                  <CardDescription>Configure the basic content and information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Link Title</Label>
                    <Input
                      id="title"
                      value={customization.title}
                      onChange={(e) => updateCustomization('title', e.target.value)}
                      placeholder="Enter link title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={customization.url}
                      onChange={(e) => updateCustomization('url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={customization.description}
                      onChange={(e) => updateCustomization('description', e.target.value)}
                      placeholder="Brief description of this link"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={customization.showDescription}
                        onCheckedChange={(checked) => updateCustomization('showDescription', checked)}
                      />
                      <Label>Show Description</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={customization.showClickCount}
                        onCheckedChange={(checked) => updateCustomization('showClickCount', checked)}
                      />
                      <Label>Show Click Count</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={customization.isHighlight}
                        onCheckedChange={(checked) => updateCustomization('isHighlight', checked)}
                      />
                      <Label>Featured Link</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Button Style</CardTitle>
                  <CardDescription>Choose from pre-designed button styles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {buttonStyles.map((style) => (
                      <Button
                        key={style.id}
                        variant={customization.style === style.id ? "default" : "outline"}
                        onClick={() => updateCustomization('style', style.id)}
                        className="h-16 flex flex-col items-center justify-center"
                      >
                        <div className={`w-8 h-4 mb-1 rounded ${style.className}`}></div>
                        <span className="text-xs">{style.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Icon Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={customization.showIcon}
                      onCheckedChange={(checked) => updateCustomization('showIcon', checked)}
                    />
                    <Label>Show Icon</Label>
                  </div>

                  {customization.showIcon && (
                    <>
                      <div className="space-y-2">
                        <Label>Icon Position</Label>
                        <div className="flex space-x-2">
                          <Button
                            variant={customization.iconPosition === "left" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateCustomization('iconPosition', 'left')}
                          >
                            <AlignLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={customization.iconPosition === "center" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateCustomization('iconPosition', 'center')}
                          >
                            <AlignCenter className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={customization.iconPosition === "right" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateCustomization('iconPosition', 'right')}
                          >
                            <AlignRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Icon Size: {customization.iconSize}px</Label>
                        <Slider
                          value={[customization.iconSize]}
                          onValueChange={([value]) => updateCustomization('iconSize', value)}
                          min={12}
                          max={32}
                          step={2}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Icon Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={customization.iconColor}
                            onChange={(e) => updateCustomization('iconColor', e.target.value)}
                            className="w-12 h-8"
                          />
                          <Input
                            value={customization.iconColor}
                            onChange={(e) => updateCustomization('iconColor', e.target.value)}
                            placeholder="#6b7280"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Type className="w-5 h-5" />
                    <span>Typography</span>
                  </CardTitle>
                  <CardDescription>Fine-tune text appearance and readability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select value={customization.fontFamily} onValueChange={(value) => updateCustomization('fontFamily', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Transform</Label>
                      <Select value={customization.textTransform} onValueChange={(value) => updateCustomization('textTransform', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="uppercase">UPPERCASE</SelectItem>
                          <SelectItem value="lowercase">lowercase</SelectItem>
                          <SelectItem value="capitalize">Capitalize Each Word</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size: {customization.fontSize}px</Label>
                    <Slider
                      value={[customization.fontSize]}
                      onValueChange={([value]) => updateCustomization('fontSize', value)}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Weight: {customization.fontWeight}</Label>
                    <Slider
                      value={[customization.fontWeight]}
                      onValueChange={([value]) => updateCustomization('fontWeight', value)}
                      min={300}
                      max={900}
                      step={100}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Letter Spacing: {customization.letterSpacing}px</Label>
                    <Slider
                      value={[customization.letterSpacing]}
                      onValueChange={([value]) => updateCustomization('letterSpacing', value)}
                      min={-2}
                      max={4}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={customization.textAlign === "left" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateCustomization('textAlign', 'left')}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={customization.textAlign === "center" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateCustomization('textAlign', 'center')}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={customization.textAlign === "right" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateCustomization('textAlign', 'right')}
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Scheme</CardTitle>
                  <CardDescription>Customize colors and gradients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={customization.useGradient}
                      onCheckedChange={(checked) => updateCustomization('useGradient', checked)}
                    />
                    <Label>Use Gradient Background</Label>
                  </div>

                  {customization.useGradient ? (
                    <>
                      <div className="space-y-2">
                        <Label>Gradient Direction</Label>
                        <Select value={customization.gradientDirection} onValueChange={(value) => updateCustomization('gradientDirection', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {gradientDirections.map((direction) => (
                              <SelectItem key={direction.value} value={direction.value}>
                                {direction.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>From Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={customization.gradientFromColor}
                              onChange={(e) => updateCustomization('gradientFromColor', e.target.value)}
                              className="w-12 h-8"
                            />
                            <Input
                              value={customization.gradientFromColor}
                              onChange={(e) => updateCustomization('gradientFromColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>To Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={customization.gradientToColor}
                              onChange={(e) => updateCustomization('gradientToColor', e.target.value)}
                              className="w-12 h-8"
                            />
                            <Input
                              value={customization.gradientToColor}
                              onChange={(e) => updateCustomization('gradientToColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={customization.backgroundColor}
                              onChange={(e) => updateCustomization('backgroundColor', e.target.value)}
                              className="w-12 h-8"
                            />
                            <Input
                              value={customization.backgroundColor}
                              onChange={(e) => updateCustomization('backgroundColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={customization.textColor}
                              onChange={(e) => updateCustomization('textColor', e.target.value)}
                              className="w-12 h-8"
                            />
                            <Input
                              value={customization.textColor}
                              onChange={(e) => updateCustomization('textColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Border Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={customization.borderColor}
                            onChange={(e) => updateCustomization('borderColor', e.target.value)}
                            className="w-12 h-8"
                          />
                          <Input
                            value={customization.borderColor}
                            onChange={(e) => updateCustomization('borderColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hover Background</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={customization.hoverBackgroundColor}
                          onChange={(e) => updateCustomization('hoverBackgroundColor', e.target.value)}
                          className="w-12 h-8"
                        />
                        <Input
                          value={customization.hoverBackgroundColor}
                          onChange={(e) => updateCustomization('hoverBackgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Hover Text</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={customization.hoverTextColor}
                          onChange={(e) => updateCustomization('hoverTextColor', e.target.value)}
                          className="w-12 h-8"
                        />
                        <Input
                          value={customization.hoverTextColor}
                          onChange={(e) => updateCustomization('hoverTextColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Layout className="w-5 h-5" />
                    <span>Layout & Spacing</span>
                  </CardTitle>
                  <CardDescription>Control dimensions, spacing, and positioning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Button Height: {customization.buttonHeight}px</Label>
                    <Slider
                      value={[customization.buttonHeight]}
                      onValueChange={([value]) => updateCustomization('buttonHeight', value)}
                      min={40}
                      max={80}
                      step={4}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Width</Label>
                    <Select value={customization.buttonWidth} onValueChange={(value) => updateCustomization('buttonWidth', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="custom">Custom Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customization.buttonWidth === "custom" && (
                    <div className="space-y-2">
                      <Label>Max Width: {customization.maxWidth}px</Label>
                      <Slider
                        value={[customization.maxWidth]}
                        onValueChange={([value]) => updateCustomization('maxWidth', value)}
                        min={200}
                        max={600}
                        step={20}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horizontal Padding: {customization.paddingX}px</Label>
                      <Slider
                        value={[customization.paddingX]}
                        onValueChange={([value]) => updateCustomization('paddingX', value)}
                        min={8}
                        max={32}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Vertical Padding: {customization.paddingY}px</Label>
                      <Slider
                        value={[customization.paddingY]}
                        onValueChange={([value]) => updateCustomization('paddingY', value)}
                        min={8}
                        max={32}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Top Margin: {customization.marginTop}px</Label>
                      <Slider
                        value={[customization.marginTop]}
                        onValueChange={([value]) => updateCustomization('marginTop', value)}
                        min={0}
                        max={24}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bottom Margin: {customization.marginBottom}px</Label>
                      <Slider
                        value={[customization.marginBottom]}
                        onValueChange={([value]) => updateCustomization('marginBottom', value)}
                        min={0}
                        max={24}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Border Radius: {customization.borderRadius}px</Label>
                    <Slider
                      value={[customization.borderRadius]}
                      onValueChange={([value]) => updateCustomization('borderRadius', value)}
                      min={0}
                      max={50}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Border Width: {customization.borderWidth}px</Label>
                    <Slider
                      value={[customization.borderWidth]}
                      onValueChange={([value]) => updateCustomization('borderWidth', value)}
                      min={0}
                      max={4}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Effects & Animation</span>
                  </CardTitle>
                  <CardDescription>Add visual effects and micro-interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hover Animation</Label>
                    <Select value={customization.hoverAnimation} onValueChange={(value) => updateCustomization('hoverAnimation', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hoverAnimations.map((animation) => (
                          <SelectItem key={animation.value} value={animation.value}>
                            {animation.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Animation Duration: {customization.animationDuration}ms</Label>
                    <Slider
                      value={[customization.animationDuration]}
                      onValueChange={([value]) => updateCustomization('animationDuration', value)}
                      min={100}
                      max={500}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Shadow Size: {customization.shadowSize}px</Label>
                    <Slider
                      value={[customization.shadowSize]}
                      onValueChange={([value]) => updateCustomization('shadowSize', value)}
                      min={0}
                      max={20}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  {customization.shadowSize > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>Shadow Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={customization.shadowColor}
                            onChange={(e) => updateCustomization('shadowColor', e.target.value)}
                            className="w-12 h-8"
                          />
                          <Input
                            value={customization.shadowColor}
                            onChange={(e) => updateCustomization('shadowColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Shadow Opacity: {customization.shadowOpacity}%</Label>
                        <Slider
                          value={[customization.shadowOpacity]}
                          onValueChange={([value]) => updateCustomization('shadowOpacity', value)}
                          min={10}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom CSS</CardTitle>
                  <CardDescription>Advanced users can add custom CSS</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={customization.customCSS}
                    onChange={(e) => updateCustomization('customCSS', e.target.value)}
                    placeholder="/* Add custom CSS here */&#10;.custom-link {&#10;  /* Your styles */&#10;}"
                    className="w-full h-24 p-3 border rounded-md font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Live Preview</span>
              </CardTitle>
              <CardDescription>See your changes in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Frame */}
              <div className="bg-black rounded-[2rem] p-3 shadow-xl">
                <div className="bg-white rounded-[1.5rem] p-4 min-h-[400px]">
                  <div className="space-y-4">
                    {/* Preview Button */}
                    <motion.button
                      style={generatePreviewStyle()}
                      className={`
                        relative overflow-hidden transition-all duration-200 cursor-pointer
                        ${getAnimationClass()}
                        ${customization.isHighlight ? 'ring-2 ring-yellow-400' : ''}
                      `}
                      whileHover={{ scale: customization.hoverAnimation === 'scale' ? 1.02 : 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`flex items-center space-x-3 ${customization.textAlign === 'center' ? 'justify-center' : customization.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                        {customization.showIcon && customization.iconPosition === 'left' && (
                          <div 
                            className="flex-shrink-0"
                            style={{ 
                              fontSize: `${customization.iconSize}px`,
                              color: customization.iconColor 
                            }}
                          >
                            🌐
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{customization.title || "Link Title"}</div>
                          {customization.showDescription && customization.description && (
                            <div className="text-xs opacity-75 truncate">{customization.description}</div>
                          )}
                        </div>
                        
                        {customization.showClickCount && (
                          <Badge variant="secondary" className="text-xs">
                            42 clicks
                          </Badge>
                        )}
                        
                        {customization.showIcon && customization.iconPosition === 'right' && (
                          <div 
                            className="flex-shrink-0"
                            style={{ 
                              fontSize: `${customization.iconSize}px`,
                              color: customization.iconColor 
                            }}
                          >
                            🌐
                          </div>
                        )}
                      </div>
                      
                      {customization.isHighlight && (
                        <div className="absolute top-1 right-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </motion.button>

                    {/* Preview Info */}
                    <div className="text-center space-y-2">
                      <div className="text-xs text-gray-500">
                        Style: {buttonStyles.find(s => s.id === customization.style)?.name || "Custom"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Animation: {hoverAnimations.find(a => a.value === customization.hoverAnimation)?.label || "None"}
                      </div>
                      {customization.useGradient && (
                        <div className="text-xs text-gray-500">
                          Gradient: {gradientDirections.find(g => g.value === customization.gradientDirection)?.label}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Height: {customization.buttonHeight}px</div>
                  <div>Font: {customization.fontSize}px {fontFamilies.find(f => f.value === customization.fontFamily)?.label}</div>
                  <div>Border: {customization.borderRadius}px radius</div>
                  {customization.shadowSize > 0 && (
                    <div>Shadow: {customization.shadowSize}px ({customization.shadowOpacity}%)</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvancedLinkCustomizer;